// 獨立顏色體感追蹤模組（純 Canvas HSV 色塊追蹤＋空間連續性防誤判，免載入 AI 模型）
export class ColorTracker {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 120;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.target = null; // { h, s, v, hex }
    this.tolerance = 'normal'; // 'strict' | 'normal' | 'wide'
    this.prevRaw = null; // { x, y } in [0..1] video space
  }

  setTolerance(tol) {
    if (['strict', 'normal', 'wide'].includes(tol)) {
      this.tolerance = tol;
    }
  }

  resetHistory() {
    this.prevRaw = null;
  }

  clearTarget() {
    this.target = null;
    this.prevRaw = null;
  }

  _rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h, s, v };
  }

  _getThresholds() {
    if (this.tolerance === 'strict') return { dh: 16, ds: 28, dv: 30 };
    if (this.tolerance === 'wide') return { dh: 32, ds: 46, dv: 50 };
    return { dh: 23, ds: 36, dv: 40 };
  }

  // 從已換算成 video 正規化座標 (rawX, rawY in 0..1) 的位置取樣 9x9 平均色
  sampleAtVideoNorm(videoEl, rawX, rawY) {
    const vw = videoEl?.videoWidth || 0;
    const vh = videoEl?.videoHeight || 0;
    if (!vw || !vh) return null;

    const w = 160;
    const h = Math.max(90, Math.round((vh / vw) * w));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.ctx.drawImage(videoEl, 0, 0, w, h);
    const cx = Math.min(w - 1, Math.max(0, Math.round(rawX * w)));
    const cy = Math.min(h - 1, Math.max(0, Math.round(rawY * h)));

    const rad = 4;
    const x0 = Math.max(0, cx - rad);
    const y0 = Math.max(0, cy - rad);
    const x1 = Math.min(w - 1, cx + rad);
    const y1 = Math.min(h - 1, cy + rad);
    const imgData = this.ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1).data;

    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      sumR += imgData[i];
      sumG += imgData[i + 1];
      sumB += imgData[i + 2];
      count++;
    }
    if (count === 0) return null;

    const r = Math.round(sumR / count);
    const g = Math.round(sumG / count);
    const b = Math.round(sumB / count);
    const hsv = this._rgbToHsv(r, g, b);
    const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

    this.target = { ...hsv, r, g, b, hex };
    this.prevRaw = { x: rawX, y: rawY };
    return this.target;
  }

  // 偵測目前影格中的目標色塊，回傳 { rawX, rawY, areaRatio } 或 null
  detect(videoEl) {
    if (!this.target) return null;
    const vw = videoEl?.videoWidth || 0;
    const vh = videoEl?.videoHeight || 0;
    if (!vw || !vh) return null;

    const w = 160;
    const h = Math.max(90, Math.round((vh / vw) * w));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.ctx.drawImage(videoEl, 0, 0, w, h);
    const data = this.ctx.getImageData(0, 0, w, h).data;

    const { dh, ds, dv } = this._getThresholds();
    const t = this.target;
    const isLowSatTarget = t.s < 18; // 若取到灰／白／黑標記，放寬 Hue 改看亮度與低飽和

    // 分成 8x6 網格群集，過濾單點雜訊並挑出最連貫的色塊中心
    const cols = 8;
    const rows = 6;
    const cellW = w / cols;
    const cellH = h / rows;
    const cells = Array.from({ length: cols * rows }, () => ({ count: 0, sumX: 0, sumY: 0 }));

    let totalMatched = 0;
    for (let y = 0; y < h; y += 2) {
      const rowOff = y * w;
      for (let x = 0; x < w; x += 2) {
        const idx = (rowOff + x) * 4;
        const { h: ph, s: ps, v: pv } = this._rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);

        let matched = false;
        if (isLowSatTarget) {
          matched = ps < 26 && Math.abs(pv - t.v) <= dv * 0.8;
        } else {
          let hueDiff = Math.abs(ph - t.h);
          if (hueDiff > 180) hueDiff = 360 - hueDiff;
          matched = hueDiff <= dh && Math.abs(ps - t.s) <= ds && Math.abs(pv - t.v) <= dv;
        }

        if (matched) {
          totalMatched++;
          const gx = Math.min(cols - 1, Math.floor(x / cellW));
          const gy = Math.min(rows - 1, Math.floor(y / cellH));
          const c = cells[gy * cols + gx];
          c.count++;
          c.sumX += x;
          c.sumY += y;
        }
      }
    }

    // 過濾雜訊：至少需達 10 個取樣點（約畫面 0.2%）
    if (totalMatched < 10) return null;

    // 挑選最佳色塊群集（面積大且靠近上一幀位置者優先）
    let bestScore = -1;
    let bestCell = null;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c.count < 4) continue;
      const cx = (c.sumX / c.count) / w;
      const cy = (c.sumY / c.count) / h;
      let score = c.count;
      if (this.prevRaw) {
        const dist = Math.hypot(cx - this.prevRaw.x, cy - this.prevRaw.y);
        // 距離上一幀越近加分越多，避免背景同色物件搶走游標
        score *= Math.max(0.25, 1.8 - dist * 2.2);
      }
      if (score > bestScore) {
        bestScore = score;
        bestCell = { cx, cy, count: c.count };
      }
    }

    if (!bestCell) return null;

    // 以最佳群集為中心做半徑加權平均，得到平滑精準的質心
    let wSumX = 0, wSumY = 0, wTotal = 0;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c.count < 2) continue;
      const cx = (c.sumX / c.count) / w;
      const cy = (c.sumY / c.count) / h;
      if (Math.hypot(cx - bestCell.cx, cy - bestCell.cy) <= 0.26) {
        wSumX += c.sumX;
        wSumY += c.sumY;
        wTotal += c.count;
      }
    }

    if (wTotal < 8) return null;
    const rawX = (wSumX / wTotal) / w;
    const rawY = (wSumY / wTotal) / h;
    this.prevRaw = { x: rawX, y: rawY };

    return {
      rawX,
      rawY,
      areaRatio: totalMatched / ((w / 2) * (h / 2)),
    };
  }
}
