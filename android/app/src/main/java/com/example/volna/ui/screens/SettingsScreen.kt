package com.example.volna.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.volna.data.model.AppThemeMode
import com.example.volna.data.model.VisualizerType
import com.example.volna.ui.theme.VolnaTurquoise
import com.example.volna.ui.viewmodel.MusicPlayerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: MusicPlayerViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val themeMode by viewModel.themeMode.collectAsState()
    val isVisualizerEnabled by viewModel.isVisualizerEnabled.collectAsState()
    val visualizerType by viewModel.visualizerType.collectAsState()
    val sensitivity by viewModel.visualizerSensitivity.collectAsState()
    val sleepTimerSeconds by viewModel.sleepTimerRemainingSeconds.collectAsState()

    var showAboutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Настройки", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Раздел 1: Внешний вид
            Text(
                text = "Внешний вид",
                style = MaterialTheme.typography.titleMedium,
                color = VolnaTurquoise
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Тема оформления", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        FilterChip(
                            selected = themeMode == AppThemeMode.DARK,
                            onClick = { viewModel.setThemeMode(AppThemeMode.DARK) },
                            label = { Text("Тёмная") }
                        )
                        FilterChip(
                            selected = themeMode == AppThemeMode.LIGHT,
                            onClick = { viewModel.setThemeMode(AppThemeMode.LIGHT) },
                            label = { Text("Светлая") }
                        )
                        FilterChip(
                            selected = themeMode == AppThemeMode.SYSTEM,
                            onClick = { viewModel.setThemeMode(AppThemeMode.SYSTEM) },
                            label = { Text("Системная") }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Раздел 2: Таймер сна
            Text(
                text = "Таймер сна",
                style = MaterialTheme.typography.titleMedium,
                color = VolnaTurquoise
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (sleepTimerSeconds != null) {
                                if (sleepTimerSeconds == -1L) "Остановится в конце трека"
                                else "Осталось: ${sleepTimerSeconds!! / 60} мин ${sleepTimerSeconds!! % 60} сек"
                            } else "Выключен",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        if (sleepTimerSeconds != null) {
                            TextButton(onClick = { viewModel.cancelSleepTimer() }) {
                                Text("Отменить", color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        listOf(15, 30, 45, 60).forEach { mins ->
                            OutlinedButton(
                                onClick = { viewModel.startSleepTimer(mins) },
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp)
                            ) {
                                Text("${mins}м")
                            }
                        }
                        OutlinedButton(
                            onClick = { viewModel.setSleepTimerOnTrackEnd() },
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text("Конец")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Раздел 3: Визуализатор
            Text(
                text = "Визуализатор",
                style = MaterialTheme.typography.titleMedium,
                color = VolnaTurquoise
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Включить визуализацию", style = MaterialTheme.typography.bodyLarge)
                        Switch(
                            checked = isVisualizerEnabled,
                            onCheckedChange = { viewModel.setVisualizerEnabled(it) }
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Тип визуализации", style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        VisualizerType.entries.forEach { type ->
                            FilterChip(
                                selected = visualizerType == type,
                                onClick = { viewModel.setVisualizerType(type) },
                                label = { Text(type.displayName) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Раздел 4: Медиатека и Управление
            Text(
                text = "Медиатека",
                style = MaterialTheme.typography.titleMedium,
                color = VolnaTurquoise
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Button(
                        onClick = { viewModel.scanMusic() },
                        colors = ButtonDefaults.buttonColors(containerColor = VolnaTurquoise),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Пересканировать медиатеку", color = Color.Black)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Раздел 5: О приложении
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Волна — Музыкальный плеер", style = MaterialTheme.typography.titleMedium)
                            Text("Версия 1.0.0 (Release)", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { showAboutDialog = true }) {
                            Icon(Icons.Default.Info, contentDescription = "Инфо", tint = VolnaTurquoise)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Приложение воспроизводит исключительно локальные аудиофайлы с вашего устройства. Никаких внешних серверов, регистрации, сбора данных или рекламы.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }

    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            title = { Text("О приложении «Волна»") },
            text = {
                Text(
                    "«Волна» — это стильный, независимый и быстрый аудиоплеер для Android.\n\n" +
                    "• Полностью локальная работа без интернета\n" +
                    "• Поддержка MP3, FLAC, AAC, OGG, WAV, M4A, Opus\n" +
                    "• Фоновое воспроизведение через Media3 MediaSession\n" +
                    "• Аппаратная и программная визуализация звука\n" +
                    "• Управление таймером сна и плейлистами"
                )
            },
            confirmButton = {
                TextButton(onClick = { showAboutDialog = false }) {
                    Text("Понятно")
                }
            }
        )
    }
}
