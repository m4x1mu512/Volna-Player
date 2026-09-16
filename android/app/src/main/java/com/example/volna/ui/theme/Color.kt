package com.example.volna.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Neon & Wave Palette
val VolnaCyan = Color(0xFF00D2FF)
val VolnaTurquoise = Color(0xFF00F5D4)
val VolnaViolet = Color(0xFF9D4EDD)
val VolnaPink = Color(0xFFFF007F)

// Dark Theme Colors (Default)
val DarkBackground = Color(0xFF060B18)
val DarkSurface = Color(0xFF0E162B)
val DarkSurfaceVariant = Color(0xFF16203D)
val DarkOnBackground = Color(0xFFE8EEF8)
val DarkOnSurface = Color(0xFFD6E2F5)
val DarkOnSurfaceSecondary = Color(0xFF8A99B5)

// Light Theme Colors
val LightBackground = Color(0xFFF3F6FC)
val LightSurface = Color(0xFFFFFFFF)
val LightSurfaceVariant = Color(0xFFE5ECF6)
val LightOnBackground = Color(0xFF0E162B)
val LightOnSurface = Color(0xFF1B253F)
val LightOnSurfaceSecondary = Color(0xFF5A6987)

// Gradients
val VolnaGlowBrush = Brush.linearGradient(
    listOf(VolnaTurquoise, VolnaCyan, VolnaViolet)
)

val DarkCardGradient = Brush.verticalGradient(
    listOf(Color(0xFF121B33), Color(0xFF0B1224))
)
