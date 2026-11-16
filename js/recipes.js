/**
 * 《台灣夜市料理秀》V2.0 完整 50 道料理與共用食材資料庫
 * - 總計 50 道台灣夜市經典美食（煎台、油炸、炭烤、熱食與湯品、甜點與飲料 五大類各 10 道）
 * - 每項食材皆標註烹飪手感分類 prepType：
 *   'cut'      🔪 切菜刀法（光刃斜切＋食材切開成兩半）
 *   'sprinkle' 🧂 撒粉／淋醬（金色粉塵星雨或琥珀醬汁弧線＋不切半）
 *   'pour'     🥣 倒料／下鍋（料粒彈跳與水花波紋＋不切半）
 *   'flip'     🔥 翻面／夾取（360° 翻面跳躍與焦香鍋氣＋不切半）
 */
export const INGREDIENTS_DB = {
  // 1. 蛋奶與豆製品
  egg:                { id: 'egg',                name: '雞蛋',       prepType: 'flip',     img: 'assets/ingredients/egg.webp' },
  preserved_egg:      { id: 'preserved_egg',      name: '滷蛋',       prepType: 'cut',      img: 'assets/ingredients/preserved_egg.webp' },
  salted_egg_yolk:    { id: 'salted_egg_yolk',    name: '鹹蛋黃',     prepType: 'pour',     img: 'assets/ingredients/salted_egg_yolk.webp' },
  milk:               { id: 'milk',               name: '牛奶',       prepType: 'pour',     img: 'assets/ingredients/milk.webp' },
  condensed_milk:     { id: 'condensed_milk',     name: '煉乳',       prepType: 'sprinkle', img: 'assets/ingredients/condensed_milk.webp' },
  cheese:             { id: 'cheese',             name: '起司',       prepType: 'flip',     img: 'assets/ingredients/cheese.webp' },
  tofu:               { id: 'tofu',               name: '豆腐',       prepType: 'cut',      img: 'assets/ingredients/tofu.webp' },
  fried_tofu:         { id: 'fried_tofu',         name: '油豆腐',     prepType: 'cut',      img: 'assets/ingredients/fried_tofu.webp' },
  tofu_pudding:       { id: 'tofu_pudding',       name: '豆花',       prepType: 'pour',     img: 'assets/ingredients/tofu_pudding.webp' },

  // 2. 粉漿、麵食與主食外皮
  batter:             { id: 'batter',             name: '粉漿／麵糊', prepType: 'pour',     img: 'assets/ingredients/batter.webp' },
  sweet_potato_flour: { id: 'sweet_potato_flour', name: '地瓜粉',     prepType: 'sprinkle', img: 'assets/ingredients/sweet_potato_flour.webp' },
  coating_flour:      { id: 'coating_flour',      name: '裹粉',       prepType: 'sprinkle', img: 'assets/ingredients/coating_flour.webp' },
  dough:              { id: 'dough',              name: '麵團',       prepType: 'flip',     img: 'assets/ingredients/dough.webp' },
  crepe_skin:         { id: 'crepe_skin',         name: '餅皮',       prepType: 'flip',     img: 'assets/ingredients/crepe_skin.webp' },
  turnip_cake:        { id: 'turnip_cake',        name: '蘿蔔糕',     prepType: 'cut',      img: 'assets/ingredients/turnip_cake.webp' },
  noodles:            { id: 'noodles',            name: '麵條',       prepType: 'pour',     img: 'assets/ingredients/noodles.webp' },
  vermicelli:         { id: 'vermicelli',         name: '麵線',       prepType: 'pour',     img: 'assets/ingredients/vermicelli.webp' },
  white_rice:         { id: 'white_rice',         name: '白飯',       prepType: 'pour',     img: 'assets/ingredients/white_rice.webp' },
  bawan_skin:         { id: 'bawan_skin',         name: '肉圓皮',     prepType: 'flip',     img: 'assets/ingredients/bawan_skin.webp' },
  silver_roll:        { id: 'silver_roll',        name: '銀絲卷',     prepType: 'cut',      img: 'assets/ingredients/silver_roll.webp' },
  rice_sausage:       { id: 'rice_sausage',       name: '糯米腸',     prepType: 'cut',      img: 'assets/ingredients/rice_sausage.webp' },
  gua_bao_bun:        { id: 'gua_bao_bun',        name: '刈包皮',     prepType: 'flip',     img: 'assets/ingredients/gua_bao_bun.webp' },
  popiah_skin:        { id: 'popiah_skin',        name: '潤餅皮',     prepType: 'flip',     img: 'assets/ingredients/popiah_skin.webp' },

  // 3. 肉類、海鮮與火鍋料
  oyster:             { id: 'oyster',             name: '蚵仔',       prepType: 'pour',     img: 'assets/ingredients/oyster.webp' },
  octopus:            { id: 'octopus',            name: '章魚',       prepType: 'cut',      img: 'assets/ingredients/octopus.webp' },
  squid:              { id: 'squid',              name: '魷魚',       prepType: 'cut',      img: 'assets/ingredients/squid.webp' },
  meat_slices:        { id: 'meat_slices',        name: '肉片',       prepType: 'cut',      img: 'assets/ingredients/meat_slices.webp' },
  beef_steak:         { id: 'beef_steak',         name: '牛排',       prepType: 'cut',      img: 'assets/ingredients/beef_steak.webp' },
  chicken_fillet:     { id: 'chicken_fillet',     name: '雞排',       prepType: 'cut',      img: 'assets/ingredients/chicken_fillet.webp' },
  chicken_meat:       { id: 'chicken_meat',       name: '雞肉',       prepType: 'cut',      img: 'assets/ingredients/chicken_meat.webp' },
  chicken_wing:       { id: 'chicken_wing',       name: '雞翅',       prepType: 'flip',     img: 'assets/ingredients/chicken_wing.webp' },
  tempura:            { id: 'tempura',            name: '甜不辣',     prepType: 'cut',      img: 'assets/ingredients/tempura.webp' },
  sausage:            { id: 'sausage',            name: '香腸',       prepType: 'cut',      img: 'assets/ingredients/sausage.webp' },
  blood_cake:         { id: 'blood_cake',         name: '米血',       prepType: 'cut',      img: 'assets/ingredients/blood_cake.webp' },
  braised_pork:       { id: 'braised_pork',       name: '滷肉',       prepType: 'pour',     img: 'assets/ingredients/braised_pork.webp' },
  intestine:          { id: 'intestine',          name: '大腸',       prepType: 'cut',      img: 'assets/ingredients/intestine.webp' },
  pork_filling:       { id: 'pork_filling',       name: '豬肉餡',     prepType: 'pour',     img: 'assets/ingredients/pork_filling.webp' },
  pork_ribs:          { id: 'pork_ribs',          name: '排骨',       prepType: 'pour',     img: 'assets/ingredients/pork_ribs.webp' },
  fish_cake:          { id: 'fish_cake',          name: '魚板',       prepType: 'cut',      img: 'assets/ingredients/fish_cake.webp' },
  meatball:           { id: 'meatball',           name: '貢丸',       prepType: 'pour',     img: 'assets/ingredients/meatball.webp' },

  // 4. 蔬菜、菇類與辛香配料
  greens:               { id: 'greens',               name: '青菜',       prepType: 'cut',      img: 'assets/ingredients/greens.webp' },
  cabbage:              { id: 'cabbage',              name: '高麗菜',     prepType: 'cut',      img: 'assets/ingredients/cabbage.webp' },
  scallion:             { id: 'scallion',             name: '蔥花',       prepType: 'sprinkle', img: 'assets/ingredients/scallion.webp' },
  onion:                { id: 'onion',                name: '洋蔥',       prepType: 'cut',      img: 'assets/ingredients/onion.webp' },
  garlic_minced:        { id: 'garlic_minced',        name: '蒜末',       prepType: 'sprinkle', img: 'assets/ingredients/garlic_minced.webp' },
  garlic_slices:        { id: 'garlic_slices',        name: '蒜片',       prepType: 'sprinkle', img: 'assets/ingredients/garlic_slices.webp' },
  garlic_paste:         { id: 'garlic_paste',         name: '蒜泥',       prepType: 'sprinkle', img: 'assets/ingredients/garlic_paste.webp' },
  basil:                { id: 'basil',                name: '九層塔',     prepType: 'sprinkle', img: 'assets/ingredients/basil.webp' },
  cilantro:             { id: 'cilantro',             name: '香菜',       prepType: 'sprinkle', img: 'assets/ingredients/cilantro.webp' },
  corn:                 { id: 'corn',                 name: '玉米',       prepType: 'flip',     img: 'assets/ingredients/corn.webp' },
  green_pepper:         { id: 'green_pepper',         name: '青椒',       prepType: 'cut',      img: 'assets/ingredients/green_pepper.webp' },
  kimchi:               { id: 'kimchi',               name: '泡菜',       prepType: 'pour',     img: 'assets/ingredients/kimchi.webp' },
  pickled_veg:          { id: 'pickled_veg',          name: '酸菜',       prepType: 'sprinkle', img: 'assets/ingredients/pickled_veg.webp' },
  bamboo_shoots:        { id: 'bamboo_shoots',        name: '筍丁',       prepType: 'cut',      img: 'assets/ingredients/bamboo_shoots.webp' },
  white_radish:         { id: 'white_radish',         name: '白蘿蔔',     prepType: 'cut',      img: 'assets/ingredients/white_radish.webp' },
  sweet_potato_mash:    { id: 'sweet_potato_mash',    name: '地瓜泥',     prepType: 'flip',     img: 'assets/ingredients/sweet_potato_mash.webp' },
  taro_mash:            { id: 'taro_mash',            name: '芋泥',       prepType: 'flip',     img: 'assets/ingredients/taro_mash.webp' },
  king_oyster_mushroom: { id: 'king_oyster_mushroom', name: '杏鮑菇',     prepType: 'cut',      img: 'assets/ingredients/king_oyster_mushroom.webp' },

  // 5. 中藥材、調味料與醬料
  angelica:       { id: 'angelica',       name: '當歸',     prepType: 'pour',     img: 'assets/ingredients/angelica.webp' },
  goji:           { id: 'goji',           name: '枸杞',     prepType: 'sprinkle', img: 'assets/ingredients/goji.webp' },
  red_dates:      { id: 'red_dates',      name: '紅棗',     prepType: 'pour',     img: 'assets/ingredients/red_dates.webp' },
  barley_herbs:   { id: 'barley_herbs',   name: '薏仁蓮子', prepType: 'pour',     img: 'assets/ingredients/barley_herbs.webp' },
  rice_wine:      { id: 'rice_wine',      name: '米酒薑絲', prepType: 'pour',     img: 'assets/ingredients/rice_wine.webp' },
  pepper:         { id: 'pepper',         name: '胡椒',     prepType: 'sprinkle', img: 'assets/ingredients/pepper.webp' },
  pepper_powder:  { id: 'pepper_powder',  name: '胡椒粉',   prepType: 'sprinkle', img: 'assets/ingredients/pepper_powder.webp' },
  chili_powder:   { id: 'chili_powder',   name: '辣粉',     prepType: 'sprinkle', img: 'assets/ingredients/chili_powder.webp' },
  plum_powder:    { id: 'plum_powder',    name: '梅粉',     prepType: 'sprinkle', img: 'assets/ingredients/plum_powder.webp' },
  sugar:          { id: 'sugar',          name: '糖',       prepType: 'sprinkle', img: 'assets/ingredients/sugar.webp' },
  sesame:         { id: 'sesame',         name: '芝麻',     prepType: 'sprinkle', img: 'assets/ingredients/sesame.webp' },
  peanut_powder:  { id: 'peanut_powder',  name: '花生粉',   prepType: 'sprinkle', img: 'assets/ingredients/peanut_powder.webp' },
  sauce:          { id: 'sauce',          name: '醬汁',     prepType: 'sprinkle', img: 'assets/ingredients/sauce.webp' },
  soy_paste:      { id: 'soy_paste',      name: '醬油膏',   prepType: 'sprinkle', img: 'assets/ingredients/soy_paste.webp' },
  shacha:         { id: 'shacha',         name: '沙茶',     prepType: 'sprinkle', img: 'assets/ingredients/shacha.webp' },
  chili_sauce:    { id: 'chili_sauce',    name: '辣醬',     prepType: 'sprinkle', img: 'assets/ingredients/chili_sauce.webp' },

  // 6. 水果、甜點配料與冰飲基底
  tapioca:          { id: 'tapioca',          name: '珍珠',     prepType: 'pour',     img: 'assets/ingredients/tapioca.webp' },
  tapioca_balls:    { id: 'tapioca_balls',    name: '粉圓',     prepType: 'pour',     img: 'assets/ingredients/tapioca_balls.webp' },
  taro_balls:       { id: 'taro_balls',       name: '芋圓',     prepType: 'pour',     img: 'assets/ingredients/taro_balls.webp' },
  black_tea:        { id: 'black_tea',        name: '紅茶',     prepType: 'pour',     img: 'assets/ingredients/black_tea.webp' },
  ice:              { id: 'ice',              name: '冰塊',     prepType: 'pour',     img: 'assets/ingredients/ice.webp' },
  shaved_ice:       { id: 'shaved_ice',       name: '剉冰',     prepType: 'pour',     img: 'assets/ingredients/shaved_ice.webp' },
  mango:            { id: 'mango',            name: '芒果',     prepType: 'cut',      img: 'assets/ingredients/mango.webp' },
  mango_sauce:      { id: 'mango_sauce',      name: '芒果醬',   prepType: 'sprinkle', img: 'assets/ingredients/mango_sauce.webp' },
  papaya:           { id: 'papaya',           name: '木瓜',     prepType: 'cut',      img: 'assets/ingredients/papaya.webp' },
  lemon:            { id: 'lemon',            name: '檸檬',     prepType: 'cut',      img: 'assets/ingredients/lemon.webp' },
  aiyu_jelly:       { id: 'aiyu_jelly',       name: '愛玉',     prepType: 'cut',      img: 'assets/ingredients/aiyu_jelly.webp' },
  grass_jelly:      { id: 'grass_jelly',      name: '仙草',     prepType: 'cut',      img: 'assets/ingredients/grass_jelly.webp' },
  red_bean_filling: { id: 'red_bean_filling', name: '紅豆餡',   prepType: 'pour',     img: 'assets/ingredients/red_bean_filling.webp' },
  custard:          { id: 'custard',          name: '奶油餡',   prepType: 'pour',     img: 'assets/ingredients/custard.webp' },
  strawberry:       { id: 'strawberry',       name: '草莓',     prepType: 'cut',      img: 'assets/ingredients/strawberry.webp' },
  tomato:           { id: 'tomato',           name: '番茄',     prepType: 'cut',      img: 'assets/ingredients/tomato.webp' },
  grape:            { id: 'grape',            name: '葡萄',     prepType: 'cut',      img: 'assets/ingredients/grape.webp' },
  syrup:            { id: 'syrup',            name: '糖漿',     prepType: 'sprinkle', img: 'assets/ingredients/syrup.webp' },
  peanut:           { id: 'peanut',           name: '花生',     prepType: 'pour',     img: 'assets/ingredients/peanut.webp' },
  red_bean:         { id: 'red_bean',         name: '紅豆',     prepType: 'pour',     img: 'assets/ingredients/red_bean.webp' },
};

