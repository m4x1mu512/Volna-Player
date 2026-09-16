package com.example.volna.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.media3.common.Player
import coil.compose.AsyncImage
import com.example.volna.ui.components.AudioVisualizerView
import com.example.volna.ui.theme.VolnaCyan
import com.example.volna.ui.theme.VolnaPink
import com.example.volna.ui.theme.VolnaTurquoise
import com.example.volna.ui.theme.VolnaViolet
import com.example.volna.ui.viewmodel.MusicPlayerViewModel
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    viewModel: MusicPlayerViewModel,
    onBackClick: () -> Unit,
    onOpenVisualizer: () -> Unit,
    modifier: Modifier = Modifier
) {
    val playerState by viewModel.playerUiState.collectAsState()
    val visualizerType by viewModel.visualizerType.collectAsState()
    val isVisualizerEnabled by viewModel.isVisualizerEnabled.collectAsState()
    val visualizerSensitivity by viewModel.visualizerSensitivity.collectAsState()
    val amplitudes by viewModel.visualizerController.amplitudes.collectAsState()

    val track = playerState.currentTrack
    var isDraggingSlider by remember { mutableStateOf(false) }
    var sliderPosition by remember { mutableFloatStateOf(0f) }
    var totalDragX by remember { mutableFloatStateOf(0f) }
    var totalDragY by remember { mutableFloatStateOf(0f) }

    // Анимация пульсации обложки в такт музыке при воспроизведении
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = if (playerState.isPlaying) 1.03f else 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "coverScale"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Сейчас играет", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                actions = {
                    IconButton(onClick = onOpenVisualizer) {
                        Icon(Icons.Default.GraphicEq, contentDescription = "Визуализатор", tint = VolnaTurquoise)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = {
                        totalDragX = 0f
                        totalDragY = 0f
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        totalDragX += dragAmount.x
                        totalDragY += dragAmount.y
                    },
                    onDragEnd = {
                        val threshold = 90f
                        if (abs(totalDragY) > abs(totalDragX)) {
                            // Сверху вниз - убрать окно воспроизведения
                            if (totalDragY > threshold) {
                                onBackClick()
                            }
                        } else {
                            // Справа налево - следующий трек
                            if (totalDragX < -threshold) {
                                viewModel.playNext()
                            }
                            // Слева направо - предыдущий трек
                            else if (totalDragX > threshold) {
                                viewModel.playPrevious()
                            }
                        }
                        totalDragX = 0f
                        totalDragY = 0f
                    }
                )
            }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Крупная квадратная обложка или встроенный визуализатор
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .scale(pulseScale)
                    .clip(RoundedCornerShape(24.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                if (track?.albumArtUri != null) {
                    AsyncImage(
                        model = track.albumArtUri,
                        contentDescription = "Обложка трека",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = null,
                        tint = VolnaTurquoise.copy(alpha = 0.5f),
                        modifier = Modifier.size(100.dp)
                    )
                }

                // Компактный наложенный визуализатор снизу обложки, если включен
                if (isVisualizerEnabled && playerState.isPlaying) {
                    AudioVisualizerView(
                        amplitudes = amplitudes,
                        type = visualizerType,
                        sensitivity = visualizerSensitivity,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp)
                            .align(Alignment.BottomCenter)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Название трека и артист
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = track?.title ?: "Нет трека",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${track?.artist ?: "Неизвестный"} • ${track?.album ?: ""}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Ползунок прогресса и тайминги
            Column(modifier = Modifier.fillMaxWidth()) {
                val currentMs = if (isDraggingSlider) (sliderPosition * playerState.durationMs).toLong()
                else playerState.currentPositionMs

                Slider(
                    value = if (isDraggingSlider) sliderPosition
                    else if (playerState.durationMs > 0) playerState.currentPositionMs.toFloat() / playerState.durationMs
                    else 0f,
                    onValueChange = {
                        isDraggingSlider = true
                        sliderPosition = it
                    },
                    onValueChangeFinished = {
                        val targetMs = (sliderPosition * playerState.durationMs).toLong()
                        viewModel.seekTo(targetMs)
                        isDraggingSlider = false
                    },
                    colors = SliderDefaults.colors(
                        thumbColor = VolnaTurquoise,
                        activeTrackColor = VolnaTurquoise,
                        inactiveTrackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatTime(currentMs),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatTime(playerState.durationMs),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Главные кнопки управления
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Перемотка назад 10 сек
                IconButton(onClick = { viewModel.seekBack10() }) {
                    Icon(Icons.Default.Replay10, contentDescription = "Назад 10с", tint = MaterialTheme.colorScheme.onSurface)
                }

                // Предыдущий
                IconButton(onClick = { viewModel.playPrevious() }) {
                    Icon(
                        imageVector = Icons.Default.SkipPrevious,
                        contentDescription = "Предыдущий",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(36.dp)
                    )
                }

                // Воспроизведение / Пауза (Большая неоновая кнопка)
                IconButton(
                    onClick = { viewModel.togglePlayPause() },
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(VolnaTurquoise)
                ) {
                    Icon(
                        imageVector = if (playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Воспроизведение",
                        tint = Color.Black,
                        modifier = Modifier.size(38.dp)
                    )
                }

                // Следующий
                IconButton(onClick = { viewModel.playNext() }) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = "Следующий",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(36.dp)
                    )
                }

                // Перемотка вперед 10 сек
                IconButton(onClick = { viewModel.seekForward10() }) {
                    Icon(Icons.Default.Forward10, contentDescription = "Вперед 10с", tint = MaterialTheme.colorScheme.onSurface)
                }
            }

            // Дополнительные кнопки (Shuffle, Repeat, Favorite)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Случайный порядок (Shuffle)
                IconButton(onClick = { viewModel.toggleShuffle() }) {
                    Icon(
                        imageVector = Icons.Default.Shuffle,
                        contentDescription = "Случайно",
                        tint = if (playerState.isShuffleEnabled) VolnaTurquoise else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Добавить в избранное
                track?.let { t ->
                    IconButton(onClick = { viewModel.toggleFavorite(t) }) {
                        Icon(
                            imageVector = if (playerState.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "В избранное",
                            tint = if (playerState.isFavorite) VolnaPink else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Режим повтора (Repeat Off / All / One)
                IconButton(onClick = { viewModel.toggleRepeatMode() }) {
                    val icon = when (playerState.repeatMode) {
                        Player.REPEAT_MODE_ONE -> Icons.Default.RepeatOne
                        else -> Icons.Default.Repeat
                    }
                    val tint = when (playerState.repeatMode) {
                        Player.REPEAT_MODE_OFF -> MaterialTheme.colorScheme.onSurfaceVariant
                        else -> VolnaTurquoise
                    }
                    Icon(imageVector = icon, contentDescription = "Повтор", tint = tint)
                }
            }
        }
    }
}

private fun formatTime(millis: Long): String {
    val totalSeconds = (millis / 1000).coerceAtLeast(0)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%02d:%02d", minutes, seconds)
}
