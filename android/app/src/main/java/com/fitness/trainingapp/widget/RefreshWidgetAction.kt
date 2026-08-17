package com.fitness.trainingapp.widget

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback

class RefreshWidgetAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val now = System.currentTimeMillis()
        // Debounce protection: prevent multiple rapid taps from spamming refresh operations
        if (now - lastRefreshTime < 600L) {
            return
        }
        lastRefreshTime = now

        // Recomposes and updates this Glance widget instance with latest preferences & state
        FitnessWidget().update(context, glanceId)
    }

    companion object {
        @Volatile
        private var lastRefreshTime: Long = 0L
    }
}
