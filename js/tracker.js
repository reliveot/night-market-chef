import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm';

export class InputTracker {
  constructor(videoEl, stageEl, callbacks) {
    this.videoEl = videoEl;
    this.stageEl = stageEl;
    this.callbacks = callbacks;

    this.mode = 'camera'; // 'camera' | 'touch'
    this.mirrored = true;
    this.lowPerfMode = false;

    this.handLandmarker = null;
    this.modelInitPromise = null;
    this.stream = null;
    this.isRunning = false;
    this.isInferencing = false;
    this.inferTimer = null;
    this.lostFrames = 0;
    this.lastInferTs = 0;

    // 效能自動降級監測器
    this.inferCostHistory = [];
    this.autoDowngraded = false;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 256;
    this.offscreenCanvas.height = 192;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: false });

    this._initPointerEvents();
  }

  async initHandLandmarker() {
    if (this.handLandmarker) return true;
    if (this.modelInitPromise) return this.modelInitPromise;

    this.callbacks.onModelLoading?.();
    this.modelInitPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const opts = {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        };
        try {
          this.handLandmarker = await HandLandmarker.createFromOptions(vision, opts);
        } catch {
          // iPad / iOS / Android WebGL 若 GPU delegate 失敗，自動切換為 CPU delegate
          opts.baseOptions.delegate = 'CPU';
          this.handLandmarker = await HandLandmarker.createFromOptions(vision, opts);
        }
        this.callbacks.onModelReady?.();
        return true;
      } catch (err) {
        console.warn('HandLandmarker init error:', err);
        this.modelInitPromise = null;
        return false;
      }
    })();

    return this.modelInitPromise;
  }

  async start(mode, options = {}) {
    this.stop();
    this.mode = mode;
    this.mirrored = options.mirrored ?? true;
    this.lowPerfMode = options.lowPerf ?? false;
    this.isRunning = true;
    this.inferCostHistory = [];
    this.lastInferTs = 0;

    if (mode === 'camera') {
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

      // 鏡頭畫面已成功顯示後，非同步啟動 AI 手部模型推論
      this.initHandLandmarker().then((ready) => {
        if (!this.isRunning || this.mode !== 'camera') return;
        if (ready) {
          const intervalMs = this.lowPerfMode ? 100 : 66;
          this.inferTimer = setInterval(() => this._runCameraInference(), intervalMs);
        } else {
          this.callbacks.onModelFallback?.();
        }
      });
    }
  }

  setLowPerf(enabled) {
    if (this.lowPerfMode === enabled) return;
    this.lowPerfMode = enabled;
    if (this.isRunning && this.mode === 'camera' && this.handLandmarker) {
      clearInterval(this.inferTimer);
      this.inferTimer = setInterval(() => this._runCameraInference(), enabled ? 100 : 66);
    }
  }

  stop() {
    this.isRunning = false;
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

  async _runCameraInference() {
    if (!this.isRunning || this.isInferencing || !this.handLandmarker || !this.videoEl || this.videoEl.readyState < 2) return;
    const vw = this.videoEl.videoWidth || 640;
    const vh = this.videoEl.videoHeight || 480;
    if (vw === 0 || vh === 0) return;

    this.isInferencing = true;

    try {
      // 依真實鏡頭比例設定離屏畫布（手機直向 3:4 時為 192x256，橫向 4:3 為 256x192），避免壓扁手部導致辨識失敗
      const maxDim = 256;
      const cw = vw >= vh ? maxDim : Math.max(128, Math.round((vw / vh) * maxDim));
      const ch = vh > vw ? maxDim : Math.max(128, Math.round((vh / vw) * maxDim));
      if (this.offscreenCanvas.width !== cw || this.offscreenCanvas.height !== ch) {
        this.offscreenCanvas.width = cw;
        this.offscreenCanvas.height = ch;
      }

      const t0 = performance.now();
      this.offscreenCtx.drawImage(this.videoEl, 0, 0, cw, ch);

      // MediaPipe VIDEO 模式必須使用嚴格遞增的整數毫秒 timestamp
      const ts = Math.max(this.lastInferTs + 1, Math.round(t0));
      this.lastInferTs = ts;

      const result = this.handLandmarker.detectForVideo(this.offscreenCanvas, ts);
      const inferCostMs = performance.now() - t0;

      if (!this.lowPerfMode && !this.autoDowngraded) {
        this.inferCostHistory.push(inferCostMs);
        if (this.inferCostHistory.length >= 12) {
          const avg = this.inferCostHistory.reduce((a, b) => a + b, 0) / this.inferCostHistory.length;
          this.inferCostHistory = [];
          if (avg > 58) {
            this.autoDowngraded = true;
            this.setLowPerf(true);
            this.callbacks.onAutoDowngrade?.(Math.round(avg));
          }
        }
      }

      if (result.landmarks && result.landmarks.length > 0) {
        this.lostFrames = 0;
        const lm = result.landmarks[0];
        const rawX = (lm[0].x + lm[5].x + lm[17].x) / 3;
        const rawY = (lm[0].y + lm[5].y + lm[17].y) / 3;

        const normX = this.mirrored ? 1.0 - rawX : rawX;
        const normY = rawY;
        const nearEdge = rawX < 0.05 || rawX > 0.95 || rawY < 0.05 || rawY > 0.95;

        this.callbacks.onPoint(normX, normY, performance.now(), nearEdge, inferCostMs);
      } else {
        this.lostFrames++;
        if (this.lostFrames >= 3) {
          this.callbacks.onLost();
        }
      }
    } catch (err) {
      console.warn('Inference error:', err);
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
      if (e.target.closest('button')) return;
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
      if (!this.isRunning) return;
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
