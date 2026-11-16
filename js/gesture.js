/**
 * One Euro Filter：低速移動時強力濾除手部顫抖，高速移動時保持低延遲
 */
export class OneEuroFilter {
  constructor(minCutoff = 1.0, beta = 0.015, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x, tMs) {
    if (this.tPrev === null) {
      this.xPrev = x;
      this.tPrev = tMs;
      return x;
    }
    const dt = Math.max(0.001, (tMs - this.tPrev) / 1000.0);
    this.tPrev = tMs;

    const dx = (x - this.xPrev) / dt;
    const edx = this.dxPrev + this.alpha(this.dCutoff, dt) * (dx - this.dxPrev);
    this.dxPrev = edx;

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const filtered = this.xPrev + this.alpha(cutoff, dt) * (x - this.xPrev);
    this.xPrev = filtered;
    return filtered;
  }
}

export const DIR_VECTORS = {
  UP:    { dx:  0,      dy: -1,      glyph: '↑', deg: -90,  opposite: 'DOWN' },
  UR:    { dx:  0.7071, dy: -0.7071, glyph: '↗', deg: -45,  opposite: 'DL' },
  RIGHT: { dx:  1,      dy:  0,      glyph: '→', deg: 0,    opposite: 'LEFT' },
  DR:    { dx:  0.7071, dy:  0.7071, glyph: '↘', deg: 45,   opposite: 'UL' },
  DOWN:  { dx:  0,      dy:  1,      glyph: '↓', deg: 90,   opposite: 'UP' },
  DL:    { dx: -0.7071, dy:  0.7071, glyph: '↙', deg: 135,  opposite: 'UR' },
  LEFT:  { dx: -1,      dy:  0,      glyph: '←', deg: 180,  opposite: 'RIGHT' },
  UL:    { dx: -0.7071, dy: -0.7071, glyph: '↖', deg: -135, opposite: 'DR' },
};

/**
 * 動作與認知判定引擎 V2.0：
 * 1. DIRECTION：非固定起點動態投影向量判定（支援慢速、小幅度、折返揮動與兩刀連擊）
 * 2. SPOILED  ：壞食材抑制控制 Go / No-Go（忍住不揮動 2.5 秒自動掃進垃圾桶）
 * 3. STIR     ：自由翻炒（參考點滑動法 Reference Anchor Stepping，僅在主動移動時回傳 isMoving: true 觸發震動）
 */
export class GestureJudge {
  constructor() {
    this.filterX = new OneEuroFilter(1.1, 0.02);
    this.filterY = new OneEuroFilter(1.1, 0.02);

    this.distThreshold = 0.18;
    this.angleToleranceDeg = 45;
    this.stirMultiplier = 5;

    this.resetState();
  }

  resetState() {
    this.anchor = null;
    this.cooldownUntil = 0;
    this.stableSince = null;

    this.holdElapsedMs = 0;
    this.lastFrameTime = null;

    this.stirAccumulated = 0;
    this.stirRefPoint = null;
    this.lastStirActiveMs = 0;
  }

  onTrackingLost() {
    this.filterX.reset();
    this.filterY.reset();
    this.anchor = null;
    this.stableSince = null;
    this.lastFrameTime = null;
    this.stirRefPoint = null;
  }

  updatePoint(rawX, rawY, nowMs, taskConfig) {
    const x = this.filterX.filter(rawX, nowMs);
    const y = this.filterY.filter(rawY, nowMs);

    const dtMs = this.lastFrameTime ? Math.min(200, nowMs - this.lastFrameTime) : 16;
    this.lastFrameTime = nowMs;

    if (nowMs < this.cooldownUntil) {
      this.anchor = { x, y };
      this.stirRefPoint = { x, y };
      return { status: 'cooldown', x, y, progress: 0, isMoving: false };
    }

    if (!this.stableSince) {
      this.stableSince = nowMs;
      this.anchor = { x, y };
      this.stirRefPoint = { x, y };
      return { status: 'stabilizing', x, y, progress: 0, isMoving: false };
    }
    if (nowMs - this.stableSince < 140) {
      this.anchor = { x, y };
      this.stirRefPoint = { x, y };
      return { status: 'stabilizing', x, y, progress: 0, isMoving: false };
    }

    if (taskConfig.type === 'DIRECTION') {
      return this._evalDirection(x, y, nowMs, taskConfig.requiredDirKey);
    } else if (taskConfig.type === 'SPOILED') {
      return this._evalSpoiled(x, y, dtMs, nowMs);
    } else if (taskConfig.type === 'STIR') {
      return this._evalStir(x, y, nowMs);
    }
    return { status: 'idle', x, y, progress: 0, isMoving: false };
  }

