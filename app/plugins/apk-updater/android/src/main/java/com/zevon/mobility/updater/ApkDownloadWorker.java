package com.zevon.mobility.updater;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

public class ApkDownloadWorker extends Worker {
    static final String KEY_URL = "downloadUrl";
    static final String KEY_SHA256 = "sha256";
    static final String KEY_FILE = "fileName";
    static final String KEY_VERSION = "version";
    private static final int NOTICE_ID = 1003;

    public ApkDownloadWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        String url = getInputData().getString(KEY_URL);
        String expected = getInputData().getString(KEY_SHA256);
        String name = getInputData().getString(KEY_FILE);
        String version = getInputData().getString(KEY_VERSION);
        File output = null;
        HttpURLConnection connection = null;
        try {
            if (url == null || !url.startsWith("https://github.com/") || !url.contains("/releases/download/"))
                throw new IllegalArgumentException("Untrusted APK URL.");
            if (expected == null || !expected.matches("(?i)[a-f0-9]{64}"))
                throw new IllegalArgumentException("Invalid release checksum.");
            if (name == null || !name.matches("[A-Za-z0-9._-]+\\.apk"))
                throw new IllegalArgumentException("Invalid APK filename.");
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(90000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Accept", "application/octet-stream");
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) throw new java.io.IOException("Download failed: HTTP " + status);
            output = new File(getApplicationContext().getCacheDir(), name);
            long total = connection.getContentLengthLong();
            long received = 0;
            try (InputStream in = new BufferedInputStream(connection.getInputStream());
                 FileOutputStream out = new FileOutputStream(output)) {
                byte[] buffer = new byte[16384];
                int count;
                while ((count = in.read(buffer)) != -1) {
                    if (isStopped()) return Result.retry();
                    out.write(buffer, 0, count);
                    received += count;
                    if (total > 0) setProgressAsync(new Data.Builder().putInt("progress",
                        (int) Math.min(99, received * 100 / total)).build());
                }
                out.getFD().sync();
            }
            if (output.length() < 1024 * 1024) throw new java.io.IOException("APK file is too small.");
            if (!expected.equalsIgnoreCase(sha256(output))) throw new SecurityException("SHA-256 mismatch; update blocked.");
            verifyPackageAndSigner(output);
            InstallApkReceiver.postReadyNotification(getApplicationContext(), output, version == null ? "" : version);
            return Result.success();
        } catch (Exception error) {
            if (output != null) output.delete();
            ZEVONFirebaseMessagingService.showNotice(getApplicationContext(),
                "ZEVON update failed", error.getMessage() == null ? "Please retry from the app." : error.getMessage(), NOTICE_ID);
            return error instanceof SecurityException || error instanceof IllegalArgumentException
                ? Result.failure() : Result.retry();
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buffer = new byte[16384]; int count;
            while ((count = in.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        StringBuilder value = new StringBuilder();
        for (byte b : digest.digest()) value.append(String.format(Locale.US, "%02x", b));
        return value.toString();
    }

    @SuppressWarnings("deprecation")
    private void verifyPackageAndSigner(File apk) throws Exception {
        PackageManager pm = getApplicationContext().getPackageManager();
        PackageInfo current;
        PackageInfo candidate;
        if (Build.VERSION.SDK_INT >= 33) {
            current = pm.getPackageInfo(getApplicationContext().getPackageName(),
                PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES));
            candidate = pm.getPackageArchiveInfo(apk.getAbsolutePath(),
                PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES));
        } else {
            current = pm.getPackageInfo(getApplicationContext().getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
            candidate = pm.getPackageArchiveInfo(apk.getAbsolutePath(), PackageManager.GET_SIGNING_CERTIFICATES);
        }
        if (candidate == null || !getApplicationContext().getPackageName().equals(candidate.packageName))
            throw new SecurityException("APK package identity does not match this app.");
        Signature[] installed = Build.VERSION.SDK_INT >= 28
            ? current.signingInfo.getApkContentsSigners() : current.signatures;
        Signature[] downloaded = Build.VERSION.SDK_INT >= 28
            ? candidate.signingInfo.getApkContentsSigners() : candidate.signatures;
        if (installed == null || downloaded == null || installed.length == 0 || downloaded.length == 0)
            throw new SecurityException("Unable to verify APK signing certificate.");
        String expectedSigner = certDigest(installed[0]);
        boolean matched = false;
        for (Signature signature : downloaded) if (expectedSigner.equals(certDigest(signature))) matched = true;
        if (!matched) throw new SecurityException("APK signing certificate does not match installed app.");
    }

    private static String certDigest(Signature signature) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(signature.toByteArray());
        StringBuilder value = new StringBuilder();
        for (byte b : hash) value.append(String.format(Locale.US, "%02x", b));
        return value.toString();
    }
}
