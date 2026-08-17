package com.fitness.trainingapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class WorkoutProgressWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_workout_progress);

        // Intent for main plan
        Intent planIntent = createLaunchIntent(context, "plan", 101);
        PendingIntent planPending = PendingIntent.getActivity(
                context, 101, planIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_open_plan, planPending);
        views.setOnClickPendingIntent(R.id.widget_root, planPending);

        // Intent for timer
        Intent timerIntent = createLaunchIntent(context, "timer", 102);
        PendingIntent timerPending = PendingIntent.getActivity(
                context, 102, timerIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_open_timer, timerPending);

        // Intent for audio
        Intent audioIntent = createLaunchIntent(context, "audio", 103);
        PendingIntent audioPending = PendingIntent.getActivity(
                context, 103, audioIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_open_audio, audioPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static Intent createLaunchIntent(Context context, String tab, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("target_tab", tab);
        intent.setData(Uri.parse("fitnessapp://view?tab=" + tab));
        return intent;
    }
}
