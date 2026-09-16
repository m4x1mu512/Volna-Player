package com.example.volna.data.model

data class Playlist(
    val id: Long = 0L,
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
    val trackCount: Int = 0
)

enum class VisualizerType(val displayName: String) {
    SPECTRUM("Спектр"),
    WAVE("Волна"),
    CIRCLE("Круг")
}

enum class AppThemeMode {
    DARK,
    LIGHT,
    SYSTEM
}

enum class SortOption(val title: String) {
    TITLE("По названию"),
    ARTIST("По исполнителю"),
    ALBUM("По альбому"),
    DURATION("По длительности")
}
