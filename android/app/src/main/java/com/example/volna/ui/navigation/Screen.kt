package com.example.volna.ui.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Player : Screen("player")
    data object Visualizer : Screen("visualizer")
    data object Settings : Screen("settings")
    data object PlaylistDetail : Screen("playlist/{playlistId}/{playlistName}") {
        fun createRoute(playlistId: Long, playlistName: String): String =
            "playlist/$playlistId/$playlistName"
    }
}
