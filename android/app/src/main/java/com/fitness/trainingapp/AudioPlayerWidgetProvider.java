package com.fitness.trainingapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class AudioPlayerWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_audio_player);

        // Open audio player tab
        Intent audioIntent = createLaunchIntent(context, "audio", "toggle", 301);
        PendingIntent audioPending = PendingIntent.getActivity(
                context, 301, audioIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_audio_root, audioPending);
        views.setOnClickPendingIntent(R.id.btn_audio_play, audioPending);

        // Prev track
        Intent prevIntent = createLaunchIntent(context, "audio", "prev", 302);
        PendingIntent prevPending = PendingIntent.getActivity(
                context, 302, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_audio_prev, prevPending);

        // Next track
        Intent nextIntent = createLaunchIntent(context, "audio", "next", 303);
        PendingIntent nextPending = PendingIntent.getActivity(
                context, 303, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_audio_next, nextPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static Intent createLaunchIntent(Context context, String tab, String action, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("target_tab", tab);
        intent.putExtra("audio_action", action);
        intent.setData(Uri.parse("fitnessapp://audio?action=" + action));
        return intent;
    }
}
