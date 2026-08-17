package com.fitness.trainingapp.widget

import android.content.Context
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent

class FitnessWidget : GlanceAppWidget() {
    
    override val sizeMode: SizeMode = SizeMode.Responsive(
        setOf(
            DpSize(150.dp, 100.dp), // Small
            DpSize(250.dp, 150.dp), // Medium
            DpSize(300.dp, 250.dp)  // Large
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            FitnessWidgetContent()
        }
    }
}
