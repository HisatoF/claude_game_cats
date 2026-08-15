export type SoundEvent =
  | 'ui-click'
  | 'battle-start'
  | 'attack-melee'
  | 'attack-forward'
  | 'attack-upward'
  | 'attack-area'
  | 'hit'
  | 'explosion'
  | 'victory'
  | 'defeat';

/**
 * WebAudioで簡易生成したSFXを再生する。
 * 実アセット(mp3等)に差し替える場合は play() の中身だけ変更すればよい。
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  play(event: SoundEvent): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    switch (event) {
      case 'ui-click':
        this.beep(ctx, now, 620, 0.05, 0.05, 'square');
        break;
      case 'battle-start':
        this.beep(ctx, now, 220, 0.15, 0.18, 'sawtooth');
        this.beep(ctx, now + 0.15, 440, 0.15, 0.18, 'sawtooth');
        break;
      case 'attack-melee':
        this.beep(ctx, now, 140, 0.08, 0.12, 'square');
        break;
      case 'attack-forward':
        this.beep(ctx, now, 880, 0.06, 0.08, 'sine');
        break;
      case 'attack-upward':
        this.beep(ctx, now, 300, 0.1, 0.14, 'triangle');
        break;
      case 'attack-area':
        this.beep(ctx, now, 90, 0.2, 0.2, 'sawtooth');
        break;
      case 'hit':
        this.noiseHit(ctx, now, 0.08);
        break;
      case 'explosion':
        this.noiseHit(ctx, now, 0.35);
        this.beep(ctx, now, 80, 0.3, 0.25, 'sawtooth');
        break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => this.beep(ctx, now + i * 0.12, f, 0.14, 0.16, 'triangle'));
        break;
      case 'defeat':
        [392, 330, 261].forEach((f, i) => this.beep(ctx, now + i * 0.16, f, 0.2, 0.16, 'sawtooth'));
        break;
    }
  }

  private beep(
    ctx: AudioContext,
    startAt: number,
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  private noiseHit(ctx: AudioContext, startAt: number, duration: number): void {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    source.connect(gain).connect(ctx.destination);
    source.start(startAt);
  }
}

export const soundManager = new SoundManager();

export function soundForWeaponKind(kind: string): SoundEvent {
  switch (kind) {
    case 'melee':
      return 'attack-melee';
    case 'forward':
      return 'attack-forward';
    case 'upward':
      return 'attack-upward';
    case 'area':
      return 'attack-area';
    default:
      return 'hit';
  }
}
