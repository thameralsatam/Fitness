package com.fitness.trainingapp;

import android.os.Bundle;
import android.view.Window;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.fitness.trainingapp.audio.NativeAudioPlayerPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAudioPlayerPlugin.class);
        super.onCreate(savedInstanceState);
        setupSystemBars();
        setupMediaAndWebView();
    }

    private void setupSystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);

        int bgColor = ContextCompat.getColor(this, R.color.appBackground);
        window.setStatusBarColor(bgColor);
        window.setNavigationBarColor(bgColor);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(true);
            controller.setAppearanceLightNavigationBars(true);
        }
    }

    private void setupMediaAndWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
            getBridge().getWebView().setBackgroundColor(ContextCompat.getColor(this, R.color.appBackground));
        }
    }
}




