import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const MUTE_STORAGE_KEY = 'iron-lab-muted-v1';

export type LabSound =
  | 'button-click'
  | 'ore-selection'
  | 'crush-impact'
  | 'furnace-ignite'
  | 'separator-surface'
  | 'separator-magnetic'
  | 'separator-electric'
  | 'particle-collection'
  | 'knowledge-discovered'
  | 'stage-complete'
  | 'stage-transition';

export type LabAmbient = 'sintering' | 'roasting';

type AmbientVoice = {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
};

class LabAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private activeVoices = 0;
  private lastStageCompleteAt = Number.NEGATIVE_INFINITY;
  private ambients = new Map<LabAmbient, AmbientVoice>();

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.55, now, 0.025);
  }

  play(sound: LabSound) {
    if (this.muted) return;
    const context = this.getContext();
    if (!context) return;
    void context.resume();
    if (sound === 'stage-complete') {
      if (context.currentTime - this.lastStageCompleteAt < 0.32) return;
      this.lastStageCompleteAt = context.currentTime;
    }

    switch (sound) {
      case 'button-click':
        this.tone(520, 0.045, 0.016, 'sine', 460);
        break;
      case 'ore-selection':
        this.tone(620, 0.075, 0.024, 'triangle', 760);
        break;
      case 'crush-impact':
        this.noise(0.1, 420, 0.07);
        this.tone(104, 0.14, 0.075, 'triangle', 46);
        break;
      case 'furnace-ignite':
        this.noise(0.24, 620, 0.038);
        this.tone(76, 0.24, 0.028, 'sine', 58);
        break;
      case 'separator-surface':
        this.noise(0.075, 1450, 0.022);
        this.tone(310, 0.07, 0.018, 'triangle', 230);
        break;
      case 'separator-magnetic':
        this.tone(175, 0.17, 0.028, 'sine', 92);
        break;
      case 'separator-electric':
        this.tone(900, 0.055, 0.012, 'square', 1120);
        this.tone(680, 0.08, 0.009, 'sine', 760, 0.055);
        break;
      case 'particle-collection':
        this.tone(430, 0.065, 0.018, 'sine', 570);
        break;
      case 'knowledge-discovered':
        this.tone(660, 0.14, 0.022, 'sine');
        this.tone(880, 0.18, 0.017, 'sine', 920, 0.04);
        break;
      case 'stage-complete':
        this.tone(520, 0.15, 0.022, 'sine');
        this.tone(690, 0.2, 0.016, 'sine', 740, 0.045);
        break;
      case 'stage-transition':
        this.tone(420, 0.11, 0.013, 'sine', 340);
        break;
    }
  }

  startAmbient(kind: LabAmbient) {
    if (this.ambients.has(kind)) return () => this.stopAmbient(kind);
    const context = this.getContext();
    if (!context) return () => undefined;
    void context.resume();
    this.stopAllAmbients();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'sintering' ? 0.032 : 0.026, now + 0.4);
    gain.connect(this.master!);

    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'sintering' ? 62 : 54;
    oscillator.connect(gain);
    oscillator.start(now);

    const noise = context.createBufferSource();
    noise.buffer = this.getNoiseBuffer(context);
    noise.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'sintering' ? 260 : 340;
    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.18;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start(now);

    const ambient: AmbientVoice = { gain, sources: [oscillator, noise] };
    this.ambients.set(kind, ambient);
    return () => this.stopAmbient(kind);
  }

  stopAllAmbients() {
    for (const kind of this.ambients.keys()) this.stopAmbient(kind);
  }

  private getContext() {
    if (typeof window === 'undefined' || !window.AudioContext) return null;
    if (this.context) return this.context;
    this.context = new window.AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.context.destination);
    return this.context;
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer;
    const frameCount = context.sampleRate;
    this.noiseBuffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
    return this.noiseBuffer;
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType, endFrequency = frequency, offset = 0) {
    const context = this.getContext();
    if (!context || this.activeVoices >= 8) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = context.currentTime + offset;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), startAt + duration);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(volume, startAt + Math.min(0.012, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master!);
    this.activeVoices += 1;
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.015);
  }

  private noise(duration: number, cutoff: number, volume: number) {
    const context = this.getContext();
    if (!context || this.activeVoices >= 8) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const startAt = context.currentTime;
    source.buffer = this.getNoiseBuffer(context);
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master!);
    this.activeVoices += 1;
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
    source.start(startAt);
    source.stop(startAt + duration + 0.015);
  }

  private stopAmbient(kind: LabAmbient) {
    const ambient = this.ambients.get(kind);
    if (!ambient || !this.context) return;
    this.ambients.delete(kind);
    const now = this.context.currentTime;
    const stopAt = now + 0.18;
    ambient.gain.gain.cancelScheduledValues(now);
    ambient.gain.gain.setTargetAtTime(0.0001, now, 0.035);
    for (const source of ambient.sources) {
      try {
        source.stop(stopAt);
      } catch {
        // The source may already be stopping as its stage unmounts.
      }
    }
    window.setTimeout(() => ambient.gain.disconnect(), 240);
  }
}

type LabAudioContextValue = {
  muted: boolean;
  toggleMute: () => void;
  playSound: (sound: LabSound) => void;
  startAmbient: (kind: LabAmbient) => () => void;
};

const LabAudioContext = createContext<LabAudioContextValue | null>(null);

function readMutedPreference() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function LabAudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(readMutedPreference);
  const mutedRef = useRef(muted);
  const engineRef = useRef<LabAudioEngine | null>(null);
  if (!engineRef.current) engineRef.current = new LabAudioEngine();
  const engine = engineRef.current;

  useEffect(() => {
    mutedRef.current = muted;
    engine.setMuted(muted);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Audio preference storage may be unavailable.
    }
  }, [engine, muted]);

  const toggleMute = useCallback(() => setMuted((current) => !current), []);
  const playSound = useCallback((sound: LabSound) => {
    if (!mutedRef.current) engine.play(sound);
  }, [engine]);
  const startAmbient = useCallback((kind: LabAmbient) => engine.startAmbient(kind), [engine]);
  const value = useMemo(() => ({ muted, toggleMute, playSound, startAmbient }), [muted, toggleMute, playSound, startAmbient]);

  return <LabAudioContext.Provider value={value}>{children}</LabAudioContext.Provider>;
}

export function useLabAudio() {
  const context = useContext(LabAudioContext);
  if (!context) throw new Error('useLabAudio must be used within LabAudioProvider.');
  return context;
}