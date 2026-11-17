import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm';
import { ColorTracker } from './color-tracker.js';

export class InputTracker {
  constructor(videoEl, stageEl, callbacks) {
    this.videoEl = videoEl;
    this.stageEl = stageEl;
    this.callbacks = callbacks;

    this.mode = 'camera'; // 'camera' | 'color' | 'touch'
    this.mirrored = true;
    this.lowPerfMode = false;

    this.handLandmarker = null;
    this.visionFileset = null;
    this.modelInitPromise = null;
    this.activeDelegate = 'GPU';
    this.consecutiveErrors = 0;
    this.emptyHandFrames = 0;

    this.colorTracker = new ColorTracker();

    this.stream = null;
    this.isRunning = false;
    this.isInferencing = false;
    this.inferTimer = null;
    this.lostFrames = 0;
    this.emptyHandFrames = 0;
    this.lastInferTs = 0;
    this.lastVideoTime = -1;
    this.hasHandNow = false;

    // 效能自動降級監測器
    this.inferCostHistory = [];
    this.autoDowngraded = false;

    this._initPointerEvents();
  }

  // 共用 object-fit: cover 座標轉換：將原始攝影機 (rawX, rawY in 0..1) 對應到可視舞台 (normX, normY in 0..1)
  mapVideoToStage(rawX, rawY) {
    const vw = this.videoEl?.videoWidth || 640;
    const vh = this.videoEl?.videoHeight || 480;
    const sw = this.stageEl?.clientWidth || window.innerWidth || 640;
    const sh = this.stageEl?.clientHeight || window.innerHeight || 480;

    const scale = Math.max(sw / vw, sh / vh);
    const renderedW = vw * scale;
    const renderedH = vh * scale;
    const offsetX = (renderedW - sw) / 2;
    const offsetY = (renderedH - sh) / 2;

    const mirroredX = this.mirrored ? 1.0 - rawX : rawX;
    const stageX = (mirroredX * renderedW - offsetX) / sw;
    const stageY = (rawY * renderedH - offsetY) / sh;

    return {
      x: Math.min(1, Math.max(0, stageX)),
      y: Math.min(1, Math.max(0, stageY)),
    };
  }

  // 反向轉換：點擊螢幕座標 (clientX, clientY) → 原始攝影機座標 (rawX, rawY in 0..1) 供顏色取樣
  mapScreenToVideo(clientX, clientY) {
    const rect = this.stageEl.getBoundingClientRect();
    const vw = this.videoEl?.videoWidth || 640;
    const vh = this.videoEl?.videoHeight || 480;
    const sw = rect.width || 640;
    const sh = rect.height || 480;

    const sx = (clientX - rect.left) / sw;
    const sy = (clientY - rect.top) / sh;

    const scale = Math.max(sw / vw, sh / vh);
    const renderedW = vw * scale;
    const renderedH = vh * scale;
    const offsetX = (renderedW - sw) / 2;
    const offsetY = (renderedH - sh) / 2;

    const mirroredX = (sx * sw + offsetX) / renderedW;
    const rawX = this.mirrored ? 1.0 - mirroredX : mirroredX;
    const rawY = (sy * sh + offsetY) / renderedH;

    return {
      rawX: Math.min(1, Math.max(0, rawX)),
      rawY: Math.min(1, Math.max(0, rawY)),
    };
  }

  sampleColorAtScreenPoint(clientX, clientY) {
    const { rawX, rawY } = this.mapScreenToVideo(clientX, clientY);
    return this.colorTracker.sampleAtVideoNorm(this.videoEl, rawX, rawY);
  }

  setColorTolerance(tol) {
    this.colorTracker.setTolerance(tol);
  }

  hasColorTarget() {
    return !!this.colorTracker.target;
  }

  getColorTarget() {
    return this.colorTracker.target;
  }

