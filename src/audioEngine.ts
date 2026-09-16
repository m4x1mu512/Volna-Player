// Real Web Audio API synthesizer and audio element manager for "Волна"
class AudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private synthGain: GainNode | null = null;
  private synthInterval: number | null = null;
  private isSynthesizing = false;
  private onEndedCallback: (() => void) | null = null;
  private isLooping = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.audioElement = new Audio();
      this.audioElement.crossOrigin = "anonymous";
      this.audioElement.loop = this.isLooping;
      this.audioElement.onended = () => {
        if (!this.audioElement?.loop && this.onEndedCallback) {
          this.onEndedCallback();
        }
      };
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSourceNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.synthGain = this.ctx.createGain();
      this.synthGain.gain.value = 0.3;
      this.synthGain.connect(this.analyser);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    if (this.audioElement) {
      this.audioElement.loop = loop;
    }
  }

  public setOnEnded(callback: (() => void) | null) {
    this.onEndedCallback = callback;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public playAudioUrl(url: string, onEnded?: () => void, onDurationReady?: (duration: number) => void) {
    this.init();
    this.stopSynth();

    if (onEnded) {
      this.onEndedCallback = onEnded;
    }

    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.loop = this.isLooping;
      this.audioElement.onended = () => {
        if (!this.audioElement?.loop && this.onEndedCallback) {
          this.onEndedCallback();
        }
      };
      this.audioElement.onloadedmetadata = () => {
        if (this.audioElement && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration) && this.audioElement.duration > 0) {
          if (onDurationReady) {
            onDurationReady(Math.round(this.audioElement.duration));
          }
        }
      };
      this.audioElement.play().catch(e => console.log('Autoplay handled:', e));
    }
  }

  public getDuration(): number {
    if (this.audioElement && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration)) {
      return this.audioElement.duration;
    }
    return 0;
  }

  public getCurrentTime(): number {
    if (this.audioElement && !isNaN(this.audioElement.currentTime)) {
      return this.audioElement.currentTime;
    }
    return 0;
  }

  public pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    this.stopSynth();
  }

  public resume() {
    this.init();
    if (this.audioElement && this.audioElement.src && this.audioElement.src !== window.location.href) {
      this.audioElement.play().catch(e => console.log(e));
    } else {
      this.startSynth();
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && !isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
    if (this.synthGain) {
      this.synthGain.gain.value = volume * 0.3;
    }
  }

  // Generates real synth chords & bass for the demo tracks
  public startSynth(mood: 'ambient' | 'synthwave' | 'chill' = 'ambient') {
    this.init();
    if (this.isSynthesizing || !this.ctx || !this.synthGain) return;
    this.isSynthesizing = true;

    const chords = mood === 'synthwave'
      ? [[130.81, 164.81, 196.00, 246.94], [110.00, 138.59, 164.81, 220.00], [146.83, 174.61, 220.00, 261.63], [98.00, 123.47, 146.83, 196.00]]
      : [[174.61, 220.00, 261.63, 329.63], [146.83, 174.61, 220.00, 261.63], [130.81, 164.81, 196.00, 246.94], [110.00, 138.59, 164.81, 220.00]];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.isSynthesizing || !this.ctx || !this.synthGain) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();

        osc.type = idx === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Subtle detune for lush thickness
        osc.detune.setValueAtTime(idx * 4 - 6, now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.08 / (idx + 1), now + 0.6);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain!);

        osc.start(now);
        osc.stop(now + 4.0);
      });
    };

    playChord();
    this.synthInterval = window.setInterval(playChord, 3600);
  }

  public stopSynth() {
    this.isSynthesizing = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public getFftData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const audioManager = new AudioManager();
