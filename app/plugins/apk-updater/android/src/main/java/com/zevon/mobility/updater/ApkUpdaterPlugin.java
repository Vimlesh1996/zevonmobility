package com.zevon.mobility.updater;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.content.pm.PackageManager;
import androidx.core.content.FileProvider;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {
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
            JSObject result = new JSObject(); result.put("allowed", true); call.resolve(result); return;
        }
        Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getContext().getPackageName()));
        startActivityForResult(call, intent, "installPermissionResult");
    }

    @ActivityCallback
    private void installPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        boolean allowed = Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject data = new JSObject(); data.put("allowed", allowed); call.resolve(data);
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "zevon-update.apk");
        if (url == null || !url.startsWith("https://") || !url.contains("github.com/")) {
            call.reject("Only HTTPS GitHub release APK URLs are allowed."); return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("Allow ZEVON to install updates in Android settings first."); return;
        }
        if (!fileName.matches("[A-Za-z0-9._-]+\\.apk")) {
            call.reject("Invalid APK file name."); return;
        }
        final String safeName = fileName;
        new Thread(() -> {
            File out = null;
            HttpURLConnection connection = null;
            try {
                URL target = new URL(url);
                connection = (HttpURLConnection) target.openConnection();
                connection.setConnectTimeout(15000); connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept", "application/octet-stream");
                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) throw new IOException("APK download failed: HTTP " + status);
                String type = connection.getContentType();
                if (type != null && !type.toLowerCase().contains("octet-stream") && !type.toLowerCase().contains("application/vnd.android.package-archive")) {
                    throw new IOException("The release asset did not return an APK download.");
                }
                File dir = new File(getContext().getCacheDir(), "apk-updates");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create update cache.");
                out = new File(dir, safeName);
                try (InputStream in = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream fos = new FileOutputStream(out)) {
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = in.read(buffer)) != -1) fos.write(buffer, 0, count);
                    fos.getFD().sync();
                }
                if (out.length() < 1024 * 1024) throw new IOException("Downloaded APK is unexpectedly small.");
                Uri uri = FileProvider.getUriForFile(getContext(),
                    getContext().getPackageName() + ".zevonupdater.fileprovider", out);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(install);
                JSObject response = new JSObject(); response.put("downloaded", true); response.put("bytes", out.length());
                getActivity().runOnUiThread(() -> call.resolve(response));
            } catch (Exception e) {
                if (out != null) out.delete();
                String message = e.getMessage() == null ? "Unable to download or open APK installer." : e.getMessage();
                getActivity().runOnUiThread(() -> call.reject(message));
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }
}
