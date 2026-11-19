package com.zevon.mobility.updater;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.OutOfQuotaPolicy;
import androidx.work.WorkManager;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class ZEVONFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL = "zevon_updates";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Topic subscription is the delivery mechanism; no device token is sent to a third party.
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);
        Map<String, String> data = message.getData();
        if (!"zevon_app_update".equals(data.get("type"))) return;
        String url = data.get("downloadUrl");
        String digest = data.get("sha256");
        String fileName = data.get("fileName");
        String version = data.get("version");
        if (url == null || digest == null || fileName == null || version == null) {
            showNotice(getApplicationContext(), "ZEVON update available", "Open ZEVON to check the latest update.", 1001);
            return;
        }
        Data input = new Data.Builder()
            .putString(ApkDownloadWorker.KEY_URL, url)
            .putString(ApkDownloadWorker.KEY_SHA256, digest)
            .putString(ApkDownloadWorker.KEY_FILE, fileName)
            .putString(ApkDownloadWorker.KEY_VERSION, version)
            .build();
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(ApkDownloadWorker.class)
             .setInputData(input)
            .setConstraints(constraints)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build();
        WorkManager.getInstance(getApplicationContext()).enqueue(request);
        showNotice(getApplicationContext(), "ZEVON update downloading", "Version " + version + " is downloading in the background.", 1002);
    }

    static void showNotice(Context context, String title, String body, int id) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(new NotificationChannel(
                CHANNEL, "ZEVON app updates", NotificationManager.IMPORTANCE_DEFAULT));
        }
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true);
        try { NotificationManagerCompat.from(context).notify(id, builder.build()); }
        catch (SecurityException ignored) { /* Notification permission may be denied by the user. */ }
    }
}
