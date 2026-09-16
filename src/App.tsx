import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw,
  Shuffle, Repeat, Repeat1, Heart, ListPlus, Search,
  SlidersHorizontal, Moon, Sun, Monitor, Timer,
  Folder, Library, Disc3, Radio, RefreshCw, Info, Music,
  Check, Copy, Download, Code2, Sparkles, ChevronUp, ChevronDown,
  Volume2, VolumeX, Upload, X, Trash2, ArrowLeft
} from 'lucide-react';
import { audioManager } from './audioEngine';
import { ANDROID_FILES, AndroidFile } from './androidProjectData';

interface TrackItem {
  id: number;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  isFavorite: boolean;
  coverGradient: string;
  audioUrl?: string;
  isCustomUpload?: boolean;
}

const INITIAL_TRACKS: TrackItem[] = [
  {
    id: 1,
    title: "Неоновый прилив",
    artist: "Волна SynthLab",
    album: "Электромагнитные сны",
    durationSeconds: 216,
    isFavorite: true,
    coverGradient: "from-cyan-500 via-teal-500 to-blue-600"
  },
  {
    id: 2,
    title: "Северное сияние",
    artist: "Кибер Восток",
    album: "Полярные частоты",
    durationSeconds: 248,
    isFavorite: false,
    coverGradient: "from-purple-600 via-indigo-500 to-teal-400"
  },
  {
    id: 3,
    title: "Бирюзовый горизонт",
    artist: "Ночной Экспресс",
    album: "Магистраль 80",
    durationSeconds: 184,
    isFavorite: true,
    coverGradient: "from-teal-400 via-cyan-600 to-purple-800"
  },
  {
    id: 4,
    title: "Пульс глубин",
    artist: "Кварц & Эхо",
    album: "Атлантика",
    durationSeconds: 232,
    isFavorite: false,
    coverGradient: "from-blue-600 via-violet-600 to-fuchsia-600"
  },
  {
    id: 5,
    title: "Ритм полуночи",
    artist: "Аналоговый Бриз",
    album: "Тени города",
    durationSeconds: 195,
    isFavorite: false,
    coverGradient: "from-fuchsia-500 via-purple-600 to-cyan-500"
  }
];

