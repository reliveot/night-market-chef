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
    this.stream = null;
    this.isRunning = false;
    this.isInferencing = false;
    this.inferTimer = null;
    this.lostFrames = 0;

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
    if (this.handLandmarker) return;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  async start(mode, options = {}) {
    this.stop();
    this.mode = mode;
    this.mirrored = options.mirrored ?? true;
    this.lowPerfMode = options.lowPerf ?? false;
    this.isRunning = true;
    this.inferCostHistory = [];

    if (mode === 'camera') {
      await this.initHandLandmarker();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();

      const intervalMs = this.lowPerfMode ? 100 : 66; // 10 FPS 或 15 FPS
      this.inferTimer = setInterval(() => this._runCameraInference(), intervalMs);
    }
  }

  setLowPerf(enabled) {
    if (this.lowPerfMode === enabled) return;
    this.lowPerfMode = enabled;
    if (this.isRunning && this.mode === 'camera') {
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
  }

  async _runCameraInference() {
    if (!this.isRunning || this.isInferencing || !this.videoEl || this.videoEl.readyState < 2) return;
    this.isInferencing = true;

    try {
      const t0 = performance.now();
      this.offscreenCtx.drawImage(this.videoEl, 0, 0, 256, 192);
      const result = this.handLandmarker.detectForVideo(this.offscreenCanvas, t0);
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
        // 取手掌中心質心 (Wrist 0, Index MCP 5, Pinky MCP 17)
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
