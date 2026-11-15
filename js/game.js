import { DIR_VECTORS, GestureJudge } from './gesture.js';
import { InputTracker } from './tracker.js';
import { INGREDIENTS_DB, RECIPES_DB, validateRecipeDatabase } from './recipes.js';
import { AssetManager } from './preloader.js';

const STORAGE_KEY_COLLECTION = 'tw_night_market_chef_unlocked_v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.voiceEnabled = true;
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

  playTone(freq = 520, dur = 0.12, type = 'triangle') {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch {}
  }

  playSliceSuccess() {
    this.playTone(587.33, 0.1, 'sine');
    setTimeout(() => this.playTone(880, 0.15, 'triangle'), 65);
  }

  playDishComplete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.18, 'triangle'), idx * 85);
    });
  }

  speak(text) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-TW';
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
    } catch {}
  }
}

class NightMarketGame {
  constructor() {
    this.dbMeta = validateRecipeDatabase();
    this.judge = new GestureJudge();
    this.sound = new SoundEngine();
    this.assets = new AssetManager();

    this.settings = {
      inputMode: 'camera',
      gameMode: 'dishes',
      targetDishes: 3,
      timeLimitSec: 60,
      dirCount: 4,
      dirRule: 'normal',
      angleTol: 45,
      enableHold: false,
      enableStir: false,
      stirMult: 5,
      specialProb: 0.25,
      distThreshold: 0.18,
      mirrored: true,
      sound: true,
      voice: true,
      lowPerf: false,
    };

    this.state = 'MENU'; // MENU | PLAYING | CELEBRATING | PAUSED | GAMEOVER | CALIBRATING
    this.stats = this._emptyStats();
    this.recipeQueue = [];
    this.currentDish = null;
    this.nextDish = null;
    this.currentSteps = [];
    this.stepIndex = 0;
    this.currentTask = null;
    this.consecutiveSpecials = 0;

    this.timerInterval = null;
    this.remainSec = 0;
    this.startTimeMs = 0;
    this.pausedElapsedMs = 0;
    this.pauseStartedAt = 0;
    this.celebrateTimer = null;

    this.unlockedSet = this._loadCollection();

    this._initDOM();
    this.tracker = new InputTracker(
      document.getElementById('webcamVideo'),
      document.getElementById('camOverlayCanvas'),
      document.getElementById('playStage'),
      {
        onPoint: (x, y, t, nearEdge) => this._handlePoint(x, y, t, nearEdge),
        onLost: () => this._handleLost(),
        onAutoDowngrade: () => {
          this.settings.lowPerf = true;
          this._syncPerfButtonUI();
          this._showToast('偵測到裝置較忙碌，已自動切換為「省電順暢模式」');
        },
      }
    );

    this._updateCollectionBadge();
  }

