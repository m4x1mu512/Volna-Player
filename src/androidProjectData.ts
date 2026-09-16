export interface AndroidFile {
  path: string;
  name: string;
  stage: number;
  stageTitle: string;
  description: string;
  code: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: "gradle/libs.versions.toml",
    name: "libs.versions.toml",
    stage: 2,
    stageTitle: "Gradle и манифест",
    description: "Version Catalog со всеми версиями Media3, Compose BOM, Room, DataStore, KSP и Coil.",
    code: `[versions]
agp = "8.7.3"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
navigationCompose = "2.8.4"
media3 = "1.5.0"
room = "2.6.1"
ksp = "2.0.21-1.0.28"
datastore = "1.1.1"
coil = "2.7.0"
coroutines = "1.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }

# Compose BOM & UI
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }

# Navigation Compose
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

# Media3 ExoPlayer & Session
androidx-media3-exoplayer = { group = "androidx.media3", name = "media3-exoplayer", version.ref = "media3" }
androidx-media3-session = { group = "androidx.media3", name = "media3-session", version.ref = "media3" }
androidx-media3-common = { group = "androidx.media3", name = "media3-common", version.ref = "media3" }

# Room
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# DataStore Preferences
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }

# Coil Image Loader
coil-compose = { group = "io.coil-kt", name = "coil-compose", version.ref = "coil" }

# Coroutines
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }`
  },
  {
    path: "app/build.gradle.kts",
    name: "app/build.gradle.kts",
    stage: 2,
    stageTitle: "Gradle и манифест",
    description: "Конфигурация модуля :app, minSdk 26, targetSdk 35, Java 17, KSP и зависимости.",
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.example.volna"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.volna"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=androidx.media3.common.util.UnstableApi"
        )
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    debugImplementation(libs.androidx.compose.ui.tooling)

    implementation(libs.androidx.navigation.compose)

    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.session)
    implementation(libs.androidx.media3.common)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.coil.compose)
    implementation(libs.kotlinx.coroutines.android)
}`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    name: "AndroidManifest.xml",
    stage: 2,
    stageTitle: "Gradle и манифест",
    description: "Разрешения READ_MEDIA_AUDIO, READ_EXTERNAL_STORAGE, FOREGROUND_SERVICE_MEDIA_PLAYBACK и объявление PlaybackService.",
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission
        android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Volna"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Volna"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="audio/*" />
            </intent-filter>
        </activity>

        <service
            android:name=".media.service.PlaybackService"
            android:exported="true"
            android:foregroundServiceType="mediaPlayback">
            <intent-filter>
                <action android:name="androidx.media3.session.MediaSessionService" />
                <action android:name="android.media.browse.MediaBrowserService" />
            </intent-filter>
        </service>
    </application>
</manifest>`
  },
  {
    path: "data/model/Track.kt",
    name: "Track.kt",
    stage: 3,
    stageTitle: "Модели, Room и Repository",
    description: "Domain-модель аудио-трека с длительностью, Uri, метаданными и статусом избранного.",
    code: `package com.example.volna.data.model

import android.net.Uri

data class Track(
    val id: Long,
    val title: String,
    val artist: String,
    val album: String,
    val durationMs: Long,
    val contentUri: Uri,
    val albumArtUri: Uri? = null,
    val size: Long = 0L,
    val dateAdded: Long = 0L,
    val mimeType: String? = null,
    val isFavorite: Boolean = false
) {
    val formattedDuration: String
        get() {
            val totalSeconds = durationMs / 1000
            val minutes = totalSeconds / 60
            val seconds = totalSeconds % 60
            return String.format("%02d:%02d", minutes, seconds)
        }
}`
  },
  {
    path: "data/database/entity/Entities.kt",
    name: "Entities.kt",
    stage: 3,
    stageTitle: "Модели, Room и Repository",
    description: "Room-сущности: TrackEntity, PlaylistEntity, PlaylistTrackCrossRef и FavoriteEntity.",
    code: `package com.example.volna.data.database.entity

import androidx.room.*

@Entity(tableName = "tracks")
data class TrackEntity(
    @PrimaryKey val id: Long,
    val title: String,
    val artist: String,
    val album: String,
    val durationMs: Long,
    val contentUriString: String,
    val albumArtUriString: String?,
    val size: Long,
    val dateAdded: Long,
    val mimeType: String?
)

@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val name: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "playlist_tracks",
    primaryKeys = ["playlistId", "trackId"],
    foreignKeys = [
        ForeignKey(
            entity = PlaylistEntity::class,
            parentColumns = ["id"],
            childColumns = ["playlistId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["playlistId"]), Index(value = ["trackId"])]
)
data class PlaylistTrackCrossRef(
    val playlistId: Long,
    val trackId: Long,
    val addedAt: Long = System.currentTimeMillis(),
    val orderPosition: Int = 0
)

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey val trackId: Long,
    val addedAt: Long = System.currentTimeMillis()
)`
  },
  {
    path: "data/database/dao/MusicDao.kt",
    name: "MusicDao.kt",
    stage: 3,
    stageTitle: "Модели, Room и Repository",
    description: "Room Data Access Object с реактивными Flow для треков, избранного и плейлистов.",
    code: `package com.example.volna.data.database.dao

import androidx.room.*
import com.example.volna.data.database.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface MusicDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTracks(tracks: List<TrackEntity>)

    @Query("SELECT * FROM tracks ORDER BY title COLLATE NOCASE ASC")
    fun getAllTracks(): Flow<List<TrackEntity>>

    @Query("SELECT * FROM tracks WHERE id = :id LIMIT 1")
    suspend fun getTrackById(id: Long): TrackEntity?

    @Query("DELETE FROM tracks WHERE id NOT IN (:validIds)")
    suspend fun deleteOldTracks(validIds: List<Long>)

    @Query("SELECT trackId FROM favorites")
    fun getFavoriteTrackIds(): Flow<List<Long>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(favorite: FavoriteEntity)

    @Query("DELETE FROM favorites WHERE trackId = :trackId")
    suspend fun removeFavorite(trackId: Long)

    @Query("SELECT EXISTS(SELECT 1 FROM favorites WHERE trackId = :trackId)")
    suspend fun isFavorite(trackId: Long): Boolean

    @Query("SELECT * FROM playlists ORDER BY createdAt DESC")
    fun getAllPlaylists(): Flow<List<PlaylistEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylist(playlist: PlaylistEntity): Long

    @Update
    suspend fun updatePlaylist(playlist: PlaylistEntity)

    @Query("DELETE FROM playlists WHERE id = :playlistId")
    suspend fun deletePlaylist(playlistId: Long)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addTrackToPlaylist(crossRef: PlaylistTrackCrossRef)

    @Query("DELETE FROM playlist_tracks WHERE playlistId = :playlistId AND trackId = :trackId")
    suspend fun removeTrackFromPlaylist(playlistId: Long, trackId: Long)

    @Query("""
        SELECT t.* FROM tracks t
        INNER JOIN playlist_tracks pt ON t.id = pt.trackId
        WHERE pt.playlistId = :playlistId
        ORDER BY pt.orderPosition ASC, pt.addedAt ASC
    """)
    fun getTracksForPlaylist(playlistId: Long): Flow<List<TrackEntity>>
}`
  },
  {
    path: "media/service/PlaybackService.kt",
    name: "PlaybackService.kt",
    stage: 4,
    stageTitle: "PlaybackService и MediaSession",
    description: "Сервис фонового воспроизведения Media3, связка с ExoPlayer, аудиофокус, системная шторка и экран блокировки.",
    code: `package com.example.volna.media.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.example.volna.MainActivity
import com.example.volna.R

class PlaybackService : MediaSessionService() {

    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null

    companion object {
        const val CHANNEL_ID = "volna_playback_channel"
        @Volatile
        var audioSessionId: Int = 0
            private set
    }

    @OptIn(UnstableApi::class)
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        val exoPlayer = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()

        player = exoPlayer
        audioSessionId = exoPlayer.audioSessionId

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        mediaSession = MediaSession.Builder(this, exoPlayer)
            .setSessionActivity(pendingIntent)
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = getString(R.string.playback_channel_name)
            val descriptionText = getString(R.string.playback_channel_description)
            val channel = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        player?.run {
            stop()
            release()
        }
        mediaSession?.release()
        player = null
        mediaSession = null
        super.onDestroy()
    }
}`
  },
  {
    path: "media/scanner/MediaStoreScanner.kt",
    name: "MediaStoreScanner.kt",
    stage: 5,
    stageTitle: "Сканирование MediaStore и разрешения",
    description: "Безопасное сканирование локальных аудиофайлов на Android 8.0 - 15+ с фильтрацией системных рингтонов и извлечением обложек.",
    code: `package com.example.volna.media.scanner

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.example.volna.data.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MediaStoreScanner(private val context: Context) {

    suspend fun scanAudioFiles(): List<Track> = withContext(Dispatchers.IO) {
        val tracks = mutableListOf<Track>()

        val collectionUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
        } else {
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        }

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.SIZE,
            MediaStore.Audio.Media.DATE_ADDED,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DISPLAY_NAME
        )

        val selection = "\${MediaStore.Audio.Media.IS_MUSIC} != 0 AND \${MediaStore.Audio.Media.DURATION} >= 5000"
        val sortOrder = "\${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"

        try {
            context.contentResolver.query(
                collectionUri,
                projection,
                selection,
                null,
                sortOrder
            )?.use { cursor ->
                val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
                val dateAddedCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
                val mimeTypeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
                val albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
                val displayNameCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idCol)
                    val rawTitle = cursor.getString(titleCol)
                    val rawDisplayName = cursor.getString(displayNameCol)
                    val rawArtist = cursor.getString(artistCol)
                    val rawAlbum = cursor.getString(albumCol)
                    val duration = cursor.getLong(durationCol)
                    val size = cursor.getLong(sizeCol)
                    val dateAdded = cursor.getLong(dateAddedCol)
                    val mimeType = cursor.getString(mimeTypeCol)
                    val albumId = cursor.getLong(albumIdCol)

                    val contentUri = ContentUris.withAppendedId(
                        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                        id
                    )

                    val albumArtUri = try {
                        ContentUris.withAppendedId(
                            Uri.parse("content://media/external/audio/albumart"),
                            albumId
                        )
                    } catch (e: Exception) { null }

                    val title = when {
                        !rawTitle.isNullOrBlank() && rawTitle != "<unknown>" -> rawTitle.trim()
                        !rawDisplayName.isNullOrBlank() -> rawDisplayName.substringBeforeLast(".")
                        else -> "Трек #$id"
                    }

                    val artist = when {
                        !rawArtist.isNullOrBlank() && rawArtist != "<unknown>" -> rawArtist.trim()
                        else -> "Неизвестный исполнитель"
                    }

                    tracks.add(
                        Track(
                            id = id,
                            title = title,
                            artist = artist,
                            album = rawAlbum ?: "Неизвестный альбом",
                            durationMs = duration,
                            contentUri = contentUri,
                            albumArtUri = albumArtUri,
                            size = size,
                            dateAdded = dateAdded,
                            mimeType = mimeType
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        tracks
    }
}`
  },
  {
    path: "media/visualizer/AudioVisualizerController.kt",
    name: "AudioVisualizerController.kt",
    stage: 8,
    stageTitle: "Аудиовизуализатор",
    description: "Аппаратный FFT-захват через android.media.audiofx.Visualizer со сглаживанием EMA и встроенным fallback-режимом.",
    code: `package com.example.volna.media.visualizer

import android.media.audiofx.Visualizer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.hypot

class AudioVisualizerController {
    private var visualizer: Visualizer? = null
    private val _amplitudes = MutableStateFlow(FloatArray(32) { 0f })
    val amplitudes: StateFlow<FloatArray> = _amplitudes.asStateFlow()

    private var smoothedData = FloatArray(32) { 0f }
    private var isSimulated = false

    fun attachToAudioSession(audioSessionId: Int, barsCount: Int = 32) {
        release()
        smoothedData = FloatArray(barsCount) { 0f }

        if (audioSessionId <= 0) {
            isSimulated = true
            return
        }

        try {
            val v = Visualizer(audioSessionId)
            v.captureSize = Visualizer.getCaptureSizeRange()[1].coerceAtMost(1024)
            v.setDataCaptureListener(
                object : Visualizer.OnDataCaptureListener {
                    override fun onWaveFormDataCapture(v: Visualizer?, b: ByteArray?, rate: Int) {}
                    override fun onFftDataCapture(v: Visualizer?, fft: ByteArray?, rate: Int) {
                        if (fft == null) return
                        processFft(fft, barsCount)
                    }
                },
                Visualizer.getMaxCaptureRate() / 2,
                false,
                true
            )
            v.enabled = true
            visualizer = v
            isSimulated = false
        } catch (e: Exception) {
            isSimulated = true
        }
    }

    private fun processFft(fft: ByteArray, barsCount: Int) {
        val n = fft.size
        val bands = FloatArray(barsCount)
        val step = (n / 2) / barsCount

        for (i in 0 until barsCount) {
            val idx = (i * step * 2).coerceIn(0, n - 2)
            val magnitude = hypot(fft[idx].toFloat(), fft[idx + 1].toFloat()) / 128f
            bands[i] = magnitude.coerceIn(0f, 1f)
        }

        val alpha = 0.25f
        for (i in 0 until barsCount) {
            smoothedData[i] = smoothedData[i] * (1 - alpha) + bands[i] * alpha
        }
        _amplitudes.value = smoothedData.copyOf()
    }

    fun release() {
        try {
            visualizer?.enabled = false
            visualizer?.release()
        } catch (e: Exception) { e.printStackTrace() }
        visualizer = null
    }
}`
  },
  {
    path: "ui/components/AudioVisualizerView.kt",
    name: "AudioVisualizerView.kt",
    stage: 8,
    stageTitle: "Аудиовизуализатор",
    description: "Jetpack Compose Canvas с тремя режимами визуализации: Спектр (столбцы), Волна (плавная кривая Безье) и Круг (радиальный неон).",
    code: `package com.example.volna.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import com.example.volna.data.model.VisualizerType
import com.example.volna.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun AudioVisualizerView(
    amplitudes: FloatArray,
    type: VisualizerType,
    modifier: Modifier = Modifier,
    sensitivity: Float = 1.0f
) {
    val gradientBrush = Brush.linearGradient(listOf(VolnaTurquoise, VolnaCyan, VolnaViolet))

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        if (width <= 0 || height <= 0 || amplitudes.isEmpty()) return@Canvas

        when (type) {
            VisualizerType.SPECTRUM -> {
                val barsCount = amplitudes.size
                val barSpacing = 4f
                val barWidth = ((width - (barsCount - 1) * barSpacing) / barsCount).coerceAtLeast(2f)

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
                    val y = if (i % 2 == 0) midY - offset else midY + offset
                    val x = i * step

                    if (i == 0) path.moveTo(x, y)
                    else {
                        val prevX = (i - 1) * step
                        val prevY = if ((i - 1) % 2 == 0) midY - amplitudes[i - 1] * (height / 2.5f) else midY + amplitudes[i - 1] * (height / 2.5f)
                        path.cubicTo((prevX + x) / 2f, prevY, (prevX + x) / 2f, y, x, y)
                    }
                }
                drawPath(path = path, brush = gradientBrush, style = Stroke(width = 5f, cap = StrokeCap.Round))
            }

            VisualizerType.CIRCLE -> {
                val center = Offset(width / 2f, height / 2f)
                val baseRadius = (minOf(width, height) / 3.5f)
                val angleStep = (2 * Math.PI) / amplitudes.size

                for (i in amplitudes.indices) {
                    val angle = i * angleStep
                    val barLength = (amplitudes[i] * sensitivity).coerceIn(0f, 1f) * (baseRadius * 0.8f)
                    val startX = (center.x + baseRadius * cos(angle)).toFloat()
                    val startY = (center.y + baseRadius * sin(angle)).toFloat()
                    val endX = (center.x + (baseRadius + barLength) * cos(angle)).toFloat()
                    val endY = (center.y + (baseRadius + barLength) * sin(angle)).toFloat()

                    drawLine(brush = gradientBrush, start = Offset(startX, startY), end = Offset(endX, endY), strokeWidth = 4f, cap = StrokeCap.Round)
                }
            }
        }
    }
}`
  },
  {
    path: "ui/screens/HomeScreen.kt",
    name: "HomeScreen.kt",
    stage: 7,
    stageTitle: "Compose-интерфейс",
    description: "Главный экран с заголовком «Волна», поиском, вкладками (Треки, Исполнители, Альбомы, Папки, Плейлисты), сортировкой музыки по папкам устройства и мини-плеером.",
    code: `// См. полный исходный файл android/app/src/main/java/com/example/volna/ui/screens/HomeScreen.kt`
  },
  {
    path: "ui/screens/PlayerScreen.kt",
    name: "PlayerScreen.kt",
    stage: 7,
    stageTitle: "Compose-интерфейс",
    description: "Полноэкранный проигрыватель со свайп-жестами (сверху вниз — свернуть окно, справа налево — следующий трек, слева направо — предыдущий), крупной обложкой, перемоткой на 10с и полным контролем воспроизведения.",
    code: `package com.example.volna.ui.screens

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

    // Анимация пульсации обложки в такт музыке
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
                // Свайп-жесты управления:
                // - Сверху вниз (dy > threshold) -> убрать окно воспроизведения
                // - Справа налево (dx < -threshold) -> следующий трек
                // - Слева направо (dx > threshold) -> предыдущий трек
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
                            if (totalDragY > threshold) {
                                onBackClick() // Сверху вниз
                            }
                        } else {
                            if (totalDragX < -threshold) {
                                viewModel.playNext() // Справа налево
                            } else if (totalDragX > threshold) {
                                viewModel.playPrevious() // Слева направо
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
                    text = "\${track?.artist ?: "Неизвестный"} • \${track?.album ?: ""}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Ползунок прогресса
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

            // Кнопки управления
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.seekBack10() }) {
                    Icon(Icons.Default.Replay10, contentDescription = "Назад 10с", tint = MaterialTheme.colorScheme.onSurface)
                }

                IconButton(onClick = { viewModel.playPrevious() }) {
                    Icon(imageVector = Icons.Default.SkipPrevious, contentDescription = "Предыдущий", tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(36.dp))
                }

                IconButton(
                    onClick = { viewModel.togglePlayPause() },
                    modifier = Modifier.size(68.dp).clip(CircleShape).background(VolnaTurquoise)
                ) {
                    Icon(imageVector = if (playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, contentDescription = "Воспроизведение", tint = Color.Black, modifier = Modifier.size(38.dp))
                }

                IconButton(onClick = { viewModel.playNext() }) {
                    Icon(imageVector = Icons.Default.SkipNext, contentDescription = "Следующий", tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(36.dp))
                }

                IconButton(onClick = { viewModel.seekForward10() }) {
                    Icon(Icons.Default.Forward10, contentDescription = "Вперед 10с", tint = MaterialTheme.colorScheme.onSurface)
                }
            }

            // Shuffle, Favorite, Repeat
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.toggleShuffle() }) {
                    Icon(imageVector = Icons.Default.Shuffle, contentDescription = "Случайно", tint = if (playerState.isShuffleEnabled) VolnaTurquoise else MaterialTheme.colorScheme.onSurfaceVariant)
                }

                track?.let { t ->
                    IconButton(onClick = { viewModel.toggleFavorite(t) }) {
                        Icon(imageVector = if (playerState.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder, contentDescription = "В избранное", tint = if (playerState.isFavorite) VolnaPink else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

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
}`
  },
  {
    path: "ui/screens/SettingsScreen.kt",
    name: "SettingsScreen.kt",
    stage: 9,
    stageTitle: "Настройки и таймер сна",
    description: "Экран настроек темы (Тёмная / Светлая / Системная), параметров визуализатора, пересканирования и таймера сна (15, 30, 45, 60 мин, Конец трека).",
    code: `// См. полный исходный файл android/app/src/main/java/com/example/volna/ui/screens/SettingsScreen.kt`
  }
];
