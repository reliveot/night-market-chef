export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.voiceEnabled = true;
    this.bgmEnabled = true;
    this.sfxVolume = 0.8;
    this.bgmVolume = 0.6;
    this.voiceVolume = 0.9;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this._noiseBuffer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _getNoiseBuffer() {
    if (!this.ctx) return null;
    if (!this._noiseBuffer) {
      const len = this.ctx.sampleRate * 1.0;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this._noiseBuffer = buf;
    }
    return this._noiseBuffer;
  }

  playTone(freq = 520, dur = 0.14, type = 'triangle', gainVal = 0.15, endFreq = null) {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq && endFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
      }
      const g = Math.max(0.0001, gainVal * this.sfxVolume);
      if (this.sfxVolume <= 0.001) return;
      gain.gain.setValueAtTime(g, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.015);
    } catch {}
  }

  playNoise(dur = 0.18, filterType = 'bandpass', freq = 1800, q = 1.5, gainVal = 0.14, delayMs = 0) {
    if (!this.soundEnabled || !this.ctx) return;
    const buf = this._getNoiseBuffer();
    if (!buf) return;
    const run = () => {
      try {
        const now = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(freq, now);
        filter.Q.setValueAtTime(q, now);
        const gain = this.ctx.createGain();
        const g = Math.max(0.0001, gainVal * this.sfxVolume);
      if (this.sfxVolume <= 0.001) return;
      gain.gain.setValueAtTime(g, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
        src.stop(now + dur + 0.02);
      } catch {}
    };
    if (delayMs > 0) setTimeout(run, delayMs);
    else run();
  }

  // 4 種備料動作專屬音效
  playPrepSound(prepType = 'cut', isReverse = false) {
    if (!this.soundEnabled) return;
    this.unlock();
    if (prepType === 'sprinkle') {
      // 撒粉淋醬：細緻沙沙撒粉 + 清亮晶瑩聲
      this.playNoise(0.11, 'highpass', 3600, 1.0, 0.12, 0);
      this.playNoise(0.10, 'highpass', 4400, 1.2, 0.10, 85);
      [987.77, 1318.5, 1567.98].forEach((f, i) => setTimeout(() => this.playTone(f, 0.09, 'sine', 0.09), i * 42));
    } else if (prepType === 'pour') {
      // 鮮料下鍋：噗通滑落水花 + 氣泡音
      this.playTone(540, 0.14, 'sine', 0.15, 220);
      this.playNoise(0.16, 'bandpass', 900, 1.8, 0.13, 45);
      setTimeout(() => this.playTone(392, 0.11, 'sine', 0.12, 660), 90);
    } else if (prepType === 'flip') {
      // 帥氣翻面：鍋鏟敲鍋脆響 + 翻拋上揚
      this.playTone(1180, 0.06, 'triangle', 0.14, 780);
      this.playNoise(0.14, 'bandpass', 1600, 1.2, 0.11, 25);
      setTimeout(() => this.playTone(360, 0.15, 'triangle', 0.14, 740), 55);
    } else {
      // 切菜刀法：清脆刀切聲 + 木砧板沉實共鳴
      this.playNoise(0.06, 'highpass', 2400, 1.0, 0.18, 0);
      this.playTone(isReverse ? 310 : 240, 0.08, 'triangle', 0.18, 110);
      setTimeout(() => {
        this.playNoise(0.05, 'highpass', 2800, 1.0, 0.14, 0);
        this.playTone(880, 0.11, 'sine', 0.11);
      }, 65);
    }
  }

  // 6 種收尾烹飪動作專屬音效
  playCookSound(cookType = 'teppan') {
    if (!this.soundEnabled) return;
    this.unlock();
    if (cookType === 'teppan') {
      // 鐵板煎炒：高頻滋滋熱煎聲 + 雙次鐵鏟敲台
      this.playNoise(0.36, 'highpass', 3200, 0.9, 0.16, 0);
      this.playTone(1240, 0.07, 'triangle', 0.13, 920);
      setTimeout(() => this.playTone(1380, 0.08, 'triangle', 0.12, 1020), 120);
    } else if (cookType === 'fry') {
      // 酥炸甩油：連續油鍋霹靂啪啦爆裂聲 + 瀝油甩網呼聲
      [0, 65, 130, 210].forEach((d, i) => {
        this.playNoise(0.07, 'bandpass', 2200 + i * 450, 2.2, 0.16, d);
      });
      setTimeout(() => this.playTone(420, 0.16, 'triangle', 0.12, 680), 220);
    } else if (cookType === 'grill') {
      // 炭火翻烤：中低頻木炭噼啪火烤 + 溫暖和弦
      [0, 80, 175].forEach((d, i) => {
        this.playNoise(0.09, 'bandpass', 1100 + i * 320, 1.8, 0.15, d);
      });
      this.playTone(293.66, 0.22, 'sawtooth', 0.07);
      setTimeout(() => this.playTone(440, 0.20, 'triangle', 0.11), 110);
    } else if (cookType === 'boil') {
      // 大鍋滾煮：咕嚕咕嚕上升氣泡連音 + 蒸氣滾水聲
      this.playNoise(0.30, 'lowpass', 750, 1.4, 0.12, 0);
      [330, 440, 523.25, 659.25].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.09, 'sine', 0.13, f * 1.35), i * 70);
      });
    } else if (cookType === 'shake') {
      // 手搖搖勻：雪克杯冰塊沙沙雙連節奏
      [0, 120, 240].forEach((d) => {
        this.playNoise(0.08, 'highpass', 3800, 1.4, 0.17, d);
        setTimeout(() => this.playTone(1480, 0.04, 'sine', 0.08), d + 15);
      });
    } else {
      // mix 手拌甜品：湯匙碰碗清脆叮鈴 + 碎冰攪拌沙沙聲
      this.playTone(1567.98, 0.14, 'sine', 0.13);
      this.playNoise(0.16, 'bandpass', 2800, 1.3, 0.12, 40);
      setTimeout(() => this.playTone(1975.53, 0.16, 'sine', 0.11), 110);
    }
  }

  // 100% 無版權台灣五聲音階夜市背景音樂 (Procedural Pentatonic BGM)
  _playBgmPluck(freq, dur = 0.24, gainVal = 0.045) {
    if (!this.bgmEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      gain.gain.setValueAtTime(0.001, now);
      const bg = gainVal * (this.bgmVolume / 0.6);
      if (bg <= 0.0005) return;
      gain.gain.linearRampToValueAtTime(bg, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {}
  }

  _playBgmWoodblock(isAccent = false) {
    if (!this.bgmEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 760 : 580, now);
      osc.frequency.exponentialRampToValueAtTime(isAccent ? 520 : 410, now + 0.045);
      const bg = (isAccent ? 0.032 : 0.02) * (this.bgmVolume / 0.6);
      if (bg <= 0.0005) return;
      gain.gain.setValueAtTime(bg, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  startBgm() {
    if (!this.bgmEnabled) return;
    this.unlock();
    if (this.bgmTimer) return;
    // 輕快台味五聲音階旋律（C5 D5 E5 G5 A5 C6），16 步循環，約 114 BPM（每步 263ms）
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      880.00, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99,
      1046.50, 880.00, 783.99, 659.25,
    ];
    const bass = [261.63, 0, 196.00, 0, 220.00, 0, 196.00, 0];
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const idx = this.bgmStep % melody.length;
      this._playBgmPluck(melody[idx], 0.24, 0.04);
      const b = bass[this.bgmStep % bass.length];
      if (b > 0) this._playBgmPluck(b, 0.32, 0.032);
      if (this.bgmStep % 2 === 0) this._playBgmWoodblock(this.bgmStep % 4 === 0);
      this.bgmStep++;
    }, 263);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playSpoiledSweep() {
    if (!this.soundEnabled) return;
    this.unlock();
    [523.25, 659.25, 783.99].forEach((f, i) => setTimeout(() => this.playTone(f, 0.14, 'sine', 0.13), i * 60));
  }

  playWrongBuzz() {
    if (!this.soundEnabled) return;
    this.unlock();
    this.playTone(220, 0.18, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(185, 0.22, 'sawtooth', 0.12), 90);
  }

  playDishComplete() {
    if (!this.soundEnabled) return;
    this.unlock();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.2, 'triangle', 0.16), idx * 80);
    });
  }

  speak(text, interrupt = true) {
    if (!this.voiceEnabled || !('speechSynthesis' in window) || !text) return;
    try {
      if (interrupt) window.speechSynthesis.cancel();
      if (this.voiceVolume <= 0.01) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-TW';
      utter.rate = 1.32;
      utter.volume = Math.max(0, Math.min(1, this.voiceVolume));
      window.speechSynthesis.speak(utter);
    } catch {}
  }
}

