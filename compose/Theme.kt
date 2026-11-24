package com.syllabustracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

data class SubjectPastelTokens(
    val container: Color,
    val onContainer: Color,
    val track: Color,
    val progress: Color
)

object SubjectAccents {
    val MintLight = SubjectPastelTokens(
        container = Color(0xFFEDF7F2),
        onContainer = Color(0xFF1E5C41),
        track = Color(0xFFCCE5D8),
        progress = Color(0xFF2B7A58)
    )
    val MintDark = SubjectPastelTokens(
        container = Color(0xFF17231E),
        onContainer = Color(0xFF8BE3BA),
        track = Color(0xFF253B31),
        progress = Color(0xFF7AD9AE)
    )

    val ApricotLight = SubjectPastelTokens(
        container = Color(0xFFFDF3EA),
        onContainer = Color(0xFF964B14),
        track = Color(0xFFF1D5BC),
        progress = Color(0xFFC46622)
    )
    val ApricotDark = SubjectPastelTokens(
        container = Color(0xFF251D17),
        onContainer = Color(0xFFF6B786),
        track = Color(0xFF3D2E22),
        progress = Color(0xFFF4AC76)
    )

    val SkyLight = SubjectPastelTokens(
        container = Color(0xFFEEF4FD),
        onContainer = Color(0xFF244B8F),
        track = Color(0xFFCBDDF7),
        progress = Color(0xFF3665B7)
    )
    val SkyDark = SubjectPastelTokens(
        container = Color(0xFF171F2A),
        onContainer = Color(0xFF96C0FF),
        track = Color(0xFF26354B),
        progress = Color(0xFF8AB8FF)
    )

    val RoseLight = SubjectPastelTokens(
        container = Color(0xFFFDF0F3),
        onContainer = Color(0xFF8F2F46),
        track = Color(0xFFEFCBD4),
        progress = Color(0xFFBA4360)
    )
    val RoseDark = SubjectPastelTokens(
        container = Color(0xFF26191D),
        onContainer = Color(0xFFF5A3B6),
        track = Color(0xFF3F282F),
        progress = Color(0xFFF296AB)
    )

    val LavenderLight = SubjectPastelTokens(
        container = Color(0xFFF4F0FD),
        onContainer = Color(0xFF4F3592),
        track = Color(0xFFD8CAF5),
        progress = Color(0xFF6B4BB8)
    )
    val LavenderDark = SubjectPastelTokens(
        container = Color(0xFF1E1A2A),
        onContainer = Color(0xFFC5B0FF),
        track = Color(0xFF322A48),
        progress = Color(0xFFB89EFF)
    )
}

private val LightColors = lightColorScheme(
    primary = Color(0xFF5B4BC4),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF3EFFA),
    onPrimaryContainer = Color(0xFF1C1B1F),
    background = Color(0xFFFAF8FC),
    onBackground = Color(0xFF1C1B1F),
    surface = Color.White,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFE6E0EC),
    onSurfaceVariant = Color(0xFF49454F)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFB9ADFF),
    onPrimary = Color(0xFF1B1252),
    primaryContainer = Color(0xFF1B1A24),
    onPrimaryContainer = Color(0xFFF4EFF4),
    background = Color(0xFF121318),
    onBackground = Color(0xFFF4EFF4),
    surface = Color(0xFF1B1A20),
    onSurface = Color(0xFFF4EFF4),
    surfaceVariant = Color(0xFF2B2933),
    onSurfaceVariant = Color(0xFFCAC4D0)
)

@Composable
fun SyllabusTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content
    )
}
