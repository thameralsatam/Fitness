package com.fitness.trainingapp.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import androidx.glance.Button
import androidx.glance.GlanceModifier
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.text.FontWeight
import androidx.glance.unit.ColorProvider
import androidx.glance.action.actionStartActivity
import com.fitness.trainingapp.MainActivity

@Composable
fun FitnessWidgetUI(context: Context) {
    val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
    
    // Read Capacitor values stored as JSON/strings by the React frontend
    val completedStr = prefs.getString("gym_completed", "[]") ?: "[]"
    val completedCount = if (completedStr.trim() == "[]" || completedStr.isEmpty()) {
        0
    } else {
        // Simple safety parsing of JSON array string
        completedStr.replace("[", "").replace("]", "").split(",").filter { it.trim().isNotEmpty() }.size
    }
    
    val totalCount = 15 // Standard total exercises in training app
    val streak = if (completedCount > 0) 3 else 1
    val percent = (completedCount * 100) / totalCount
    
    val lang = prefs.getString("gym_lang", "ar") ?: "ar"
    val titleText = if (lang == "ar") "تدريب الجسم الكامل" else "Ganzkörper-Training"
    val streakText = if (lang == "ar") "التتابع: $streak أيام" else "Streak: $streak Tage"
    val progressText = if (lang == "ar") "الإنجاز: $completedCount/$totalCount ($percent%)" else "Fortschritt: $completedCount/$totalCount ($percent%)"
    val buttonText = if (lang == "ar") "افتح التطبيق" else "App öffnen"

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color(0xFF13271E))) // Matches dark emerald theme background
            .padding(12.dp),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Text(
            text = titleText,
            style = TextStyle(
                color = ColorProvider(Color.White),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        )
        Spacer(modifier = GlanceModifier.height(6.dp))
        Row(
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            Text(
                text = streakText,
                style = TextStyle(
                    color = ColorProvider(Color(0xFF6EE7B7)),
                    fontSize = 11.sp
                )
            )
            Spacer(modifier = GlanceModifier.width(12.dp))
            Text(
                text = progressText,
                style = TextStyle(
                    color = ColorProvider(Color(0xFF34D399)),
                    fontSize = 11.sp
                )
            )
        }
        Spacer(modifier = GlanceModifier.height(8.dp))
        Button(
            text = buttonText,
            onClick = actionStartActivity<MainActivity>()
        )
    }
}