  _emptyStats() {
    return { dishes: 0, steps: 0, swipes: 0, holds: 0, stirs: 0, completedList: [] };
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
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
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
            document.getElementById('groupDishTarget').classList.toggle('hidden', this.settings.gameMode !== 'dishes');
            document.getElementById('groupTimeLimit').classList.toggle('hidden', this.settings.gameMode !== 'timed');
          }
        });
      });
    };

    bindSeg('ctrlInputMode', 'inputMode');
    bindSeg('ctrlGameMode', 'gameMode');
    bindSeg('ctrlDishCount', 'targetDishes', true);
    bindSeg('ctrlTimeSec', 'timeLimitSec', true);
    bindSeg('ctrlDirCount', 'dirCount', true);
    bindSeg('ctrlDirRule', 'dirRule');
    bindSeg('ctrlAngleTol', 'angleTol', true);
    bindSeg('ctrlStirMult', 'stirMult', true);

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this._applyPreset(btn.dataset.preset);
      });
    });

    const rng = document.getElementById('rngDistThreshold');
    rng.addEventListener('input', () => {
      document.getElementById('lblDistThreshold').textContent = `${rng.value}%`;
      this.settings.distThreshold = Number(rng.value) / 100;
    });

    document.getElementById('chkEnableHold').addEventListener('change', (e) => (this.settings.enableHold = e.target.checked));
    document.getElementById('chkEnableStir').addEventListener('change', (e) => (this.settings.enableStir = e.target.checked));
    document.getElementById('chkMirror').addEventListener('change', (e) => (this.settings.mirrored = e.target.checked));
    document.getElementById('chkSound').addEventListener('change', (e) => {
      this.settings.sound = e.target.checked;
      this.sound.soundEnabled = e.target.checked;
    });
    document.getElementById('chkVoice').addEventListener('change', (e) => {
      this.settings.voice = e.target.checked;
      this.sound.voiceEnabled = e.target.checked;
    });

    document.getElementById('btnQuickStart').addEventListener('click', () => {
      this._applyPreset('easy');
      this.startGame();
    });
    document.getElementById('btnStartCustom').addEventListener('click', () => this.startGame());
    document.getElementById('btnPauseGame').addEventListener('click', () => this.pauseGame());
    document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btnRestart').addEventListener('click', () => {
      document.getElementById('modalPause').classList.add('hidden');
      this.startGame();
    });
    document.getElementById('btnQuitToMenu').addEventListener('click', () => {
      document.getElementById('modalPause').classList.add('hidden');
      this.quitToMenu();
    });
    document.getElementById('btnPlayAgain').addEventListener('click', () => this.startGame());
    document.getElementById('btnBackSettings').addEventListener('click', () => this.quitToMenu());

    document.getElementById('btnTogglePerf').addEventListener('click', () => {
      this.settings.lowPerf = !this.settings.lowPerf;
      this.tracker.setLowPerf(this.settings.lowPerf);
      this._syncPerfButtonUI();
    });

    // 全螢幕切換
    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // 30 道夜市美食收集圖鑑彈窗
    document.getElementById('btnOpenGallery').addEventListener('click', () => this._openGalleryModal('ALL'));
    document.getElementById('btnCloseGallery').addEventListener('click', () => {
      document.getElementById('modalGallery').classList.add('hidden');
    });
    document.querySelectorAll('.gallery-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.gallery-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this._openGalleryModal(tab.dataset.cat);
      });
    });

    this._initCalibrationModal();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') {
        this.pauseGame();
      }
    });
  }

  _syncPerfButtonUI() {
    const btn = document.getElementById('btnTogglePerf');
    btn.textContent = this.settings.lowPerf ? '🔋 省電順暢' : '⚡ 一般效能';
    document.body.classList.toggle('low-perf', this.settings.lowPerf);
  }

  _applyPreset(preset) {
    if (preset === 'easy') {
      this.settings.dirCount = 4;
      this.settings.dirRule = 'normal';
      this.settings.enableHold = false;
      this.settings.enableStir = false;
      this.settings.distThreshold = 0.15;
    } else if (preset === 'brain') {
      this.settings.dirCount = 4;
      this.settings.dirRule = 'mixed';
      this.settings.enableHold = true;
      this.settings.enableStir = false;
      this.settings.distThreshold = 0.18;
    } else if (preset === 'master') {
      this.settings.dirCount = 8;
      this.settings.dirRule = 'mixed';
      this.settings.enableHold = true;
      this.settings.enableStir = true;
      this.settings.distThreshold = 0.20;
    }

    const syncSeg = (id, val) => {
      const c = document.getElementById(id);
      if (!c) return;
      c.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.val === String(val)));
    };
    syncSeg('ctrlDirCount', this.settings.dirCount);
    syncSeg('ctrlDirRule', this.settings.dirRule);

    document.getElementById('chkEnableHold').checked = this.settings.enableHold;
    document.getElementById('chkEnableStir').checked = this.settings.enableStir;
    const pct = Math.round(this.settings.distThreshold * 100);
    document.getElementById('rngDistThreshold').value = pct;
    document.getElementById('lblDistThreshold').textContent = `${pct}%`;
  }

  _drawRecipeFromDeck() {
    if (this.recipeQueue.length === 0) {
      this.recipeQueue = [...RECIPES_DB].sort(() => Math.random() - 0.5);
      if (this.currentDish && this.recipeQueue[this.recipeQueue.length - 1].id === this.currentDish.id) {
        const last = this.recipeQueue.pop();
        this.recipeQueue.unshift(last);
      }
    }
    return this.recipeQueue.pop();
  }

  async startGame() {
    this.sound.unlock();
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
    this.consecutiveSpecials = 0;

    this.startTimeMs = performance.now();
    this.pausedElapsedMs = 0;
    this.remainSec = this.settings.timeLimitSec;

    this._switchScreen('screenGame');
    document.getElementById('completedThumbs').innerHTML = '';
    document.getElementById('hudCompletedCount').textContent = '0';
    document.getElementById('celebrateOverlay').classList.add('hidden');

    const camBox = document.getElementById('camPreviewBox');
    camBox.classList.toggle('hidden', this.settings.inputMode !== 'camera');
    camBox.classList.toggle('mirrored', this.settings.mirrored);

    try {
      await this.tracker.start(this.settings.inputMode, {
        mirrored: this.settings.mirrored,
        lowPerf: this.settings.lowPerf,
      });
    } catch {
      this._showToast('無法開啟攝影機，已自動切換為「觸控／滑鼠模式」');
      this.settings.inputMode = 'touch';
      camBox.classList.add('hidden');
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
      if (this.state !== 'PLAYING') return;
      if (this.settings.gameMode === 'timed') {
        this.remainSec--;
        this._updateTargetHUD();
        if (this.remainSec <= 0) {
          this.finishGame();
        }
      }
    }, 1000);
  }

  _updateTargetHUD() {
    const lbl = document.getElementById('hudTargetLabel');
    const val = document.getElementById('hudTargetVal');
    if (this.settings.gameMode === 'dishes') {
      lbl.textContent = '剩餘料理';
      val.textContent = `${Math.max(0, this.settings.targetDishes - this.stats.dishes)} 道`;
    } else {
      lbl.textContent = '剩餘時間';
      val.textContent = `${Math.max(0, this.remainSec)} 秒`;
    }
  }

  async _startNextDish() {
    this.currentDish = this.nextDish || this._drawRecipeFromDeck();
    this.nextDish = this._drawRecipeFromDeck();

    // 先等待當前料理圖片就緒（通常數毫秒），並背景預載下一道料理
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
        imgSrc: ing.img,
      })),
      {
        isFinish: true,
        id: this.currentDish.id,
        name: '完成料理',
        imgSrc: this.currentDish.finishImg,
      },
    ];
    this.stepIndex = 0;

    document.getElementById('hudCategoryTag').textContent = this.currentDish.category;
    document.getElementById('hudDishName').textContent = this.currentDish.name;
    this._renderIngredientSlots();
    this._setupStepTask();
  }

  _renderIngredientSlots() {
    const container = document.getElementById('ingredientSlots');
    container.innerHTML = this.currentSteps
      .map(
        (step, idx) => `
      <div class="ing-slot ${idx < this.stepIndex ? 'done' : idx === this.stepIndex ? 'current' : ''}">
        <img class="slot-thumb" src="${step.imgSrc}" alt="${step.name}" loading="eager" />
        <span class="slot-name">${idx === 4 ? '5.完成出餐' : `${idx + 1}.${step.name}`}</span>
      </div>
    `
      )
      .join('');
  }

  _setupStepTask() {
    const step = this.currentSteps[this.stepIndex];
    document.getElementById('hudStepProgress').textContent = `${this.stepIndex + 1} / 5`;
    this._renderIngredientSlots();
    this.judge.resetState();

    // 更新目前步驟的食材／成品視覺卡片
    const stepImgEl = document.getElementById('currentStepImg');
    const stepLabelEl = document.getElementById('currentStepLabel');
    stepImgEl.src = step.imgSrc;
    stepImgEl.alt = step.name;
    stepLabelEl.textContent = step.isFinish ? `第 5 步：完成【${this.currentDish.name}】` : `收集食材：${step.name}`;

    // 決定本題類型（一般方向 / 等待 3 秒 / 自由翻炒）
    let taskType = 'DIRECTION';
    const specialPool = [];
    if (this.settings.enableHold) specialPool.push('HOLD');
    if (this.settings.enableStir) specialPool.push('STIR');

    if (specialPool.length > 0 && this.consecutiveSpecials < 2 && Math.random() < this.settings.specialProb) {
      taskType = specialPool[Math.floor(Math.random() * specialPool.length)];
      this.consecutiveSpecials++;
    } else {
      this.consecutiveSpecials = 0;
    }

    document.getElementById('viewDirection').classList.toggle('active', taskType === 'DIRECTION');
    document.getElementById('viewHold').classList.toggle('active', taskType === 'HOLD');
    document.getElementById('viewStir').classList.toggle('active', taskType === 'STIR');

    const banner = document.getElementById('promptBanner');
    const ruleTag = document.getElementById('promptRuleTag');
    const targetText = document.getElementById('promptTargetText');
    targetText.textContent = step.isFinish ? this.currentDish.finishText : `加入「${step.name}」`;

    if (taskType === 'DIRECTION') {
      const dirKeys =
        this.settings.dirCount === 4
          ? ['UP', 'DOWN', 'LEFT', 'RIGHT']
          : ['UP', 'UR', 'RIGHT', 'DR', 'DOWN', 'DL', 'LEFT', 'UL'];
      const shownKey = dirKeys[Math.floor(Math.random() * dirKeys.length)];

      let isReverse = false;
      if (this.settings.dirRule === 'reverse') isReverse = true;
      else if (this.settings.dirRule === 'mixed') isReverse = Math.random() < 0.5;

      const requiredDirKey = isReverse ? DIR_VECTORS[shownKey].opposite : shownKey;
      this.currentTask = { type: 'DIRECTION', shownKey, requiredDirKey, isReverse };

      const arrowCircle = document.getElementById('arrowContainer');
      arrowCircle.classList.toggle('rule-reverse', isReverse);
      document.getElementById('arrowGlyph').textContent = DIR_VECTORS[shownKey].glyph;
      document.getElementById('dirSwipeFill').style.width = '0%';

      banner.className = `prompt-banner ${isReverse ? 'rule-reverse' : 'rule-normal'}`;
      ruleTag.textContent = isReverse ? '🔄 反方向揮動' : '➡️ 照箭頭揮動';
    } else if (taskType === 'HOLD') {
      this.currentTask = { type: 'HOLD' };
      banner.className = 'prompt-banner rule-special';
      ruleTag.textContent = '✋ 等一下！穩定維持 3 秒';
      document.getElementById('holdRemainSec').textContent = '3.0';
      document.getElementById('holdProgressFill').style.width = '0%';
      this.sound.speak('等一下，手部維持穩定');
    } else if (taskType === 'STIR') {
      this.currentTask = { type: 'STIR' };
      banner.className = 'prompt-banner rule-special';
      ruleTag.textContent = '🍳 自由翻炒（任意方向移動）';
      document.getElementById('stirPercentText').textContent = '0%';
      document.getElementById('stirProgressFill').style.width = '0%';
      this.sound.speak('自由翻炒');
    }
  }

  _handlePoint(x, y, nowMs, nearEdge) {
    if (this.state === 'CALIBRATING') {
      this._updateCalibration(x, y);
      return;
    }
    if (this.state !== 'PLAYING' || !this.currentTask) return;

    const camBox = document.getElementById('camPreviewBox');
    const camTxt = document.getElementById('camStatusText');
    camBox.classList.toggle('status-ok', !nearEdge);
    camBox.classList.toggle('status-lost', nearEdge);
    camTxt.textContent = nearEdge ? '⚠️ 手部太靠邊緣' : '✅ 追蹤穩定';

    const res = this.judge.updatePoint(x, y, nowMs, this.currentTask);

    if (this.currentTask.type === 'DIRECTION') {
      document.getElementById('dirSwipeFill').style.width = `${Math.round(res.progress * 100)}%`;
      if (res.status === 'completed') {
        this._drawSlashFX(res.startAnchor, { x, y }, this.currentTask.isReverse);
        this.stats.swipes++;
        this._completeCurrentStep();
      }
    } else if (this.currentTask.type === 'HOLD') {
      document.getElementById('holdProgressFill').style.width = `${Math.round(res.progress * 100)}%`;
      if (res.remainSec !== undefined) {
        document.getElementById('holdRemainSec').textContent = res.remainSec.toFixed(1);
      }
      if (res.status === 'completed') {
        this.stats.holds++;
        this._completeCurrentStep();
      }
    } else if (this.currentTask.type === 'STIR') {
      const pct = Math.round(res.progress * 100);
      document.getElementById('stirPercentText').textContent = `${pct}%`;
      document.getElementById('stirProgressFill').style.width = `${pct}%`;
      document.getElementById('stirWokBox').classList.toggle('stirring', !!res.isMoving);
      if (res.status === 'completed') {
        document.getElementById('stirWokBox').classList.remove('stirring');
        this.stats.stirs++;
        this._completeCurrentStep();
      }
    }
  }

  _handleLost() {
    this.judge.onTrackingLost();
    const camBox = document.getElementById('camPreviewBox');
    camBox.classList.remove('status-ok');
    camBox.classList.add('status-lost');
    document.getElementById('camStatusText').textContent = '請將手舉到畫面中';
    document.getElementById('stirWokBox')?.classList.remove('stirring');
  }

  _completeCurrentStep() {
    if (this.state !== 'PLAYING') return;
    this.stats.steps++;
    this.sound.playSliceSuccess();

    this.stepIndex++;
    if (this.stepIndex < 5) {
      this._setupStepTask();
    } else {
      this._triggerDishComplete();
    }
  }

  _triggerDishComplete() {
    this.state = 'CELEBRATING';
    this.sound.playDishComplete();
    this.sound.speak(`出餐成功！${this.currentDish.name}`);

    this.stats.dishes++;
    this.stats.completedList.push(this.currentDish);
    this._updateTargetHUD();

    // 寫入 30 道夜市美食收集圖鑑
    this.unlockedSet.add(this.currentDish.id);
    this._saveCollection();

    // 加入底部已出餐縮圖列
    document.getElementById('hudCompletedCount').textContent = String(this.stats.dishes);
    const pill = document.createElement('div');
    pill.className = 'thumb-pill';
    pill.innerHTML = `<img src="${this.currentDish.finishImg}" alt="${this.currentDish.name}" /><span>${this.currentDish.name}</span>`;
    document.getElementById('completedThumbs').appendChild(pill);

    // 顯示 1.2 秒簡單慶祝動畫
    const overlay = document.getElementById('celebrateOverlay');
    const celImg = document.getElementById('celebrateDishImg');
    celImg.src = this.currentDish.finishImg;
    celImg.alt = this.currentDish.name;
    document.getElementById('celebrateDishTitle').textContent = this.currentDish.name;
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
    }, 1200);
  }

  _drawSlashFX(p1, p2, isReverse) {
    if (this.settings.lowPerf) return;
    const canvas = document.getElementById('fxCanvas');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = isReverse ? '#00e5ff' : '#ffb703';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
    ctx.stroke();
    setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 250);
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.pauseStartedAt = performance.now();
    document.getElementById('modalPause').classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.pausedElapsedMs += performance.now() - this.pauseStartedAt;
    document.getElementById('modalPause').classList.add('hidden');
    this.judge.resetState();
    this.state = 'PLAYING';
  }

  quitToMenu() {
    clearTimeout(this.celebrateTimer);
    clearInterval(this.timerInterval);
    this.tracker.stop();
    this.state = 'MENU';
    this._switchScreen('screenStart');
  }

  finishGame() {
    this.state = 'GAMEOVER';
    clearTimeout(this.celebrateTimer);
    clearInterval(this.timerInterval);
    this.tracker.stop();

    const activeMs = Math.max(0, performance.now() - this.startTimeMs - this.pausedElapsedMs);
    const totalSec = Math.round(activeMs / 1000);

    document.getElementById('resDishes').textContent = `${this.stats.dishes} 道`;
    document.getElementById('resSteps').textContent = `${this.stats.steps} 步`;
    document.getElementById('resSwipes').textContent = `${this.stats.swipes} 次`;
    document.getElementById('resHolds').textContent = `${this.stats.holds} 次`;
    document.getElementById('resStirs').textContent = `${this.stats.stirs} 次`;
    document.getElementById('resTime').textContent = `${totalSec} 秒`;

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
      this.sound.playSliceSuccess();

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
  new NightMarketGame();
});