export default function App() {
  // App navigation modes
  const [activeAppTab, setActiveAppTab] = useState<'player' | 'code'>('player');

  // Library state
  const [tracks, setTracks] = useState<TrackItem[]>(INITIAL_TRACKS);
  const [playlists, setPlaylists] = useState<{ id: number; name: string; trackIds: number[] }[]>([
    { id: 1, name: "Для ночных поездок", trackIds: [1, 3] },
    { id: 2, name: "Глубокая концентрация", trackIds: [2, 4] }
  ]);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'tracks' | 'artists' | 'albums' | 'playlists' | 'favorites'>('tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'title' | 'artist' | 'album' | 'duration'>('title');

  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreenPlayer, setIsFullscreenPlayer] = useState(false);

  // Visualizer settings
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [visualizerType, setVisualizerType] = useState<'spectrum' | 'wave' | 'circle'>('spectrum');
  const [visualizerSensitivity, setVisualizerSensitivity] = useState(1.2);

  // Settings & Sleep timer
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState<TrackItem | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Code explorer state
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<number | 'all'>('all');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Visualizer Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (visualizerEnabled) {
        const fft = audioManager.getFftData();
        const hasRealSignal = fft.some(v => v > 0);

        // Fallback simulation when paused or idle
        const data = new Float32Array(32);
        for (let i = 0; i < 32; i++) {
          if (isPlaying && hasRealSignal) {
            data[i] = (fft[i % fft.length] / 255) * visualizerSensitivity;
          } else if (isPlaying) {
            // Smooth harmonic wave
            const t = Date.now() / 300;
            data[i] = (Math.sin(t + i * 0.4) * 0.35 + 0.5) * visualizerSensitivity;
          } else {
            data[i] = 0.04;
          }
        }

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00F5D4'); // turquoise
        gradient.addColorStop(0.5, '#00D2FF'); // cyan
        gradient.addColorStop(1, '#9D4EDD'); // violet

        if (visualizerType === 'spectrum') {
          const barsCount = 32;
          const spacing = 3;
          const barWidth = (width - (barsCount - 1) * spacing) / barsCount;

          for (let i = 0; i < barsCount; i++) {
            const amp = Math.min(1, Math.max(0.05, data[i]));
            const barHeight = amp * (height * 0.85);
            const x = i * (barWidth + spacing);
            const y = height - barHeight;

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          }
        } else if (visualizerType === 'wave') {
          ctx.beginPath();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = gradient;
          const step = width / (data.length - 1);
          const midY = height / 2;

          for (let i = 0; i < data.length; i++) {
            const amp = Math.min(1, data[i]);
            const offset = amp * (height * 0.4);
            const y = i % 2 === 0 ? midY - offset : midY + offset;
            const x = i * step;

            if (i === 0) ctx.moveTo(x, y);
            else {
              const prevX = (i - 1) * step;
              const prevY = (i - 1) % 2 === 0 ? midY - data[i - 1] * (height * 0.4) : midY + data[i - 1] * (height * 0.4);
              ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
            }
          }
          ctx.stroke();
        } else if (visualizerType === 'circle') {
          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = Math.min(width, height) / 4.2;
          localAngle += isPlaying ? 0.006 : 0.001;

          for (let i = 0; i < data.length; i++) {
            const angle = (i / data.length) * Math.PI * 2 + localAngle;
            const amp = Math.min(1, data[i]);
            const barLen = amp * (baseRadius * 0.9);

            const startX = centerX + Math.cos(angle) * baseRadius;
            const startY = centerY + Math.sin(angle) * baseRadius;
            const endX = centerX + Math.cos(angle) * (baseRadius + barLen);
            const endY = centerY + Math.sin(angle) * (baseRadius + barLen);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualizerEnabled, visualizerType, visualizerSensitivity, isPlaying]);

  // Audio Playback simulation / Real Audio tracking
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= currentTrack.durationSeconds) {
            handleTrackEnd();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // Sleep timer interval
  useEffect(() => {
    let timer: number;
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
      timer = window.setInterval(() => {
        setSleepTimerRemaining(prev => {
          if (prev === null || prev <= 1) {
            audioManager.pause();
            setIsPlaying(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  const handleTrackEnd = () => {
    if (sleepTimerRemaining === -1) {
      // "End of track" sleep timer
      audioManager.pause();
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      return;
    }

    if (repeatMode === 'one') {
      setCurrentTime(0);
      audioManager.seek(0);
      audioManager.resume();
    } else if (repeatMode === 'all' || currentTrackIndex < tracks.length - 1) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
      audioManager.pause();
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack.audioUrl) {
        audioManager.playAudioUrl(currentTrack.audioUrl, handleTrackEnd);
      } else {
        audioManager.startSynth(currentTrack.id % 2 === 0 ? 'synthwave' : 'ambient');
      }
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    const target = tracks[index];
    if (target.audioUrl) {
      audioManager.playAudioUrl(target.audioUrl, handleTrackEnd);
    } else {
      audioManager.startSynth(target.id % 2 === 0 ? 'synthwave' : 'ambient');
    }
    setIsPlaying(true);
  };

  const handleNextTrack = () => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      handleSelectTrack(nextIndex);
    } else {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      handleSelectTrack(nextIndex);
    }
  };

  const handlePrevTrack = () => {
    if (currentTime > 3) {
      setCurrentTime(0);
      audioManager.seek(0);
    } else {
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      handleSelectTrack(prevIndex);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    audioManager.seek(time);
  };

  const toggleFavorite = (trackId: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: TrackItem[] = [];
    Array.from(files).forEach((file: File, idx) => {
      const url = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const colors = [
        "from-cyan-500 via-teal-500 to-indigo-600",
        "from-purple-600 via-pink-500 to-cyan-400",
        "from-emerald-400 via-teal-600 to-blue-700"
      ];
      newTracks.push({
        id: Date.now() + idx,
        title: cleanName,
        artist: "Локальный файл",
        album: "Загружено на устройство",
        durationSeconds: 180,
        isFavorite: false,
        coverGradient: colors[idx % colors.length],
        audioUrl: url,
        isCustomUpload: true
      });
    });

    setTracks(prev => [...newTracks, ...prev]);
    handleSelectTrack(0);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered and sorted tracks
  const filteredTracks = useMemo(() => {
    let result = tracks;
    if (activeLibraryTab === 'favorites') {
      result = result.filter(t => t.isFavorite);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sortOption === 'title') return a.title.localeCompare(b.title);
      if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
      if (sortOption === 'album') return a.album.localeCompare(b.album);
      if (sortOption === 'duration') return b.durationSeconds - a.durationSeconds;
      return 0;
    });
  }, [tracks, activeLibraryTab, searchQuery, sortOption]);

  const artistsList = useMemo(() => {
    const map = new Map<string, TrackItem[]>();
    tracks.forEach(t => {
      const list = map.get(t.artist) || [];
      list.push(t);
      map.set(t.artist, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  const albumsList = useMemo(() => {
    const map = new Map<string, TrackItem[]>();
    tracks.forEach(t => {
      const list = map.get(t.album) || [];
      list.push(t);
      map.set(t.album, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  const filteredAndroidFiles = useMemo(() => {
    if (activeStageFilter === 'all') return ANDROID_FILES;
    return ANDROID_FILES.filter(f => f.stage === activeStageFilter);
  }, [activeStageFilter]);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={`min-h-screen ${themeMode === 'dark' ? 'bg-[#060B18] text-[#E8EEF8]' : 'bg-[#F3F6FC] text-[#0E162B]'} flex flex-col font-sans transition-colors duration-200 selection:bg-[#00F5D4] selection:text-black overflow-x-hidden w-full max-w-full`}>
      
      {/* Top Header */}
      <header className={`border-b ${themeMode === 'dark' ? 'border-[#16203D] bg-[#0E162B]/80' : 'border-[#E2E8F0] bg-white/80'} backdrop-blur-md sticky top-0 z-30 px-3 py-2.5 sm:px-6 sm:py-3 w-full max-w-full`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00F5D4] via-[#00D2FF] to-[#9D4EDD] p-[2px] shadow-lg shadow-[#00F5D4]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#060B18] rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-[#00F5D4] animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-[#00F5D4] via-[#00D2FF] to-[#9D4EDD] bg-clip-text text-transparent">
                  Волна
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Локальный аудиоплеер без AI, серверов и внешних API
              </p>
            </div>
          </div>

          {/* Tab navigation between Live Player & Code Explorer */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`p-1 rounded-xl flex items-center ${themeMode === 'dark' ? 'bg-[#16203D]' : 'bg-slate-200'}`}>
              <button
                id="btn-nav-player"
                onClick={() => setActiveAppTab('player')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                  activeAppTab === 'player'
                    ? 'bg-gradient-to-r from-[#00F5D4] to-[#00D2FF] text-black font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Плеер</span>
              </button>
              <button
                id="btn-nav-code"
                onClick={() => setActiveAppTab('code')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                  activeAppTab === 'code'
                    ? 'bg-gradient-to-r from-[#00F5D4] to-[#00D2FF] text-black font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Код<span className="hidden sm:inline"> проекта Android</span></span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              id="btn-quick-sleep-timer"
              onClick={() => setShowSleepTimerModal(true)}
              className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
                sleepTimerRemaining !== null
                  ? 'border-[#00F5D4] text-[#00F5D4] bg-[#00F5D4]/10'
                  : themeMode === 'dark'
                    ? 'border-[#16203D] text-slate-300 hover:bg-[#16203D]'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Таймер сна"
            >
              <Timer className="w-4 h-4" />
            </button>

            <button
              id="btn-quick-settings"
              onClick={() => setShowSettingsModal(true)}
              className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
                themeMode === 'dark'
                  ? 'border-[#16203D] text-slate-300 hover:bg-[#16203D]'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Настройки"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28 overflow-x-hidden">

        {/* MODE 1: LIVE PLAYER SIMULATOR */}
        {activeAppTab === 'player' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            {/* Left Column: Visualizer & Current Playing Stage */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5 min-w-0">
              
              {/* Visualizer Card */}
              <div className={`rounded-2xl p-4 sm:p-5 border relative overflow-hidden ${
                themeMode === 'dark'
                  ? 'bg-gradient-to-b from-[#0E162B] to-[#080E20] border-[#16203D]'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <span className="text-sm font-semibold tracking-wide truncate">Неоновый визуализатор</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#060B18]/60 p-1 rounded-lg border border-[#16203D] shrink-0">
                    {(['spectrum', 'wave', 'circle'] as const).map(mode => (
                      <button
                        key={mode}
                        id={`btn-visualizer-mode-${mode}`}
                        onClick={() => setVisualizerType(mode)}
                        className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                          visualizerType === mode
                            ? 'bg-[#00F5D4] text-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode === 'spectrum' ? 'Спектр' : mode === 'wave' ? 'Волна' : 'Круг'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canvas Stage */}
                <div className="w-full h-36 sm:h-44 rounded-xl bg-[#060B18] border border-[#16203D] relative overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={180}
                    className="w-full h-full object-cover"
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none p-2 text-center">
                      <Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#00F5D4] mb-1.5 animate-bounce" />
                      <span className="text-xs text-slate-300 font-medium">Нажмите Play для живой волны</span>
                    </div>
                  )}
                </div>

                {/* Visualizer controls */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 gap-2">
                  <span className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isPlaying ? 'bg-[#00F5D4] animate-ping' : 'bg-slate-500'}`} />
                    <span className="truncate">{isPlaying ? 'Аудиопоток активен' : 'Ожидание воспроизведения'}</span>
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="hidden sm:inline">Чувствительность:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={visualizerSensitivity}
                      onChange={e => setVisualizerSensitivity(Number(e.target.value))}
                      className="w-16 sm:w-20 accent-[#00F5D4] cursor-pointer"
                      title="Чувствительность визуализатора"
                    />
                  </div>
                </div>
              </div>

              {/* Now Playing Widget Card */}
              <div className={`rounded-2xl p-4 sm:p-5 border ${
                themeMode === 'dark' ? 'bg-[#0E162B] border-[#16203D]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    onClick={() => setIsFullscreenPlayer(true)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${currentTrack.coverGradient} flex items-center justify-center cursor-pointer shadow-lg shadow-black/40 group relative overflow-hidden shrink-0`}
                  >
                    <Disc3 className={`w-8 h-8 sm:w-10 sm:h-10 text-white/90 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#00F5D4]">
                        Сейчас играет
                      </span>
                      <button
                        id="btn-toggle-favorite-current"
                        onClick={() => toggleFavorite(currentTrack.id)}
                        className="text-slate-400 hover:text-[#FF007F] transition-colors p-1"
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTrack.isFavorite ? 'fill-[#FF007F] text-[#FF007F]' : ''}`} />
                      </button>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold truncate text-slate-100 mt-0.5">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {currentTrack.artist} • {currentTrack.album}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 sm:mt-4">
                  <input
                    type="range"
                    min="0"
                    max={currentTrack.durationSeconds}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-[#16203D] rounded-lg appearance-none cursor-pointer accent-[#00F5D4]"
                  />
                  <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mt-1 font-mono">
                    <span>{formatSeconds(currentTime)}</span>
                    <span>{formatSeconds(currentTrack.durationSeconds)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#16203D] gap-1">
                  <button
                    id="btn-toggle-shuffle"
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isShuffle ? 'text-[#00F5D4]' : 'text-slate-400 hover:text-white'}`}
                    title="Случайно"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-skip-back-10"
                    onClick={() => {
                      const t = Math.max(0, currentTime - 10);
                      setCurrentTime(t);
                      audioManager.seek(t);
                    }}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white transition-colors"
                    title="-10 секунд"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-prev-track"
                    onClick={handlePrevTrack}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white transition-colors"
                    title="Предыдущий"
                  >
                    <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    id="btn-play-pause-main"
                    onClick={handleTogglePlay}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#00F5D4] to-[#00D2FF] text-black flex items-center justify-center shadow-lg shadow-[#00F5D4]/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                    title={isPlaying ? "Пауза" : "Воспроизведение"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black ml-0.5" />}
                  </button>

                  <button
                    id="btn-next-track"
                    onClick={handleNextTrack}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white transition-colors"
                    title="Следующий"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    id="btn-skip-forward-10"
                    onClick={() => {
                      const t = Math.min(currentTrack.durationSeconds, currentTime + 10);
                      setCurrentTime(t);
                      audioManager.seek(t);
                    }}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white transition-colors"
                    title="+10 секунд"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-toggle-repeat"
                    onClick={() => {
                      setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
                    }}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${repeatMode !== 'off' ? 'text-[#00F5D4]' : 'text-slate-400 hover:text-white'}`}
                    title="Повтор"
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Upload Local Audio Prompt Card */}
              <div className={`p-3.5 sm:p-4 rounded-xl border border-dashed ${
                themeMode === 'dark' ? 'border-[#16203D] bg-[#0E162B]/50' : 'border-slate-300 bg-slate-50'
              } flex items-center justify-between gap-2.5`}>
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-[#00F5D4]/10 text-[#00F5D4] shrink-0">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">Добавить свои аудиофайлы</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">MP3, WAV, FLAC, OGG с устройства</p>
                  </div>
                </div>
                <button
                  id="btn-upload-local-files"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#00F5D4] text-black text-xs font-semibold hover:bg-[#00D2FF] transition-colors shrink-0"
                >
                  Выбрать
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="audio/*"
                  className="hidden"
                />
              </div>

            </div>

            {/* Right Column: Library & Collections */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по треку, исполнителю или альбому..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                      themeMode === 'dark'
                        ? 'bg-[#0E162B] border-[#16203D] text-slate-200 focus:border-[#00F5D4]'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-[#00F5D4]'
                    }`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Сортировка:</span>
                  <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-[#0E162B] border-[#16203D] text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="title">По названию</option>
                    <option value="artist">По исполнителю</option>
                    <option value="album">По альбому</option>
                    <option value="duration">По длительности</option>
                  </select>
                </div>
              </div>

              {/* Library Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#16203D]">
                {[
                  { id: 'tracks', label: 'Треки', count: tracks.length },
                  { id: 'artists', label: 'Исполнители', count: artistsList.length },
                  { id: 'albums', label: 'Альбомы', count: albumsList.length },
                  { id: 'playlists', label: 'Плейлисты', count: playlists.length },
                  { id: 'favorites', label: 'Любимые', count: tracks.filter(t => t.isFavorite).length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    id={`tab-library-${tab.id}`}
                    onClick={() => setActiveLibraryTab(tab.id as any)}
                    className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                      activeLibraryTab === tab.id
                        ? 'border-[#00F5D4] text-[#00F5D4] bg-[#00F5D4]/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label} <span className="text-[10px] opacity-70">({tab.count})</span>
                  </button>
                ))}
              </div>

              {/* Tab Content Display */}
              <div className={`rounded-2xl border flex-1 p-2 overflow-hidden ${
                themeMode === 'dark' ? 'bg-[#0E162B] border-[#16203D]' : 'bg-white border-slate-200'
              }`}>
                {activeLibraryTab === 'tracks' || activeLibraryTab === 'favorites' ? (
                  <div className="divide-y divide-[#16203D]/50">
                    {filteredTracks.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                        <Folder className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="font-semibold text-sm">Ничего не найдено</p>
                        <p className="text-xs text-slate-500 mt-1">Попробуйте изменить поисковый фильтр</p>
                      </div>
                    ) : (
                      filteredTracks.map((track, idx) => {
                        const isCurrent = currentTrack.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => handleSelectTrack(tracks.findIndex(t => t.id === track.id))}
                            className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors group ${
                              isCurrent
                                ? 'bg-[#00F5D4]/10 border border-[#00F5D4]/30'
                                : 'hover:bg-[#16203D]/50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${track.coverGradient} flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden`}>
                                {isCurrent && isPlaying ? (
                                  <div className="flex items-end gap-[2px] h-4">
                                    <div className="w-[3px] bg-black h-full animate-bounce" />
                                    <div className="w-[3px] bg-black h-2/3 animate-bounce delay-75" />
                                    <div className="w-[3px] bg-black h-4/5 animate-bounce delay-150" />
                                  </div>
                                ) : (
                                  <Music className="w-5 h-5 text-white/90" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#00F5D4]' : 'text-slate-200'}`}>
                                  {track.title}
                                </h4>
                                <p className="text-xs text-slate-400 truncate">
                                  {track.artist} • {track.album}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-mono">
                                {formatSeconds(track.durationSeconds)}
                              </span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleFavorite(track.id);
                                }}
                                className="text-slate-400 hover:text-[#FF007F] p-1 transition-colors"
                              >
                                <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-[#FF007F] text-[#FF007F]' : ''}`} />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowPlaylistModal(track);
                                }}
                                className="text-slate-400 hover:text-white p-1 transition-colors"
                                title="В плейлист"
                              >
                                <ListPlus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : activeLibraryTab === 'artists' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                    {artistsList.map(([artist, artistTracks]) => (
                      <div
                        key={artist}
                        onClick={() => {
                          const firstTrack = artistTracks[0];
                          handleSelectTrack(tracks.findIndex(t => t.id === firstTrack.id));
                        }}
                        className="p-3.5 rounded-xl border border-[#16203D] bg-[#060B18]/50 hover:border-[#00F5D4]/40 cursor-pointer transition-all flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#9D4EDD] flex items-center justify-center flex-shrink-0 text-white font-bold">
                          {artist.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 truncate">{artist}</h4>
                          <p className="text-xs text-slate-400">{artistTracks.length} композиций</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeLibraryTab === 'albums' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                    {albumsList.map(([album, albumTracks]) => (
                      <div
                        key={album}
                        onClick={() => {
                          const firstTrack = albumTracks[0];
                          handleSelectTrack(tracks.findIndex(t => t.id === firstTrack.id));
                        }}
                        className="p-3.5 rounded-xl border border-[#16203D] bg-[#060B18]/50 hover:border-[#00F5D4]/40 cursor-pointer transition-all flex items-center gap-3"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${albumTracks[0].coverGradient} flex items-center justify-center flex-shrink-0 shadow`}>
                          <Disc3 className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 truncate">{album}</h4>
                          <p className="text-xs text-slate-400">{albumTracks[0].artist} • {albumTracks.length} треков</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Название нового плейлиста..."
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${
                          themeMode === 'dark' ? 'bg-[#060B18] border-[#16203D] text-white' : 'bg-slate-100 border-slate-300'
                        }`}
                      />
                      <button
                        onClick={() => {
                          if (newPlaylistName.trim()) {
                            setPlaylists(prev => [...prev, { id: Date.now(), name: newPlaylistName.trim(), trackIds: [] }]);
                            setNewPlaylistName('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-[#00F5D4] text-black text-xs font-semibold hover:bg-[#00D2FF]"
                      >
                        Создать
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {playlists.map(pl => (
                        <div
                          key={pl.id}
                          className="p-3.5 rounded-xl border border-[#16203D] bg-[#060B18]/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-[#9D4EDD]/20 text-[#9D4EDD]">
                              <Library className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{pl.name}</h4>
                              <p className="text-xs text-slate-400">{pl.trackIds.length} треков</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPlaylists(prev => prev.filter(p => p.id !== pl.id))}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* MODE 2: ANDROID KOTLIN CODE EXPLORER */}
        {activeAppTab === 'code' && (
          <div className="flex flex-col gap-6">
            
            {/* Stage filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Этапы:</span>
              <button
                onClick={() => setActiveStageFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeStageFilter === 'all'
                    ? 'bg-[#00F5D4] text-black shadow-md'
                    : 'bg-[#16203D] text-slate-300 hover:text-white'
                }`}
              >
                Все файлы ({ANDROID_FILES.length})
              </button>
              {[
                { stage: 2, label: "Этап 2: Gradle & Manifest" },
                { stage: 3, label: "Этап 3: Room & Models" },
                { stage: 4, label: "Этап 4: PlaybackService" },
                { stage: 5, label: "Этап 5: MediaStore" },
                { stage: 7, label: "Этап 7: Compose UI" },
                { stage: 8, label: "Этап 8: Visualizer" },
                { stage: 9, label: "Этап 9: Settings" }
              ].map(st => (
                <button
                  key={st.stage}
                  onClick={() => setActiveStageFilter(st.stage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeStageFilter === st.stage
                      ? 'bg-[#00F5D4] text-black shadow-md'
                      : 'bg-[#16203D] text-slate-300 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Code Explorer Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* File tree sidebar */}
              <div className={`md:col-span-4 rounded-2xl p-4 border flex flex-col gap-2 max-h-[680px] overflow-y-auto ${
                themeMode === 'dark' ? 'bg-[#0E162B] border-[#16203D]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-[#16203D]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00F5D4]">
                    Дерево файлов проекта
                  </span>
                  <span className="text-[11px] text-slate-400">com.example.volna</span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {filteredAndroidFiles.map(file => {
                    const isSelected = selectedFile.path === file.path;
                    return (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] font-semibold'
                            : 'hover:bg-[#16203D]/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Code2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#00F5D4]' : 'text-slate-400'}`} />
                          <span className="truncate">{file.path}</span>
                        </div>
                        <span className="text-[10px] opacity-60 ml-2 px-1.5 py-0.5 rounded bg-black/30">
                          {file.stageTitle.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code viewer pane */}
              <div className={`md:col-span-8 rounded-2xl border flex flex-col overflow-hidden max-h-[680px] ${
                themeMode === 'dark' ? 'bg-[#090E1D] border-[#16203D]' : 'bg-slate-900 border-slate-700 text-white'
              }`}>
                {/* File info bar */}
                <div className="p-4 border-b border-[#16203D] bg-[#0E162B]/80 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{selectedFile.path}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] font-semibold border border-[#00F5D4]/20">
                        {selectedFile.stageTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedFile.description}</p>
                  </div>

                  <button
                    onClick={copyCodeToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-[#00F5D4] text-black text-xs font-semibold hover:bg-[#00D2FF] transition-all flex items-center gap-1.5 shadow"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                    <span>{copiedCode ? 'Скопировано!' : 'Скопировать файл'}</span>
                  </button>
                </div>

                {/* Code body */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 selection:bg-[#00F5D4] selection:text-black">
                  <pre className="overflow-x-auto whitespace-pre">
                    <code>{selectedFile.code}</code>
                  </pre>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Persistent Bottom Mini-Player Bar */}
      {activeAppTab === 'player' && (
        <div className={`fixed bottom-0 left-0 right-0 z-20 border-t ${
          themeMode === 'dark' ? 'bg-[#0E162B]/95 border-[#16203D]' : 'bg-white/95 border-slate-200'
        } backdrop-blur-lg px-3 py-2 sm:px-6 w-full max-w-full overflow-hidden`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Track identity */}
            <div
              onClick={() => setIsFullscreenPlayer(true)}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 flex-1 max-w-[170px] sm:max-w-xs"
            >
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr ${currentTrack.coverGradient} flex items-center justify-center shrink-0 shadow`}>
                <Disc3 className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate text-slate-200 group-hover:text-[#00F5D4] transition-colors">
                  {currentTrack.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Middle: Controls */}
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <button
                onClick={handlePrevTrack}
                className="text-slate-300 hover:text-white p-1.5 sm:p-2 transition-colors hidden sm:block"
                title="Предыдущий трек"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#00F5D4] to-[#00D2FF] text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
                title={isPlaying ? "Пауза" : "Воспроизведение"}
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-black" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black ml-0.5" />}
              </button>
              <button
                onClick={handleNextTrack}
                className="text-slate-300 hover:text-white p-1.5 sm:p-2 transition-colors"
                title="Следующий трек"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Expand & Volume */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    setIsMuted(false);
                    audioManager.setVolume(v);
                  }}
                  className="w-20 accent-[#00F5D4] cursor-pointer"
                />
              </div>

              <button
                onClick={() => setIsFullscreenPlayer(true)}
                className="p-1.5 sm:p-2 text-slate-300 hover:text-[#00F5D4] transition-colors"
                title="Полноэкранный плеер"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN PLAYER MODAL */}
      {isFullscreenPlayer && (
        <div className="fixed inset-0 z-50 bg-[#060B18] flex flex-col p-4 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsFullscreenPlayer(false)}
                className="p-2 rounded-full bg-[#16203D] text-slate-200 hover:bg-[#16203D]/80"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-[#00F5D4] font-bold">Волна Player</span>
                <p className="text-xs text-slate-400">Локальное воспроизведение</p>
              </div>
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className="p-2 text-slate-300 hover:text-[#FF007F]"
              >
                <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-[#FF007F] text-[#FF007F]' : ''}`} />
              </button>
            </div>

            {/* Giant Album Artwork Vinyl */}
            <div className="my-4 sm:my-8 flex justify-center">
              <div className={`w-52 h-52 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-tr ${currentTrack.coverGradient} shadow-2xl shadow-[#00F5D4]/20 flex items-center justify-center relative overflow-hidden transition-transform duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
                <Disc3 className={`w-24 h-24 sm:w-32 sm:h-32 text-white/90 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
                
                {/* Visualizer wave overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-black/40 backdrop-blur-xs flex items-end justify-center px-4 pb-2">
                  <div className="flex items-end gap-1 w-full justify-center h-8">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-[#00F5D4] rounded-full transition-all duration-100"
                        style={{
                          height: isPlaying ? `${Math.sin(i * 0.5 + Date.now() / 200) * 40 + 50}%` : '15%'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Track Details */}
            <div className="text-center px-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">{currentTrack.artist} • {currentTrack.album}</p>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 sm:mt-6">
              <input
                type="range"
                min="0"
                max={currentTrack.durationSeconds}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#16203D] rounded-lg appearance-none cursor-pointer accent-[#00F5D4]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-mono">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(currentTrack.durationSeconds)}</span>
              </div>
            </div>

            {/* Fullscreen Controls */}
            <div className="flex items-center justify-between my-4 sm:my-6 gap-0.5 sm:gap-1">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 sm:p-3 rounded-full transition-colors ${isShuffle ? 'text-[#00F5D4] bg-[#00F5D4]/10' : 'text-slate-400'}`}
                title="Случайно"
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => {
                  const t = Math.max(0, currentTime - 10);
                  setCurrentTime(t);
                  audioManager.seek(t);
                }}
                className="p-2 sm:p-3 text-slate-300 hover:text-white"
                title="-10 секунд"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button onClick={handlePrevTrack} className="p-2 sm:p-3 text-slate-200 hover:text-white" title="Предыдущий трек">
                <SkipBack className="w-5 h-5 sm:w-7 sm:h-7" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#00F5D4] to-[#00D2FF] text-black flex items-center justify-center shadow-xl shadow-[#00F5D4]/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                title={isPlaying ? "Пауза" : "Воспроизведение"}
              >
                {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-black" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-black ml-0.5 sm:ml-1" />}
              </button>

              <button onClick={handleNextTrack} className="p-2 sm:p-3 text-slate-200 hover:text-white" title="Следующий трек">
                <SkipForward className="w-5 h-5 sm:w-7 sm:h-7" />
              </button>

              <button
                onClick={() => {
                  const t = Math.min(currentTrack.durationSeconds, currentTime + 10);
                  setCurrentTime(t);
                  audioManager.seek(t);
                }}
                className="p-2 sm:p-3 text-slate-300 hover:text-white"
                title="+10 секунд"
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => {
                  setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
                }}
                className={`p-2 sm:p-3 rounded-full transition-colors ${repeatMode !== 'off' ? 'text-[#00F5D4] bg-[#00F5D4]/10' : 'text-slate-400'}`}
                title="Повтор"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SLEEP TIMER MODAL */}
      {showSleepTimerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0E162B] border border-[#16203D] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#16203D]">
              <div className="flex items-center gap-2 text-[#00F5D4]">
                <Timer className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Таймер сна</h3>
              </div>
              <button onClick={() => setShowSleepTimerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-4">
              Воспроизведение автоматически остановится по истечении выбранного времени.
            </p>

            {sleepTimerRemaining !== null && (
              <div className="p-3 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/20 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Активный таймер:</span>
                  <p className="text-base font-bold text-[#00F5D4]">
                    {sleepTimerRemaining === -1
                      ? 'Остановка в конце текущего трека'
                      : `${Math.floor(sleepTimerRemaining / 60)} мин ${sleepTimerRemaining % 60} сек`}
                  </p>
                </div>
                <button
                  onClick={() => setSleepTimerRemaining(null)}
                  className="px-2.5 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  Отмена
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {[15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setSleepTimerRemaining(mins * 60);
                    setShowSleepTimerModal(false);
                  }}
                  className="py-2.5 rounded-xl border border-[#16203D] bg-[#060B18] text-sm font-semibold text-slate-200 hover:border-[#00F5D4] hover:text-[#00F5D4] transition-all"
                >
                  {mins} минут
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSleepTimerRemaining(-1); // -1 marks end of current track
                setShowSleepTimerModal(false);
              }}
              className="w-full mt-3 py-2.5 rounded-xl border border-[#16203D] bg-[#060B18] text-sm font-semibold text-slate-200 hover:border-[#00F5D4] hover:text-[#00F5D4] transition-all"
            >
              Конец текущего трека
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0E162B] border border-[#16203D] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#16203D]">
              <div className="flex items-center gap-2 text-[#00F5D4]">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Настройки приложения</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 my-4">
              {/* Theme option */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Тема оформления
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      themeMode === 'dark' ? 'border-[#00F5D4] text-[#00F5D4] bg-[#00F5D4]/10' : 'border-[#16203D] text-slate-400'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Тёмная</span>
                  </button>
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      themeMode === 'light' ? 'border-[#00F5D4] text-[#00F5D4] bg-[#00F5D4]/10' : 'border-[#16203D] text-slate-400'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Светлая</span>
                  </button>
                </div>
              </div>

              {/* Visualizer toggle */}
              <div className="flex items-center justify-between py-2 border-t border-[#16203D]">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Визуализация звука</h4>
                  <p className="text-xs text-slate-400">Отображать Canvas-спектр в плеере</p>
                </div>
                <input
                  type="checkbox"
                  checked={visualizerEnabled}
                  onChange={e => setVisualizerEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#00F5D4] cursor-pointer"
                />
              </div>

              {/* Rescan library */}
              <div className="py-2 border-t border-[#16203D]">
                <button
                  onClick={() => {
                    setTracks(INITIAL_TRACKS);
                    alert("Медиатека обновлена из MediaStore устройства!");
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00F5D4] text-black text-xs font-bold hover:bg-[#00D2FF] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Пересканировать медиатеку</span>
                </button>
              </div>

              {/* About */}
              <div className="p-3 rounded-xl bg-[#060B18] border border-[#16203D] text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
                  <Info className="w-4 h-4 text-[#00F5D4]" />
                  <span>О приложении «Волна» 1.0.0</span>
                </div>
                <p>
                  Чистый локальный плеер на Kotlin, Jetpack Compose и AndroidX Media3 ExoPlayer.
                  Никакой рекламы, регистрации, трекеров и сетевых запросов.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
