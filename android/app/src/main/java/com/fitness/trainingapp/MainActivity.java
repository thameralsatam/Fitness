package com.fitness.trainingapp;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.fitness.trainingapp.widget.FitnessWidgetReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupMediaAndWebView();
        setupWidgetBridge();
        handleWidgetIntent(getIntent());
    }

    private void setupMediaAndWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleWidgetIntent(intent);
    }

    private void setupWidgetBridge() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void syncWidgetLanguage(String lang) {
                    if (lang != null && !lang.isEmpty()) {
                        getSharedPreferences("gym_widget_prefs", MODE_PRIVATE)
                            .edit()
                            .putString("gym_lang", lang)
                            .apply();

                        getSharedPreferences("CapacitorStorage", MODE_PRIVATE)
                            .edit()
                            .putString("gym_lang", lang)
                            .apply();

                        Intent updateIntent = new Intent(MainActivity.this, FitnessWidgetReceiver.class);
                        updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                        int[] ids = AppWidgetManager.getInstance(getApplication())
                            .getAppWidgetIds(new ComponentName(getApplication(), FitnessWidgetReceiver.class));
                        updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                        sendBroadcast(updateIntent);
                    }
                }
            }, "AndroidWidgetBridge");
        }
    }

    private void handleWidgetIntent(Intent intent) {
        if (intent == null) return;
        
        String targetTab = intent.getStringExtra("target_tab");
        Uri data = intent.getData();

        String tab = targetTab;
        if (tab == null && data != null) {
            tab = data.getQueryParameter("tab");
        }

        if (tab != null) {
            final String finalTab = tab;
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('widget-navigate', { detail: { tab: '" + finalTab + "' } }));",
                            null
                        );
                    }
                });
            }
        }
    }
}


