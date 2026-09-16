package com.example.volna.data.repository

import android.content.Context
import android.net.Uri
import com.example.volna.data.database.VolnaDatabase
import com.example.volna.data.database.entity.FavoriteEntity
import com.example.volna.data.database.entity.PlaylistEntity
import com.example.volna.data.database.entity.PlaylistTrackCrossRef
import com.example.volna.data.database.entity.TrackEntity
import com.example.volna.data.model.Playlist
import com.example.volna.data.model.Track
import com.example.volna.media.scanner.MediaStoreScanner
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map

class MusicRepository(
    private val context: Context,
    private val database: VolnaDatabase = VolnaDatabase.getDatabase(context),
    private val scanner: MediaStoreScanner = MediaStoreScanner(context)
) {
    private val dao = database.musicDao()

    /**
     * Возвращает реактивный поток всех треков, объединяя их с избранными.
     */
    val allTracksFlow: Flow<List<Track>> = combine(
        dao.getAllTracks(),
        dao.getFavoriteTrackIds()
    ) { trackEntities, favoriteIds ->
        val favSet = favoriteIds.toSet()
        trackEntities.map { entity ->
            entity.toDomain(isFavorite = favSet.contains(entity.id))
        }
    }

    /**
     * Поток всех плейлистов.
     */
    val playlistsFlow: Flow<List<Playlist>> = dao.getAllPlaylists().map { list ->
        list.map { entity ->
            Playlist(
                id = entity.id,
                name = entity.name,
                createdAt = entity.createdAt
            )
        }
    }

    /**
     * Поток избранных треков.
     */
    val favoriteTracksFlow: Flow<List<Track>> = allTracksFlow.map { tracks ->
        tracks.filter { it.isFavorite }
    }

    /**
     * Сканирует локальное хранилище через MediaStore и сохраняет в Room.
     */
    suspend fun scanLocalMusic(): Int {
        val scannedTracks = scanner.scanAudioFiles()
        val entities = scannedTracks.map { track ->
            TrackEntity(
                id = track.id,
                title = track.title,
                artist = track.artist,
                album = track.album,
                durationMs = track.durationMs,
                contentUriString = track.contentUri.toString(),
                albumArtUriString = track.albumArtUri?.toString(),
                size = track.size,
                dateAdded = track.dateAdded,
                mimeType = track.mimeType
            )
        }
        dao.insertTracks(entities)
        // Удаляем треки, которые были удалены с устройства
        if (entities.isNotEmpty()) {
            dao.deleteOldTracks(entities.map { it.id })
        }
        return entities.size
    }

    suspend fun toggleFavorite(trackId: Long) {
        if (dao.isFavorite(trackId)) {
            dao.removeFavorite(trackId)
        } else {
            dao.addFavorite(FavoriteEntity(trackId = trackId))
        }
    }

    suspend fun isFavorite(trackId: Long): Boolean {
        return dao.isFavorite(trackId)
    }

    suspend fun createPlaylist(name: String): Long {
        return dao.insertPlaylist(PlaylistEntity(name = name))
    }

    suspend fun renamePlaylist(playlistId: Long, newName: String) {
        val entity = PlaylistEntity(id = playlistId, name = newName)
        dao.updatePlaylist(entity)
    }

    suspend fun deletePlaylist(playlistId: Long) {
        dao.deletePlaylist(playlistId)
    }

    suspend fun addTrackToPlaylist(playlistId: Long, trackId: Long) {
        dao.addTrackToPlaylist(PlaylistTrackCrossRef(playlistId = playlistId, trackId = trackId))
    }

    suspend fun removeTrackFromPlaylist(playlistId: Long, trackId: Long) {
        dao.removeTrackFromPlaylist(playlistId, trackId)
    }

    fun getTracksForPlaylist(playlistId: Long): Flow<List<Track>> {
        return combine(
            dao.getTracksForPlaylist(playlistId),
            dao.getFavoriteTrackIds()
        ) { trackEntities, favoriteIds ->
            val favSet = favoriteIds.toSet()
            trackEntities.map { it.toDomain(favSet.contains(it.id)) }
        }
    }

    private fun TrackEntity.toDomain(isFavorite: Boolean): Track {
        return Track(
            id = id,
            title = title,
            artist = artist,
            album = album,
            durationMs = durationMs,
            contentUri = Uri.parse(contentUriString),
            albumArtUri = albumArtUriString?.let { Uri.parse(it) },
            size = size,
            dateAdded = dateAdded,
            mimeType = mimeType,
            isFavorite = isFavorite
        )
    }
}