export const RECIPES_DB = [
  // A. 煎台料理（10 道）
  { id: 'oyster_omelet',             category: '煎台料理', name: '蚵仔煎',   finishImg: 'assets/dishes/oyster_omelet.webp',             finishText: '淋上甜辣醬，熱騰騰蚵仔煎出餐！', ingredientIds: ['egg', 'batter', 'oyster', 'greens'] },
  { id: 'scallion_pancake',          category: '煎台料理', name: '蔥油餅',   finishImg: 'assets/dishes/scallion_pancake.webp',          finishText: '煎到兩面金黃酥脆，蔥香四溢！',   ingredientIds: ['dough', 'scallion', 'egg', 'pepper'] },
  { id: 'egg_crepe',                 category: '煎台料理', name: '蛋餅',     finishImg: 'assets/dishes/egg_crepe.webp',                 finishText: '捲起濃郁起司與蔥蛋，美味出餐！', ingredientIds: ['crepe_skin', 'egg', 'scallion', 'cheese'] },
  { id: 'turnip_cake',               category: '煎台料理', name: '蘿蔔糕',   finishImg: 'assets/dishes/turnip_cake.webp',               finishText: '外酥內嫩淋蒜蓉醬油，出餐！',     ingredientIds: ['turnip_cake', 'egg', 'garlic_minced', 'scallion'] },
  { id: 'takoyaki',                  category: '煎台料理', name: '章魚燒',   finishImg: 'assets/dishes/takoyaki.webp',                  finishText: '翻轉渾圓金黃，撒滿柴魚片出餐！', ingredientIds: ['batter', 'octopus', 'cabbage', 'scallion'] },
  { id: 'teppan_noodles',            category: '煎台料理', name: '鐵板麵',   finishImg: 'assets/dishes/teppan_noodles.webp',            finishText: '黑胡椒鐵板滋滋作響，澎湃出餐！', ingredientIds: ['noodles', 'meat_slices', 'onion', 'greens'] },
  { id: 'pan_fried_bun',             category: '煎台料理', name: '水煎包',   finishImg: 'assets/dishes/pan_fried_bun.webp',             finishText: '底部金黃焦脆、內餡多汁，出爐！', ingredientIds: ['dough', 'cabbage', 'pork_filling', 'sesame'] },
  { id: 'scallion_shredded_pancake', category: '煎台料理', name: '蔥抓餅',   finishImg: 'assets/dishes/scallion_shredded_pancake.webp', finishText: '拍鬆千層酥脆夾九層塔蛋，出餐！', ingredientIds: ['crepe_skin', 'scallion', 'egg', 'basil'] },
  { id: 'potstickers',               category: '煎台料理', name: '鍋貼',     finishImg: 'assets/dishes/potstickers.webp',               finishText: '冰花脆底配鮮甜高麗菜肉餡，上桌！', ingredientIds: ['dough', 'pork_filling', 'cabbage', 'soy_paste'] },
  { id: 'night_market_steak',        category: '煎台料理', name: '夜市牛排', finishImg: 'assets/dishes/night_market_steak.webp',        finishText: '鐵板牛排配半熟蛋與鐵板麵，上桌！', ingredientIds: ['beef_steak', 'noodles', 'egg', 'sauce'] },

  // B. 油炸料理（10 道）
  { id: 'fried_chicken_fillet',       category: '油炸料理', name: '香雞排',   finishImg: 'assets/dishes/fried_chicken_fillet.webp',       finishText: '比臉還大的金黃酥脆雞排，出餐！', ingredientIds: ['chicken_fillet', 'sweet_potato_flour', 'pepper_powder', 'chili_powder'] },
  { id: 'popcorn_chicken',            category: '油炸料理', name: '鹽酥雞',   finishImg: 'assets/dishes/popcorn_chicken.webp',            finishText: '九層塔爆香配蒜片，宵夜首選！',   ingredientIds: ['chicken_meat', 'basil', 'garlic_slices', 'pepper_powder'] },
  { id: 'sweet_potato_balls',         category: '油炸料理', name: '地瓜球',   finishImg: 'assets/dishes/sweet_potato_balls.webp',         finishText: '按壓膨脹Ｑ彈酥脆，金黃出鍋！',   ingredientIds: ['sweet_potato_mash', 'sweet_potato_flour', 'sugar', 'sesame'] },
  { id: 'fried_squid',                category: '油炸料理', name: '炸魷魚',   finishImg: 'assets/dishes/fried_squid.webp',                finishText: '彈牙鮮甜配蒜片胡椒，超涮嘴！',   ingredientIds: ['squid', 'coating_flour', 'garlic_slices', 'pepper_powder'] },
  { id: 'fried_tempura',              category: '油炸料理', name: '炸甜不辣', finishImg: 'assets/dishes/fried_tempura.webp',              finishText: '炸到澎起金黃，撒滿胡椒粉出餐！', ingredientIds: ['tempura', 'garlic_minced', 'basil', 'pepper_powder'] },
  { id: 'fried_wings',                category: '油炸料理', name: '炸雞翅',   finishImg: 'assets/dishes/fried_wings.webp',                finishText: '皮脆肉多汁，香辣過癮出餐！',     ingredientIds: ['chicken_wing', 'coating_flour', 'pepper_powder', 'chili_powder'] },
  { id: 'fried_king_oyster_mushroom', category: '油炸料理', name: '炸杏鮑菇', finishImg: 'assets/dishes/fried_king_oyster_mushroom.webp', finishText: '外酥內揪C，九層塔椒鹽飄香！',   ingredientIds: ['king_oyster_mushroom', 'coating_flour', 'basil', 'pepper_powder'] },
  { id: 'sweet_potato_fries',         category: '油炸料理', name: '地瓜薯條', finishImg: 'assets/dishes/sweet_potato_fries.webp',         finishText: '綿密甘甜撒滿酸甜梅粉，出餐！',   ingredientIds: ['sweet_potato_mash', 'sweet_potato_flour', 'plum_powder', 'pepper_powder'] },
  { id: 'fried_silver_roll',          category: '油炸料理', name: '炸銀絲卷', finishImg: 'assets/dishes/fried_silver_roll.webp',          finishText: '金黃酥脆淋上滿滿煉乳花生粉！',   ingredientIds: ['silver_roll', 'condensed_milk', 'peanut_powder', 'sesame'] },
  { id: 'fried_taro_balls',           category: '油炸料理', name: '炸芋丸',   finishImg: 'assets/dishes/fried_taro_balls.webp',           finishText: '綿密芋泥包金沙鹹蛋黃，酥脆出鍋！', ingredientIds: ['taro_mash', 'salted_egg_yolk', 'coating_flour', 'sesame'] },

  // C. 炭烤料理（10 道）
  { id: 'grilled_sausage',         category: '炭烤料理', name: '烤香腸',     finishImg: 'assets/dishes/grilled_sausage.webp',         finishText: '炭火烤出油亮焦香，配蒜片最對味！', ingredientIds: ['sausage', 'garlic_slices', 'pepper', 'sauce'] },
  { id: 'grilled_corn',            category: '炭烤料理', name: '烤玉米',     finishImg: 'assets/dishes/grilled_corn.webp',            finishText: '刷上獨門沙茶醬，炭香十足出餐！',   ingredientIds: ['corn', 'soy_paste', 'shacha', 'chili_powder'] },
  { id: 'chicken_skewer',          category: '炭烤料理', name: '雞肉串',     finishImg: 'assets/dishes/chicken_skewer.webp',          finishText: '肉嫩蔬菜甜，刷醬炭烤完成！',       ingredientIds: ['chicken_meat', 'onion', 'green_pepper', 'sauce'] },
  { id: 'grilled_squid',           category: '炭烤料理', name: '烤魷魚',     finishImg: 'assets/dishes/grilled_squid.webp',           finishText: '整隻炭烤刷甜醬撒白芝麻，出餐！',   ingredientIds: ['squid', 'garlic_minced', 'sauce', 'sesame'] },
  { id: 'pig_blood_cake',          category: '炭烤料理', name: '米血糕',     finishImg: 'assets/dishes/pig_blood_cake.webp',          finishText: '裹滿花生粉與香菜，道地古早味！',   ingredientIds: ['blood_cake', 'peanut_powder', 'cilantro', 'soy_paste'] },
  { id: 'grilled_tempura',         category: '炭烤料理', name: '烤甜不辣',   finishImg: 'assets/dishes/grilled_tempura.webp',         finishText: '炭烤微焦刷甜醬，撒芝麻香噴噴！',   ingredientIds: ['tempura', 'sauce', 'sesame', 'chili_powder'] },
  { id: 'sausage_in_rice_sausage', category: '炭烤料理', name: '大腸包小腸', finishImg: 'assets/dishes/sausage_in_rice_sausage.webp', finishText: '炭烤糯米腸夾多汁香腸配酸菜蒜片！', ingredientIds: ['rice_sausage', 'sausage', 'garlic_slices', 'pickled_veg'] },
  { id: 'grilled_chicken_roll',    category: '炭烤料理', name: '烤雞腿捲',   finishImg: 'assets/dishes/grilled_chicken_roll.webp',    finishText: '黃金脆皮鎖住滿滿肉汁，撒蔥出餐！', ingredientIds: ['chicken_meat', 'green_pepper', 'onion', 'sauce'] },
  { id: 'pepper_bun',              category: '炭烤料理', name: '胡椒餅',     finishImg: 'assets/dishes/pepper_bun.webp',              finishText: '貼爐炭烤酥殼、爆汁蔥香胡椒肉餡！', ingredientIds: ['dough', 'pork_filling', 'scallion', 'pepper'] },
  { id: 'diced_beef',              category: '炭烤料理', name: '骰子牛',     finishImg: 'assets/dishes/diced_beef.webp',              finishText: '大火炙燒鎖住肉汁，配洋蔥蒜片出餐！', ingredientIds: ['beef_steak', 'garlic_slices', 'onion', 'pepper'] },

  // D. 熱食與湯品（10 道）
  { id: 'stinky_tofu',       category: '熱食與湯品', name: '臭豆腐',   finishImg: 'assets/dishes/stinky_tofu.webp',       finishText: '外酥內嫩塞滿爽脆台式泡菜，出餐！', ingredientIds: ['tofu', 'kimchi', 'garlic_paste', 'chili_sauce'] },
  { id: 'braised_pork_rice', category: '熱食與湯品', name: '滷肉飯',   finishImg: 'assets/dishes/braised_pork_rice.webp', finishText: '淋上油亮肉燥配滷蛋酸菜，開動！',   ingredientIds: ['white_rice', 'braised_pork', 'pickled_veg', 'preserved_egg'] },
  { id: 'oyster_vermicelli', category: '熱食與湯品', name: '蚵仔麵線', finishImg: 'assets/dishes/oyster_vermicelli.webp', finishText: '大腸蚵仔料滿滿，撒上香菜出餐！',   ingredientIds: ['vermicelli', 'oyster', 'intestine', 'cilantro'] },
  { id: 'bawan',             category: '熱食與湯品', name: '肉圓',     finishImg: 'assets/dishes/bawan.webp',             finishText: 'Ｑ彈外皮包鮮肉筍丁淋米醬，完成！', ingredientIds: ['bawan_skin', 'pork_filling', 'bamboo_shoots', 'cilantro'] },
  { id: 'herbal_pork_ribs',  category: '熱食與湯品', name: '藥燉排骨', finishImg: 'assets/dishes/herbal_pork_ribs.webp',  finishText: '溫潤甘甜中藥湯頭，暖心補氣上桌！', ingredientIds: ['pork_ribs', 'angelica', 'goji', 'red_dates'] },
  { id: 'oden',              category: '熱食與湯品', name: '關東煮',   finishImg: 'assets/dishes/oden.webp',              finishText: '清甜高湯煮透好料沾甜辣醬，出餐！', ingredientIds: ['white_radish', 'fish_cake', 'meatball', 'fried_tofu'] },
  { id: 'gua_bao',           category: '熱食與湯品', name: '刈包',     finishImg: 'assets/dishes/gua_bao.webp',           finishText: '白胖餅皮夾控肉花生粉香菜，出餐！', ingredientIds: ['gua_bao_bun', 'braised_pork', 'peanut_powder', 'cilantro'] },
  { id: 'popiah_roll',       category: '熱食與湯品', name: '潤餅',     finishImg: 'assets/dishes/popiah_roll.webp',       finishText: '薄Q餅皮包滿爽脆高麗菜與花生糖粉！', ingredientIds: ['popiah_skin', 'cabbage', 'peanut_powder', 'sugar'] },
  { id: 'heated_luwei',      category: '熱食與湯品', name: '加熱滷味', finishImg: 'assets/dishes/heated_luwei.webp',      finishText: '老滷汁涮燙入味撒滿蔥花，熱騰出餐！', ingredientIds: ['tofu', 'blood_cake', 'greens', 'sauce'] },
  { id: 'four_herbs_soup',   category: '熱食與湯品', name: '四神湯',   finishImg: 'assets/dishes/four_herbs_soup.webp',   finishText: '濃醇薏仁蓮子大腸湯加點米酒香，上桌！', ingredientIds: ['intestine', 'barley_herbs', 'pork_ribs', 'rice_wine'] },

  // E. 甜點與飲料（10 道）
  { id: 'bubble_tea',        category: '甜點與飲料', name: '珍珠奶茶',   finishImg: 'assets/dishes/bubble_tea.webp',        finishText: 'Ｑ彈黑糖珍珠配香醇厚奶茶，出杯！', ingredientIds: ['tapioca', 'black_tea', 'milk', 'ice'] },
  { id: 'mango_shaved_ice',  category: '甜點與飲料', name: '芒果冰',     finishImg: 'assets/dishes/mango_shaved_ice.webp',  finishText: '滿滿新鮮愛文芒果淋煉乳，清涼上桌！', ingredientIds: ['shaved_ice', 'mango', 'condensed_milk', 'mango_sauce'] },
  { id: 'wheel_pie',         category: '甜點與飲料', name: '紅豆餅',     finishImg: 'assets/dishes/wheel_pie.webp',         finishText: '爆餡紅豆與奶油雙重享受，熱騰出爐！', ingredientIds: ['batter', 'red_bean_filling', 'custard', 'sesame'] },
  { id: 'egg_cake',          category: '甜點與飲料', name: '雞蛋糕',     finishImg: 'assets/dishes/egg_cake.webp',          finishText: '現烤出爐蛋奶香撲鼻，外酥內軟！',   ingredientIds: ['batter', 'egg', 'milk', 'sugar'] },
  { id: 'tanghulu',          category: '甜點與飲料', name: '糖葫蘆',     finishImg: 'assets/dishes/tanghulu.webp',          finishText: '晶瑩脆甜糖衣包裹鮮果，酸甜出餐！', ingredientIds: ['strawberry', 'tomato', 'grape', 'syrup'] },
  { id: 'tofu_pudding',      category: '甜點與飲料', name: '豆花',       finishImg: 'assets/dishes/tofu_pudding.webp',      finishText: '綿密古早味豆花配花生粉圓紅豆！',   ingredientIds: ['tofu_pudding', 'peanut', 'tapioca_balls', 'red_bean'] },
  { id: 'papaya_milk',       category: '甜點與飲料', name: '木瓜牛奶',   finishImg: 'assets/dishes/papaya_milk.webp',       finishText: '濃郁熟成木瓜鮮奶冰沙，香醇出杯！', ingredientIds: ['papaya', 'milk', 'syrup', 'ice'] },
  { id: 'aiyu_jelly_ice',    category: '甜點與飲料', name: '愛玉檸檬冰', finishImg: 'assets/dishes/aiyu_jelly_ice.webp',    finishText: '手洗晶瑩愛玉配鮮榨檸檬糖水，透心涼！', ingredientIds: ['aiyu_jelly', 'lemon', 'syrup', 'ice'] },
  { id: 'grass_jelly_soup',  category: '甜點與飲料', name: '燒仙草',     finishImg: 'assets/dishes/grass_jelly_soup.webp',  finishText: '濃滑熱仙草鋪滿芋圓粉圓硬花生，暖心！', ingredientIds: ['grass_jelly', 'peanut', 'tapioca_balls', 'red_bean'] },
  { id: 'taro_ball_dessert', category: '甜點與飲料', name: '芋圓甜湯',   finishImg: 'assets/dishes/taro_ball_dessert.webp', finishText: 'Ｑ彈芋圓地瓜圓配紅豆花生糖水，出餐！', ingredientIds: ['taro_balls', 'red_bean', 'peanut', 'syrup'] },
];

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