  _evalDirection(x, y, nowMs, dirKey) {
    if (!this.anchor) this.anchor = { x, y };
    const target = DIR_VECTORS[dirKey];
    const vx = x - this.anchor.x;
    const vy = y - this.anchor.y;
    const dist = Math.hypot(vx, vy);
    const proj = vx * target.dx + vy * target.dy;

    if (proj < -0.025) {
      this.anchor = { x, y };
      return { status: 'tracking', x, y, progress: 0 };
    }

    const progress = Math.min(1, Math.max(0, proj / this.distThreshold));

    if (dist >= this.distThreshold) {
      const cosTheta = proj / dist;
      const angleDeg = (Math.acos(Math.min(1, Math.max(-1, cosTheta))) * 180) / Math.PI;
      if (angleDeg <= this.angleToleranceDeg) {
        const startAnchor = { ...this.anchor };
        const swipeAngleRad = Math.atan2(vy, vx);
        this.anchor = { x, y };
        this.cooldownUntil = nowMs + 340;
        return { status: 'completed', x, y, startAnchor, swipeAngleRad, progress: 1 };
      } else {
        this.anchor = { x, y };
      }
    }

    return { status: 'tracking', x, y, progress };
  }

  _evalSpoiled(x, y, dtMs, nowMs) {
    if (!this.anchor) this.anchor = { x, y };
    const dist = Math.hypot(x - this.anchor.x, y - this.anchor.y);
    const swipeTrigger = Math.max(0.10, this.distThreshold * 0.72);

    // 若不小心大幅揮動，代表誤切壞食材
    if (dist >= swipeTrigger) {
      this.holdElapsedMs = 0;
      this.anchor = { x, y };
      this.cooldownUntil = nowMs + 450;
      return { status: 'spoiled_cut', x, y, progress: 0, remainSec: 2.5 };
    }

    // 緩慢微調手部位置不影響忍耐計時
    this.anchor = {
      x: this.anchor.x * 0.92 + x * 0.08,
      y: this.anchor.y * 0.92 + y * 0.08,
    };
    this.holdElapsedMs += dtMs;

    const targetMs = 2500;
    const progress = Math.min(1, this.holdElapsedMs / targetMs);
    if (this.holdElapsedMs >= targetMs) {
      this.holdElapsedMs = 0;
      this.cooldownUntil = nowMs + 360;
      return { status: 'completed', x, y, progress: 1, remainSec: 0 };
    }
    return {
      status: 'tracking',
      x,
      y,
      progress,
      remainSec: Math.max(0, (targetMs - this.holdElapsedMs) / 1000),
    };
  }

  _evalStir(x, y, nowMs) {
    if (!this.stirRefPoint) {
      this.stirRefPoint = { x, y };
      return { status: 'tracking', x, y, progress: this._getStirProgress(), isMoving: false };
    }

    const stepDist = Math.hypot(x - this.stirRefPoint.x, y - this.stirRefPoint.y);
    const minStepDeadzone = Math.max(0.012, this.distThreshold * 0.11);
    const maxJumpClamp = 0.32;

    if (stepDist > maxJumpClamp) {
      this.stirRefPoint = { x, y };
    } else if (stepDist >= minStepDeadzone) {
      this.stirAccumulated += stepDist;
      this.stirRefPoint = { x, y };
      this.lastStirActiveMs = nowMs;
    }

    const progress = this._getStirProgress();
    const isMoving = nowMs - this.lastStirActiveMs < 150;

    if (progress >= 1) {
      this.stirAccumulated = 0;
      this.cooldownUntil = nowMs + 380;
      return { status: 'completed', x, y, progress: 1, isMoving: false };
    }

    return { status: 'tracking', x, y, progress, isMoving };
  }

  _getStirProgress() {
    const targetTotal = this.distThreshold * this.stirMultiplier;
    return Math.min(1, this.stirAccumulated / targetTotal);
  }
}
