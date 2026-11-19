package com.zevon.mobility.updater;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import java.io.File;

public class InstallApkReceiver extends BroadcastReceiver {
    private static final String CHANNEL = "zevon_updates";
    private static final String EXTRA_FILE = "apk_path";

    @Override
    public void onReceive(Context context, Intent intent) {
        String path = intent.getStringExtra(EXTRA_FILE);
        if (path == null) return;
        File apk = new File(path);
        if (!apk.isFile()) {
            ZEVONFirebaseMessagingService.showNotice(context, "ZEVON update unavailable",
                "Please open ZEVON and check for updates again.", 1004);
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !context.getPackageManager().canRequestPackageInstalls()) {
            Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + context.getPackageName()));
            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(settings);
            ZEVONFirebaseMessagingService.showNotice(context, "Allow ZEVON to install updates",
                "Enable Allow from this source, then tap Install update again.", 1005);
            return;
        }
        Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", apk);
        Intent install = new Intent(Intent.ACTION_VIEW);
        install.setDataAndType(uri, "application/vnd.android.package-archive");
        install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(install);
        NotificationManagerCompat.from(context).cancel(1003);
    }

    static void postReadyNotification(Context context, File apk, String version) {
        if (Build.VERSION.SDK_INT >= 26) {
            android.app.NotificationManager manager = context.getSystemService(android.app.NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(new android.app.NotificationChannel(
                CHANNEL, "ZEVON app updates", android.app.NotificationManager.IMPORTANCE_HIGH));
        }
        Intent action = new Intent(context, InstallApkReceiver.class);
        action.putExtra(EXTRA_FILE, apk.getAbsolutePath());
        android.app.PendingIntent pending = android.app.PendingIntent.getBroadcast(context, 1003, action,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder notice = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("ZEVON update ready")
            .setContentText("Version " + version + " is downloaded and verified. Tap to install.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .addAction(0, "Install update", pending);
        try { NotificationManagerCompat.from(context).notify(1003, notice.build()); }
        catch (SecurityException ignored) { /* User may have denied notifications. */ }
    }
}
