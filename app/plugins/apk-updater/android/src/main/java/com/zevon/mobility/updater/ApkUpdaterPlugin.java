package com.zevon.mobility.updater;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import androidx.activity.result.ActivityResult;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {
    private static final AtomicBoolean DOWNLOAD_IN_PROGRESS = new AtomicBoolean(false);

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject result = new JSObject();
            result.put("version", info.versionName == null ? "0.0.0" : info.versionName);
            result.put("versionCode", packageVersionCode(info));
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to read installed app version.", e);
        }
    }

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        boolean allowed = Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject result = new JSObject();
        result.put("allowed", allowed);
        call.resolve(result);
    }

    @PluginMethod
    public void requestInstallPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls()) {
            JSObject result = new JSObject();
            result.put("allowed", true);
            call.resolve(result);
            return;
        }
        Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getContext().getPackageName()));
        startActivityForResult(call, intent, "installPermissionResult");
    }

    @ActivityCallback
    private void installPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        boolean allowed = Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject data = new JSObject();
        data.put("allowed", allowed);
        call.resolve(data);
    }

    private static long packageVersionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    private static int signingFlags() {
        return Build.VERSION.SDK_INT >= 28
            ? PackageManager.GET_SIGNING_CERTIFICATES
            : PackageManager.GET_SIGNATURES;
    }

    private static Signature[] packageSignatures(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= 28 && info.signingInfo != null) {
            return info.signingInfo.getApkContentsSigners();
        }
        return info.signatures;
    }

    private static String sha256(Signature signature) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(signature.toByteArray());
        StringBuilder value = new StringBuilder();
        for (byte b : digest) value.append(String.format(Locale.US, "%02X", b));
        return value.toString();
    }

    private static String signerFingerprint(PackageInfo info) throws Exception {
        Signature[] signatures = packageSignatures(info);
        if (signatures == null || signatures.length != 1) {
            throw new SecurityException("APK must have exactly one current signing certificate.");
        }
        return sha256(signatures[0]);
    }

    private void verifyDownloadedApk(File apk, String expectedSigner, long expectedVersionCode) throws Exception {
        PackageManager manager = getContext().getPackageManager();
        int flags = signingFlags();
        PackageInfo candidate = manager.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (candidate == null || candidate.applicationInfo == null) {
            throw new SecurityException("Downloaded file is not a valid Android APK.");
        }
        String installedPackage = getContext().getPackageName();
        if (!ApkUpdatePolicy.isExpectedPackage(candidate.packageName, installedPackage)) {
            throw new SecurityException("APK package name does not match the installed ZEVON app.");
        }

        PackageInfo installed = manager.getPackageInfo(installedPackage, flags);
        String candidateSigner = signerFingerprint(candidate);
        String installedSigner = signerFingerprint(installed);
        if (!ApkUpdatePolicy.isMatchingSigner(candidateSigner, installedSigner, expectedSigner)) {
            throw new SecurityException("APK signing certificate does not match this ZEVON installation.");
        }

        long candidateVersionCode = packageVersionCode(candidate);
        if (!ApkUpdatePolicy.isNewerExpectedVersion(
            candidateVersionCode, expectedVersionCode, packageVersionCode(installed))) {
            throw new SecurityException("APK versionCode does not match the manifest or is not newer than the installed version.");
        }
    }

    private HttpURLConnection openTrustedDownloadConnection(URL initialUrl) throws Exception {
        URL target = initialUrl;
        for (int redirectCount = 0; ; redirectCount++) {
            if (!ApkUpdatePolicy.isTrustedDownloadUrl(target.toExternalForm())) {
                throw new SecurityException("APK download URL is not an approved HTTPS GitHub host.");
            }

            HttpURLConnection current = (HttpURLConnection) target.openConnection();
            try {
                current.setConnectTimeout(15000);
                current.setReadTimeout(60000);
                current.setInstanceFollowRedirects(false);
                current.setRequestProperty("Accept", "application/octet-stream");

                int status = current.getResponseCode();
                if (ApkUpdatePolicy.isRedirectStatus(status)) {
                    String location = current.getHeaderField("Location");
                    if (redirectCount >= ApkUpdatePolicy.MAX_REDIRECTS) {
                        throw new SecurityException("APK download exceeded the maximum redirect count.");
                    }
                    URL next = ApkUpdatePolicy.resolveTrustedRedirect(target, location);
                    current.disconnect();
                    target = next;
                    continue;
                }
                if (status != HttpURLConnection.HTTP_OK) {
                    throw new IOException("APK download failed: HTTP " + status);
                }
                return current;
            } catch (Exception e) {
                current.disconnect();
                throw e;
            }
        }
    }

    private static long declaredContentLength(HttpURLConnection connection) throws IOException {
        String value = connection.getHeaderField("Content-Length");
        if (value == null || value.trim().isEmpty()) return -1L;
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            throw new IOException("APK server returned an invalid Content-Length.", e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "zevon-update.apk");
        String expectedSha256 = call.getString("sha256");
        String expectedSigner = call.getString("signerSha256");
        Integer expectedVersionCode = call.getInt("versionCode");

        if (!ApkUpdatePolicy.isSha256(expectedSha256)) {
            call.reject("A valid APK SHA-256 checksum is required.");
            return;
        }
        if (!ApkUpdatePolicy.isSha256(expectedSigner)) {
            call.reject("A valid signing certificate fingerprint is required.");
            return;
        }
        if (expectedVersionCode == null || expectedVersionCode <= 0) {
            call.reject("A valid expected Android versionCode is required.");
            return;
        }
        if (!ApkUpdatePolicy.isOfficialReleaseUrl(url, fileName)) {
            call.reject("Only APK assets from the official ZEVON GitHub Releases are allowed.");
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("Allow ZEVON to install updates in Android settings first.");
            return;
        }
        if (!ApkUpdatePolicy.tryAcquireDownload(DOWNLOAD_IN_PROGRESS)) {
            call.reject("A ZEVON update download is already in progress.");
            return;
        }

        final String safeName = fileName;
        try {
            Thread worker = new Thread(() -> {
            File out = null;
            HttpURLConnection connection = null;
            try {
                URL target = new URL(url);
                connection = openTrustedDownloadConnection(target);

                String type = connection.getContentType();
                if (type != null && !type.toLowerCase(Locale.ROOT).contains("octet-stream") &&
                    !type.toLowerCase(Locale.ROOT).contains("application/vnd.android.package-archive")) {
                    throw new IOException("The release asset did not return an APK download.");
                }

                long contentLength = declaredContentLength(connection);
                if (contentLength > ApkUpdatePolicy.MAX_APK_BYTES) {
                    throw new SecurityException("APK exceeds the maximum permitted download size.");
                }

                out = new File(getContext().getCacheDir(), safeName);
                try (InputStream in = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream fos = new FileOutputStream(out)) {
                    byte[] buffer = new byte[8192];
                    int count;
                    long totalBytesRead = 0L;
                    while ((count = in.read(buffer)) != -1) {
                        if (!ApkUpdatePolicy.canAppendBytes(totalBytesRead, count)) {
                            throw new SecurityException("APK exceeds the maximum permitted download size.");
                        }
                        totalBytesRead += count;
                        fos.write(buffer, 0, count);
                    }
                    fos.getFD().sync();
                }
                if (out.length() < 1024 * 1024) throw new IOException("Downloaded APK is unexpectedly small.");

                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (InputStream verify = new FileInputStream(out)) {
                    byte[] chunk = new byte[8192];
                    int n;
                    while ((n = verify.read(chunk)) != -1) digest.update(chunk, 0, n);
                }
                StringBuilder actual = new StringBuilder();
                for (byte b : digest.digest()) actual.append(String.format(Locale.US, "%02x", b));
                if (!actual.toString().equalsIgnoreCase(expectedSha256)) {
                    throw new SecurityException("APK checksum verification failed. Update cancelled.");
                }

                verifyDownloadedApk(out, expectedSigner, expectedVersionCode.longValue());
                Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    out
                );
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(install);
                JSObject response = new JSObject();
                response.put("downloaded", true);
                response.put("bytes", out.length());
                new Handler(Looper.getMainLooper()).post(() -> call.resolve(response));
            } catch (Exception e) {
                if (out != null && out.exists()) {
                    // Best-effort cleanup: never retain a partial or rejected APK.
                    out.delete();
                }
                String error = e.getMessage() == null
                    ? "Unable to download or verify the APK update."
                    : e.getMessage();
                new Handler(Looper.getMainLooper()).post(() -> call.reject(error));
            } finally {
                if (connection != null) connection.disconnect();
                ApkUpdatePolicy.releaseDownload(DOWNLOAD_IN_PROGRESS);
            }
        }, "zevon-apk-update");

            }, "zevon-apk-update");
            worker.start();
        } catch (RuntimeException e) {
            ApkUpdatePolicy.releaseDownload(DOWNLOAD_IN_PROGRESS);
            call.reject("Unable to start the ZEVON update download.", e);
        }
    }
}
