package com.example.volna.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.volna.data.model.VisualizerType
import com.example.volna.ui.components.AudioVisualizerView
import com.example.volna.ui.theme.VolnaTurquoise
import com.example.volna.ui.viewmodel.MusicPlayerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VisualizerScreen(
    viewModel: MusicPlayerViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val playerState by viewModel.playerUiState.collectAsState()
    val visualizerType by viewModel.visualizerType.collectAsState()
    val isEnabled by viewModel.isVisualizerEnabled.collectAsState()
    val sensitivity by viewModel.visualizerSensitivity.collectAsState()
    val barsCount by viewModel.visualizerBarsCount.collectAsState()
    val amplitudes by viewModel.visualizerController.amplitudes.collectAsState()

    var showControls by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Визуализатор звука", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                actions = {
                    Switch(
                        checked = isEnabled,
                        onCheckedChange = { viewModel.setVisualizerEnabled(it) },
                        colors = SwitchDefaults.colors(checkedThumbColor = VolnaTurquoise)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Информация о текущем треке
            Text(
                text = playerState.currentTrack?.title ?: "Нет трека",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Text(
                text = playerState.currentTrack?.artist ?: "Воспроизведение остановлено",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Основная область визуализации Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(vertical = 16.dp)
                    .background(Color.Black.copy(alpha = 0.2f), shape = RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                if (isEnabled) {
                    AudioVisualizerView(
                        amplitudes = amplitudes,
                        type = visualizerType,
                        sensitivity = sensitivity,
                        modifier = Modifier.fillMaxSize().padding(16.dp)
                    )
                } else {
                    Text(
                        text = "Визуализатор выключен",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Переключатели режимов и чувствительности
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                // Выбор типа визуализации
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    VisualizerType.entries.forEach { type ->
                        FilterChip(
                            selected = visualizerType == type,
                            onClick = { viewModel.setVisualizerType(type) },
                            label = { Text(type.displayName) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Настройка чувствительности
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Чувствительность",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.width(130.dp)
                    )
                    Slider(
                        value = sensitivity,
                        onValueChange = { viewModel.setVisualizerSensitivity(it) },
                        valueRange = 0.5f..2.5f,
                        modifier = Modifier.weight(1f),
                        colors = SliderDefaults.colors(thumbColor = VolnaTurquoise, activeTrackColor = VolnaTurquoise)
                    )
                }

                // Быстрое управление воспроизведением
                IconButton(
                    onClick = { viewModel.togglePlayPause() },
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Icon(
                        imageVector = if (playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Play/Pause",
                        tint = VolnaTurquoise,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }
        }
    }
}
