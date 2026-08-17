package com.fitness.trainingapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class QuickTimerWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_timer);

        // General open timer
        Intent timerIntent = createTimerLaunchIntent(context, 90, 201);
        PendingIntent timerPending = PendingIntent.getActivity(
                context, 201, timerIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_timer_root, timerPending);

        // 60s
        Intent timer60 = createTimerLaunchIntent(context, 60, 202);
        PendingIntent p60 = PendingIntent.getActivity(
                context, 202, timer60, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_timer_60, p60);

        // 90s
        Intent timer90 = createTimerLaunchIntent(context, 90, 203);
        PendingIntent p90 = PendingIntent.getActivity(
                context, 203, timer90, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_timer_90, p90);

        // 120s
        Intent timer120 = createTimerLaunchIntent(context, 120, 204);
        PendingIntent p120 = PendingIntent.getActivity(
                context, 204, timer120, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_timer_120, p120);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static Intent createTimerLaunchIntent(Context context, int seconds, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("target_tab", "timer");
        intent.putExtra("timer_seconds", seconds);
        intent.setData(Uri.parse("fitnessapp://timer?seconds=" + seconds));
        return intent;
    }
}
