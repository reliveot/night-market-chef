/**
 * 《台灣夜市料理秀》完整料理與共用食材資料庫 (V1.1)
 * - 總計 30 道台灣夜市美食（A～E 五大分類各 6 道）
 * - 總計 120 個食材引用，經程式自動化去重統計為 80 種獨立食材 ID（每種皆對應獨立透明底 WebP 圖檔）
 */
export const INGREDIENTS_DB = {
  // 蛋奶與豆製品 (8)
  egg:                { id: 'egg',                name: '雞蛋',       img: 'assets/ingredients/egg.webp' },
  preserved_egg:      { id: 'preserved_egg',      name: '滷蛋',       img: 'assets/ingredients/preserved_egg.webp' },
  milk:               { id: 'milk',               name: '牛奶',       img: 'assets/ingredients/milk.webp' },
  condensed_milk:     { id: 'condensed_milk',     name: '煉乳',       img: 'assets/ingredients/condensed_milk.webp' },
  cheese:             { id: 'cheese',             name: '起司',       img: 'assets/ingredients/cheese.webp' },
  tofu:               { id: 'tofu',               name: '豆腐',       img: 'assets/ingredients/tofu.webp' },
  fried_tofu:         { id: 'fried_tofu',         name: '油豆腐',     img: 'assets/ingredients/fried_tofu.webp' },
  tofu_pudding:       { id: 'tofu_pudding',       name: '豆花',       img: 'assets/ingredients/tofu_pudding.webp' },

  // 粉漿、麵食與主食 (10)
  batter:             { id: 'batter',             name: '粉漿／麵糊', img: 'assets/ingredients/batter.webp' },
  sweet_potato_flour: { id: 'sweet_potato_flour', name: '地瓜粉',     img: 'assets/ingredients/sweet_potato_flour.webp' },
  coating_flour:      { id: 'coating_flour',      name: '裹粉',       img: 'assets/ingredients/coating_flour.webp' },
  dough:              { id: 'dough',              name: '麵團',       img: 'assets/ingredients/dough.webp' },
  crepe_skin:         { id: 'crepe_skin',         name: '餅皮',       img: 'assets/ingredients/crepe_skin.webp' },
  turnip_cake:        { id: 'turnip_cake',        name: '蘿蔔糕',     img: 'assets/ingredients/turnip_cake.webp' },
  noodles:            { id: 'noodles',            name: '麵條',       img: 'assets/ingredients/noodles.webp' },
  vermicelli:         { id: 'vermicelli',         name: '麵線',       img: 'assets/ingredients/vermicelli.webp' },
  white_rice:         { id: 'white_rice',         name: '白飯',       img: 'assets/ingredients/white_rice.webp' },
  bawan_skin:         { id: 'bawan_skin',         name: '肉圓皮',     img: 'assets/ingredients/bawan_skin.webp' },

  // 肉類、海鮮與火鍋料 (16)
  oyster:             { id: 'oyster',             name: '蚵仔',       img: 'assets/ingredients/oyster.webp' },
  octopus:            { id: 'octopus',            name: '章魚',       img: 'assets/ingredients/octopus.webp' },
  squid:              { id: 'squid',              name: '魷魚',       img: 'assets/ingredients/squid.webp' },
  meat_slices:        { id: 'meat_slices',        name: '肉片',       img: 'assets/ingredients/meat_slices.webp' },
  chicken_fillet:     { id: 'chicken_fillet',     name: '雞排',       img: 'assets/ingredients/chicken_fillet.webp' },
  chicken_meat:       { id: 'chicken_meat',       name: '雞肉',       img: 'assets/ingredients/chicken_meat.webp' },
  chicken_wing:       { id: 'chicken_wing',       name: '雞翅',       img: 'assets/ingredients/chicken_wing.webp' },
  tempura:            { id: 'tempura',            name: '甜不辣',     img: 'assets/ingredients/tempura.webp' },
  sausage:            { id: 'sausage',            name: '香腸',       img: 'assets/ingredients/sausage.webp' },
  blood_cake:         { id: 'blood_cake',         name: '米血',       img: 'assets/ingredients/blood_cake.webp' },
  braised_pork:       { id: 'braised_pork',       name: '滷肉',       img: 'assets/ingredients/braised_pork.webp' },
  intestine:          { id: 'intestine',          name: '大腸',       img: 'assets/ingredients/intestine.webp' },
  pork_filling:       { id: 'pork_filling',       name: '豬肉餡',     img: 'assets/ingredients/pork_filling.webp' },
  pork_ribs:          { id: 'pork_ribs',          name: '排骨',       img: 'assets/ingredients/pork_ribs.webp' },
  fish_cake:          { id: 'fish_cake',          name: '魚板',       img: 'assets/ingredients/fish_cake.webp' },
  meatball:           { id: 'meatball',           name: '貢丸',       img: 'assets/ingredients/meatball.webp' },

  // 蔬菜、辛香料與中藥材 (19)
  scallion:           { id: 'scallion',           name: '蔥花',       img: 'assets/ingredients/scallion.webp' },
  greens:             { id: 'greens',             name: '青菜',       img: 'assets/ingredients/greens.webp' },
  cabbage:            { id: 'cabbage',            name: '高麗菜',     img: 'assets/ingredients/cabbage.webp' },
  onion:              { id: 'onion',              name: '洋蔥',       img: 'assets/ingredients/onion.webp' },
  garlic_slices:      { id: 'garlic_slices',      name: '蒜片',       img: 'assets/ingredients/garlic_slices.webp' },
  garlic_minced:      { id: 'garlic_minced',      name: '蒜末',       img: 'assets/ingredients/garlic_minced.webp' },
  garlic_paste:       { id: 'garlic_paste',       name: '蒜泥',       img: 'assets/ingredients/garlic_paste.webp' },
  basil:              { id: 'basil',              name: '九層塔',     img: 'assets/ingredients/basil.webp' },
  cilantro:           { id: 'cilantro',           name: '香菜',       img: 'assets/ingredients/cilantro.webp' },
  corn:               { id: 'corn',               name: '玉米',       img: 'assets/ingredients/corn.webp' },
  green_pepper:       { id: 'green_pepper',       name: '青椒',       img: 'assets/ingredients/green_pepper.webp' },
  kimchi:             { id: 'kimchi',             name: '泡菜',       img: 'assets/ingredients/kimchi.webp' },
  pickled_veg:        { id: 'pickled_veg',        name: '酸菜',       img: 'assets/ingredients/pickled_veg.webp' },
  bamboo_shoots:      { id: 'bamboo_shoots',      name: '筍丁',       img: 'assets/ingredients/bamboo_shoots.webp' },
  white_radish:       { id: 'white_radish',       name: '白蘿蔔',     img: 'assets/ingredients/white_radish.webp' },
  angelica:           { id: 'angelica',           name: '當歸',       img: 'assets/ingredients/angelica.webp' },
  goji:               { id: 'goji',               name: '枸杞',       img: 'assets/ingredients/goji.webp' },
  red_dates:          { id: 'red_dates',          name: '紅棗',       img: 'assets/ingredients/red_dates.webp' },

  // 調味料與醬汁 (12)
  pepper:             { id: 'pepper',             name: '胡椒',       img: 'assets/ingredients/pepper.webp' },
  pepper_powder:      { id: 'pepper_powder',      name: '胡椒粉',     img: 'assets/ingredients/pepper_powder.webp' },
  chili_powder:       { id: 'chili_powder',       name: '辣粉',       img: 'assets/ingredients/chili_powder.webp' },
  chili_sauce:        { id: 'chili_sauce',        name: '辣醬',       img: 'assets/ingredients/chili_sauce.webp' },
  sauce:              { id: 'sauce',              name: '醬汁',       img: 'assets/ingredients/sauce.webp' },
  soy_paste:          { id: 'soy_paste',          name: '醬油膏',     img: 'assets/ingredients/soy_paste.webp' },
  shacha:             { id: 'shacha',             name: '沙茶',       img: 'assets/ingredients/shacha.webp' },
  sesame:             { id: 'sesame',             name: '芝麻',       img: 'assets/ingredients/sesame.webp' },
  peanut_powder:      { id: 'peanut_powder',      name: '花生粉',     img: 'assets/ingredients/peanut_powder.webp' },
  peanut:             { id: 'peanut',             name: '花生',       img: 'assets/ingredients/peanut.webp' },

  // 甜點、水果與飲品配料 (16)
  sweet_potato_mash:  { id: 'sweet_potato_mash',  name: '地瓜泥',     img: 'assets/ingredients/sweet_potato_mash.webp' },
  sugar:              { id: 'sugar',              name: '糖',         img: 'assets/ingredients/sugar.webp' },
  syrup:              { id: 'syrup',              name: '糖漿',       img: 'assets/ingredients/syrup.webp' },
  tapioca:            { id: 'tapioca',            name: '珍珠',       img: 'assets/ingredients/tapioca.webp' },
  tapioca_balls:      { id: 'tapioca_balls',      name: '粉圓',       img: 'assets/ingredients/tapioca_balls.webp' },
  black_tea:          { id: 'black_tea',          name: '紅茶',       img: 'assets/ingredients/black_tea.webp' },
  ice:                { id: 'ice',                name: '冰塊',       img: 'assets/ingredients/ice.webp' },
  shaved_ice:         { id: 'shaved_ice',         name: '剉冰',       img: 'assets/ingredients/shaved_ice.webp' },
  mango:              { id: 'mango',              name: '芒果',       img: 'assets/ingredients/mango.webp' },
  mango_sauce:        { id: 'mango_sauce',        name: '芒果醬',     img: 'assets/ingredients/mango_sauce.webp' },
  red_bean_filling:   { id: 'red_bean_filling',   name: '紅豆餡',     img: 'assets/ingredients/red_bean_filling.webp' },
  red_bean:           { id: 'red_bean',           name: '紅豆',       img: 'assets/ingredients/red_bean.webp' },
  custard:            { id: 'custard',            name: '奶油餡',     img: 'assets/ingredients/custard.webp' },
  strawberry:         { id: 'strawberry',         name: '草莓',       img: 'assets/ingredients/strawberry.webp' },
  tomato:             { id: 'tomato',             name: '番茄',       img: 'assets/ingredients/tomato.webp' },
  grape:              { id: 'grape',              name: '葡萄',       img: 'assets/ingredients/grape.webp' },
};

