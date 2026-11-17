import { DIR_VECTORS, GestureJudge } from './gesture.js';
import { InputTracker } from './tracker.js';
import { INGREDIENTS_DB, RECIPES_DB, validateRecipeDatabase } from './recipes.js';
import { AssetManager } from './preloader.js';

const STORAGE_KEY_COLLECTION = 'tw_night_market_chef_unlocked_v1';

const PREP_LABELS = {
  cut: {
    icon: '🔪', tag: '切菜刀法', callout: '🔪 一刀兩斷！', anim: 'anim-cut',
    svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3L8 14l3 3L22 6l-3-3z" fill="currentColor" fill-opacity="0.22"/><path d="M8 14l-5 5"/><path d="M11 17l-2 2"/></svg>`
  },
  sprinkle: {
    icon: '🧂', tag: '撒粉淋醬', callout: '🧂 香氣提味！', anim: 'anim-sprinkle',
    svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="8" width="10" height="12" rx="2" fill="currentColor" fill-opacity="0.18"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/><circle cx="10" cy="3" r="0.8" fill="currentColor"/><circle cx="14" cy="3" r="0.8" fill="currentColor"/><circle cx="12" cy="2" r="0.8" fill="currentColor"/></svg>`
  },
  pour: {
    icon: '🥣', tag: '鮮料下鍋', callout: '🥣 鮮料下鍋！', anim: 'anim-pour',
    svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 0 16 0H4z" fill="currentColor" fill-opacity="0.22"/><path d="M12 4v5"/><path d="M9.5 6.5L12 9l2.5-2.5"/><path d="M7 20h10"/></svg>`
  },
  flip: {
    icon: '🍳', tag: '帥氣翻面', callout: '🔥 帥氣翻面！', anim: 'anim-flip',
    svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l5 5-6 6-5-5 6-6z" fill="currentColor" fill-opacity="0.22"/><path d="M9 15l-5 5"/><path d="M5 9a6 6 0 0 1 8-4"/><path d="M5 6v3h3"/></svg>`
  },
};

import { SoundEngine } from './sound.js';
class NightMarketGame {
  constructor() {
    this.dbMeta = validateRecipeDatabase();
    this.judge = new GestureJudge();
    this.sound = new SoundEngine();
    this.assets = new AssetManager();

    this.settings = {
      trainingMode: 'action', // 'action' | 'cognitive'
      cogChoices: 2,          // 2 | 3 | 4
      inputMode: 'touch',     // 'camera' | 'touch'
      gameMode: 'dishes',     // 'dishes' | 'timed' | 'endless'
      categoryFilter: 'ALL',
      targetDishes: 3,
      timeLimitSec: 60,
      allowedDirs: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
      dirRule: 'normal',      // 'normal' | 'reverse' | 'mixed'
      angleTol: 45,
      enableSpoiled: false,
      enableDoubleCut: false,
      enableStir: true,
      stirMode: 'random',
      stirMult: 5,
      distThreshold: 0.15,
      mirrored: true,
      sound: true,
      voice: true,
      bgm: true,
      lowPerf: false,
    };

    this.state = 'MENU'; // MENU | PLAYING | ANIMATING | CELEBRATING | GAMEOVER | CALIBRATING
    this.stats = this._emptyStats();
    this.recipeQueue = [];
    this.currentDish = null;
    this.nextDish = null;
    this.currentSteps = [];
    this.stepIndex = 0;
    this.currentTask = null;

    this.timerInterval = null;
    this.remainSec = 0;
    this.startTimeMs = 0;
    this.celebrateTimer = null;
    this.lastVibrateAt = 0;

    // 視覺特效陣列（光軌、光刃、火花、波紋、蒸氣、浮動文字）
    this.cursorPos = null;
    this.trail = [];
    this.slashes = [];
    this.sparks = [];
    this.rings = [];
    this.steams = [];
    this.callouts = [];

    // 認知模式第 5 步懸停選取狀態
    this.cogHoveredId = null;
    this.cogHoverElapsedMs = 0;
    this.cogLastTickMs = null;

    this.unlockedSet = this._loadCollection();

    this._initDOM();
    this.tracker = new InputTracker(
      document.getElementById('webcamVideo'),
      document.getElementById('playStage'),
      {
        onPoint: (x, y, t, nearEdge) => this._handlePoint(x, y, t, nearEdge),
        onLost: () => this._handleLost(),
        onModelLoading: () => {
          const btn = document.getElementById('btnHudCam');
          if (btn && this.settings.inputMode === 'camera') btn.textContent = '⏳ 啟動鏡頭…';
          this._showToast('⏳ 正在啟動手部偵測，請稍候…');
        },
        onModelReady: () => {
          const btn = document.getElementById('btnHudCam');
          if (btn && this.settings.inputMode === 'camera') btn.textContent = '👀 尋手中';
          this._showToast('✅ 手部偵測已就緒！把手舉到鏡頭前即可揮動');
        },
        onTrackingState: (detected) => {
          const btn = document.getElementById('btnHudCam');
          if (!btn) return;
          if (!detected && this.state === 'PLAYING' && this.stats) {
            this.stats.drops++;
          }
          if (this.settings.inputMode === 'camera') {
            btn.textContent = detected ? '🖐️ 追蹤中' : '👀 尋手中';
          } else if (this.settings.inputMode === 'color') {
            btn.textContent = detected ? '🎨 追蹤中' : '🎨 尋色中';
          }
        },
        onModelError: (msg) => {
          this._showToast(`⚠️ 手部偵測錯誤：${msg}`);
        },
        onModelFallback: () => {
          this.settings.inputMode = 'touch';
          const videoEl = document.getElementById('webcamVideo');
          if (videoEl) videoEl.style.display = 'none';
          const camBtn = document.getElementById('btnHudCam');
          if (camBtn) { camBtn.textContent = '📷 開鏡頭'; camBtn.classList.remove('cam-on'); }
          this.tracker.start('touch');
          this._showToast('⚠️ 手部偵測啟動失敗，已自動切換為觸控模式（亦可直接觸控滑動）');
        },
        onAutoDowngrade: () => {
          this.settings.lowPerf = true;
          this._syncPerfButtonUI();
          this._showToast('偵測到裝置較忙碌，已自動切換為「省電順暢模式」');
        },
      }
    );

    this._updateCollectionBadge();
    this._startRenderLoop();
  }

  _emptyStats() {
    return { dishes: 0, steps: 0, swipes: 0, holds: 0, stirs: 0, coins: 0, drops: 0, activeMs: 0, dirCounts: {}, completedList: [] };
  }

