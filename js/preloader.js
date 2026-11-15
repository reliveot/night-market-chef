import { INGREDIENTS_DB } from './recipes.js';

/**
 * 滑動窗口圖片預載與快取管理器
 * - 真正以 URL 字串去重，並快取進行中的 Promise 避免重複請求
 * - 支援非同步載入完成通知，確保圖片就緒後即時更新 DOM
 * - 自動清理過期食材圖以保護低階手機記憶體
 */
export class AssetManager {
  constructor() {
    this.loadedUrls = new Set();
    this.inFlight = new Map(); // url -> Promise<string>
  }

  /**
   * 預載指定料理陣列（例如 [currentDish, nextDish]）
   */
  async preloadRecipes(recipes) {
    const uniqueUrls = new Set();
    for (const recipe of recipes) {
      if (!recipe) continue;
      if (recipe.finishImg) uniqueUrls.add(recipe.finishImg);
      for (const ingId of recipe.ingredientIds) {
        const ing = INGREDIENTS_DB[ingId];
        if (ing && ing.img) uniqueUrls.add(ing.img);
      }
    }
    const tasks = Array.from(uniqueUrls).map((url) => this.loadUrl(url));
    await Promise.allSettled(tasks);
  }

  loadUrl(url) {
    if (this.loadedUrls.has(url)) return Promise.resolve(url);
    if (this.inFlight.has(url)) return this.inFlight.get(url);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.loadedUrls.add(url);
        this.inFlight.delete(url);
        resolve(url);
      };
      img.onerror = () => {
        this.inFlight.delete(url);
        resolve(url);
      };
      img.src = url;
    });

    this.inFlight.set(url, promise);
    return promise;
  }

  /**
   * 釋放已過期料理的食材快取標記，僅保留現役料理與已完成成品圖
   */
  pruneOldIngredients(activeRecipes) {
    const keepUrls = new Set();
    for (const r of activeRecipes) {
      if (!r) continue;
      keepUrls.add(r.finishImg);
      for (const id of r.ingredientIds) {
        const ing = INGREDIENTS_DB[id];
        if (ing) keepUrls.add(ing.img);
      }
    }
    for (const url of Array.from(this.loadedUrls)) {
      if (url.includes('/ingredients/') && !keepUrls.has(url)) {
        this.loadedUrls.delete(url);
      }
    }
  }
}