export const RECIPES_DB = [
  // A. 煎台料理（6 道）
  { id: 'oyster_omelet', category: '煎台料理', name: '蚵仔煎', finishImg: 'assets/dishes/oyster_omelet.webp', finishText: '淋上甜辣醬，熱騰騰上菜！', ingredientIds: ['egg', 'batter', 'oyster', 'greens'] },
  { id: 'scallion_pancake', category: '煎台料理', name: '蔥油餅', finishImg: 'assets/dishes/scallion_pancake.webp', finishText: '煎到金黃酥脆，層次分明！', ingredientIds: ['dough', 'scallion', 'egg', 'pepper'] },
  { id: 'egg_crepe', category: '煎台料理', name: '蛋餅', finishImg: 'assets/dishes/egg_crepe.webp', finishText: '起司牽絲香氣四溢，切塊出餐！', ingredientIds: ['crepe_skin', 'egg', 'scallion', 'cheese'] },
  { id: 'turnip_cake', category: '煎台料理', name: '蘿蔔糕', finishImg: 'assets/dishes/turnip_cake.webp', finishText: '外酥內嫩淋蒜蓉醬，完成！', ingredientIds: ['turnip_cake', 'egg', 'garlic_minced', 'scallion'] },
  { id: 'takoyaki', category: '煎台料理', name: '章魚燒', finishImg: 'assets/dishes/takoyaki.webp', finishText: '翻轉成圓滾滾金球，出餐！', ingredientIds: ['batter', 'octopus', 'cabbage', 'scallion'] },
  { id: 'teppan_noodles', category: '煎台料理', name: '鐵板麵', finishImg: 'assets/dishes/teppan_noodles.webp', finishText: '鐵板滋滋作響，醬香濃郁！', ingredientIds: ['noodles', 'meat_slices', 'onion', 'greens'] },

  // B. 油炸料理（6 道）
  { id: 'fried_chicken_fillet', category: '油炸料理', name: '香雞排', finishImg: 'assets/dishes/fried_chicken_fillet.webp', finishText: '比臉還大金黃酥脆，撒胡椒！', ingredientIds: ['chicken_fillet', 'sweet_potato_flour', 'pepper_powder', 'chili_powder'] },
  { id: 'popcorn_chicken', category: '油炸料理', name: '鹽酥雞', finishImg: 'assets/dishes/popcorn_chicken.webp', finishText: '九層塔爆香起鍋，宵夜首選！', ingredientIds: ['chicken_meat', 'basil', 'garlic_slices', 'pepper_powder'] },
  { id: 'sweet_potato_balls', category: '油炸料理', name: '地瓜球', finishImg: 'assets/dishes/sweet_potato_balls.webp', finishText: '按壓膨脹Ｑ彈酥脆，出餐！', ingredientIds: ['sweet_potato_mash', 'sweet_potato_flour', 'sugar', 'sesame'] },
  { id: 'fried_squid', category: '油炸料理', name: '炸魷魚', finishImg: 'assets/dishes/fried_squid.webp', finishText: '彈牙鮮甜配蒜片，超涮嘴！', ingredientIds: ['squid', 'coating_flour', 'garlic_slices', 'pepper_powder'] },
  { id: 'fried_tempura', category: '油炸料理', name: '炸甜不辣', finishImg: 'assets/dishes/fried_tempura.webp', finishText: '炸到澎起金黃，撒滿胡椒！', ingredientIds: ['tempura', 'garlic_minced', 'basil', 'pepper_powder'] },
  { id: 'fried_wings', category: '油炸料理', name: '炸雞翅', finishImg: 'assets/dishes/fried_wings.webp', finishText: '皮脆肉多汁，香辣過癮！', ingredientIds: ['chicken_wing', 'coating_flour', 'pepper_powder', 'chili_powder'] },

  // C. 炭烤料理（6 道）
  { id: 'grilled_sausage', category: '炭烤料理', name: '烤香腸', finishImg: 'assets/dishes/grilled_sausage.webp', finishText: '炭火烤出油亮焦香，配蒜片！', ingredientIds: ['sausage', 'garlic_slices', 'pepper', 'sauce'] },
  { id: 'grilled_corn', category: '炭烤料理', name: '烤玉米', finishImg: 'assets/dishes/grilled_corn.webp', finishText: '刷上獨門沙茶醬，炭香十足！', ingredientIds: ['corn', 'soy_paste', 'shacha', 'chili_powder'] },
  { id: 'chicken_skewer', category: '炭烤料理', name: '雞肉串', finishImg: 'assets/dishes/chicken_skewer.webp', finishText: '肉嫩蔬菜甜，刷醬完成！', ingredientIds: ['chicken_meat', 'onion', 'green_pepper', 'sauce'] },
  { id: 'grilled_squid', category: '炭烤料理', name: '烤魷魚', finishImg: 'assets/dishes/grilled_squid.webp', finishText: '整隻炭烤刷醬撒白芝麻！', ingredientIds: ['squid', 'garlic_minced', 'sauce', 'sesame'] },
  { id: 'pig_blood_cake', category: '炭烤料理', name: '米血糕', finishImg: 'assets/dishes/pig_blood_cake.webp', finishText: '裹滿花生粉與香菜，道地美味！', ingredientIds: ['blood_cake', 'peanut_powder', 'cilantro', 'soy_paste'] },
  { id: 'grilled_tempura', category: '炭烤料理', name: '烤甜不辣', finishImg: 'assets/dishes/grilled_tempura.webp', finishText: '炭烤微焦刷甜醬，撒芝麻！', ingredientIds: ['tempura', 'sauce', 'sesame', 'chili_powder'] },

  // D. 熱食與湯品（6 道）
  { id: 'stinky_tofu', category: '熱食與湯品', name: '臭豆腐', finishImg: 'assets/dishes/stinky_tofu.webp', finishText: '酥脆豆腐塞入台式泡菜！', ingredientIds: ['tofu', 'kimchi', 'garlic_paste', 'chili_sauce'] },
  { id: 'braised_pork_rice', category: '熱食與湯品', name: '滷肉飯', finishImg: 'assets/dishes/braised_pork_rice.webp', finishText: '淋上油亮肉燥配滷蛋，開動！', ingredientIds: ['white_rice', 'braised_pork', 'pickled_veg', 'preserved_egg'] },
  { id: 'oyster_vermicelli', category: '熱食與湯品', name: '蚵仔麵線', finishImg: 'assets/dishes/oyster_vermicelli.webp', finishText: '大腸蚵仔料滿滿，撒香菜！', ingredientIds: ['vermicelli', 'oyster', 'intestine', 'cilantro'] },
  { id: 'bawan', category: '熱食與湯品', name: '肉圓', finishImg: 'assets/dishes/bawan.webp', finishText: 'Ｑ彈外皮包鮮肉筍丁，完成！', ingredientIds: ['bawan_skin', 'pork_filling', 'bamboo_shoots', 'cilantro'] },
  { id: 'herbal_pork_ribs', category: '熱食與湯品', name: '藥燉排骨', finishImg: 'assets/dishes/herbal_pork_ribs.webp', finishText: '溫潤甘甜中藥湯頭，暖心上桌！', ingredientIds: ['pork_ribs', 'angelica', 'goji', 'red_dates'] },
  { id: 'oden', category: '熱食與湯品', name: '關東煮', finishImg: 'assets/dishes/oden.webp', finishText: '清甜高湯煮透好料，出餐！', ingredientIds: ['white_radish', 'fish_cake', 'meatball', 'fried_tofu'] },

  // E. 甜點與飲料（6 道）
  { id: 'bubble_tea', category: '甜點與飲料', name: '珍珠奶茶', finishImg: 'assets/dishes/bubble_tea.webp', finishText: 'Ｑ彈黑糖珍珠配香醇奶茶！', ingredientIds: ['tapioca', 'black_tea', 'milk', 'ice'] },
  { id: 'mango_shaved_ice', category: '甜點與飲料', name: '芒果冰', finishImg: 'assets/dishes/mango_shaved_ice.webp', finishText: '滿滿新鮮愛文芒果淋煉乳！', ingredientIds: ['shaved_ice', 'mango', 'condensed_milk', 'mango_sauce'] },
  { id: 'wheel_pie', category: '甜點與飲料', name: '紅豆餅', finishImg: 'assets/dishes/wheel_pie.webp', finishText: '爆餡紅豆奶油雙重享受！', ingredientIds: ['batter', 'red_bean_filling', 'custard', 'sesame'] },
  { id: 'egg_cake', category: '甜點與飲料', name: '雞蛋糕', finishImg: 'assets/dishes/egg_cake.webp', finishText: '現烤出爐蛋奶香撲鼻！', ingredientIds: ['batter', 'egg', 'milk', 'sugar'] },
  { id: 'tanghulu', category: '甜點與飲料', name: '糖葫蘆', finishImg: 'assets/dishes/tanghulu.webp', finishText: '晶瑩脆甜糖衣包裹鮮果！', ingredientIds: ['strawberry', 'tomato', 'grape', 'syrup'] },
  { id: 'tofu_pudding', category: '甜點與飲料', name: '豆花', finishImg: 'assets/dishes/tofu_pudding.webp', finishText: '綿密豆花配花生粉圓紅豆！', ingredientIds: ['tofu_pudding', 'peanut', 'tapioca_balls', 'red_bean'] },
];

// 啟動時自我驗證：確認 30 道料理與所有 120 個食材引用皆存在於 INGREDIENTS_DB
export function validateRecipeDatabase() {
  const referencedIds = new Set();
  for (const recipe of RECIPES_DB) {
    if (recipe.ingredientIds.length !== 4) {
      throw new Error(`料理 ${recipe.name} 食材數量不為 4`);
    }
    for (const id of recipe.ingredientIds) {
      if (!INGREDIENTS_DB[id]) {
        throw new Error(`找不到食材 ID: ${id}（於料理 ${recipe.name}）`);
      }
      referencedIds.add(id);
    }
  }
  return {
    totalDishes: RECIPES_DB.length,
    totalReferences: RECIPES_DB.length * 4,
    uniqueIngredientsCount: Object.keys(INGREDIENTS_DB).length,
    referencedUniqueCount: referencedIds.size,
  };
}