  async _createLandmarker(delegate) {
    if (!this.visionFileset) {
      this.visionFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
    }
    this.activeDelegate = delegate;
    return HandLandmarker.createFromOptions(this.visionFileset, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.25,
      minHandPresenceConfidence: 0.25,
      minTrackingConfidence: 0.25,
    });
  }

  async initHandLandmarker() {
    if (this.handLandmarker) return true;
    if (this.modelInitPromise) return this.modelInitPromise;

    this.callbacks.onModelLoading?.();
    this.modelInitPromise = (async () => {
      try {
        try {
          this.handLandmarker = await this._createLandmarker('GPU');
        } catch {
          this.handLandmarker = await this._createLandmarker('CPU');
        }
        this.callbacks.onModelReady?.();
        return true;
      } catch (err) {
        console.warn('HandLandmarker init error:', err);
        this.modelInitPromise = null;
        this.callbacks.onModelError?.(err?.message || String(err));
        return false;
      }
    })();

    return this.modelInitPromise;
  }

  async _openWebcamStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API unavailable');
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    this.videoEl.setAttribute('playsinline', '');
    this.videoEl.setAttribute('webkit-playsinline', '');
    this.videoEl.muted = true;
    this.videoEl.srcObject = this.stream;
    this.videoEl.style.display = 'block';

    try {
      await this.videoEl.play();
    } catch {
      this.videoEl.onloadedmetadata = () => {
        this.videoEl.play().catch(() => {});
      };
    }
  }

  async start(mode, options = {}) {
    this.stop();
    this.mode = mode;
    this.mirrored = options.mirrored ?? true;
    this.lowPerfMode = options.lowPerf ?? false;
    this.isRunning = true;
    this.inferCostHistory = [];
    this.lastInferTs = 0;
    this.lastVideoTime = -1;
    this.consecutiveErrors = 0;
    this.hasHandNow = false;
    this.lostFrames = 0;

    if (mode === 'camera') {
      await this._openWebcamStream();
      this.initHandLandmarker().then((ready) => {
        if (!this.isRunning || this.mode !== 'camera') return;
        if (ready) {
          const intervalMs = this.lowPerfMode ? 100 : 66;
          this.inferTimer = setInterval(() => this._runCameraInference(), intervalMs);
        } else {
          this.callbacks.onModelFallback?.();
        }
      });
    } else if (mode === 'color') {
      await this._openWebcamStream();
      this.colorTracker.resetHistory();
      const intervalMs = this.lowPerfMode ? 80 : 50;
      this.inferTimer = setInterval(() => this._runColorInference(), intervalMs);
    }
  }

  setLowPerf(enabled) {
    if (this.lowPerfMode === enabled) return;
    this.lowPerfMode = enabled;
    if (this.isRunning && this.mode === 'camera' && this.handLandmarker) {
      clearInterval(this.inferTimer);
      this.inferTimer = setInterval(() => this._runCameraInference(), enabled ? 100 : 66);
    } else if (this.isRunning && this.mode === 'color') {
      clearInterval(this.inferTimer);
      this.inferTimer = setInterval(() => this._runColorInference(), enabled ? 80 : 50);
    }
  }

  stop() {
    this.isRunning = false;
    this.hasHandNow = false;
    if (this.inferTimer) {
      clearInterval(this.inferTimer);
      this.inferTimer = null;
    }
    if (this.holdHeartbeat) {
      clearInterval(this.holdHeartbeat);
      this.holdHeartbeat = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  _runColorInference() {
    if (!this.isRunning || this.mode !== 'color' || !this.videoEl) return;
    if (this.videoEl.paused && this.stream) {
      this.videoEl.play().catch(() => {});
    }
    if (this.videoEl.readyState < 2 || this.videoEl.videoWidth === 0 || this.videoEl.videoHeight === 0) return;
    if (!this.colorTracker.target) return;

    const t0 = performance.now();
    const res = this.colorTracker.detect(this.videoEl);
    const costMs = performance.now() - t0;

    if (res) {
      this.lostFrames = 0;
      if (!this.hasHandNow) {
        this.hasHandNow = true;
        this.callbacks.onTrackingState?.(true);
      }
      const mapped = this.mapVideoToStage(res.rawX, res.rawY);
      const nearEdge = mapped.x < 0.05 || mapped.x > 0.95 || mapped.y < 0.05 || mapped.y > 0.95;
      this.callbacks.onPoint(mapped.x, mapped.y, performance.now(), nearEdge, costMs);
    } else {
      this.lostFrames++;
      if (this.lostFrames >= 6) {
        if (this.hasHandNow) {
          this.hasHandNow = false;
          this.callbacks.onTrackingState?.(false);
        }
        this.callbacks.onLost();
      }
    }
  }

  async _runCameraInference() {
    if (!this.isRunning || this.isInferencing || !this.handLandmarker || !this.videoEl) return;
    if (this.videoEl.paused && this.stream) {
      this.videoEl.play().catch(() => {});
    }
    if (this.videoEl.readyState < 2 || this.videoEl.videoWidth === 0 || this.videoEl.videoHeight === 0) return;

    if (this.videoEl.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.videoEl.currentTime;

    this.isInferencing = true;

    try {
      const t0 = performance.now();
      const ts = Math.max(this.lastInferTs + 1, Math.round(t0));
      this.lastInferTs = ts;

      const result = this.handLandmarker.detectForVideo(this.videoEl, ts);
      const inferCostMs = performance.now() - t0;
      this.consecutiveErrors = 0;

      if (!this.lowPerfMode && !this.autoDowngraded) {
        this.inferCostHistory.push(inferCostMs);
        if (this.inferCostHistory.length >= 12) {
          const avg = this.inferCostHistory.reduce((a, b) => a + b, 0) / this.inferCostHistory.length;
          this.inferCostHistory = [];
          if (avg > 70) {
            this.autoDowngraded = true;
            this.setLowPerf(true);
            this.callbacks.onAutoDowngrade?.(Math.round(avg));
          }
        }
      }

      if (result.landmarks && result.landmarks.length > 0) {
        this.lostFrames = 0;
        this.emptyHandFrames = 0;
        if (!this.hasHandNow) {
          this.hasHandNow = true;
          this.callbacks.onTrackingState?.(true);
        }
        const lm = result.landmarks[0];
        const rawX = (lm[0].x + lm[5].x + lm[17].x) / 3;
        const rawY = (lm[0].y + lm[5].y + lm[17].y) / 3;

        const mapped = this.mapVideoToStage(rawX, rawY);
        const nearEdge = mapped.x < 0.05 || mapped.x > 0.95 || mapped.y < 0.05 || mapped.y > 0.95;

        this.callbacks.onPoint(mapped.x, mapped.y, performance.now(), nearEdge, inferCostMs);
      } else {
        this.lostFrames++;
        this.emptyHandFrames++;
        // 若部分手機 GPU delegate 靜默回傳空結果達 ~3.5 秒，自動切換 CPU delegate 自癒
        if (this.emptyHandFrames >= 55 && this.activeDelegate === 'GPU') {
          this.emptyHandFrames = 0;
          try { this.handLandmarker.close?.(); } catch {}
          this.handLandmarker = null;
          this._createLandmarker('CPU')
            .then((lm) => { this.handLandmarker = lm; })
            .catch(() => {});
        }
        if (this.lostFrames >= 6) {
          if (this.hasHandNow) {
            this.hasHandNow = false;
            this.callbacks.onTrackingState?.(false);
          }
          this.callbacks.onLost();
        }
      }
    } catch (err) {
      console.warn('Inference error:', err);
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= 3 && this.activeDelegate === 'GPU') {
        this.consecutiveErrors = 0;
        try {
          this.handLandmarker.close?.();
        } catch {}
        this.handLandmarker = null;
        this._createLandmarker('CPU')
          .then((lm) => { this.handLandmarker = lm; })
          .catch(() => {});
      }
    } finally {
      this.isInferencing = false;
    }
  }

  _initPointerEvents() {
    let isPointerDown = false;
    let lastPt = { x: 0.5, y: 0.5 };

    const getNormPos = (e) => {
      const rect = this.stageEl.getBoundingClientRect();
      return {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width))),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(1, rect.height))),
      };
    };

    this.stageEl.addEventListener('pointerdown', (e) => {
      if (!this.isRunning) return;
      if (e.target.closest('button') || e.target.closest('.color-calib-bar')) return;
      if (this.mode === 'color') return; // 顏色模式改由 game.js 處理點擊取色，不觸發模擬滑動
      isPointerDown = true;
      lastPt = getNormPos(e);
      this.callbacks.onPoint(lastPt.x, lastPt.y, performance.now(), false, 0);

      clearInterval(this.holdHeartbeat);
      this.holdHeartbeat = setInterval(() => {
        if (isPointerDown && this.isRunning) {
          this.callbacks.onPoint(lastPt.x, lastPt.y, performance.now(), false, 0);
        }
      }, 50);
    });

    this.stageEl.addEventListener('pointermove', (e) => {
      if (!this.isRunning || this.mode === 'color') return;
      lastPt = getNormPos(e);
      if (isPointerDown || this.mode === 'touch') {
        this.callbacks.onPoint(lastPt.x, lastPt.y, performance.now(), false, 0);
      }
    });

    const endPointer = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      clearInterval(this.holdHeartbeat);
      if (this.mode === 'touch') this.callbacks.onLost();
    };

    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }
}
