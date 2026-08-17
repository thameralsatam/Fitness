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

fun getWidgetLanguage(context: Context): String {
    return try {
        val sp = context.getSharedPreferences("gym_widget_prefs", Context.MODE_PRIVATE)
        val lang = sp.getString("gym_lang", null)
        if (!lang.isNullOrBlank()) return lang

        val capSp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
        val capLang = capSp.getString("gym_lang", null)
        if (!capLang.isNullOrBlank()) return capLang

        if (java.util.Locale.getDefault().language == "ar") "ar" else "de"
    } catch (e: Exception) {
        if (java.util.Locale.getDefault().language == "ar") "ar" else "de"
    }
}

@Composable
fun FitnessWidgetContent() {
    val size = LocalSize.current
    val isSmall = size.width < 200.dp
    
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color(0xFF13271E)))
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
    val lang = getWidgetLanguage(context)
    val isAr = lang == "ar"

    val titleText = if (isAr) "خطة التدريب" else "Trainingsplan"
    val startBtnText = if (isAr) "ابدأ الآن" else "Starten"
    val refreshDesc = if (isAr) "تحديث الويدجت" else "Widget aktualisieren"

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically,
        modifier = GlanceModifier.fillMaxSize()
    ) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Image(
                provider = ImageProvider(R.drawable.ic_widget_logo),
                contentDescription = "App Icon",
                modifier = GlanceModifier.size(22.dp)
            )
            Spacer(modifier = GlanceModifier.width(4.dp))
            Text(
                text = titleText, 
                style = TextStyle(
                    color = ColorProvider(Color.White), 
                    fontWeight = FontWeight.Bold, 
                    fontSize = 12.sp
                ),
                modifier = GlanceModifier.defaultWeight()
            )
            Box(
                modifier = GlanceModifier
                    .size(24.dp)
                    .background(ColorProvider(Color(0xFF1E3D2F)))
                    .cornerRadius(6.dp)
                    .clickable(actionRunCallback<RefreshWidgetAction>()),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    provider = ImageProvider(R.drawable.ic_widget_refresh),
                    contentDescription = refreshDesc,
                    modifier = GlanceModifier.size(13.dp)
                )
            }
        }

        Spacer(modifier = GlanceModifier.height(8.dp))

        Button(
            text = startBtnText,
            onClick = actionStartActivity(createIntent(context, "plan")),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = ColorProvider(Color(0xFF34D399)),
                contentColor = ColorProvider(Color(0xFF0F241C))
            ),
            style = TextStyle(
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
fun MediumFitnessWidget() {
    val context = LocalContext.current
    val lang = getWidgetLanguage(context)
    val isAr = lang == "ar"

    val titleText = if (isAr) "خطة التدريب الكاملة" else "Trainingsplan · Full Body"
    val planBtnText = if (isAr) "الخطة" else "Plan"
    val timerBtnText = if (isAr) "المؤقت" else "Timer"
    val audioBtnText = if (isAr) "الصوتيات" else "Audio"
    val refreshDesc = if (isAr) "تحديث الويدجت" else "Widget aktualisieren"

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Image(
                provider = ImageProvider(R.drawable.ic_widget_logo),
                contentDescription = "App Icon",
                modifier = GlanceModifier.size(24.dp)
            )
            Spacer(modifier = GlanceModifier.width(8.dp))
            Text(
                text = titleText, 
                style = TextStyle(
                    color = ColorProvider(Color.White), 
                    fontWeight = FontWeight.Bold, 
                    fontSize = 15.sp
                ),
                modifier = GlanceModifier.defaultWeight()
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Box(
                modifier = GlanceModifier
                    .size(28.dp)
                    .background(ColorProvider(Color(0xFF1E3D2F)))
                    .cornerRadius(8.dp)
                    .clickable(actionRunCallback<RefreshWidgetAction>()),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    provider = ImageProvider(R.drawable.ic_widget_refresh),
                    contentDescription = refreshDesc,
                    modifier = GlanceModifier.size(15.dp)
                )
            }
        }
        
        Spacer(modifier = GlanceModifier.defaultWeight())
        
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                text = planBtnText,
                onClick = actionStartActivity(createIntent(context, "plan")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White)),
                style = TextStyle(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Button(
                text = timerBtnText,
                onClick = actionStartActivity(createIntent(context, "timer")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White)),
                style = TextStyle(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Button(
                text = audioBtnText,
                onClick = actionStartActivity(createIntent(context, "audio")),
                colors = ButtonDefaults.buttonColors(backgroundColor = ColorProvider(Color(0xFF215641)), contentColor = ColorProvider(Color.White)),
                style = TextStyle(fontWeight = FontWeight.Bold)
            )
        }
    }
}
