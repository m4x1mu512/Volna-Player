package com.example.volna.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.volna.ui.screens.HomeScreen
import com.example.volna.ui.screens.PlayerScreen
import com.example.volna.ui.screens.SettingsScreen
import com.example.volna.ui.screens.VisualizerScreen
import com.example.volna.ui.viewmodel.MusicPlayerViewModel

@Composable
fun VolnaNavGraph(
    navController: NavHostController,
    viewModel: MusicPlayerViewModel,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                viewModel = viewModel,
                onNavigateToPlayer = { navController.navigate(Screen.Player.route) },
                onNavigateToVisualizer = { navController.navigate(Screen.Visualizer.route) },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(Screen.Player.route) {
            PlayerScreen(
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() },
                onOpenVisualizer = { navController.navigate(Screen.Visualizer.route) }
            )
        }

        composable(Screen.Visualizer.route) {
            VisualizerScreen(
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
