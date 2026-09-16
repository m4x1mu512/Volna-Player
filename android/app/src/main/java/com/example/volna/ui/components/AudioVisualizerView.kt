package com.example.volna.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import com.example.volna.data.model.VisualizerType
import com.example.volna.ui.theme.VolnaCyan
import com.example.volna.ui.theme.VolnaTurquoise
import com.example.volna.ui.theme.VolnaViolet
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun AudioVisualizerView(
    amplitudes: FloatArray,
    type: VisualizerType,
    modifier: Modifier = Modifier,
    sensitivity: Float = 1.0f
) {
    val gradientBrush = Brush.linearGradient(
        colors = listOf(VolnaTurquoise, VolnaCyan, VolnaViolet)
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        if (width <= 0 || height <= 0 || amplitudes.isEmpty()) return@Canvas

        when (type) {
            VisualizerType.SPECTRUM -> {
                val barsCount = amplitudes.size
                val barSpacing = 4f
                val totalSpacing = (barsCount - 1) * barSpacing
                val barWidth = ((width - totalSpacing) / barsCount).coerceAtLeast(2f)

                for (i in 0 until barsCount) {
                    val rawAmp = amplitudes[i] * sensitivity
                    val barHeight = (rawAmp * height * 0.85f).coerceIn(4f, height)
                    val left = i * (barWidth + barSpacing)
                    val top = height - barHeight

                    drawRoundRect(
                        brush = gradientBrush,
                        topLeft = Offset(left, top),
                        size = Size(barWidth, barHeight),
                        cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
                    )
                }
            }

            VisualizerType.WAVE -> {
                val path = Path()
                val step = width / (amplitudes.size - 1)
                val midY = height / 2f

                for (i in amplitudes.indices) {
                    val amp = (amplitudes[i] * sensitivity).coerceIn(0f, 1f)
                    val offset = (amp * (height / 2.5f))
                    // Чередование фазы волны
                    val y = if (i % 2 == 0) midY - offset else midY + offset
                    val x = i * step

                    if (i == 0) {
                        path.moveTo(x, y)
                    } else {
                        val prevX = (i - 1) * step
                        val prevAmp = (amplitudes[i - 1] * sensitivity).coerceIn(0f, 1f)
                        val prevY = if ((i - 1) % 2 == 0) midY - prevAmp * (height / 2.5f) else midY + prevAmp * (height / 2.5f)
                        val cX = (prevX + x) / 2f
                        path.cubicTo(cX, prevY, cX, y, x, y)
                    }
                }

                drawPath(
                    path = path,
                    brush = gradientBrush,
                    style = Stroke(width = 5f, cap = StrokeCap.Round)
                )
            }

            VisualizerType.CIRCLE -> {
                val center = Offset(width / 2f, height / 2f)
                val baseRadius = (minOf(width, height) / 3.5f)
                val barsCount = amplitudes.size
                val angleStep = (2 * Math.PI) / barsCount

                for (i in 0 until barsCount) {
                    val angle = i * angleStep
                    val amp = (amplitudes[i] * sensitivity).coerceIn(0f, 1f)
                    val barLength = amp * (baseRadius * 0.8f)

                    val startX = (center.x + baseRadius * cos(angle)).toFloat()
                    val startY = (center.y + baseRadius * sin(angle)).toFloat()
                    val endX = (center.x + (baseRadius + barLength) * cos(angle)).toFloat()
                    val endY = (center.y + (baseRadius + barLength) * sin(angle)).toFloat()

                    drawLine(
                        brush = gradientBrush,
                        start = Offset(startX, startY),
                        end = Offset(endX, endY),
                        strokeWidth = 4f,
                        cap = StrokeCap.Round
                    )
                }

                // Внутренний светящийся круг
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(VolnaTurquoise.copy(alpha = 0.3f), Color.Transparent),
                        center = center,
                        radius = baseRadius
                    ),
                    radius = baseRadius,
                    center = center
                )
            }
        }
    }
}
