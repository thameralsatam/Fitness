package com.fitness.trainingapp.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.Button
import androidx.glance.ButtonColors
import androidx.glance.ButtonDefaults
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.text.TextAlign
import androidx.glance.unit.ColorProvider
import com.fitness.trainingapp.MainActivity
import com.fitness.trainingapp.R

@Composable
fun FitnessWidgetContent() {
    val size = LocalSize.current
    val isSmall = size.width < 200.dp
    
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color(0xFF1B3D2F)))
            .padding(12.dp)
            .cornerRadius(16.dp),
        contentAlignment = Alignment.Center
    ) {
        if (isSmall) {
            SmallFitnessWidget()
        } else {
            MediumFitnessWidget()
        }
    }
}

private fun createIntent(context: Context, tab: String): Intent {
    return Intent(context, MainActivity::class.java).apply {
        putExtra("target_tab", tab)
        data = Uri.parse("fitnessapp://view?tab=$tab")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
}

@Composable
fun SmallFitnessWidget() {
    val context = LocalContext.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically,
        modifier = GlanceModifier.fillMaxSize()
    ) {
        Text(
            text = "Fitness Plan", 
            style = TextStyle(
                color = ColorProvider(Color.White), 
                fontWeight = FontWeight.Bold, 
                fontSize = 14.sp
            )
        )
        Spacer(modifier = GlanceModifier.height(12.dp))
        Button(
            text = "Start",
            onClick = actionStartActivity(createIntent(context, "plan")),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = ColorProvider(Color(0xFF34D399)),
                contentColor = ColorProvider(Color.Black)
            )
        )
    }
}

@Composable
fun MediumFitnessWidget() {
    val context = LocalContext.current
    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Image(
                provider = ImageProvider(R.mipmap.ic_launcher),
                contentDescription = "Icon",
                modifier = GlanceModifier.size(24.dp)
            )
            Spacer(modifier = GlanceModifier.width(8.dp))
            Text(
                text = "Training Plan", 
                style = TextStyle(color = ColorProvider(Color.White), fontWeight = FontWeight.Bold, fontSize = 16.sp),
                modifier = GlanceModifier.defaultWeight()
            )
        }
        
        Spacer(modifier = GlanceModifier.defaultWeight())
        
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                text = "Plan",
                onClick = actionStartActivity(createIntent(context, "plan")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White))
            )
            Spacer(modifier = GlanceModifier.width(4.dp))
            Button(
                text = "Timer",
                onClick = actionStartActivity(createIntent(context, "timer")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White))
            )
            Spacer(modifier = GlanceModifier.width(4.dp))
            Button(
                text = "Audio",
                onClick = actionStartActivity(createIntent(context, "audio")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White))
            )
        }
    }
}
