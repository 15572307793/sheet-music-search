/**
 * 中英文钢琴术语映射表
 *
 * 用于将中文搜索词翻译为英文，以便在英文数据源中搜索。
 * 包含常见作曲家、曲目名称和音乐术语。
 */
const zhToEnMap: Record<string, string> = {
  // 作曲家
  '莫扎特': 'Mozart',
  '贝多芬': 'Beethoven',
  '巴赫': 'Bach',
  '肖邦': 'Chopin',
  '李斯特': 'Liszt',
  '舒伯特': 'Schubert',
  '舒曼': 'Schumann',
  '柴可夫斯基': 'Tchaikovsky',
  '德彪西': 'Debussy',
  '拉赫玛尼诺夫': 'Rachmaninoff',
  '海顿': 'Haydn',
  '亨德尔': 'Handel',
  '勃拉姆斯': 'Brahms',
  '门德尔松': 'Mendelssohn',
  '车尔尼': 'Czerny',
  '克莱门蒂': 'Clementi',
  '布格缪勒': 'Burgmuller',
  '汤普森': 'Thompson',
  '拜厄': 'Beyer',
  '哈农': 'Hanon',
  '久石让': 'Joe Hisaishi',
  '理查德克莱德曼': 'Richard Clayderman',
  '克莱德曼': 'Clayderman',
  '坂本龙一': 'Ryuichi Sakamoto',

  // 常见曲目
  '致爱丽丝': 'Fur Elise',
  '月光奏鸣曲': 'Moonlight Sonata',
  '月光': 'Moonlight Sonata',
  '悲怆': 'Pathetique Sonata',
  '悲怆奏鸣曲': 'Pathetique Sonata',
  '热情奏鸣曲': 'Appassionata',
  '命运交响曲': 'Symphony No.5 Beethoven',
  '欢乐颂': 'Ode to Joy',
  '小星星': 'Twinkle Twinkle Little Star',
  '小星星变奏曲': 'Twinkle Twinkle Little Star Variations Mozart',
  '土耳其进行曲': 'Turkish March Mozart',
  '卡农': 'Canon Pachelbel',
  '梦中的婚礼': 'Mariage d Amour',
  '天空之城': 'Castle in the Sky',
  '千与千寻': 'Spirited Away Always with Me',
  '菊次郎的夏天': 'Summer Joe Hisaishi',
  '夜的钢琴曲': '"Erta" piano',
  '克罗地亚狂想曲': 'Croatian Rhapsody',
  '秋日私语': 'A Comme Amour',
  '水边的阿狄丽娜': 'Ballade Pour Adeline',
  '少女的祈祷': 'Maiden Prayer',
  '幻想即兴曲': 'Fantaisie Impromptu',
  '革命练习曲': 'Revolutionary Etude',
  '英雄波兰舞曲': 'Heroic Polonaise',
  '雨滴前奏曲': 'Raindrop Prelude',
  '小狗圆舞曲': 'Minute Waltz',
  '春之歌': 'Spring Song Mendelssohn',
  '梦幻曲': 'Traumerei',
  '爱之梦': 'Liebestraum',
  '钟': 'La Campanella',
  '匈牙利狂想曲': 'Hungarian Rhapsody',
  '四小天鹅': 'Dance of the Little Swans',
  '船歌': 'Barcarolle',
  '圆舞曲': 'Waltz',
  '奏鸣曲': 'Sonata',
  '协奏曲': 'Concerto',
  '练习曲': 'Etude',
  '前奏曲': 'Prelude',
  '夜曲': 'Nocturne',
  '即兴曲': 'Impromptu',
  '波兰舞曲': 'Polonaise',
  '玛祖卡': 'Mazurka',
  '谐谑曲': 'Scherzo',
  '叙事曲': 'Ballade',
  '回旋曲': 'Rondo',
  '变奏曲': 'Variations',
  '赋格': 'Fugue',
  '创意曲': 'Invention',
  '小步舞曲': 'Minuet',

  // 考级相关
  '考级': 'grade exam',
  '一级': 'Grade 1',
  '二级': 'Grade 2',
  '三级': 'Grade 3',
  '四级': 'Grade 4',
  '五级': 'Grade 5',
  '六级': 'Grade 6',
  '七级': 'Grade 7',
  '八级': 'Grade 8',
  '九级': 'Grade 9',
  '十级': 'Grade 10',
};

/**
 * 检测查询是否包含中文字符
 */
function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/**
 * 将中文查询翻译为英文
 *
 * 策略：
 * 1. 先尝试完整匹配
 * 2. 再尝试部分匹配（替换已知的中文词汇）
 * 3. 如果没有匹配项，返回原始查询
 *
 * @returns 翻译后的英文查询，如果无法翻译则返回 null
 */
export function translateToEnglish(query: string): string | null {
  if (!containsChinese(query)) return null;

  const trimmed = query.trim();

  // 完整匹配
  if (zhToEnMap[trimmed]) {
    return zhToEnMap[trimmed];
  }

  // 部分匹配：替换已知词汇
  let translated = trimmed;
  let hasTranslation = false;

  // 按长度降序排列，优先匹配长词
  const sortedKeys = Object.keys(zhToEnMap).sort((a, b) => b.length - a.length);

  for (const zh of sortedKeys) {
    if (translated.includes(zh)) {
      translated = translated.replace(zh, zhToEnMap[zh]);
      hasTranslation = true;
    }
  }

  return hasTranslation ? translated : null;
}

/**
 * 获取搜索查询的所有变体（中文原文 + 英文翻译）
 */
export function getQueryVariants(query: string): { chinese: string; english: string | null } {
  return {
    chinese: query,
    english: translateToEnglish(query),
  };
}
