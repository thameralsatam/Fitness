package com.fitness.trainingapp;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleWidgetIntent(intent);
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

