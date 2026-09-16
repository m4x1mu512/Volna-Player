package com.example.volna.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.volna.data.model.SortOption
import com.example.volna.data.model.Track
import com.example.volna.ui.components.MiniPlayer
import com.example.volna.ui.components.TrackListItem
import com.example.volna.ui.theme.VolnaTurquoise
import com.example.volna.ui.viewmodel.MusicPlayerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: MusicPlayerViewModel,
    onNavigateToPlayer: () -> Unit,
    onNavigateToVisualizer: () -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tracks by viewModel.tracks.collectAsState()
    val playlists by viewModel.playlists.collectAsState()
    val favoriteTracks by viewModel.favoriteTracks.collectAsState()
    val playerState by viewModel.playerUiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val sortOption by viewModel.sortOption.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Треки", "Исполнители", "Альбомы", "Плейлисты")

    var showSortMenu by remember { mutableStateOf(false) }
    var showCreatePlaylistDialog by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("") }
    var trackToAddToPlaylist by remember { mutableStateOf<Track?>(null) }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(top = 16.dp, start = 16.dp, end = 16.dp)
            ) {
                // Заголовок «Волна» и кнопки действий
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Волна",
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = VolnaTurquoise
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Плеер",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }

                    Row {
                        IconButton(onClick = onNavigateToVisualizer) {
                            Icon(
                                imageVector = Icons.Default.GraphicEq,
                                contentDescription = "Визуализатор",
                                tint = VolnaTurquoise
                            )
                        }
                        IconButton(onClick = { viewModel.scanMusic() }) {
                            if (isScanning) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = VolnaTurquoise,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Обновить медиатеку",
                                    tint = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                        IconButton(onClick = onNavigateToSettings) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Настройки",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Поиск
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    placeholder = { Text("Поиск трека, артиста или альбома...") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Очистить")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        focusedBorderColor = VolnaTurquoise,
                        unfocusedBorderColor = Color.Transparent
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Вкладки
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = VolnaTurquoise,
                    divider = {}
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = {
                                Text(
                                    text = title,
                                    fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        )
                    }
                }
            }
        },
        bottomBar = {
            MiniPlayer(
                currentTrack = playerState.currentTrack,
                isPlaying = playerState.isPlaying,
                progressMs = playerState.currentPositionMs,
                durationMs = playerState.durationMs,
                onPlayPauseClick = { viewModel.togglePlayPause() },
                onNextClick = { viewModel.playNext() },
                onClick = onNavigateToPlayer
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> {
                    // Раздел "Треки"
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Панель сортировки и счетчик
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Треков: ${tracks.size}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Box {
                                TextButton(onClick = { showSortMenu = true }) {
                                    Icon(Icons.Default.Sort, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(sortOption.title)
                                }
                                DropdownMenu(
                                    expanded = showSortMenu,
                                    onDismissRequest = { showSortMenu = false }
                                ) {
                                    SortOption.entries.forEach { option ->
                                        DropdownMenuItem(
                                            text = { Text(option.title) },
                                            onClick = {
                                                viewModel.setSortOption(option)
                                                showSortMenu = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        if (tracks.isEmpty()) {
                            EmptyLibraryView(
                                isSearching = searchQuery.isNotBlank(),
                                onRescan = { viewModel.scanMusic() }
                            )
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                items(tracks, key = { it.id }) { track ->
                                    TrackListItem(
                                        track = track,
                                        isCurrentTrack = playerState.currentTrack?.id == track.id,
                                        onClick = { viewModel.playTrack(track, tracks) },
                                        onFavoriteToggle = { viewModel.toggleFavorite(track) },
                                        onAddToPlaylist = { trackToAddToPlaylist = track }
                                    )
                                }
                            }
                        }
                    }
                }

                1 -> {
                    // Раздел "Исполнители"
                    val artistsGroup = remember(tracks) {
                        tracks.groupBy { it.artist }.toList().sortedBy { it.first.lowercase() }
                    }
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp)
                    ) {
                        items(artistsGroup) { (artist, artistTracks) ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable {
                                        if (artistTracks.isNotEmpty()) {
                                            viewModel.playTrack(artistTracks.first(), artistTracks)
                                        }
                                    },
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = VolnaTurquoise)
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(text = artist, style = MaterialTheme.typography.titleMedium)
                                        Text(
                                            text = "${artistTracks.size} треков",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                2 -> {
                    // Раздел "Альбомы"
                    val albumsGroup = remember(tracks) {
                        tracks.groupBy { it.album }.toList().sortedBy { it.first.lowercase() }
                    }
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp)
                    ) {
                        items(albumsGroup) { (album, albumTracks) ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable {
                                        if (albumTracks.isNotEmpty()) {
                                            viewModel.playTrack(albumTracks.first(), albumTracks)
                                        }
                                    },
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Album, contentDescription = null, tint = VolnaTurquoise)
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(text = album, style = MaterialTheme.typography.titleMedium)
                                        Text(
                                            text = "${albumTracks.firstOrNull()?.artist ?: ""} • ${albumTracks.size} треков",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                3 -> {
                    // Раздел "Плейлисты"
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Button(
                            onClick = { showCreatePlaylistDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = VolnaTurquoise),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Создать плейлист", color = Color.Black)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Плейлист "Избранное"
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable {
                                    if (favoriteTracks.isNotEmpty()) {
                                        viewModel.playTrack(favoriteTracks.first(), favoriteTracks)
                                    }
                                },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFFF007F))
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text("Любимые треки", style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        text = "${favoriteTracks.size} треков",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        // Пользовательские плейлисты
                        LazyColumn(modifier = Modifier.fillMaxSize()) {
                            items(playlists) { playlist ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.QueueMusic, contentDescription = null, tint = VolnaTurquoise)
                                            Spacer(modifier = Modifier.width(16.dp))
                                            Text(playlist.name, style = MaterialTheme.typography.titleMedium)
                                        }
                                        IconButton(onClick = { viewModel.deletePlaylist(playlist.id) }) {
                                            Icon(Icons.Default.Delete, contentDescription = "Удалить", tint = Color.Gray)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Диалог создания плейлиста
    if (showCreatePlaylistDialog) {
        AlertDialog(
            onDismissRequest = { showCreatePlaylistDialog = false },
            title = { Text("Новый плейлист") },
            text = {
                OutlinedTextField(
                    value = newPlaylistName,
                    onValueChange = { newPlaylistName = it },
                    placeholder = { Text("Название плейлиста") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (newPlaylistName.isNotBlank()) {
                            viewModel.createPlaylist(newPlaylistName.trim())
                            newPlaylistName = ""
                            showCreatePlaylistDialog = false
                        }
                    }
                ) {
                    Text("Создать")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreatePlaylistDialog = false }) {
                    Text("Отмена")
                }
            }
        )
    }

    // Диалог добавления трека в существующий плейлист
    trackToAddToPlaylist?.let { track ->
        AlertDialog(
            onDismissRequest = { trackToAddToPlaylist = null },
            title = { Text("Добавить в плейлист") },
            text = {
                if (playlists.isEmpty()) {
                    Text("Плейлисты ещё не созданы. Создайте плейлист на вкладке «Плейлисты».")
                } else {
                    LazyColumn {
                        items(playlists) { pl ->
                            Text(
                                text = pl.name,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        viewModel.addTrackToPlaylist(pl.id, track.id)
                                        trackToAddToPlaylist = null
                                    }
                                    .padding(vertical = 12.dp),
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { trackToAddToPlaylist = null }) {
                    Text("Закрыть")
                }
            }
        )
    }
}

@Composable
fun EmptyLibraryView(
    isSearching: Boolean,
    onRescan: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = if (isSearching) Icons.Default.SearchOff else Icons.Default.MusicNote,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (isSearching) "Ничего не найдено" else "Музыкальная библиотека пуста",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (isSearching) "Попробуйте изменить поисковый запрос"
                else "Добавьте аудиофайлы на устройство или обновите список",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (!isSearching) {
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onRescan,
                    colors = ButtonDefaults.buttonColors(containerColor = VolnaTurquoise)
                ) {
                    Text("Сканировать устройство", color = Color.Black)
                }
            }
        }
    }
}
