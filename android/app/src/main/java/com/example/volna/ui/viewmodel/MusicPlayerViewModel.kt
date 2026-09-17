package com.example.volna.ui.viewmodel

import android.app.Application
import android.content.ComponentName
import android.net.Uri
import android.os.CountDownTimer
import androidx.annotation.OptIn
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.example.volna.data.model.AppThemeMode
import com.example.volna.data.model.Playlist
import com.example.volna.data.model.SortOption
import com.example.volna.data.model.Track
import com.example.volna.data.model.VisualizerType
import com.example.volna.data.preferences.UserPreferencesRepository
import com.example.volna.data.repository.MusicRepository
import com.example.volna.media.service.PlaybackService
import com.example.volna.media.visualizer.AudioVisualizerController
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class PlayerUiState(
    val currentTrack: Track? = null,
    val isPlaying: Boolean = false,
    val currentPositionMs: Long = 0L,
    val durationMs: Long = 0L,
    val isShuffleEnabled: Boolean = false,
    val repeatMode: Int = Player.REPEAT_MODE_OFF, // REPEAT_MODE_OFF, REPEAT_MODE_ONE, REPEAT_MODE_ALL
    val isFavorite: Boolean = false,
    val errorMessage: String? = null
)

class MusicPlayerViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MusicRepository(application)
    private val preferences = UserPreferencesRepository(application)
    val visualizerController = AudioVisualizerController()

    // MediaController
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var mediaController: MediaController? = null

    // UI States
    private val _playerUiState = MutableStateFlow(PlayerUiState())
    val playerUiState: StateFlow<PlayerUiState> = _playerUiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val sortOption: StateFlow<SortOption> = preferences.sortOptionFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SortOption.TITLE)

    val themeMode: StateFlow<AppThemeMode> = preferences.themeModeFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AppThemeMode.DARK)

    val visualizerType: StateFlow<VisualizerType> = preferences.visualizerTypeFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), VisualizerType.SPECTRUM)

    val isVisualizerEnabled: StateFlow<Boolean> = preferences.isVisualizerEnabledFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val visualizerSensitivity: StateFlow<Float> = preferences.visualizerSensitivityFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 1.0f)

    val visualizerBarsCount: StateFlow<Int> = preferences.visualizerBarsCountFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 32)

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    // Raw tracks from DB
    private val rawTracks = repository.allTracksFlow

    // Filtered & Sorted Tracks
    val tracks: StateFlow<List<Track>> = combine(
        rawTracks,
        _searchQuery,
        sortOption
    ) { trackList, query, sort ->
        val filtered = if (query.isBlank()) {
            trackList
        } else {
            val q = query.trim().lowercase()
            trackList.filter {
                it.title.lowercase().contains(q) ||
                it.artist.lowercase().contains(q) ||
                it.album.lowercase().contains(q)
            }
        }
        when (sort) {
            SortOption.TITLE -> filtered.sortedBy { it.title.lowercase() }
            SortOption.ARTIST -> filtered.sortedBy { it.artist.lowercase() }
            SortOption.ALBUM -> filtered.sortedBy { it.album.lowercase() }
            SortOption.DURATION -> filtered.sortedByDescending { it.durationMs }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val playlists: StateFlow<List<Playlist>> = repository.playlistsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val favoriteTracks: StateFlow<List<Track>> = repository.favoriteTracksFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Sleep timer
    private var sleepTimer: CountDownTimer? = null
    private val _sleepTimerRemainingSeconds = MutableStateFlow<Long?>(null)
    val sleepTimerRemainingSeconds: StateFlow<Long?> = _sleepTimerRemainingSeconds.asStateFlow()
    private var stopOnTrackEnd: Boolean = false

    private var progressJob: Job? = null

    init {
        initMediaController()
        startProgressTracker()
    }

    private fun initMediaController() {
        val sessionToken = SessionToken(
            getApplication(),
            ComponentName(getApplication(), PlaybackService::class.java)
        )
        controllerFuture = MediaController.Builder(getApplication(), sessionToken).buildAsync()
        controllerFuture?.addListener({
            try {
                mediaController = controllerFuture?.get()
                setupPlayerListener()
                // Подключаем визуализатор
                visualizerController.attachToAudioSession(
                    PlaybackService.audioSessionId,
                    visualizerBarsCount.value
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, MoreExecutors.directExecutor())
    }

    private fun setupPlayerListener() {
        mediaController?.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                _playerUiState.update { it.copy(isPlaying = isPlaying) }
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                if (stopOnTrackEnd && reason == Player.MEDIA_ITEM_TRANSITION_REASON_AUTO) {
                    pause()
                    cancelSleepTimer()
                    stopOnTrackEnd = false
                    return
                }
                updateCurrentTrackFromMediaItem(mediaItem)
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) {
                    _playerUiState.update {
                        it.copy(durationMs = mediaController?.duration?.coerceAtLeast(0L) ?: 0L)
                    }
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                _playerUiState.update {
                    it.copy(
                        isPlaying = false,
                        errorMessage = "Не удалось воспроизвести файл: ${error.message ?: "неподдерживаемый формат или повреждён"}"
                    )
                }
            }

            override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
                _playerUiState.update { it.copy(isShuffleEnabled = shuffleModeEnabled) }
            }

            override fun onRepeatModeChanged(repeatMode: Int) {
                _playerUiState.update { it.copy(repeatMode = repeatMode) }
            }
        })
    }

    private fun updateCurrentTrackFromMediaItem(mediaItem: MediaItem?) {
        val id = mediaItem?.mediaId?.toLongOrNull() ?: return
        viewModelScope.launch {
            val track = tracks.value.find { it.id == id } ?: favoriteTracks.value.find { it.id == id }
            if (track != null) {
                _playerUiState.update {
                    it.copy(
                        currentTrack = track,
                        durationMs = track.durationMs,
                        isFavorite = track.isFavorite
                    )
                }
                preferences.savePlaybackState(track.id, 0L)
            }
        }
    }

    fun scanMusic() {
        viewModelScope.launch {
            _isScanning.value = true
            try {
                repository.scanLocalMusic()
            } catch (e: Exception) {
                _playerUiState.update { it.copy(errorMessage = "Ошибка сканирования: ${e.message}") }
            } finally {
                _isScanning.value = false
            }
        }
    }

    fun playTrack(track: Track, playlist: List<Track> = tracks.value, startPositionMs: Long = 0L) {
        val controller = mediaController ?: return
        val startIndex = playlist.indexOfFirst { it.id == track.id }.coerceAtLeast(0)

        val mediaItems = playlist.map { item ->
            MediaItem.Builder()
                .setMediaId(item.id.toString())
                .setUri(item.contentUri)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(item.title)
                        .setArtist(item.artist)
                        .setAlbumTitle(item.album)
                        .setArtworkUri(item.albumArtUri)
                        .build()
                )
                .build()
        }

        controller.setMediaItems(mediaItems, startIndex, startPositionMs)
        controller.prepare()
        controller.play()

        _playerUiState.update {
            it.copy(
                currentTrack = track,
                isPlaying = true,
                isFavorite = track.isFavorite,
                errorMessage = null
            )
        }
    }

    fun togglePlayPause() {
        val controller = mediaController ?: return
        if (controller.isPlaying) {
            controller.pause()
        } else {
            if (controller.playbackState == Player.STATE_IDLE && _playerUiState.value.currentTrack != null) {
                val resumePos = _playerUiState.value.currentPositionMs
                playTrack(_playerUiState.value.currentTrack!!, startPositionMs = resumePos)
            } else {
                controller.play()
            }
        }
    }

    fun pause() {
        mediaController?.pause()
    }

    fun playNext() {
        mediaController?.let {
            if (it.hasNextMediaItem()) {
                it.seekToNextMediaItem()
            }
        }
    }

    fun playPrevious() {
        mediaController?.let {
            if (it.currentPosition > 3000 || !it.hasPreviousMediaItem()) {
                it.seekTo(0)
            } else {
                it.seekToPreviousMediaItem()
            }
        }
    }

    fun seekTo(positionMs: Long) {
        mediaController?.seekTo(positionMs)
        _playerUiState.update { it.copy(currentPositionMs = positionMs) }
    }

    fun seekForward10() {
        val current = mediaController?.currentPosition ?: 0L
        val target = (current + 10_000L).coerceAtMost(_playerUiState.value.durationMs)
        seekTo(target)
    }

    fun seekBack10() {
        val current = mediaController?.currentPosition ?: 0L
        val target = (current - 10_000L).coerceAtLeast(0L)
        seekTo(target)
    }

    fun toggleShuffle() {
        val controller = mediaController ?: return
        val newShuffle = !controller.shuffleModeEnabled
        controller.shuffleModeEnabled = newShuffle
        _playerUiState.update { it.copy(isShuffleEnabled = newShuffle) }
    }

    fun toggleRepeatMode() {
        val controller = mediaController ?: return
        val nextMode = when (controller.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        controller.repeatMode = nextMode
        _playerUiState.update { it.copy(repeatMode = nextMode) }
    }

    fun toggleFavorite(track: Track) {
        viewModelScope.launch {
            repository.toggleFavorite(track.id)
            val updatedFavorite = !track.isFavorite
            if (_playerUiState.value.currentTrack?.id == track.id) {
                _playerUiState.update { it.copy(isFavorite = updatedFavorite) }
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSortOption(option: SortOption) {
        viewModelScope.launch {
            preferences.setSortOption(option)
        }
    }

    fun setThemeMode(mode: AppThemeMode) {
        viewModelScope.launch { preferences.setThemeMode(mode) }
    }

    fun setVisualizerEnabled(enabled: Boolean) {
        viewModelScope.launch { preferences.setVisualizerEnabled(enabled) }
    }

    fun setVisualizerType(type: VisualizerType) {
        viewModelScope.launch { preferences.setVisualizerType(type) }
    }

    fun setVisualizerSensitivity(sensitivity: Float) {
        viewModelScope.launch { preferences.setVisualizerSensitivity(sensitivity) }
    }

    fun setVisualizerBarsCount(count: Int) {
        viewModelScope.launch {
            preferences.setVisualizerBarsCount(count)
            visualizerController.attachToAudioSession(PlaybackService.audioSessionId, count)
        }
    }

    fun createPlaylist(name: String) {
        viewModelScope.launch { repository.createPlaylist(name) }
    }

    fun deletePlaylist(playlistId: Long) {
        viewModelScope.launch { repository.deletePlaylist(playlistId) }
    }

    fun addTrackToPlaylist(playlistId: Long, trackId: Long) {
        viewModelScope.launch { repository.addTrackToPlaylist(playlistId, trackId) }
    }

    fun startSleepTimer(minutes: Int) {
        cancelSleepTimer()
        stopOnTrackEnd = false
        val totalSeconds = minutes * 60L
        _sleepTimerRemainingSeconds.value = totalSeconds

        sleepTimer = object : CountDownTimer(totalSeconds * 1000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                _sleepTimerRemainingSeconds.value = millisUntilFinished / 1000
            }

            override fun onFinish() {
                pause()
                _sleepTimerRemainingSeconds.value = null
            }
        }.start()
    }

    fun setSleepTimerOnTrackEnd() {
        cancelSleepTimer()
        stopOnTrackEnd = true
        _sleepTimerRemainingSeconds.value = -1L // специальный маркер "Конец трека"
    }

    fun cancelSleepTimer() {
        sleepTimer?.cancel()
        sleepTimer = null
        stopOnTrackEnd = false
        _sleepTimerRemainingSeconds.value = null
    }

    fun clearError() {
        _playerUiState.update { it.copy(errorMessage = null) }
    }

    private fun startProgressTracker() {
        progressJob = viewModelScope.launch {
            while (true) {
                val controller = mediaController
                if (controller != null && controller.isPlaying) {
                    val pos = controller.currentPosition.coerceAtLeast(0L)
                    val dur = controller.duration.coerceAtLeast(0L)
                    _playerUiState.update {
                        it.copy(
                            currentPositionMs = pos,
                            durationMs = if (dur > 0) dur else it.durationMs
                        )
                    }
                    // Обновляем визуализатор (включая fallback анимацию)
                    val norm = if (dur > 0) (pos.toFloat() / dur).coerceIn(0f, 1f) else 0f
                    visualizerController.updateFallbackFrame(
                        progressNormalized = norm,
                        isPlaying = true,
                        sensitivity = visualizerSensitivity.value
                    )
                }
                delay(200)
            }
        }
    }

    override fun onCleared() {
        progressJob?.cancel()
        cancelSleepTimer()
        visualizerController.release()
        controllerFuture?.let { MediaController.releaseFuture(it) }
        mediaController = null
        super.onCleared()
    }
}
