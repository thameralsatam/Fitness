package com.fitness.trainingapp;

import android.os.Bundle;
import com.fitness.trainingapp.audio.NativeAudioPlayerPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAudioPlayerPlugin.class);
        super.onCreate(savedInstanceState);
        setupMediaAndWebView();
    }

    private void setupMediaAndWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }
}



