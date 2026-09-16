package com.example.volna.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.volna.data.database.dao.MusicDao
import com.example.volna.data.database.entity.FavoriteEntity
import com.example.volna.data.database.entity.PlaylistEntity
import com.example.volna.data.database.entity.PlaylistTrackCrossRef
import com.example.volna.data.database.entity.TrackEntity

@Database(
    entities = [
        TrackEntity::class,
        PlaylistEntity::class,
        PlaylistTrackCrossRef::class,
        FavoriteEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class VolnaDatabase : RoomDatabase() {

    abstract fun musicDao(): MusicDao

    companion object {
        @Volatile
        private var INSTANCE: VolnaDatabase? = null

        fun getDatabase(context: Context): VolnaDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    VolnaDatabase::class.java,
                    "volna_music.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
