package com.example.volna.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.example.volna.data.model.AppThemeMode
import com.example.volna.data.model.SortOption
import com.example.volna.data.model.VisualizerType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "volna_user_settings")

class UserPreferencesRepository(private val context: Context) {

    private object PreferencesKeys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val VISUALIZER_ENABLED = booleanPreferencesKey("visualizer_enabled")
        val VISUALIZER_TYPE = stringPreferencesKey("visualizer_type")
        val VISUALIZER_SENSITIVITY = floatPreferencesKey("visualizer_sensitivity")
        val VISUALIZER_BARS_COUNT = intPreferencesKey("visualizer_bars_count")
        val SORT_OPTION = stringPreferencesKey("sort_option")
        val LAST_PLAYED_TRACK_ID = longPreferencesKey("last_played_track_id")
        val LAST_PLAYED_POSITION = longPreferencesKey("last_played_position")
    }

    val themeModeFlow: Flow<AppThemeMode> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { preferences ->
            when (preferences[PreferencesKeys.THEME_MODE]) {
                AppThemeMode.LIGHT.name -> AppThemeMode.LIGHT
                AppThemeMode.SYSTEM.name -> AppThemeMode.SYSTEM
                else -> AppThemeMode.DARK
            }
        }

    val isVisualizerEnabledFlow: Flow<Boolean> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.VISUALIZER_ENABLED] ?: true }

    val visualizerTypeFlow: Flow<VisualizerType> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { preferences ->
            when (preferences[PreferencesKeys.VISUALIZER_TYPE]) {
                VisualizerType.WAVE.name -> VisualizerType.WAVE
                VisualizerType.CIRCLE.name -> VisualizerType.CIRCLE
                else -> VisualizerType.SPECTRUM
            }
        }

    val visualizerSensitivityFlow: Flow<Float> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.VISUALIZER_SENSITIVITY] ?: 1.0f }

    val visualizerBarsCountFlow: Flow<Int> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.VISUALIZER_BARS_COUNT] ?: 32 }

    val sortOptionFlow: Flow<SortOption> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { preferences ->
            when (preferences[PreferencesKeys.SORT_OPTION]) {
                SortOption.ARTIST.name -> SortOption.ARTIST
                SortOption.ALBUM.name -> SortOption.ALBUM
                SortOption.DURATION.name -> SortOption.DURATION
                else -> SortOption.TITLE
            }
        }

    val lastPlayedTrackIdFlow: Flow<Long?> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.LAST_PLAYED_TRACK_ID] }

    val lastPlayedPositionFlow: Flow<Long> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.LAST_PLAYED_POSITION] ?: 0L }

    suspend fun setThemeMode(mode: AppThemeMode) {
        context.dataStore.edit { it[PreferencesKeys.THEME_MODE] = mode.name }
    }

    suspend fun setVisualizerEnabled(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.VISUALIZER_ENABLED] = enabled }
    }

    suspend fun setVisualizerType(type: VisualizerType) {
        context.dataStore.edit { it[PreferencesKeys.VISUALIZER_TYPE] = type.name }
    }

    suspend fun setVisualizerSensitivity(sensitivity: Float) {
        context.dataStore.edit { it[PreferencesKeys.VISUALIZER_SENSITIVITY] = sensitivity }
    }

    suspend fun setVisualizerBarsCount(count: Int) {
        context.dataStore.edit { it[PreferencesKeys.VISUALIZER_BARS_COUNT] = count }
    }

    suspend fun setSortOption(sort: SortOption) {
        context.dataStore.edit { it[PreferencesKeys.SORT_OPTION] = sort.name }
    }

    suspend fun savePlaybackState(trackId: Long, positionMs: Long) {
        context.dataStore.edit {
            it[PreferencesKeys.LAST_PLAYED_TRACK_ID] = trackId
            it[PreferencesKeys.LAST_PLAYED_POSITION] = positionMs
        }
    }

    suspend fun resetPreferences() {
        context.dataStore.edit { it.clear() }
    }
}