  _loadCollection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COLLECTION);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  _saveCollection() {
    try {
      localStorage.setItem(STORAGE_KEY_COLLECTION, JSON.stringify(Array.from(this.unlockedSet)));
    } catch {}
    this._updateCollectionBadge();
  }

  _updateCollectionBadge() {
    const el = document.getElementById('collectionProgressBadge');
    if (el) el.textContent = `${this.unlockedSet.size} / ${RECIPES_DB.length}`;
  }

  _showToast(msg) {
    const toast = document.getElementById('toastBanner');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  _initDOM() {
    const bindSeg = (id, key, isNum = false) => {
      const container = document.getElementById(id);
      if (!container) return;
      container.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.settings[key] = isNum ? Number(btn.dataset.val) : btn.dataset.val;
          if (key === 'gameMode') {
            document.getElementById('groupDishTarget')?.classList.toggle('hidden', this.settings.gameMode !== 'dishes');
            document.getElementById('groupTimeLimit')?.classList.toggle('hidden', this.settings.gameMode !== 'timed');
          }
          if (['trainingMode', 'cogChoices', 'dirRule', 'angleTol', 'stirMult'].includes(key)) { this._markCustomPreset(); }
          if (key === 'trainingMode') {
            document.getElementById('groupCogChoices')?.classList.toggle('hidden', this.settings.trainingMode !== 'cognitive');
            document.getElementById('rowEnableStir')?.classList.toggle('hidden', this.settings.trainingMode === 'cognitive');
            document.getElementById('ctrlStirMode')?.classList.toggle('hidden', this.settings.trainingMode === 'cognitive');
            document.getElementById('ctrlStirMult')?.classList.toggle('hidden', this.settings.trainingMode === 'cognitive');
          }
        });
      });
    };

    bindSeg('ctrlGameMode', 'gameMode');
    bindSeg('ctrlDishCount', 'targetDishes', true);
    bindSeg('ctrlTimeSec', 'timeLimitSec', true);
    bindSeg('ctrlCategoryFilter', 'categoryFilter');
    bindSeg('ctrlTrainingMode', 'trainingMode');
    bindSeg('ctrlCogChoices', 'cogChoices', true);
    bindSeg('ctrlStirMode', 'stirMode');
    bindSeg('ctrlStirMult', 'stirMult', true);
    bindSeg('ctrlDirRule', 'dirRule');
    bindSeg('ctrlAngleTol', 'angleTol', true);
    bindSeg('ctrlInputMode', 'inputMode');

    // 方向組合預設按鈕
    const dirPresetEl = document.getElementById('ctrlDirPreset');
    if (dirPresetEl) {
      dirPresetEl.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          dirPresetEl.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const v = btn.dataset.val;
          if (v === '4') this.settings.allowedDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          else if (v === '8') this.settings.allowedDirs = ['UP', 'UR', 'RIGHT', 'DR', 'DOWN', 'DL', 'LEFT', 'UL'];
          else if (v === 'high') this.settings.allowedDirs = ['UP', 'UL', 'UR'];
          else if (v === 'wide') this.settings.allowedDirs = ['LEFT', 'RIGHT'];
          this._syncDirChipsUI();
          this._markCustomPreset();
        });
      });
    }

    // 關卡左右滑動按鈕
    const stageGrid = document.getElementById('stageCardGrid');
    document.getElementById('btnStagePrev')?.addEventListener('click', () => {
      stageGrid?.scrollBy({ left: -240, behavior: 'smooth' });
    });
    document.getElementById('btnStageNext')?.addEventListener('click', () => {
      stageGrid?.scrollBy({ left: 240, behavior: 'smooth' });
    });
    document.querySelectorAll('#quickLengthRow .len-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#quickLengthRow .len-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.dataset.mode;
        const val = Number(pill.dataset.val);
        this.settings.gameMode = mode;
        if (mode === 'dishes') this.settings.targetDishes = val;
        if (mode === 'timed') this.settings.timeLimitSec = val;
        document.getElementById('ctrlDishCount')?.classList.toggle('hidden', mode !== 'dishes');
        document.getElementById('ctrlTimeSec')?.classList.toggle('hidden', mode !== 'timed');
      });
    });

    document.getElementById('btnHudCam')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnHudCam');
      if (this.settings.inputMode === 'color') {
        this._enterColorCalibration(true);
        return;
      }
      if (this.settings.inputMode === 'camera' && this.tracker.stream) {
        this.settings.inputMode = 'touch';
        document.getElementById('webcamVideo').style.display = 'none';
        await this.tracker.start('touch');
        btn.textContent = '📷 開鏡頭';
        btn.classList.remove('cam-on');
        this._syncSegVal('ctrlInputMode', 'touch');
        this._showToast('👆 已切換為「觸控／滑鼠模式」');
      } else {
        try {
          this.settings.inputMode = 'camera';
          await this.tracker.start('camera', {
            mirrored: this.settings.mirrored,
            lowPerf: this.settings.lowPerf,
          });
          document.getElementById('webcamVideo').style.display = 'block';
          btn.textContent = '📷 鏡頭中';
          btn.classList.add('cam-on');
          this._syncSegVal('ctrlInputMode', 'camera');
          this._showToast('📷 已開啟滿版鏡頭體感！把手舉到畫面中即可揮動');
        } catch {
          this.settings.inputMode = 'touch';
          this._showToast('⚠️ 請在瀏覽器網址列允許相機權限，目前可先用觸控／滑鼠遊玩');
        }
      }
    });

    document.getElementById('btnHudSettings')?.addEventListener('click', () => {
      this.quitToMenu();
    });

    document.querySelectorAll('#customDirGrid .dir-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const d = chip.dataset.dir;
        const set = new Set(this.settings.allowedDirs);
        if (set.has(d)) {
          if (set.size <= 1) {
            this._showToast('請至少保留 1 個揮動方向');
            return;
          }
          set.delete(d);
        } else {
          set.add(d);
        }
        this.settings.allowedDirs = Array.from(set);
        this._syncDirChipsUI();
      });
    });

    document.querySelectorAll('.stage-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stage-card').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        this._applyPreset(btn.dataset.preset);
      });
    });

    const rng = document.getElementById('rngDistThreshold');
    rng.addEventListener('input', () => {
      document.getElementById('lblDistThreshold').textContent = `${rng.value}%`;
      this.settings.distThreshold = Number(rng.value) / 100;
    });

    document.getElementById('chkEnableSpoiled').addEventListener('change', (e) => (this.settings.enableSpoiled = e.target.checked));
    document.getElementById('chkEnableDoubleCut').addEventListener('change', (e) => (this.settings.enableDoubleCut = e.target.checked));
    document.getElementById('chkEnableStir').addEventListener('change', (e) => (this.settings.enableStir = e.target.checked));
    document.getElementById('chkMirror').addEventListener('change', (e) => {
      this.settings.mirrored = e.target.checked;
      document.getElementById('webcamVideo')?.classList.toggle('mirrored', this.settings.mirrored);
    });
    document.getElementById('chkSound').addEventListener('change', (e) => {
      this.settings.sound = e.target.checked;
      this.sound.soundEnabled = e.target.checked;
      this._syncSoundBtnUI();
    });
    document.getElementById('chkVoice').addEventListener('change', (e) => {
      this.settings.voice = e.target.checked;
      this.sound.voiceEnabled = e.target.checked;
    });
    document.getElementById('chkBgm')?.addEventListener('change', (e) => {
      this.settings.bgm = e.target.checked;
      this.sound.bgmEnabled = e.target.checked;
      if (this.settings.bgm && (this.state === 'PLAYING' || this.state === 'ANIMATING' || this.state === 'CELEBRATING')) {
        this.sound.startBgm();
      } else {
        this.sound.stopBgm();
      }
      this._syncBgmBtnUI();
    });
    document.getElementById('rngSfxVol')?.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.sound.sfxVolume = v / 100;
      const lbl = document.getElementById('lblSfxVol');
      if (lbl) lbl.textContent = `${v}%`;
    });
    document.getElementById('rngBgmVol')?.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.sound.bgmVolume = v / 100;
      const lbl = document.getElementById('lblBgmVol');
      if (lbl) lbl.textContent = `${v}%`;
    });
    document.getElementById('rngVoiceVol')?.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.sound.voiceVolume = v / 100;
      const lbl = document.getElementById('lblVoiceVol');
      if (lbl) lbl.textContent = `${v}%`;
    });
    document.getElementById('btnStartCustom').addEventListener('click', () => this.startGame());

    const welcomeModal = document.getElementById('modalWelcome');
    document.getElementById('btnWelcomeColor')?.addEventListener('click', () => {
      this.sound.unlock();
      this.settings.inputMode = 'color';
      document.querySelectorAll('#ctrlInputMode button').forEach((b) => {
        b.classList.toggle('active', b.dataset.val === 'color');
      });
      welcomeModal?.classList.add('hidden');
      this.startGame();
    });
    document.getElementById('btnWelcomeCamera')?.addEventListener('click', () => {
      this.settings.inputMode = 'camera';
      document.querySelectorAll('#ctrlInputMode button').forEach((b) => {
        b.classList.toggle('active', b.dataset.val === 'camera');
      });
      welcomeModal?.classList.add('hidden');
      this.startGame();
    });
    document.getElementById('btnWelcomeTouch')?.addEventListener('click', () => {
      this.settings.inputMode = 'touch';
      document.querySelectorAll('#segInputMode button').forEach((b) => {
        b.classList.toggle('active', b.dataset.val === 'touch');
      });
      welcomeModal?.classList.add('hidden');
      this.startGame();
    });
    document.getElementById('btnWelcomeSettings')?.addEventListener('click', () => {
      this.sound.unlock();
      welcomeModal?.classList.add('hidden');
      this.quitToMenu();
    });

    // HUD 音效與結束／打烊結算按鈕
    document.getElementById('btnHudSound').addEventListener('click', () => {
      this.settings.sound = !this.settings.sound;
      this.sound.soundEnabled = this.settings.sound;
      document.getElementById('chkSound').checked = this.settings.sound;
      this._syncSoundBtnUI();
    });
    document.getElementById('btnHudBgm')?.addEventListener('click', () => {
      this.settings.bgm = !this.settings.bgm;
      this.sound.bgmEnabled = this.settings.bgm;
      const chkBgm = document.getElementById('chkBgm');
      if (chkBgm) chkBgm.checked = this.settings.bgm;
      if (this.settings.bgm) this.sound.startBgm();
      else this.sound.stopBgm();
      this._syncBgmBtnUI();
    });

    document.getElementById('btnHudFinish').addEventListener('click', () => {
      if (this.stats.dishes > 0 || this.settings.gameMode === 'endless') {
        this.finishGame();
      } else {
        this.quitToMenu();
      }
    });

    document.getElementById('btnPlayAgain').addEventListener('click', () => this.startGame());
    document.getElementById('btnBackSettings').addEventListener('click', () => this.quitToMenu());

    document.getElementById('btnTogglePerf').addEventListener('click', () => {
      this.settings.lowPerf = !this.settings.lowPerf;
      this.tracker.setLowPerf(this.settings.lowPerf);
      this._syncPerfButtonUI();
    });

    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // 50 道夜市美食收集圖鑑彈窗
    document.getElementById('btnOpenGallery').addEventListener('click', () => this._openGalleryModal('ALL'));
    document.getElementById('btnCloseGallery').addEventListener('click', () => {
      document.getElementById('modalGallery').classList.add('hidden');
    });

    // 🎨 顏色體感：點擊畫面取色（僅在 CALIBRATING_COLOR 狀態生效，畫面無任何食材）
    document.getElementById('playStage')?.addEventListener('pointerdown', (e) => {
      if (this.state !== 'CALIBRATING_COLOR') return;
      if (e.target.closest('.color-calib-bar') || e.target.closest('button')) return;
      const picked = this.tracker.sampleColorAtScreenPoint(e.clientX, e.clientY);
      if (!picked) {
        this._showToast('請等鏡頭畫面出現後再點選物品喔');
        return;
      }
      const swatch = document.getElementById('colorSwatch');
      const prompt = document.getElementById('colorCalibPrompt');
      const startBtn = document.getElementById('btnColorCalibStart');
      if (swatch) swatch.style.background = picked.hex;
      if (prompt) prompt.textContent = '✅ 已鎖定顏色！揮動看看光圈，穩了就按「開始料理」';
      if (startBtn) startBtn.disabled = false;
      this.sound.speak('已鎖定顏色，揮動看看光圈是否跟隨');
    });

    document.querySelectorAll('#ctrlColorTol button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#ctrlColorTol button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.tracker.setColorTolerance(btn.dataset.val);
      });
    });

    document.getElementById('btnColorCalibBack')?.addEventListener('click', () => {
      this._exitColorCalibration();
      this.tracker.stop();
      this.state = 'IDLE';
      document.getElementById('modalWelcome')?.classList.remove('hidden');
    });

    document.getElementById('btnColorCalibStart')?.addEventListener('click', async () => {
      if (!this.tracker.hasColorTarget()) return;
      const resuming = this._colorCalibResuming;
      this._exitColorCalibration();
      if (resuming) {
        this.state = 'PLAYING';
      } else {
        this.state = 'PLAYING';
        await this._startNextDish();
        this._startGameClock();
      }
    });
    document.querySelectorAll('.gallery-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.gallery-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this._openGalleryModal(tab.dataset.cat);
      });
    });

    this._initCalibrationModal();
    window.addEventListener('resize', () => this._resizeCanvases());
  }

  getCookMeta(dish) {
    const cat = dish?.category || '';
    const name = dish?.name || '';
    const isDrink = /奶茶|檸檬|牛奶|甘蔗汁|紅茶|愛玉|冬瓜/.test(name);
    if (cat === '煎台料理') {
      return {
        typeKey: 'teppan', actionName: '鐵板煎炒', badge: '🍳 鐵板煎炒', icon: '🍳',
        verb: '揮動鐵板滋滋煎炒', color: '#fb923c',
        cookImg: 'assets/common/cook_teppan.webp?v=2.3', cookAnim: 'anim-cook-teppan',
        svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="11" cy="14" rx="8" ry="4" fill="currentColor" fill-opacity="0.2"/><path d="M19 14l3-2"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3"/></svg>`
      };
    }
    if (cat === '油炸料理') {
      return {
        typeKey: 'fry', actionName: '酥炸甩油', badge: '🧺 酥炸起鍋', icon: '🧺',
        verb: '晃動炸網金黃甩油', color: '#facc15',
        cookImg: 'assets/common/cook_fry.webp?v=2.3', cookAnim: 'anim-cook-fry',
        svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 10h12l-2 9H7l-2-9z" fill="currentColor" fill-opacity="0.2"/><path d="M17 10l4-4"/><circle cx="9" cy="6" r="1"/><circle cx="13" cy="5" r="1"/></svg>`
      };
    }
    if (cat === '炭烤料理') {
      return {
        typeKey: 'grill', actionName: '炭火翻烤', badge: '🍢 炭火翻烤', icon: '🍢',
        verb: '炭火翻烤刷上醬香', color: '#f87171',
        cookImg: 'assets/common/cook_grill.webp?v=2.3', cookAnim: 'anim-cook-grill',
        svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 13h16M6 16h12M8 19h8" stroke-linecap="round"/><path d="M9 10c0-2 2-3 2-5 1.5 1.5 2 3 2 5" fill="currentColor" fill-opacity="0.25"/></svg>`
      };
    }
    if (cat === '熱食與湯品') {
      return {
        typeKey: 'boil', actionName: '大鍋滾煮', badge: '🍲 大鍋滾煮', icon: '🍲',
        verb: '大鍋滾煮熱氣蒸騰', color: '#fbbf24',
        cookImg: 'assets/common/cook_boil.webp?v=2.3', cookAnim: 'anim-cook-boil',
        svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 11h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6z" fill="currentColor" fill-opacity="0.2"/><path d="M3 11h18"/><path d="M9 7V4M15 7V4"/></svg>`
      };
    }
    if (isDrink) {
      return {
        typeKey: 'shake', actionName: '手搖搖勻', badge: '🧋 手搖搖勻', icon: '🧋',
        verb: '雪克杯上下搖勻冰涼', color: '#38bdf8',
        cookImg: 'assets/common/cook_shake.webp?v=2.3', cookAnim: 'anim-cook-shake',
        svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h8l-1 13H9L8 7z" fill="currentColor" fill-opacity="0.22"/><path d="M9 7l1-3h4l1 3"/><path d="M4 11l-1 3M20 11l1 3"/></svg>`
      };
    }
    return {
      typeKey: 'mix', actionName: '手工拌料', badge: '🍧 手工拌料', icon: '🍧',
      verb: '甜品碗拌勻配料淋醬', color: '#f472b6',
      cookImg: 'assets/common/cook_mix.webp?v=2.3', cookAnim: 'anim-cook-mix',
      svg: `<svg class="act-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a8 8 0 0 1-16 0z" fill="currentColor" fill-opacity="0.22"/><path d="M14 12l5-7"/></svg>`
    };
  }

  _markCustomPreset() {
    document.querySelectorAll('.stage-card').forEach((b) => b.classList.remove('active'));
    const badge = document.getElementById('presetStatusBadge');
    if (badge) badge.textContent = '目前選擇：🎛️ 已微調為自訂規則';
  }

  _syncSegVal(id, val) {
    const c = document.getElementById(id);
    if (!c) return;
    c.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.val === String(val)));
  }

  _dismissGuide() {
  }

  _syncDirChipsUI() {
    const set = new Set(this.settings.allowedDirs);
    document.querySelectorAll('#customDirGrid .dir-chip').forEach((chip) => {
      chip.classList.toggle('active', set.has(chip.dataset.dir));
    });
  }

  _syncSoundBtnUI() {
    const btn = document.getElementById('btnHudSound');
    if (btn) btn.textContent = this.settings.sound ? '🔊' : '🔇';
  }

  _syncBgmBtnUI() {
    const btn = document.getElementById('btnHudBgm');
    if (btn) {
      btn.textContent = this.settings.bgm ? '🎵' : '🔇🎵';
      btn.style.opacity = this.settings.bgm ? '1' : '0.6';
    }
  }

  _syncPerfButtonUI() {
    const btn = document.getElementById('btnTogglePerf');
    if (btn) btn.textContent = this.settings.lowPerf ? '🔋 省電順暢' : '⚡ 一般效能';
  }

  _applyPreset(preset) {
    if (preset === 'easy') {
      this.settings.trainingMode = 'action';
      this.settings.allowedDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      this.settings.dirRule = 'normal';
      this.settings.enableSpoiled = false;
      this.settings.enableDoubleCut = false;
      this.settings.enableStir = true;
      this.settings.distThreshold = 0.15;
    } else if (preset === 'brain') {
      this.settings.trainingMode = 'action';
      this.settings.allowedDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      this.settings.dirRule = 'mixed';
      this.settings.enableSpoiled = true;
      this.settings.enableDoubleCut = false;
      this.settings.enableStir = true;
      this.settings.distThreshold = 0.18;
    } else if (preset === 'cognitive') {
      this.settings.trainingMode = 'cognitive';
      this.settings.cogChoices = 3;
      this.settings.allowedDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      this.settings.dirRule = 'normal';
      this.settings.enableSpoiled = false;
      this.settings.enableDoubleCut = false;
      this.settings.distThreshold = 0.16;
    } else if (preset === 'master') {
      this.settings.trainingMode = 'action';
      this.settings.allowedDirs = ['UP', 'UR', 'RIGHT', 'DR', 'DOWN', 'DL', 'LEFT', 'UL'];
      this.settings.dirRule = 'mixed';
      this.settings.enableSpoiled = true;
      this.settings.enableDoubleCut = true;
      this.settings.enableStir = true;
      this.settings.distThreshold = 0.19;
    }

    const syncSeg = (id, val) => {
      const c = document.getElementById(id);
      if (!c) return;
      c.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.val === String(val)));
    };
    syncSeg('ctrlTrainingMode', this.settings.trainingMode);
    syncSeg('ctrlCogChoices', this.settings.cogChoices);
    syncSeg('ctrlDirRule', this.settings.dirRule);
    syncSeg('ctrlDirPreset', this.settings.allowedDirs.length === 8 ? '8' : '4');
    document.getElementById('groupCogChoices').classList.toggle('hidden', this.settings.trainingMode !== 'cognitive');

    document.getElementById('chkEnableSpoiled').checked = this.settings.enableSpoiled;
    document.getElementById('chkEnableDoubleCut').checked = this.settings.enableDoubleCut;
    document.getElementById('chkEnableStir').checked = this.settings.enableStir;
    this._syncSegVal('ctrlStirMode', this.settings.stirMode);
    this._syncDirChipsUI();

    const pct = Math.round(this.settings.distThreshold * 100);
    document.getElementById('rngDistThreshold').value = pct;
    document.getElementById('lblDistThreshold').textContent = `${pct}%`;
  }

  _getFilteredPool() {
    if (this.settings.categoryFilter === 'ALL') return RECIPES_DB;
    const list = RECIPES_DB.filter((r) => r.category === this.settings.categoryFilter);
    return list.length > 0 ? list : RECIPES_DB;
  }

  _drawRecipeFromDeck() {
    if (this.recipeQueue.length === 0) {
      const pool = this._getFilteredPool();
      this.recipeQueue = [...pool].sort(() => Math.random() - 0.5);
      if (this.currentDish && this.recipeQueue.length > 1 && this.recipeQueue[this.recipeQueue.length - 1].id === this.currentDish.id) {
        const last = this.recipeQueue.pop();
        this.recipeQueue.unshift(last);
      }
    }
    return this.recipeQueue.pop();
  }

  async startGame() {
    this.sound.unlock();
    if (this.settings.bgm) this.sound.startBgm();
    clearTimeout(this.celebrateTimer);
    clearInterval(this.timerInterval);

    this.judge.distThreshold = this.settings.distThreshold;
    this.judge.angleToleranceDeg = this.settings.angleTol;
    this.judge.stirMultiplier = this.settings.stirMult;
    this.judge.resetState();

    this.stats = this._emptyStats();
    this.recipeQueue = [];
    this.currentDish = null;
    this.nextDish = null;

    this.startTimeMs = performance.now();
    this.remainSec = this.settings.timeLimitSec;

    this._switchScreen('screenGame');
    this._resizeCanvases();

    document.getElementById('completedThumbs').innerHTML = '';
    document.getElementById('hudCompletedCount').textContent = '0';
    document.getElementById('celebrateOverlay').classList.add('hidden');

    const coinBadge = document.getElementById('hudCoinBadge');
    coinBadge.classList.toggle('hidden', this.settings.gameMode !== 'endless');
    coinBadge.textContent = '｜💰 0 銅板';

    const finishBtn = document.getElementById('btnHudFinish');
    finishBtn.textContent = this.settings.gameMode === 'endless' ? '🏆 打烊結算' : '🏠 結束';

    const videoEl = document.getElementById('webcamVideo');
    const camBtn = document.getElementById('btnHudCam');
    videoEl.classList.toggle('mirrored', this.settings.mirrored);

    if (this.settings.inputMode === 'camera' || this.settings.inputMode === 'color') {
      try {
        await this.tracker.start(this.settings.inputMode, {
          mirrored: this.settings.mirrored,
          lowPerf: this.settings.lowPerf,
        });
        videoEl.style.display = 'block';
        if (camBtn) {
          camBtn.textContent = this.settings.inputMode === 'color' ? '🎨 換色' : '📷 鏡頭中';
          camBtn.classList.add('cam-on');
        }
        if (this.settings.inputMode === 'color') {
          this._enterColorCalibration(false);
          return;
        }
      } catch {
        this._showToast('無法開啟攝影機，已自動切換為「觸控／滑鼠模式」');
        this.settings.inputMode = 'touch';
        videoEl.style.display = 'none';
        await this.tracker.start('touch');
      }
    } else {
      videoEl.style.display = 'none';
      if (camBtn) { camBtn.textContent = '📷 開鏡頭'; camBtn.classList.remove('cam-on'); }
      await this.tracker.start('touch');
    }

    this.state = 'PLAYING';
    await this._startNextDish();
    this._startGameClock();
  }

  _startGameClock() {
    clearInterval(this.timerInterval);
    this._updateTargetHUD();
    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING' && this.state !== 'ANIMATING') return;
      if (this.settings.gameMode === 'timed') {
        this.remainSec--;
        this._updateTargetHUD();
        if (this.remainSec <= 0) {
          this.finishGame();
        }
      }
    }, 1000);
  }

  _getEndlessRankTitle(dishes) {
    if (dishes >= 10) return '👑 夜市傳奇總舖師';
    if (dishes >= 6) return '⭐⭐⭐ 排隊老店';
    if (dishes >= 3) return '⭐⭐ 人氣名攤';
    return '⭐ 夜市小推車';
  }

  _updateTargetHUD() {
    const val = document.getElementById('hudTargetVal');
    if (this.settings.gameMode === 'dishes') {
      val.textContent = `剩餘 ${Math.max(0, this.settings.targetDishes - this.stats.dishes)} 道`;
    } else if (this.settings.gameMode === 'timed') {
      val.textContent = `倒數 ${Math.max(0, this.remainSec)} 秒`;
    } else {
      val.textContent = `${this._getEndlessRankTitle(this.stats.dishes)}`;
    }
  }

  async _startNextDish() {
    this.currentDish = this.nextDish || this._drawRecipeFromDeck();
    this.nextDish = this._drawRecipeFromDeck();

    await this.assets.preloadRecipes([this.currentDish]);
    this.assets.preloadRecipes([this.nextDish]);
    this.assets.pruneOldIngredients([this.currentDish, this.nextDish]);

    const resolvedIngredients = this.currentDish.ingredientIds.map((id) => INGREDIENTS_DB[id]);
    const shuffled = [...resolvedIngredients].sort(() => Math.random() - 0.5);

    this.currentSteps = [
      ...shuffled.map((ing) => ({
        isFinish: false,
        id: ing.id,
        name: ing.name,
        prepType: ing.prepType || 'cut',
        imgSrc: ing.img,
        collected: false,
      })),
      {
        isFinish: true,
        id: this.currentDish.id,
        name: this.currentDish.name,
        prepType: 'stir',
        imgSrc: this.settings.enableStir ? this.getCookMeta(this.currentDish).cookImg : this.currentDish.finishImg,
      },
    ];
    this.stepIndex = 0;

    this._syncTopHudDishInfo();
    this._renderIngredientSlots();
    this._setupStepTask();
  }

  _syncTopHudDishInfo() {
    const isMystery = this.settings.trainingMode === 'cognitive' && this.stepIndex < 4;
    const thumb = document.getElementById('hudDishThumb');
    const nameEl = document.getElementById('hudDishName');
    const catEl = document.getElementById('hudCategoryTag');

    catEl.textContent = this.currentDish.category;
    if (isMystery) {
      thumb.src = 'assets/common/wok.webp?v=2.1';
      nameEl.textContent = '❓ 神秘料理';
    } else {
      thumb.src = this.currentDish.finishImg;
      nameEl.textContent = this.currentDish.name;
    }

    const dots = document.querySelectorAll('#hudStepDots .step-dot');
    dots.forEach((d, idx) => {
      d.classList.remove('active', 'done');
      if (idx < this.stepIndex) d.classList.add('done');
      else if (idx === this.stepIndex) d.classList.add('active');
    });
    document.getElementById('hudStepProgress').textContent = `步驟 ${this.stepIndex + 1} / 5`;
  }

  _renderIngredientSlots() {
    const container = document.getElementById('ingredientSlots');
    const ingSteps = this.currentSteps.slice(0, 4);
    container.innerHTML = ingSteps
      .map(
        (step, idx) => `
      <div class="slot-item ${step.collected ? 'collected' : idx === this.stepIndex ? 'active' : ''}" data-slot-index="${idx}">
        <img src="${step.imgSrc}" alt="${step.name}" loading="eager" />
        <span>${step.name}</span>
      </div>
    `
      )
      .join('');
  }

  _pickRandomDirection(excludeKey = null) {
    const pool = this.settings.allowedDirs.filter((k) => k !== excludeKey);
    const list = pool.length > 0 ? pool : this.settings.allowedDirs;
    return list[Math.floor(Math.random() * list.length)];
  }

  _pickIsReverse() {
    if (this.settings.dirRule === 'reverse') return true;
    if (this.settings.dirRule === 'mixed') return Math.random() < 0.5;
    return false;
  }

  _setupStepTask() {
    const step = this.currentSteps[this.stepIndex];
    this._syncTopHudDishInfo();
    this._renderIngredientSlots();
    this.judge.resetState();

    const foodHeroWrap = document.getElementById('foodHeroWrap');
    const foodImgBox = document.getElementById('foodImgBox');
    const stepImgEl = document.getElementById('currentStepImg');
    const halfLeft = document.getElementById('foodHalfLeft');
    const halfRight = document.getElementById('foodHalfRight');
    const stepLabelEl = document.getElementById('currentStepLabel');
    const hintSubEl = document.getElementById('promptTargetText');
    const ruleBanner = document.getElementById('ruleBanner');
    const arrowOverlay = document.getElementById('arrowOverlay');
    const spoiledOverlay = document.getElementById('spoiledOverlay');
    const spoiledRingSvg = document.getElementById('spoiledRingSvg');
    const spoiledTimerText = document.getElementById('spoiledTimerText');
    const doubleCutBadge = document.getElementById('doubleCutBadge');
    const stirRingSvg = document.getElementById('stirRingSvg');
    const stirPercentText = document.getElementById('stirPercentText');
    const cogChoiceArena = document.getElementById('cogChoiceArena');

    foodHeroWrap.className = 'food-hero-wrap';
    foodImgBox.classList.remove('stirring');
    spoiledOverlay.classList.add('hidden');
    spoiledRingSvg.classList.remove('active');
    spoiledTimerText.classList.remove('active');
    doubleCutBadge.classList.add('hidden');
    stirRingSvg?.classList.remove('active');
    stirPercentText?.classList.remove('active');
    cogChoiceArena.classList.add('hidden');
    arrowOverlay.style.display = 'none';
    const arrowOverlay2 = document.getElementById('arrowOverlay2');
    if (arrowOverlay2) arrowOverlay2.style.display = 'none';

    // 情境 A：第 5 步且為「認知推理選菜模式」
    if (step.isFinish && this.settings.trainingMode === 'cognitive') {
      foodHeroWrap.classList.add('hidden');
      stepLabelEl.classList.add('hidden');
      cogChoiceArena.classList.remove('hidden');

      this.cogReadyAtMs = performance.now() + 1500;
      ruleBanner.className = 'rule-banner reverse';
      ruleBanner.textContent = '🧠 猜猜看！這 4 樣材料是哪道夜市美食？';
      hintSubEl.textContent = '⏳ 先看題目想一下（1.5 秒後開始感應作答）…';
      this.sound.speak('看看底下的四樣材料，猜猜看是哪一道料理？');
      this._setupCognitiveChoices();
      return;
    }

    foodHeroWrap.classList.remove('hidden');
    stepLabelEl.classList.remove('hidden');

    stepImgEl.src = step.imgSrc;
    halfLeft.src = step.imgSrc;
    halfRight.src = step.imgSrc;

    // 情境 B：第 5 步且為「動作料理模式」（視覺與語音永遠呈現該分類烹飪器具，體感判定可隨機穿插自由連揮或單次揮動）
    if (step.isFinish) {
      const cookMeta = this.getCookMeta(this.currentDish);
      const useCookImg = this.settings.enableStir ? cookMeta.cookImg : this.currentDish.finishImg;
      stepImgEl.src = useCookImg;
      halfLeft.src = useCookImg;
      halfRight.src = useCookImg;

      const shouldStir = this.settings.enableStir && (
        this.settings.stirMode === 'always' ||
        (this.settings.stirMode === 'random' && Math.random() < 0.35)
      );

      if (shouldStir) {
        this.currentTask = { type: 'STIR', cookMeta };
        ruleBanner.className = 'rule-banner stir';
        ruleBanner.textContent = `🔥 火力全開！【${cookMeta.actionName}】自由連揮！`;
        stirRingSvg?.classList.add('active');
        stirPercentText?.classList.add('active');
        const stirProg = document.getElementById('stirRingProg');
        if (stirProg) stirProg.style.strokeDashoffset = '339.29';
        if (stirPercentText) stirPercentText.textContent = `🔥 ${cookMeta.actionName} 0%`;
        stepLabelEl.innerHTML = `<span class="step-action-badge badge-cook" style="--badge-color:${cookMeta.color}">${cookMeta.svg}<span>${cookMeta.actionName}</span></span><span class="step-item-name">${this.currentDish.name}</span>`;
        hintSubEl.textContent = `${cookMeta.verb}，累積熱度 100% 即可香噴噴出餐！`;
        this.sound.speak(`火力全開！${cookMeta.actionName}，完成${this.currentDish.name}`);
        return;
      }
    }

    // 情境 C：步驟 1-4 隨機插入「壞食材抑制 (Go/No-Go)」（若開啟且本步尚未觸發過）
    if (!step.isFinish && this.settings.enableSpoiled && !step.spoiledCleared && Math.random() < 0.28) {
      this.currentTask = { type: 'SPOILED' };
      foodHeroWrap.classList.add('is-spoiled');
      spoiledOverlay.classList.remove('hidden');
      spoiledRingSvg.classList.add('active');
      spoiledTimerText.classList.add('active');
      document.getElementById('spoiledRingProg').style.strokeDashoffset = '339.29';
      spoiledTimerText.textContent = '✋ 忍住不動 2.5s';

      ruleBanner.className = 'rule-banner spoiled';
      ruleBanner.textContent = '🦠 壞食材警報！忍住不要揮動！';
      stepLabelEl.textContent = `🤢 發霉的${step.name}`;
      hintSubEl.textContent = '保持手部穩定不揮動 2.5 秒，自動掃進垃圾桶換新鮮食材';
      this.sound.speak('壞掉了，忍住不要動');
      return;
    }

    // 情境 D：一般方向揮動（含四大烹飪手感 & 兩刀連擊）
    const shownKey = this._pickRandomDirection();
    const isReverse = this._pickIsReverse();
    const requiredDirKey = isReverse ? DIR_VECTORS[shownKey].opposite : shownKey;

    const totalCuts = (!step.isFinish && this.settings.enableDoubleCut && Math.random() < 0.45) ? 2 : 1;
    const remainingCuts = [{ shownKey, isReverse, requiredDirKey }];
    if (totalCuts === 2) {
      let shown2 = this._pickRandomDirection(shownKey);
      let rev2 = this.settings.dirRule === 'mixed'
        ? Math.random() < 0.5
        : this.settings.dirRule === 'reverse';
      let req2 = rev2 ? DIR_VECTORS[shown2].opposite : shown2;
      if (req2 === requiredDirKey) {
        shown2 = this._pickRandomDirection(shown2);
        req2 = rev2 ? DIR_VECTORS[shown2].opposite : shown2;
      }
      remainingCuts.push({ shownKey: shown2, isReverse: rev2, requiredDirKey: req2 });
    }
    const prepInfo = PREP_LABELS[step.prepType] || PREP_LABELS.cut;

    const cookMeta = step.isFinish ? this.getCookMeta(this.currentDish) : null;
    this.currentTask = {
      type: 'DIRECTION',
      shownKey,
      requiredDirKey,
      isReverse,
      remainingCuts,
      prepType: step.isFinish ? 'cook' : (step.prepType || 'cut'),
      cookMeta,
      totalCuts,
      currentCut: 1,
    };

    this._renderDirectionUI(step, prepInfo);
  }

  _renderDirectionUI(step, prepInfo) {
    const cuts = this.currentTask.remainingCuts || [{
      shownKey: this.currentTask.shownKey,
      isReverse: this.currentTask.isReverse,
      requiredDirKey: this.currentTask.requiredDirKey,
    }];
    const cut1 = cuts[0];
    const cut2 = cuts[1] || null;
    const { totalCuts, currentCut } = this.currentTask;
    const shownKey = cut1.shownKey;
    const isReverse = cut1.isReverse;

    const foodImgBox = document.getElementById('foodImgBox');
    const arrowOverlay = document.getElementById('arrowOverlay');
    const arrowSvg = document.getElementById('arrowSvg');
    const arrowPath = document.getElementById('arrowPath');
    const foodHalo = document.getElementById('foodHalo');
    const ruleBanner = document.getElementById('ruleBanner');
    const doubleCutBadge = document.getElementById('doubleCutBadge');
    const stepLabelEl = document.getElementById('currentStepLabel');
    const hintSubEl = document.getElementById('promptTargetText');

    foodImgBox?.classList.toggle('has-dual-arrows', cuts.length === 2);

    arrowOverlay.style.display = 'grid';
    arrowOverlay.style.transform = `rotate(${DIR_VECTORS[cut1.shownKey].deg}deg)`;
    arrowSvg.style.transform = '';
    arrowSvg.classList.toggle('normal', !cut1.isReverse);
    arrowSvg.classList.toggle('reverse', cut1.isReverse);
    arrowPath.setAttribute('fill', cut1.isReverse ? 'url(#gradCyan)' : 'url(#gradGold)');
    arrowPath.setAttribute('stroke', cut1.isReverse ? '#0F3E5C' : '#5C3317');
    foodHalo.classList.toggle('reverse', cuts.some((c) => c.isReverse));

    const arrowOverlay2 = document.getElementById('arrowOverlay2');
    const arrowSvg2 = document.getElementById('arrowSvg2');
    const arrowPath2 = document.getElementById('arrowPath2');

    if (totalCuts > 1) {
      doubleCutBadge.classList.remove('hidden');
      if (cut2 && arrowOverlay2 && arrowSvg2 && arrowPath2) {
        arrowOverlay2.style.display = 'grid';
        arrowOverlay2.style.transform = `rotate(${DIR_VECTORS[cut2.shownKey].deg}deg)`;
        arrowSvg2.style.transform = '';
        arrowSvg2.classList.toggle('normal', !cut2.isReverse);
        arrowSvg2.classList.toggle('reverse', cut2.isReverse);
        arrowPath2.setAttribute('fill', cut2.isReverse ? 'url(#gradCyan)' : 'url(#gradGold)');
        arrowPath2.setAttribute('stroke', cut2.isReverse ? '#0F3E5C' : '#5C3317');
        doubleCutBadge.textContent = '⚔️ 雙刀連擊（順序不限）';
      } else {
        if (arrowOverlay2) arrowOverlay2.style.display = 'none';
        doubleCutBadge.textContent = '⚔️ 還剩最後 1 刀';
      }
    } else {
      if (arrowOverlay2) arrowOverlay2.style.display = 'none';
      doubleCutBadge.classList.add('hidden');
    }

    const cookMeta = this.currentTask.cookMeta;
    const activeIcon = cookMeta ? cookMeta.icon : prepInfo.icon;
    const activeTag = cookMeta ? cookMeta.actionName : prepInfo.tag;

    ruleBanner.className = `rule-banner ${isReverse ? 'reverse' : 'normal'}`;
    if (isReverse) {
      ruleBanner.textContent = '🧠 往箭頭「相反方向」揮';
      hintSubEl.textContent = '看見青藍色箭頭，請往相反方向揮';
    } else if (step.isFinish && cookMeta) {
      ruleBanner.textContent = '🏮 照箭頭方向揮動';
      hintSubEl.textContent = '';
    } else {
      ruleBanner.textContent = '🏮 照箭頭方向揮動';
      hintSubEl.textContent = '';
    }

    if (step.isFinish && cookMeta) {
      stepLabelEl.innerHTML = `<span class="step-action-badge badge-cook" style="--badge-color:${cookMeta.color}">${cookMeta.svg}<span>${cookMeta.actionName}</span></span><span class="step-item-name">${this.currentDish.name}</span>`;
      if (currentCut === 1) {
        this.sound.speak(`${cookMeta.actionName}，${this.currentDish.name}`, false);
      }
    } else {
      const pType = step.prepType || 'cut';
      stepLabelEl.innerHTML = `<span class="step-action-badge badge-${pType}">${prepInfo.svg}<span>${prepInfo.tag}</span></span><span class="step-item-name">${step.name}</span>`;
      if (currentCut === 1) {
        this.sound.speak(step.name, false);
      }
    }
  }

  _setupCognitiveChoices() {
    const count = this.settings.cogChoices || 2;
    const pool = RECIPES_DB.filter((r) => r.id !== this.currentDish.id).sort(() => Math.random() - 0.5);
    const distractors = pool.slice(0, count - 1);
    const options = [this.currentDish, ...distractors].sort(() => Math.random() - 0.5);

    const positions = count === 2
      ? ['LEFT', 'RIGHT']
      : count === 3
      ? ['LEFT', 'UP', 'RIGHT']
      : ['UP', 'LEFT', 'RIGHT', 'DOWN'];

    const posLabels = { LEFT: '👈 左側區', RIGHT: '👉 右側區', UP: '👆 上方區', DOWN: '👇 下方區' };

    this.currentTask = {
      type: 'COGNITIVE_CHOICE',
      options: options.map((dish, idx) => ({
        dish,
        pos: positions[idx],
        isCorrect: dish.id === this.currentDish.id,
      })),
    };
    this.cogHoveredId = null;
    this.cogHoverElapsedMs = 0;
    this.cogLastTickMs = performance.now();

    const arena = document.getElementById('cogChoiceArena');
    arena.dataset.count = String(this.currentTask.options.length);
    arena.innerHTML = this.currentTask.options
      .map(
        (opt) => `
      <div class="cog-card pos-${opt.pos}" data-dish-id="${opt.dish.id}" data-pos="${opt.pos}">
        <span class="cog-card-dir">${posLabels[opt.pos]}</span>
        <div class="cog-card-img-wrap">
          <img src="${opt.dish.finishImg}" alt="${opt.dish.name}" />
          <svg class="cog-ring-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="6" />
            <circle class="cog-ring-prog" data-ring-id="${opt.dish.id}" cx="60" cy="60" r="54" fill="none"
              stroke="#4ade80" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="339.29" stroke-dashoffset="339.29" />
          </svg>
        </div>
        <strong class="cog-card-title">${opt.dish.name}</strong>
      </div>
    `
      )
      .join('');

    arena.querySelectorAll('.cog-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (this.state !== 'PLAYING' || this.currentTask?.type !== 'COGNITIVE_CHOICE') return;
        this._evaluateCogSelection(card.dataset.dishId);
      });
    });
  }

  _evaluateCogSelection(selectedDishId) {
    if (this.state !== 'PLAYING') return;
    const cardEl = document.querySelector(`.cog-card[data-dish-id="${selectedDishId}"]`);
    if (selectedDishId === this.currentDish.id) {
      this.stats.steps++;
      this.stats.stirs++;
      this._triggerDishComplete();
    } else {
      this.sound.playWrongBuzz();
      this.sound.speak('再看看下面的四樣材料喔');
      cardEl?.classList.add('wrong-shake');
      setTimeout(() => cardEl?.classList.remove('wrong-shake'), 450);
      this.cogHoveredId = null;
      this.cogHoverElapsedMs = 0;
    }
  }

  _enterColorCalibration(resuming = false) {
    this._colorCalibResuming = resuming;
    this.state = 'CALIBRATING_COLOR';
    this.trail = [];
    this.cursorPos = null;
    document.getElementById('screenGame')?.classList.add('color-calibrating');
    document.getElementById('colorCalibOverlay')?.classList.remove('hidden');

    const target = this.tracker.getColorTarget();
    const swatch = document.getElementById('colorSwatch');
    const prompt = document.getElementById('colorCalibPrompt');
    const startBtn = document.getElementById('btnColorCalibStart');
    if (swatch) swatch.style.background = target ? target.hex : 'rgba(255,255,255,0.18)';
    if (prompt) {
      prompt.textContent = target
        ? '✅ 可直接點畫面換色，或按「開始料理」'
        : '🎨 請直接點一下畫面中的彩色物品或腕帶';
    }
    if (startBtn) startBtn.disabled = !target;
    this.sound.speak('請直接點一下畫面中的彩色物品或腕帶');
  }

  _exitColorCalibration() {
    document.getElementById('screenGame')?.classList.remove('color-calibrating');
    document.getElementById('colorCalibOverlay')?.classList.add('hidden');
  }

  _handlePoint(x, y, nowMs) {
    // 記錄手部游標與光軌座標
    const canvas = document.getElementById('fxCanvas');
    if (canvas) {
      const px = x * canvas.width;
      const py = y * canvas.height;
      this.cursorPos = { x: px, y: py };
      this.trail.push({ x: px, y: py, life: 1.0 });
    }

    if (this.state === 'CALIBRATING') {
      this._updateCalibration(x, y);
      return;
    }
    if (this.state !== 'PLAYING' || !this.currentTask) return;

    // 認知推理模式第 5 步：手部游標懸停感應選料理
    if (this.currentTask.type === 'COGNITIVE_CHOICE') {
      this._updateCognitiveHover(x, y, nowMs);
      return;
    }

    const res = this.judge.updatePoint(x, y, nowMs, this.currentTask);

    if (this.currentTask.type === 'DIRECTION') {
      if (res.status === 'completed') {
        const cuts = this.currentTask.remainingCuts || [];
        const matchedIdx = typeof res.matchedIndex === 'number' ? res.matchedIndex : 0;
        const matchedCut = cuts[matchedIdx] || this.currentTask;

        this.stats.swipes++;
        if (matchedCut?.requiredDirKey) {
          const dk = matchedCut.requiredDirKey;
          this.stats.dirCounts[dk] = (this.stats.dirCounts[dk] || 0) + 1;
        }
        if (cuts.length > 1) {
          this._playFirstCutFX(res.swipeAngleRad, matchedCut.isReverse);
          cuts.splice(matchedIdx, 1);
          this.currentTask.currentCut++;
          this.currentTask.shownKey = cuts[0].shownKey;
          this.currentTask.isReverse = cuts[0].isReverse;
          this.currentTask.requiredDirKey = cuts[0].requiredDirKey;
          const step = this.currentSteps[this.stepIndex];
          this._renderDirectionUI(step, PREP_LABELS[step.prepType] || PREP_LABELS.cut);
        } else {
          this._triggerPrepCompleteAnimation(res.swipeAngleRad, matchedCut.isReverse, this.currentTask.prepType);
        }
      }
    } else if (this.currentTask.type === 'SPOILED') {
      if (res.status === 'spoiled_cut') {
        this.sound.playWrongBuzz();
        this.sound.speak('切到壞食材了，換一顆新鮮的');
        this._showToast('🤢 不小心揮到壞食材了！已為您換上新鮮食材');
        this.currentSteps[this.stepIndex].spoiledCleared = true;
        this._setupStepTask();
        return;
      }
      if (res.remainSec !== undefined) {
        const offset = 339.29 * (1 - res.progress);
        document.getElementById('spoiledRingProg').style.strokeDashoffset = offset.toFixed(1);
        document.getElementById('spoiledTimerText').textContent = `✋ 忍住不動 ${res.remainSec.toFixed(1)}s`;
      }
      if (res.status === 'completed') {
        this.stats.holds++;
        this._triggerSpoiledSweepAnimation();
      }
    } else if (this.currentTask.type === 'STIR') {
      const pct = Math.round(res.progress * 100);
      const cName = this.currentTask.cookMeta?.actionName || '烹飪';
      const stirTxt = document.getElementById('stirPercentText');
      if (stirTxt) stirTxt.textContent = `🔥 ${cName} ${pct}%`;
      const stirProg = document.getElementById('stirRingProg');
      if (stirProg) stirProg.style.strokeDashoffset = (339.29 * (1 - pct / 100)).toFixed(2);

      // 僅在主動翻炒移動時才觸發鍋具震動與手機微震動
      const foodImgBox = document.getElementById('foodImgBox');
      foodImgBox.classList.toggle('stirring', !!res.isMoving);
      if (res.isMoving && nowMs - this.lastVibrateAt > 130) {
        this.lastVibrateAt = nowMs;
        if (navigator.vibrate) navigator.vibrate(14);
      }

      if (res.status === 'completed') {
        foodImgBox.classList.remove('stirring');
        this.stats.stirs++;
        this._triggerStirFinishAnimation(this.currentTask.cookMeta);
      }
    }
  }

  _updateCognitiveHover(normX, normY, nowMs) {
    const dt = this.cogLastTickMs ? Math.min(120, nowMs - this.cogLastTickMs) : 16;
    this.cogLastTickMs = nowMs;

    const stageRect = document.getElementById('playStage').getBoundingClientRect();
    const clientX = stageRect.left + normX * stageRect.width;
    const clientY = stageRect.top + normY * stageRect.height;

    const cards = Array.from(document.querySelectorAll('#cogChoiceArena .cog-card'));
    let hitId = null;

    // 1. 若游標直接落在某張卡片上，優先選中該卡片
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      if (clientX >= r.left - 10 && clientX <= r.right + 10 && clientY >= r.top - 10 && clientY <= r.bottom + 10) {
        hitId = card.dataset.dishId;
        break;
      }
    }

    // 2. 否則依整張畫面分區（上方區 / 左半區 / 右半區）自動對應，整張螢幕都能輕鬆選！
    if (!hitId) {
      let targetPos = 'LEFT';
      const hasUp = cards.some((c) => c.dataset.pos === 'UP');
      const hasDown = cards.some((c) => c.dataset.pos === 'DOWN');
      if (hasUp && !hasDown) {
        // 3 選 1：上方全寬 (y < 0.46) / 下方左右
        if (normY < 0.46) targetPos = 'UP';
        else targetPos = normX >= 0.5 ? 'RIGHT' : 'LEFT';
      } else if (hasUp && hasDown) {
        // 4 選 1：上 / 下 / 左 / 右
        if (normY < 0.36) targetPos = 'UP';
        else if (normY > 0.66) targetPos = 'DOWN';
        else targetPos = normX >= 0.5 ? 'RIGHT' : 'LEFT';
      } else {
        // 2 選 1：左半 / 右半
        targetPos = normX >= 0.5 ? 'RIGHT' : 'LEFT';
      }
      const matched = cards.find((c) => c.dataset.pos === targetPos);
      if (matched) hitId = matched.dataset.dishId;
    }

    if (this.cogReadyAtMs && performance.now() < this.cogReadyAtMs) {
      this.cogHoveredId = null;
      this.cogHoverElapsedMs = 0;
      return;
    }
    const hintSubEl = document.getElementById('promptTargetText');
    if (hintSubEl && hintSubEl.textContent.includes('想一下')) {
      hintSubEl.textContent = '把手移到任一分區停留 2 秒作答（或直接點選）';
    }
    const DWELL_MS = 2000;
    if (hitId && hitId === this.cogHoveredId) {
      this.cogHoverElapsedMs += dt;
    } else {
      this.cogHoveredId = hitId;
      this.cogHoverElapsedMs = hitId ? dt : 0;
    }

    const remainSec = Math.max(0, (DWELL_MS - this.cogHoverElapsedMs) / 1000).toFixed(1);
    cards.forEach((card) => {
      const active = card.dataset.dishId === this.cogHoveredId;
      card.classList.toggle('hovering', active);
      const dirEl = card.querySelector('.cog-card-dir');
      if (dirEl) {
        const baseLabel = card.dataset.pos === 'LEFT' ? '👈 左側區' : card.dataset.pos === 'RIGHT' ? '👉 右側區' : '👆 上方區';
        dirEl.textContent = active ? `⏳ ${remainSec}s` : baseLabel;
      }
    });

    document.querySelectorAll('#cogChoiceArena .cog-ring-prog').forEach((circle) => {
      const id = circle.dataset.ringId;
      const prog = id === this.cogHoveredId ? Math.min(1, this.cogHoverElapsedMs / DWELL_MS) : 0;
      circle.style.strokeDashoffset = (339.29 * (1 - prog)).toFixed(1);
    });

    if (this.cogHoveredId && this.cogHoverElapsedMs >= DWELL_MS) {
      const chosen = this.cogHoveredId;
      this.cogHoveredId = null;
      this.cogHoverElapsedMs = 0;
      this._evaluateCogSelection(chosen);
    }
  }

  _handleLost() {
    this.judge.onTrackingLost();
    document.getElementById('foodImgBox')?.classList.remove('stirring');
  }

  _playFirstCutFX(angleRad = -0.7, isReverse = false) {
    const wrap = document.getElementById('foodHeroWrap');
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    this.sound.playPrepSound('cut', isReverse);
    this.slashes.push({
      cx, cy,
      angle: angleRad ?? -0.7,
      len: Math.max(rect.width * 1.35, 260),
      life: 1.0,
      color: isReverse ? '#38bdf8' : '#f59e0b',
      core: '#ffffff',
    });
    this.callouts.push({ x: cx, y: cy - rect.height * 0.42, text: '⚔️ 第一刀命中！再揮第二刀！', color: '#fde68a', life: 0.95 });
  }

  // 四大烹飪手感動畫（切菜切半 / 撒粉淋醬 / 倒料下鍋 / 翻面夾取）
  _triggerPrepCompleteAnimation(angleRad = -0.78, isReverse = false, prepType = 'cut') {
    if (this.state !== 'PLAYING') return;
    const curStep = this.currentSteps[this.stepIndex];
    if (curStep?.isFinish) {
      this._dismissGuide();
      this._triggerStirFinishAnimation(this.currentTask?.cookMeta || this.getCookMeta(this.currentDish));
      return;
    }
    this._dismissGuide();
    this.state = 'ANIMATING';

    const wrap = document.getElementById('foodHeroWrap');
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const prepMeta = PREP_LABELS[prepType] || PREP_LABELS.cut;

    this.sound.playPrepSound(prepType, isReverse);

    // 1. 若為切菜刀法才畫銳利斬擊光刃，其他則畫溫潤弧光
    if (prepType === 'cut') {
      this.slashes.push({
        cx, cy,
        angle: angleRad ?? -0.78,
        len: Math.max(rect.width * 1.45, 300),
        life: 1.0,
        color: isReverse ? '#38bdf8' : '#f59e0b',
        core: '#ffffff',
      });
    }

    this.rings.push({
      x: cx, y: cy, r: 24, maxR: rect.width * 0.92,
      life: 1.0,
      color: isReverse ? '#38bdf8' : '#fbbf24',
    });
    this.callouts.push({
      x: cx, y: cy - rect.height * 0.45,
      text: prepMeta.callout,
      color: isReverse ? '#e0f2fe' : '#fde68a',
      life: 1.0,
    });

    // 2. 依烹飪分類產生專屬粒子
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 9.5;
      this.sparks.push({
        x: cx + (Math.random() - 0.5) * 36,
        y: cy + (Math.random() - 0.5) * 36,
        vx: prepType === 'sprinkle' ? (Math.random() - 0.5) * 5 : Math.cos(a) * spd,
        vy: prepType === 'sprinkle' ? 2 + Math.random() * 6 : Math.sin(a) * spd - 2,
        size: 2.5 + Math.random() * 4.5,
        life: 1.0,
        decay: 0.022 + Math.random() * 0.02,
        color: prepType === 'pour'
          ? (i % 2 === 0 ? '#7dd3fc' : '#fffbeb')
          : (isReverse ? '#38bdf8' : (i % 2 === 0 ? '#fbbf24' : '#f97316')),
      });
    }

    if (prepType === 'pour') {
      for (let i = 0; i < 10; i++) {
        this.steams.push({
          x: cx + (Math.random() - 0.5) * rect.width * 0.45,
          y: cy + 12,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -2.6 - Math.random() * 2.2,
          r: 12 + Math.random() * 14,
          life: 1.0,
        });
      }
    }
    wrap.classList.add(prepMeta.anim);

    // 3. 飛入底部對應收集格
    const step = this.currentSteps[this.stepIndex];
    const slotEl = document.querySelector(`#ingredientSlots [data-slot-index="${this.stepIndex}"]`);
    if (slotEl && !step.isFinish) {
      const sRect = slotEl.getBoundingClientRect();
      const fly = document.createElement('img');
      fly.src = step.imgSrc;
      fly.className = 'fly-token';
      fly.style.left = `${cx}px`;
      fly.style.top = `${cy}px`;
      document.body.appendChild(fly);
      requestAnimationFrame(() => {
        fly.style.left = `${sRect.left + sRect.width / 2}px`;
        fly.style.top = `${sRect.top + sRect.height / 2}px`;
        fly.style.transform = 'translate(-50%, -50%) scale(0.42)';
        fly.style.opacity = '0.2';
      });
      setTimeout(() => fly.remove(), 480);
    }

    setTimeout(() => {
      wrap.classList.remove(prepMeta.anim);
      step.collected = true;
      this.stats.steps++;
      this.stepIndex++;
      this.state = 'PLAYING';
      if (this.stepIndex < 5) {
        this._setupStepTask();
      } else {
        this._triggerDishComplete();
      }
    }, 500);
  }

  _triggerSpoiledSweepAnimation() {
    if (this.state !== 'PLAYING') return;
    this.state = 'ANIMATING';
    this.sound.playSpoiledSweep();

    const wrap = document.getElementById('foodHeroWrap');
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    this.callouts.push({
      x: cx, y: cy - rect.height * 0.42,
      text: '🧹 成功忍住！掃進垃圾桶！',
      color: '#86efac',
      life: 1.05,
    });
    wrap.classList.add('anim-sweep');

    setTimeout(() => {
      wrap.classList.remove('anim-sweep', 'is-spoiled');
      this.currentSteps[this.stepIndex].spoiledCleared = true;
      this.state = 'PLAYING';
      this._setupStepTask();
    }, 480);
  }

  _triggerStirFinishAnimation(cookMeta = null) {
    if (this.state !== 'PLAYING') return;
    this.state = 'ANIMATING';
    const meta = cookMeta || this.getCookMeta(this.currentDish);
    const tKey = meta.typeKey || 'teppan';
    const animClass = meta.cookAnim || 'anim-stir-done';

    const wrap = document.getElementById('foodHeroWrap');
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    this.sound.playCookSound(tKey);
    this.rings.push({ x: cx, y: cy, r: 28, maxR: rect.width * 1.08, life: 1.0, color: meta.color || '#f97316' });
    this.callouts.push({ x: cx, y: cy - rect.height * 0.46, text: `${meta.icon} ${meta.actionName}出餐！`, color: '#fde68a', life: 1.1 });

    const pColorA = meta.color || '#fbbf24';
    const pColorB = tKey === 'shake' ? '#e0f2fe' : (tKey === 'mix' ? '#fbcfe8' : '#fef08a');
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      this.sparks.push({
        x: cx + (Math.random() - 0.5) * rect.width * 0.65,
        y: cy + (tKey === 'fry' || tKey === 'boil' ? rect.height * 0.12 : 0),
        vx: tKey === 'shake' ? Math.cos(a) * spd : (Math.random() - 0.5) * 5.5,
        vy: tKey === 'shake' ? Math.sin(a) * spd : (-4.5 - Math.random() * 7.5),
        size: 3 + Math.random() * 5,
        life: 1.0,
        decay: 0.022,
        color: i % 2 === 0 ? pColorA : pColorB,
      });
    }
    if (tKey !== 'shake' && tKey !== 'mix') {
      for (let i = 0; i < 12; i++) {
        this.steams.push({
          x: cx + (Math.random() - 0.5) * rect.width * 0.55,
          y: cy + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -2.4 - Math.random() * 2.4,
          r: 14 + Math.random() * 20,
          life: 1.0,
        });
      }
    }

    wrap.classList.add(animClass);
    setTimeout(() => {
      wrap.classList.remove(animClass);
      this.stats.steps++;
      this._triggerDishComplete();
    }, 580);
  }

  _triggerDishComplete() {
    this.state = 'CELEBRATING';
    this.sound.playDishComplete();
    this.sound.speak(`${this.currentDish.name}完成`);

    this.stats.dishes++;
    this.stats.coins += 100;
    this.stats.completedList.push(this.currentDish);
    this._updateTargetHUD();

    // 寫入 50 道夜市美食收集圖鑑
    this.unlockedSet.add(this.currentDish.id);
    this._saveCollection();

    document.getElementById('hudCompletedCount').textContent = String(this.stats.dishes);
    const coinBadge = document.getElementById('hudCoinBadge');
    if (this.settings.gameMode === 'endless') {
      coinBadge.textContent = `｜💰 ${this.stats.coins} 銅板`;
    }

    const pill = document.createElement('div');
    pill.className = 'thumb-pill';
    pill.innerHTML = `<img src="${this.currentDish.finishImg}" alt="${this.currentDish.name}" /><span>${this.currentDish.name}</span>`;
    document.getElementById('completedThumbs').appendChild(pill);

    const overlay = document.getElementById('celebrateOverlay');
    const celImg = document.getElementById('celebrateDishImg');
    celImg.src = this.currentDish.finishImg;
    celImg.alt = this.currentDish.name;
    document.getElementById('celebrateDishTitle').textContent = this.currentDish.name;
    document.getElementById('celebrateDishDesc').textContent = this.currentDish.finishText || '';
    document.getElementById('celebrateBurstText').textContent =
      this.settings.gameMode === 'endless' ? `🎉 出餐成功！+100 銅板 🎉` : '🎉 香氣出餐！ 🎉';
    overlay.classList.remove('hidden');

    this.celebrateTimer = setTimeout(async () => {
      overlay.classList.add('hidden');
      if (this.settings.gameMode === 'dishes' && this.stats.dishes >= this.settings.targetDishes) {
        this.finishGame();
      } else if (this.settings.gameMode === 'timed' && this.remainSec <= 0) {
        this.finishGame();
      } else {
        this.state = 'PLAYING';
        await this._startNextDish();
      }
    }, 1150);
  }

  quitToMenu() {
    this.sound.stopBgm();
    clearTimeout(this.celebrateTimer);
    clearInterval(this.timerInterval);
    this.tracker.stop();
    this.state = 'MENU';
    this._switchScreen('screenStart');
  }

  finishGame() {
    this.sound.stopBgm();
    this.state = 'GAMEOVER';
    clearTimeout(this.celebrateTimer);
    clearInterval(this.timerInterval);
    this.tracker.stop();

    const activeSec = Math.round((this.stats.activeMs || 0) / 1000);

    document.getElementById('resDishes').textContent = `${this.stats.dishes} 道`;
    document.getElementById('resSteps').textContent = `${this.stats.steps} 步`;
    document.getElementById('resSwipes').textContent = `${this.stats.swipes} 次`;
    document.getElementById('resHolds').textContent = `${this.stats.holds} 次`;
    document.getElementById('resStirs').textContent = `${this.stats.stirs} 次`;
    document.getElementById('resTime').textContent = `${activeSec} 秒`;

    const dropsEl = document.getElementById('resDrops');
    if (dropsEl) dropsEl.textContent = `${this.stats.drops || 0} 次`;

    const dirEl = document.getElementById('resDirBreakdown');
    if (dirEl) {
      const entries = Object.entries(this.stats.dirCounts || {});
      dirEl.innerHTML = entries.length > 0
        ? entries.map(([k, cnt]) => {
            const g = DIR_VECTORS[k]?.glyph || k;
            return `<span class="res-dir-chip">${g} ${cnt} 次</span>`;
          }).join('')
        : '<span class="res-dir-chip">本局無方向揮動紀錄</span>';
    }

    const rankBanner = document.getElementById('resStallRankBanner');
    if (this.settings.gameMode === 'endless') {
      rankBanner.classList.remove('hidden');
      rankBanner.textContent = `🏮 無盡營業結算：獲得稱號【${this._getEndlessRankTitle(this.stats.dishes)}】｜累積營業額 ${this.stats.coins} 銅板`;
    } else {
      rankBanner.classList.add('hidden');
    }

    const incBox = document.getElementById('resIncompleteBox');
    if (this.stepIndex > 0 && this.stepIndex < 5 && this.currentDish) {
      incBox.classList.remove('hidden');
      incBox.textContent = `📌 結束時正在製作：${this.currentDish.name}（已完成 ${this.stepIndex} / 5 步，已計入步驟紀錄）`;
    } else {
      incBox.classList.add('hidden');
    }

    const grid = document.getElementById('resDishGrid');
    grid.innerHTML =
      this.stats.completedList.length > 0
        ? this.stats.completedList
            .map(
              (d) => `
          <div class="res-dish-item">
            <img src="${d.finishImg}" alt="${d.name}" loading="lazy" />
            <strong>${d.name}</strong>
          </div>`
            )
            .join('')
        : '<p class="empty-msg">本局尚未完成出餐，下次再接再厲！</p>';

    this._switchScreen('screenResult');
  }

  _openGalleryModal(category = 'ALL') {
    const modal = document.getElementById('modalGallery');
    const grid = document.getElementById('galleryGrid');
    const countLabel = document.getElementById('galleryUnlockCount');
    countLabel.textContent = `已收集 ${this.unlockedSet.size} / ${RECIPES_DB.length} 道台灣夜市美食`;

    const list = category === 'ALL' ? RECIPES_DB : RECIPES_DB.filter((r) => r.category === category);
    grid.innerHTML = list
      .map((dish) => {
        const unlocked = this.unlockedSet.has(dish.id);
        const ingNames = dish.ingredientIds.map((id) => INGREDIENTS_DB[id]?.name || '').join('、');
        return `
        <div class="gallery-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="img-wrap">
            <img src="${dish.finishImg}" alt="${dish.name}" loading="lazy" />
            ${unlocked ? '<span class="stamp">已收集</span>' : '<span class="lock-tag">尚未解鎖</span>'}
          </div>
          <strong>${dish.name}</strong>
          <small>${unlocked ? ingNames : dish.category}</small>
        </div>`;
      })
      .join('');

    modal.classList.remove('hidden');
  }

  _switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _resizeCanvases() {
    const stage = document.getElementById('playStage');
    const bgCanvas = document.getElementById('bgSimCanvas');
    const fxCanvas = document.getElementById('fxCanvas');
    if (!stage || !bgCanvas || !fxCanvas) return;
    const w = Math.max(320, stage.clientWidth || window.innerWidth);
    const h = Math.max(240, stage.clientHeight || window.innerHeight);
    bgCanvas.width = Math.floor(w * 0.5);
    bgCanvas.height = Math.floor(h * 0.5);
    fxCanvas.width = w;
    fxCanvas.height = h;
  }

  _startRenderLoop() {
    let lastTs = performance.now();
    const tick = (ts) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (this.state === 'PLAYING' && this.stats) {
        this.stats.activeMs += dt * 1000;
      }
      if (this.state === 'PLAYING' || this.state === 'ANIMATING' || this.state === 'CELEBRATING' || this.state === 'CALIBRATING_COLOR') {
        this._renderSimBackground(ts);
        this._renderFXCanvas(dt);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _renderSimBackground(t) {
    if (this.settings.inputMode === 'camera' || this.settings.inputMode === 'color') return;
    const canvas = document.getElementById('bgSimCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#240d0e');
    grad.addColorStop(0.5, '#311612');
    grad.addColorStop(1, '#190b0c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const bokehs = [
      { x: 0.16, y: 0.18, r: 48, c: 'rgba(239, 68, 68, 0.26)' },
      { x: 0.84, y: 0.16, r: 52, c: 'rgba(245, 158, 11, 0.22)' },
      { x: 0.78, y: 0.64, r: 56, c: 'rgba(234, 88, 12, 0.18)' },
      { x: 0.2, y: 0.7, r: 44, c: 'rgba(251, 191, 36, 0.18)' },
    ];
    bokehs.forEach((b, i) => {
      const bx = b.x * w + Math.sin(t * 0.0008 + i) * 10;
      const by = b.y * h + Math.cos(t * 0.0007 + i) * 8;
      const rg = ctx.createRadialGradient(bx, by, 2, bx, by, b.r);
      rg.addColorStop(0, b.c);
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const sway = Math.sin(t * 0.0014) * 6;
    const cx = w * 0.5 + sway;
    const cy = h * 0.58;
    ctx.save();
    ctx.fillStyle = 'rgba(14, 6, 6, 0.44)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.24, w * 0.095, h * 0.095, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.12, w * 0.26, h * 0.34, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(cx + w * 0.26, h);
    ctx.lineTo(cx - w * 0.26, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _renderFXCanvas(dt) {
    const canvas = document.getElementById('fxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isRev = !!this.currentTask?.isReverse;

    // 1. 手部發光光軌
    if (this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const p0 = this.trail[i - 1];
        const p1 = this.trail[i];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, p1.life * 14);
        ctx.strokeStyle = isRev ? `rgba(56, 189, 248, ${p1.life * 0.85})` : `rgba(251, 191, 36, ${p1.life * 0.85})`;
        ctx.shadowColor = isRev ? '#38bdf8' : '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      }
    }
    this.trail.forEach((pt) => { pt.life -= dt * 3.4; });
    this.trail = this.trail.filter((pt) => pt.life > 0);

    if (this.trail.length > 0) {
      const head = this.trail[this.trail.length - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = isRev ? '#38bdf8' : '#fbbf24';
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.restore();
    }

    // 2. 衝擊波環
    this.rings.forEach((r) => {
      r.r += (r.maxR - r.r) * 0.22;
      r.life -= dt * 2.8;
      if (r.life > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.life * 0.8;
        ctx.lineWidth = 6 * r.life;
        ctx.stroke();
        ctx.restore();
      }
    });
    this.rings = this.rings.filter((r) => r.life > 0);

    // 3. 銳利斬擊光刃
    this.slashes.forEach((s) => {
      s.life -= dt * 3.0;
      if (s.life > 0) {
        const half = s.len / 2;
        const x1 = s.cx - Math.cos(s.angle) * half;
        const y1 = s.cy - Math.sin(s.angle) * half;
        const x2 = s.cx + Math.cos(s.angle) * half;
        const y2 = s.cy + Math.sin(s.angle) * half;

        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 28;
        ctx.lineWidth = 22 * s.life;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = s.core;
        ctx.lineWidth = 7 * s.life;
        ctx.stroke();
        ctx.restore();
      }
    });
    this.slashes = this.slashes.filter((s) => s.life > 0);

    // 4. 烹飪火花與粉塵／水滴粒子
    this.sparks.forEach((sp) => {
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.22;
      sp.life -= sp.decay;
      if (sp.life > 0) {
        ctx.save();
        ctx.globalAlpha = sp.life;
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    this.sparks = this.sparks.filter((sp) => sp.life > 0);

    // 5. 香氣蒸氣與浮動文字
    this.steams.forEach((st) => {
      st.x += st.vx;
      st.y += st.vy;
      st.r += 0.45;
      st.life -= dt * 1.4;
      if (st.life > 0) {
        ctx.save();
        ctx.globalAlpha = st.life * 0.32;
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    this.steams = this.steams.filter((st) => st.life > 0);

    this.callouts.forEach((c) => {
      c.y -= dt * 36;
      c.life -= dt * 1.25;
      if (c.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life * 1.3);
        ctx.font = "900 22px 'Noto Sans TC', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = c.color;
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 10;
        ctx.fillText(c.text, c.x, c.y);
        ctx.restore();
      }
    });
    this.callouts = this.callouts.filter((c) => c.life > 0);
  }

  _initCalibrationModal() {
    this.calibSwipes = [];
    this.calibStartPt = null;

    document.getElementById('btnOpenCalibrate').addEventListener('click', async () => {
      document.getElementById('modalCalibrate').classList.remove('hidden');
      this.calibSwipes = [];
      this.calibStartPt = null;
      document.getElementById('calibCount').textContent = '0 / 3';
      this.state = 'CALIBRATING';
      try {
        await this.tracker.start(this.settings.inputMode, {
          mirrored: this.settings.mirrored,
          lowPerf: this.settings.lowPerf,
        });
      } catch {
        await this.tracker.start('touch');
      }
    });

    document.getElementById('btnResetCalib').addEventListener('click', () => {
      this.calibSwipes = [];
      this.calibStartPt = null;
      document.getElementById('calibCount').textContent = '0 / 3';
    });

    document.getElementById('btnCloseCalib').addEventListener('click', () => {
      document.getElementById('modalCalibrate').classList.add('hidden');
      this.tracker.stop();
      this.state = 'MENU';
    });
  }

  _updateCalibration(x, y) {
    if (!this.calibStartPt) {
      this.calibStartPt = { x, y };
      return;
    }
    const d = Math.hypot(x - this.calibStartPt.x, y - this.calibStartPt.y);
    if (d >= 0.12 && this.calibSwipes.length < 3) {
      this.calibSwipes.push(d);
      this.calibStartPt = { x, y };
      document.getElementById('calibCount').textContent = `${this.calibSwipes.length} / 3`;
      this.sound.playPrepSound('cut', false);

      const avg = this.calibSwipes.reduce((a, b) => a + b, 0) / this.calibSwipes.length;
      const recommended = Math.min(40, Math.max(8, Math.round(avg * 0.85 * 100)));
      document.getElementById('calibResultVal').textContent = `${recommended}%`;
      this.settings.distThreshold = recommended / 100;
      document.getElementById('rngDistThreshold').value = recommended;
      document.getElementById('lblDistThreshold').textContent = `${recommended}%`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__nightMarketGame = new NightMarketGame();
});
