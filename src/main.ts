import { App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, FuzzySuggestModal, Modal } from 'obsidian';

export const VIEW_TYPE_MERIDIAN = "meridian-clock-view";
const padZero = (n: number | string) => Number(n) < 10 ? '0' + n : String(n);

// =================================================================
// 1. 国际化字典 & 严格中英隔离
// =================================================================
const TEXTS: Record<string, any> = {
    en: {
        settingsTitle: "Meridian Settings", preview: "Live Preview", langName: "Language", 
        secOfficial: "✨ Official Presets", secCollection: "⭐ My Presets", btnSavePreset: "Save Current Preset", emptyCollection: "No saved presets",
        secLang: "🌐 Language", secColor: "🎨 Colors", secGeo: "⚙️ Geometry", secHands: "⏱️ Hands & Date", secTz: "📍 Timezones & Custom Cities",
        tabAnalog: "🕰️ Analog", tabDigital: "📟 Digital", worldClock: "Enable World Clock (2x2)", 
        colorName: "Accent Color", bgName: "Background Color", numColorName: "Numbers Color", 
        tickColorName: "Ticks Color", hHandColorName: "Hour Hand", mHandColorName: "Minute Hand", colorCustom: "Custom Picker",
        outerRing: "Outer Ring Design", innerRing: "Inner Ring Design", secMode: "Second Hand Mode", showDate: "Show Date",
        optTicks: "Standard Ticks", optDense: "Dense Ticks", optUniform: "Uniform Ticks", optDotsLines: "Dots & Lines",
        optNumbers: "Numbers", optHidden: "Hidden", optSweep: "Sweep", optTick: "Tick",
        digiTimeColor: "Time Color", digiSecColor: "Seconds Color", digiSecSize: "Seconds Size", optSmall: "Small", optLarge: "Large",
        tzMain: "Primary City", tzWorld: "World Clock Slot", btnSearch: "Search / Select...", fontTitle: "🔤 Typography", saveModalTitle: "Save Custom Preset",
        saveInput: "Enter preset name...", btnSave: "Save", btnDelete: "Delete",
        customCitiesTitle: "🌍 Custom Cities Management", btnAddCity: "Add Custom City", customCityEmpty: "No custom cities added yet.", addCityModalTitle: "Create Custom City",
        modalEnName: "English Name", modalZhName: "Chinese Name", modalTz: "Base Timezone", modalTzDesc: "Search & select timezone", phZh: "e.g. My Hometown (ZH)"
    },
    zh: {
        settingsTitle: "Meridian 设置", preview: "实时预览", langName: "语言", 
        secOfficial: "✨ 官方预设", secCollection: "⭐ 我的预设", btnSavePreset: "保存当前预设", emptyCollection: "暂无预设",
        secLang: "🌐 语言", secColor: "🎨 颜色", secGeo: "⚙️ 几何", secHands: "⏱️ 指针与日期", secTz: "📍 城市与时区管理",
        tabAnalog: "🕰️ 钟表", tabDigital: "📟 电子表", worldClock: "开启世界时钟 (四宫格)", 
        colorName: "强调色", bgName: "背景色", numColorName: "数字颜色", 
        tickColorName: "刻度颜色", hHandColorName: "时针颜色", mHandColorName: "分针颜色", colorCustom: "自定义颜色",
        outerRing: "外圈设计", innerRing: "内圈设计", secMode: "秒针运行方式", showDate: "显示日期",
        optTicks: "经典刻度", optDense: "高密刻度", optUniform: "统一刻度", optDotsLines: "圆点与线段",
        optNumbers: "数字", optHidden: "隐藏", optSweep: "丝滑扫动", optTick: "机械跳秒",
        digiTimeColor: "时间颜色", digiSecColor: "秒数颜色", digiSecSize: "秒数大小", optSmall: "小", optLarge: "大",
        tzMain: "主时区", tzWorld: "世界时钟槽位", btnSearch: "搜索 / 选择城市...", fontTitle: "🔤 字体与排版", saveModalTitle: "保存自定义预设",
        saveInput: "输入预设名称...", btnSave: "保存", btnDelete: "删除",
        customCitiesTitle: "🌍 自定义城市管理", btnAddCity: "新增自定义城市", customCityEmpty: "暂无自定义城市", addCityModalTitle: "创建自定义城市",
        modalEnName: "英文名称", modalZhName: "中文名称", modalTz: "关联时区", modalTzDesc: "点击搜索并选择真实时区", phZh: "例如: 我的老家"
    }
};

const COLOR_OPTIONS: Record<string, any> = {
    accent: { en: { '#FF9500': 'Hermès Orange', '#FF3B30': 'Product RED', '#CCFF00': 'Volt Yellow', '#00F5D4': 'Mint Green', '#007AFF': 'Ocean Blue', '#FFFFFF': 'Pure White', 'custom': 'Custom...' }, zh: { '#FF9500': '爱马仕橙', '#FF3B30': '经典红', '#CCFF00': '荧光黄', '#00F5D4': '薄荷绿', '#007AFF': '深海蓝', '#FFFFFF': '纯白', 'custom': '自定义...' } },
    bg: { en: { 'none': 'Transparent', '#798071': 'Sage Green', '#1C2833': 'Navy Blue', '#4A2323': 'Deep Maroon', '#F2F2F7': 'Silver White', '#0A0A0A': 'Deep Black', 'custom': 'Custom...' }, zh: { 'none': '透明', '#798071': '灰绿', '#1C2833': '深蓝', '#4A2323': '酒红', '#F2F2F7': '银白', '#0A0A0A': '深黑', 'custom': '自定义...' } },
    generic: { en: { 'default': 'Theme Adaptive', '#FFFFFF': 'Pure White', '#000000': 'Pure Black', '#FF9500': 'Orange', '#FF3B30': 'Red', '#888888': 'Gray', 'custom': 'Custom...' }, zh: { 'default': '自适应主题', '#FFFFFF': '纯白', '#000000': '纯黑', '#FF9500': '橙色', '#FF3B30': '红色', '#888888': '灰色', 'custom': '自定义...' } }
};

const FONTS: Record<string, any> = {
    en: [ { id: "'Inter', sans-serif", name: "Modern" }, { id: "'Courier New', monospace", name: "Terminal" }, { id: "Impact, sans-serif", name: "Bold" }, { id: "'Times New Roman', serif", name: "Classic" } ],
    zh: [ { id: "'Inter', sans-serif", name: "现代" }, { id: "'Courier New', monospace", name: "终端" }, { id: "Impact, sans-serif", name: "粗体" }, { id: "'Times New Roman', serif", name: "经典" } ]
};

// =================================================================
// 2. 强悍的全球地毯式城市库 (300个手敲核心城市) & 智能时区翻译引擎
// =================================================================
export interface CityDef { id: string; en: string; zh: string; tz: string; isCustom?: boolean; }

// 纯手工录入的全球 300 个核心城市数据库
const CITY_DB: CityDef[] = [
    { id: "local", en: "Local Time", zh: "本地时间", tz: "Local" },
    // 中国与东亚 (China & East Asia)
    { id: "beijing", en: "Beijing", zh: "北京", tz: "Asia/Shanghai" }, { id: "shanghai", en: "Shanghai", zh: "上海", tz: "Asia/Shanghai" }, { id: "guangzhou", en: "Guangzhou", zh: "广州", tz: "Asia/Shanghai" }, { id: "shenzhen", en: "Shenzhen", zh: "深圳", tz: "Asia/Shanghai" },
    { id: "chengdu", en: "Chengdu", zh: "成都", tz: "Asia/Shanghai" }, { id: "chongqing", en: "Chongqing", zh: "重庆", tz: "Asia/Shanghai" }, { id: "hangzhou", en: "Hangzhou", zh: "杭州", tz: "Asia/Shanghai" }, { id: "wuhan", en: "Wuhan", zh: "武汉", tz: "Asia/Shanghai" },
    { id: "xian", en: "Xi'an", zh: "西安", tz: "Asia/Shanghai" }, { id: "nanjing", en: "Nanjing", zh: "南京", tz: "Asia/Shanghai" }, { id: "tianjin", en: "Tianjin", zh: "天津", tz: "Asia/Shanghai" }, { id: "suzhou", en: "Suzhou", zh: "苏州", tz: "Asia/Shanghai" },
    { id: "changsha", en: "Changsha", zh: "长沙", tz: "Asia/Shanghai" }, { id: "zhengzhou", en: "Zhengzhou", zh: "郑州", tz: "Asia/Shanghai" }, { id: "qingdao", en: "Qingdao", zh: "青岛", tz: "Asia/Shanghai" }, { id: "dalian", en: "Dalian", zh: "大连", tz: "Asia/Shanghai" },
    { id: "xiamen", en: "Xiamen", zh: "厦门", tz: "Asia/Shanghai" }, { id: "jinan", en: "Jinan", zh: "济南", tz: "Asia/Shanghai" }, { id: "kunming", en: "Kunming", zh: "昆明", tz: "Asia/Shanghai" }, { id: "hefei", en: "Hefei", zh: "合肥", tz: "Asia/Shanghai" },
    { id: "fuzhou", en: "Fuzhou", zh: "福州", tz: "Asia/Shanghai" }, { id: "haerbin", en: "Harbin", zh: "哈尔滨", tz: "Asia/Shanghai" }, { id: "changchun", en: "Changchun", zh: "长春", tz: "Asia/Shanghai" }, { id: "shenyang", en: "Shenyang", zh: "沈阳", tz: "Asia/Shanghai" },
    { id: "wulumuqi", en: "Urumqi", zh: "乌鲁木齐", tz: "Asia/Urumqi" }, { id: "kashi", en: "Kashgar", zh: "喀什", tz: "Asia/Urumqi" }, { id: "lasa", en: "Lhasa", zh: "拉萨", tz: "Asia/Shanghai" }, { id: "sanya", en: "Sanya", zh: "三亚", tz: "Asia/Shanghai" },
    { id: "dongguan", en: "Dongguan", zh: "东莞", tz: "Asia/Shanghai" }, { id: "ningbo", en: "Ningbo", zh: "宁波", tz: "Asia/Shanghai" }, { id: "wuxi", en: "Wuxi", zh: "无锡", tz: "Asia/Shanghai" }, { id: "nantong", en: "Nantong", zh: "南通", tz: "Asia/Shanghai" },
    { id: "taipei", en: "Taipei", zh: "台北", tz: "Asia/Taipei" }, { id: "kaohsiung", en: "Kaohsiung", zh: "高雄", tz: "Asia/Taipei" }, { id: "hongkong", en: "Hong Kong", zh: "香港", tz: "Asia/Hong_Kong" }, { id: "macau", en: "Macau", zh: "澳门", tz: "Asia/Macau" },
    { id: "tokyo", en: "Tokyo", zh: "东京", tz: "Asia/Tokyo" }, { id: "osaka", en: "Osaka", zh: "大阪", tz: "Asia/Tokyo" }, { id: "kyoto", en: "Kyoto", zh: "京都", tz: "Asia/Tokyo" }, { id: "nagoya", en: "Nagoya", zh: "名古屋", tz: "Asia/Tokyo" },
    { id: "fukuoka", en: "Fukuoka", zh: "福冈", tz: "Asia/Tokyo" }, { id: "sapporo", en: "Sapporo", zh: "札幌", tz: "Asia/Tokyo" }, { id: "yokohama", en: "Yokohama", zh: "横滨", tz: "Asia/Tokyo" }, { id: "seoul", en: "Seoul", zh: "首尔", tz: "Asia/Seoul" },
    { id: "busan", en: "Busan", zh: "釜山", tz: "Asia/Seoul" }, { id: "incheon", en: "Incheon", zh: "仁川", tz: "Asia/Seoul" }, { id: "pyongyang", en: "Pyongyang", zh: "平壤", tz: "Asia/Pyongyang" }, { id: "ulaanbaatar", en: "Ulaanbaatar", zh: "乌兰巴托", tz: "Asia/Ulaanbaatar" },
    // 东南亚与南亚 (Southeast & South Asia)
    { id: "singapore", en: "Singapore", zh: "新加坡", tz: "Asia/Singapore" }, { id: "kualalumpur", en: "Kuala Lumpur", zh: "吉隆坡", tz: "Asia/Kuala_Lumpur" }, { id: "penang", en: "Penang", zh: "槟城", tz: "Asia/Kuala_Lumpur" }, { id: "bangkok", en: "Bangkok", zh: "曼谷", tz: "Asia/Bangkok" },
    { id: "phuket", en: "Phuket", zh: "普吉岛", tz: "Asia/Bangkok" }, { id: "chiangmai", en: "Chiang Mai", zh: "清迈", tz: "Asia/Bangkok" }, { id: "jakarta", en: "Jakarta", zh: "雅加达", tz: "Asia/Jakarta" }, { id: "surabaya", en: "Surabaya", zh: "泗水", tz: "Asia/Jakarta" },
    { id: "bali", en: "Bali", zh: "巴厘岛", tz: "Asia/Makassar" }, { id: "manila", en: "Manila", zh: "马尼拉", tz: "Asia/Manila" }, { id: "cebu", en: "Cebu", zh: "宿务", tz: "Asia/Manila" }, { id: "hochiminh", en: "Ho Chi Minh", zh: "胡志明市", tz: "Asia/Ho_Chi_Minh" },
    { id: "hanoi", en: "Hanoi", zh: "河内", tz: "Asia/Ho_Chi_Minh" }, { id: "danang", en: "Da Nang", zh: "岘港", tz: "Asia/Ho_Chi_Minh" }, { id: "phnompenh", en: "Phnom Penh", zh: "金边", tz: "Asia/Phnom_Penh" }, { id: "vientiane", en: "Vientiane", zh: "万象", tz: "Asia/Vientiane" },
    { id: "yangon", en: "Yangon", zh: "仰光", tz: "Asia/Yangon" }, { id: "dhaka", en: "Dhaka", zh: "达卡", tz: "Asia/Dhaka" }, { id: "newdelhi", en: "New Delhi", zh: "新德里", tz: "Asia/Kolkata" }, { id: "mumbai", en: "Mumbai", zh: "孟买", tz: "Asia/Kolkata" },
    { id: "bangalore", en: "Bangalore", zh: "班加罗尔", tz: "Asia/Kolkata" }, { id: "chennai", en: "Chennai", zh: "金奈", tz: "Asia/Kolkata" }, { id: "kolkata", en: "Kolkata", zh: "加尔各答", tz: "Asia/Kolkata" }, { id: "hyderabad", en: "Hyderabad", zh: "海得拉巴", tz: "Asia/Kolkata" },
    { id: "karachi", en: "Karachi", zh: "卡拉奇", tz: "Asia/Karachi" }, { id: "lahore", en: "Lahore", zh: "拉合尔", tz: "Asia/Karachi" }, { id: "islamabad", en: "Islamabad", zh: "伊斯兰堡", tz: "Asia/Karachi" }, { id: "colombo", en: "Colombo", zh: "科伦坡", tz: "Asia/Colombo" },
    { id: "kathmandu", en: "Kathmandu", zh: "加德满都", tz: "Asia/Kathmandu" }, { id: "male", en: "Male", zh: "马累", tz: "Indian/Maldives" },
    // 中东与中亚 (Middle East & Central Asia)
    { id: "dubai", en: "Dubai", zh: "迪拜", tz: "Asia/Dubai" }, { id: "abudhabi", en: "Abu Dhabi", zh: "阿布扎比", tz: "Asia/Dubai" }, { id: "riyadh", en: "Riyadh", zh: "利雅得", tz: "Asia/Riyadh" }, { id: "jeddah", en: "Jeddah", zh: "吉达", tz: "Asia/Riyadh" },
    { id: "mecca", en: "Mecca", zh: "麦加", tz: "Asia/Riyadh" }, { id: "doha", en: "Doha", zh: "多哈", tz: "Asia/Qatar" }, { id: "kuwait", en: "Kuwait City", zh: "科威特城", tz: "Asia/Kuwait" }, { id: "manama", en: "Manama", zh: "麦纳麦", tz: "Asia/Bahrain" },
    { id: "muscat", en: "Muscat", zh: "马斯喀特", tz: "Asia/Muscat" }, { id: "tehran", en: "Tehran", zh: "德黑兰", tz: "Asia/Tehran" }, { id: "baghdad", en: "Baghdad", zh: "巴格达", tz: "Asia/Baghdad" }, { id: "damascus", en: "Damascus", zh: "大马士革", tz: "Asia/Damascus" },
    { id: "amman", en: "Amman", zh: "安曼", tz: "Asia/Damascus" }, { id: "beirut", en: "Beirut", zh: "贝鲁特", tz: "Asia/Beirut" }, { id: "telaviv", en: "Tel Aviv", zh: "特拉维夫", tz: "Asia/Jerusalem" }, { id: "jerusalem", en: "Jerusalem", zh: "耶路撒冷", tz: "Asia/Jerusalem" },
    { id: "tashkent", en: "Tashkent", zh: "塔什干", tz: "Asia/Tashkent" }, { id: "almaty", en: "Almaty", zh: "阿拉木图", tz: "Asia/Almaty" }, { id: "astana", en: "Astana", zh: "阿斯塔纳", tz: "Asia/Almaty" }, { id: "bishkek", en: "Bishkek", zh: "比什凯克", tz: "Asia/Bishkek" },
    { id: "dushanbe", en: "Dushanbe", zh: "杜尚别", tz: "Asia/Dushanbe" }, { id: "ashgabat", en: "Ashgabat", zh: "阿什哈巴德", tz: "Asia/Ashgabat" }, { id: "kabul", en: "Kabul", zh: "喀布尔", tz: "Asia/Kabul" },
    // 欧洲 (Europe)
    { id: "london", en: "London", zh: "伦敦", tz: "Europe/London" }, { id: "manchester", en: "Manchester", zh: "曼彻斯特", tz: "Europe/London" }, { id: "birmingham", en: "Birmingham", zh: "伯明翰", tz: "Europe/London" }, { id: "edinburgh", en: "Edinburgh", zh: "爱丁堡", tz: "Europe/London" },
    { id: "glasgow", en: "Glasgow", zh: "格拉斯哥", tz: "Europe/London" }, { id: "dublin", en: "Dublin", zh: "都柏林", tz: "Europe/Dublin" }, { id: "paris", en: "Paris", zh: "巴黎", tz: "Europe/Paris" }, { id: "marseille", en: "Marseille", zh: "马赛", tz: "Europe/Paris" },
    { id: "lyon", en: "Lyon", zh: "里昂", tz: "Europe/Paris" }, { id: "berlin", en: "Berlin", zh: "柏林", tz: "Europe/Berlin" }, { id: "munich", en: "Munich", zh: "慕尼黑", tz: "Europe/Berlin" }, { id: "frankfurt", en: "Frankfurt", zh: "法兰克福", tz: "Europe/Berlin" },
    { id: "hamburg", en: "Hamburg", zh: "汉堡", tz: "Europe/Berlin" }, { id: "rome", en: "Rome", zh: "罗马", tz: "Europe/Rome" }, { id: "milan", en: "Milan", zh: "米兰", tz: "Europe/Rome" }, { id: "naples", en: "Naples", zh: "那不勒斯", tz: "Europe/Rome" },
    { id: "venice", en: "Venice", zh: "威尼斯", tz: "Europe/Rome" }, { id: "madrid", en: "Madrid", zh: "马德里", tz: "Europe/Madrid" }, { id: "barcelona", en: "Barcelona", zh: "巴塞罗那", tz: "Europe/Madrid" }, { id: "valencia", en: "Valencia", zh: "瓦伦西亚", tz: "Europe/Madrid" },
    { id: "seville", en: "Seville", zh: "塞维利亚", tz: "Europe/Madrid" }, { id: "lisbon", en: "Lisbon", zh: "里斯本", tz: "Europe/Lisbon" }, { id: "porto", en: "Porto", zh: "波尔图", tz: "Europe/Lisbon" }, { id: "amsterdam", en: "Amsterdam", zh: "阿姆斯特丹", tz: "Europe/Amsterdam" },
    { id: "rotterdam", en: "Rotterdam", zh: "鹿特丹", tz: "Europe/Amsterdam" }, { id: "brussels", en: "Brussels", zh: "布鲁塞尔", tz: "Europe/Brussels" }, { id: "antwerp", en: "Antwerp", zh: "安特卫普", tz: "Europe/Brussels" }, { id: "vienna", en: "Vienna", zh: "维也纳", tz: "Europe/Vienna" },
    { id: "salzburg", en: "Salzburg", zh: "萨尔茨堡", tz: "Europe/Vienna" }, { id: "zurich", en: "Zurich", zh: "苏黎世", tz: "Europe/Zurich" }, { id: "geneva", en: "Geneva", zh: "日内瓦", tz: "Europe/Zurich" }, { id: "bern", en: "Bern", zh: "伯尔尼", tz: "Europe/Zurich" },
    { id: "stockholm", en: "Stockholm", zh: "斯德哥尔摩", tz: "Europe/Stockholm" }, { id: "gothenburg", en: "Gothenburg", zh: "哥德堡", tz: "Europe/Stockholm" }, { id: "oslo", en: "Oslo", zh: "奥斯陆", tz: "Europe/Oslo" }, { id: "bergen", en: "Bergen", zh: "卑尔根", tz: "Europe/Oslo" },
    { id: "copenhagen", en: "Copenhagen", zh: "哥本哈根", tz: "Europe/Copenhagen" }, { id: "helsinki", en: "Helsinki", zh: "赫尔辛基", tz: "Europe/Helsinki" }, { id: "moscow", en: "Moscow", zh: "莫斯科", tz: "Europe/Moscow" }, { id: "stpetersburg", en: "St. Petersburg", zh: "圣彼得堡", tz: "Europe/Moscow" },
    { id: "kiev", en: "Kyiv", zh: "基辅", tz: "Europe/Kyiv" }, { id: "minsk", en: "Minsk", zh: "明斯克", tz: "Europe/Minsk" }, { id: "warsaw", en: "Warsaw", zh: "华沙", tz: "Europe/Warsaw" }, { id: "krakow", en: "Krakow", zh: "克拉科夫", tz: "Europe/Warsaw" },
    { id: "prague", en: "Prague", zh: "布拉格", tz: "Europe/Prague" }, { id: "budapest", en: "Budapest", zh: "布达佩斯", tz: "Europe/Budapest" }, { id: "bucharest", en: "Bucharest", zh: "布加勒斯特", tz: "Europe/Bucharest" }, { id: "sofia", en: "Sofia", zh: "索非亚", tz: "Europe/Sofia" },
    { id: "athens", en: "Athens", zh: "雅典", tz: "Europe/Athens" }, { id: "istanbul", en: "Istanbul", zh: "伊斯坦布尔", tz: "Europe/Istanbul" }, { id: "ankara", en: "Ankara", zh: "安卡拉", tz: "Europe/Istanbul" },
    // 北美洲 (North America)
    { id: "newyork", en: "New York", zh: "纽约", tz: "America/New_York" }, { id: "washingtondc", en: "Washington D.C.", zh: "华盛顿", tz: "America/New_York" }, { id: "boston", en: "Boston", zh: "波士顿", tz: "America/New_York" }, { id: "philadelphia", en: "Philadelphia", zh: "费城", tz: "America/New_York" },
    { id: "miami", en: "Miami", zh: "迈阿密", tz: "America/New_York" }, { id: "atlanta", en: "Atlanta", zh: "亚特兰大", tz: "America/New_York" }, { id: "chicago", en: "Chicago", zh: "芝加哥", tz: "America/Chicago" }, { id: "detroit", en: "Detroit", zh: "底特律", tz: "America/Detroit" },
    { id: "houston", en: "Houston", zh: "休斯顿", tz: "America/Chicago" }, { id: "dallas", en: "Dallas", zh: "达拉斯", tz: "America/Chicago" }, { id: "austin", en: "Austin", zh: "奥斯汀", tz: "America/Chicago" }, { id: "denver", en: "Denver", zh: "丹佛", tz: "America/Denver" },
    { id: "phoenix", en: "Phoenix", zh: "凤凰城", tz: "America/Phoenix" }, { id: "saltlakecity", en: "Salt Lake City", zh: "盐湖城", tz: "America/Denver" }, { id: "losangeles", en: "Los Angeles", zh: "洛杉矶", tz: "America/Los_Angeles" }, { id: "sanfrancisco", en: "San Francisco", zh: "旧金山", tz: "America/Los_Angeles" },
    { id: "sandiego", en: "San Diego", zh: "圣地亚哥(美)", tz: "America/Los_Angeles" }, { id: "lasvegas", en: "Las Vegas", zh: "拉斯维加斯", tz: "America/Los_Angeles" }, { id: "seattle", en: "Seattle", zh: "西雅图", tz: "America/Los_Angeles" }, { id: "portland", en: "Portland", zh: "波特兰", tz: "America/Los_Angeles" },
    { id: "anchorage", en: "Anchorage", zh: "安克雷奇", tz: "America/Anchorage" }, { id: "honolulu", en: "Honolulu", zh: "檀香山", tz: "Pacific/Honolulu" }, { id: "toronto", en: "Toronto", zh: "多伦多", tz: "America/Toronto" }, { id: "montreal", en: "Montreal", zh: "蒙特利尔", tz: "America/Toronto" },
    { id: "vancouver", en: "Vancouver", zh: "温哥华", tz: "America/Vancouver" }, { id: "calgary", en: "Calgary", zh: "卡尔加里", tz: "America/Edmonton" }, { id: "ottawa", en: "Ottawa", zh: "渥太华", tz: "America/Toronto" }, { id: "quebec", en: "Quebec", zh: "魁北克", tz: "America/Toronto" },
    { id: "mexicocity", en: "Mexico City", zh: "墨西哥城", tz: "America/Mexico_City" }, { id: "cancun", en: "Cancun", zh: "坎昆", tz: "America/Cancun" }, { id: "guadalajara", en: "Guadalajara", zh: "瓜达拉哈拉", tz: "America/Mexico_City" }, { id: "monterrey", en: "Monterrey", zh: "蒙特雷", tz: "America/Monterrey" },
    { id: "havana", en: "Havana", zh: "哈瓦那", tz: "America/Havana" }, { id: "kingston", en: "Kingston", zh: "金斯敦", tz: "America/Jamaica" },
    // 南美洲 (South America)
    { id: "saopaulo", en: "Sao Paulo", zh: "圣保罗", tz: "America/Sao_Paulo" }, { id: "riodejaneiro", en: "Rio de Janeiro", zh: "里约热内卢", tz: "America/Sao_Paulo" }, { id: "brasilia", en: "Brasilia", zh: "巴西利亚", tz: "America/Sao_Paulo" }, { id: "buenosaires", en: "Buenos Aires", zh: "布宜诺斯艾利斯", tz: "America/Argentina/Buenos_Aires" },
    { id: "santiago", en: "Santiago", zh: "圣地亚哥(智)", tz: "America/Santiago" }, { id: "bogota", en: "Bogota", zh: "波哥大", tz: "America/Bogota" }, { id: "lima", en: "Lima", zh: "利马", tz: "America/Lima" }, { id: "caracas", en: "Caracas", zh: "加拉加斯", tz: "America/Caracas" },
    { id: "quito", en: "Quito", zh: "基多", tz: "America/Guayaquil" }, { id: "montevideo", en: "Montevideo", zh: "蒙得维的亚", tz: "America/Montevideo" }, { id: "lapaz", en: "La Paz", zh: "拉巴斯", tz: "America/La_Paz" }, { id: "asuncion", en: "Asuncion", zh: "亚松森", tz: "America/Asuncion" },
    // 大洋洲 (Oceania)
    { id: "sydney", en: "Sydney", zh: "悉尼", tz: "Australia/Sydney" }, { id: "melbourne", en: "Melbourne", zh: "墨尔本", tz: "Australia/Melbourne" }, { id: "brisbane", en: "Brisbane", zh: "布里斯班", tz: "Australia/Brisbane" }, { id: "perth", en: "Perth", zh: "珀斯", tz: "Australia/Perth" },
    { id: "adelaide", en: "Adelaide", zh: "阿德莱德", tz: "Australia/Adelaide" }, { id: "hobart", en: "Hobart", zh: "霍巴特", tz: "Australia/Hobart" }, { id: "darwin", en: "Darwin", zh: "达尔文", tz: "Australia/Darwin" }, { id: "auckland", en: "Auckland", zh: "奥克兰", tz: "Pacific/Auckland" },
    { id: "wellington", en: "Wellington", zh: "惠灵顿", tz: "Pacific/Auckland" }, { id: "christchurch", en: "Christchurch", zh: "基督城", tz: "Pacific/Auckland" }, { id: "fiji", en: "Fiji", zh: "斐济", tz: "Pacific/Fiji" }, { id: "guam", en: "Guam", zh: "关岛", tz: "Pacific/Guam" },
    // 非洲 (Africa)
    { id: "cairo", en: "Cairo", zh: "开罗", tz: "Africa/Cairo" }, { id: "alexandria", en: "Alexandria", zh: "亚历山大", tz: "Africa/Cairo" }, { id: "johannesburg", en: "Johannesburg", zh: "约翰内斯堡", tz: "Africa/Johannesburg" }, { id: "capetown", en: "Cape Town", zh: "开普敦", tz: "Africa/Johannesburg" },
    { id: "pretoria", en: "Pretoria", zh: "比勒陀利亚", tz: "Africa/Johannesburg" }, { id: "nairobi", en: "Nairobi", zh: "内罗毕", tz: "Africa/Nairobi" }, { id: "casablanca", en: "Casablanca", zh: "卡萨布兰卡", tz: "Africa/Casablanca" }, { id: "lagos", en: "Lagos", zh: "拉各斯", tz: "Africa/Lagos" },
    { id: "abuja", en: "Abuja", zh: "阿布贾", tz: "Africa/Lagos" }, { id: "addisababa", en: "Addis Ababa", zh: "亚的斯亚贝巴", tz: "Africa/Addis_Ababa" }, { id: "algiers", en: "Algiers", zh: "阿尔及尔", tz: "Africa/Algiers" }, { id: "tunis", en: "Tunis", zh: "突尼斯", tz: "Africa/Tunis" },
    { id: "dakar", en: "Dakar", zh: "达喀尔", tz: "Africa/Dakar" }, { id: "accra", en: "Accra", zh: "阿克拉", tz: "Africa/Accra" }, { id: "khartoum", en: "Khartoum", zh: "喀土穆", tz: "Africa/Khartoum" }, { id: "kinshasa", en: "Kinshasa", zh: "金沙萨", tz: "Africa/Kinshasa" },
    { id: "luanda", en: "Luanda", zh: "罗安达", tz: "Africa/Luanda" }, { id: "harare", en: "Harare", zh: "哈拉雷", tz: "Africa/Harare" }
];
function getCityById(id: string, customCities: CityDef[] = []): CityDef { const f = [...CITY_DB, ...customCities].find(c => c.id === id); return f !== undefined ? f : CITY_DB[0]; }

// 涵盖几乎所有 IANA 时区后缀的巨型中文翻译字典
const TZ_ZH_MAP: Record<string, string> = { "Abidjan":"阿比让","Accra":"阿克拉","Algiers":"阿尔及尔","Bissau":"比绍","Cairo":"开罗","Casablanca":"卡萨布兰卡","Ceuta":"休达","El_Aaiun":"阿尤恩","Johannesburg":"约翰内斯堡","Juba":"朱巴","Khartoum":"喀土穆","Lagos":"拉各斯","Maputo":"马普托","Monrovia":"蒙罗维亚","Nairobi":"内罗毕","Ndjamena":"恩贾梅纳","Sao_Tome":"圣多美","Tripoli":"的黎波里","Tunis":"突尼斯","Windhoek":"温得和克","Adak":"埃达克","Anchorage":"安克雷奇","Anguilla":"安圭拉","Antigua":"安提瓜","Araguaina":"阿拉瓜伊纳","Argentina":"阿根廷","Buenos_Aires":"布宜诺斯艾利斯","Catamarca":"卡塔马卡","Cordoba":"科尔多瓦","Jujuy":"胡胡伊","La_Rioja":"拉里奥哈","Mendoza":"门多萨","Rio_Gallegos":"里奥加耶戈斯","Salta":"萨尔塔","San_Juan":"圣胡安","San_Luis":"圣路易斯","Tucuman":"图库曼","Ushuaia":"乌斯怀亚","Aruba":"阿鲁巴","Asuncion":"亚松森","Bahia":"巴伊亚","Bahia_Banderas":"巴伊亚班德拉斯","Barbados":"巴巴多斯","Belize":"伯利兹","Blanc-Sablon":"布朗萨布隆","Boa_Vista":"博阿维斯塔","Bogota":"波哥大","Boise":"博伊西","Cuiaba":"库亚巴","Curacao":"库拉索","Danmarkshavn":"丹麦港","Dawson":"道森","Dawson_Creek":"道森克里克","Denver":"丹佛","Detroit":"底特律","Dominica":"多米尼加","Edmonton":"埃德蒙顿","Eirunepe":"埃鲁内佩","El_Salvador":"萨尔瓦多","Fort_Nelson":"纳尔逊堡","Fortaleza":"福塔莱萨","Glace_Bay":"格莱斯湾","Godthab":"戈特霍布","Goose_Bay":"鹅湾","Grand_Turk":"大特克","Grenada":"格林纳达","Guadeloupe":"瓜德罗普","Guatemala":"危地马拉","Guayaquil":"瓜亚基尔","Guyana":"圭亚那","Halifax":"哈利法克斯","Havana":"哈瓦那","Hermosillo":"埃莫西约","Indiana":"印第安纳","Indianapolis":"印第安纳波利斯","Knox":"诺克斯","Marengo":"马伦戈","Petersburg":"彼得斯堡","Tell_City":"特尔城","Vevay":"韦韦","Vincennes":"万塞讷","Winamac":"温纳马克","Inuvik":"伊努维克","Iqaluit":"伊卡卢伊特","Jamaica":"牙买加","Juneau":"朱诺","Kentucky":"肯塔基","Louisville":"路易斯维尔","Monticello":"蒙蒂塞洛","Kralendijk":"克拉伦代克","La_Paz":"拉巴斯","Lima":"利马","Los_Angeles":"洛杉矶","Lower_Princes":"下王子区","Maceio":"马塞约","Managua":"马那瓜","Manaus":"马瑙斯","Marigot":"马里戈特","Martinique":"马提尼克","Matamoros":"马塔莫罗斯","Mazatlan":"马萨特兰","Menominee":"梅诺米尼","Merida":"梅里达","Metlakatla":"梅特拉卡特拉","Mexico_City":"墨西哥城","Miquelon":"密克隆","Moncton":"蒙克顿","Monterrey":"蒙特雷","Montevideo":"蒙得维的亚","Montserrat":"蒙特塞拉特","Nassau":"拿骚","New_York":"纽约","Nipigon":"尼皮贡","Nome":"诺姆","Noronha":"诺罗尼亚","North_Dakota":"北达科他","Beulah":"比尤拉","Center":"中心城","New_Salem":"新塞勒姆","Ojinaga":"奥希纳加","Panama":"巴拿马","Pangnirtung":"庞纳图","Paramaribo":"帕拉马里博","Phoenix":"凤凰城","Port-au-Prince":"太子港","Port_of_Spain":"西班牙港","Porto_Velho":"韦柳港","Puerto_Rico":"波多黎各","Punta_Arenas":"蓬塔阿雷纳斯","Rankin_Inlet":"兰金因莱特","Recife":"累西腓","Regina":"里贾纳","Resolute":"雷索卢特","Rio_Branco":"里约布兰科","Santarem":"圣塔伦","Santiago":"圣地亚哥","Santo_Domingo":"圣多明各","Sao_Paulo":"圣保罗","Scoresbysund":"斯科斯比松","Sitka":"锡特卡","St_Barthelemy":"圣巴泰勒米","St_Johns":"圣约翰","St_Kitts":"圣基茨","St_Lucia":"圣卢西亚","St_Thomas":"圣托马斯","St_Vincent":"圣文森特","Swift_Current":"斯威夫特卡伦特","Tegucigalpa":"特古西加尔巴","Thule":"图勒","Thunder_Bay":"桑德贝","Tijuana":"蒂华纳","Toronto":"多伦多","Tortola":"托尔托拉","Vancouver":"温哥华","Whitehorse":"怀特霍斯","Winnipeg":"温尼伯","Yakutat":"亚库塔特","Yellowknife":"黄刀","Crestone":"克雷斯通" };
const TZ_PREFIX: Record<string, string> = { 'Asia': '亚洲', 'Europe': '欧洲', 'America': '美洲', 'Africa': '非洲', 'Australia': '澳洲', 'Pacific': '太平洋', 'Indian': '印度洋', 'Atlantic': '大西洋', 'Antarctica': '南极洲' };

function getTzDisplayName(tz: string, lang: 'en' | 'zh'): string {
    if (lang !== 'zh') return tz.replace(/_/g, ' ');
    // 1. 优先查核心城市库
    const matched = CITY_DB.find(c => c.tz === tz);
    if (matched && matched.zh) return `(${TZ_PREFIX[tz.split('/')[0]] || ''}) ${matched.zh}`;
    // 2. 使用强大翻译字典
    let parts = tz.split('/');
    if (parts.length === 1) return tz;
    let prefix = TZ_PREFIX[parts[0]] || parts[0];
    let suffix = parts[parts.length - 1]; // 取最后一节
    let translatedSuffix = TZ_ZH_MAP[suffix] || suffix.replace(/_/g, ' ');
    return `${prefix} / ${translatedSuffix}`;
}

// =================================================================
// 3. 数据结构 & 预设 
// =================================================================
interface SavedPreset { id: string; name: string; isCustom: boolean; visuals: Partial<MeridianSettings>; }

interface MeridianSettings {
    language: 'en' | 'zh'; isWorldClock: boolean; clockFace: 'analog' | 'digital';
    presetColor: string; customColor: string; dialBgColor: string; customDialBgColor: string;
    numberColor: string; customNumberColor: string; tickColor: string; customTickColor: string;
    hHandColor: string; customHHandColor: string; mHandColor: string; customMHandColor: string;
    outerRing: 'ticks' | 'ticks-dense' | 'ticks-uniform' | 'dots-lines' | 'numbers' | 'hidden'; 
    innerRing: 'ticks' | 'numbers' | 'hidden'; secondHandMode: 'sweep' | 'tick' | 'hidden'; showDate: boolean;
    digitalTimeColor: string; customDigitalTimeColor: string; digitalSecColor: string; customDigitalSecColor: string; digitalSecSize: 'small' | 'large'; digitalFont: string;
    cityIds: [string, string, string, string]; userPresets: SavedPreset[]; customCities: CityDef[];
}

const DEFAULT_SETTINGS: MeridianSettings = {
    language: 'zh', isWorldClock: false, clockFace: 'analog',
    presetColor: '#FF9500', customColor: '#FF9500', dialBgColor: 'none', customDialBgColor: '#798071',
    numberColor: 'default', customNumberColor: '#FFFFFF', tickColor: 'default', customTickColor: '#FFFFFF', hHandColor: 'default', customHHandColor: '#FFFFFF', mHandColor: 'default', customMHandColor: '#FFFFFF',
    outerRing: 'ticks', innerRing: 'numbers', secondHandMode: 'sweep', showDate: true, 
    digitalTimeColor: 'default', customDigitalTimeColor: '#FFFFFF', digitalSecColor: 'default', customDigitalSecColor: '#FF9500', digitalSecSize: 'small', digitalFont: "'Inter', sans-serif",
    cityIds: ['local', 'tokyo', 'london', 'newyork'], userPresets: [], customCities: []
}

const ANALOG_PRESETS: SavedPreset[] = [
    { id: 'a1', name: 'Ultimate Black', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#0A0A0A', presetColor: '#FFFFFF', outerRing: 'hidden', innerRing: 'ticks', secondHandMode: 'sweep', showDate: true, numberColor: 'default', tickColor: '#FFFFFF', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a2', name: 'Classic Panda', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#0A0A0A', presetColor: '#FF3B30', outerRing: 'ticks', innerRing: 'ticks', secondHandMode: 'tick', showDate: false, tickColor: '#FFFFFF', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a3', name: 'Navy Pilot', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#1C2833', presetColor: '#FF3B30', outerRing: 'ticks-dense', innerRing: 'ticks', secondHandMode: 'sweep', showDate: true, numberColor: 'default', tickColor: '#FFFFFF', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a4', name: 'Crimson Minimal', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#4A2323', presetColor: '#FFFFFF', outerRing: 'ticks-uniform', innerRing: 'hidden', secondHandMode: 'tick', showDate: false, tickColor: '#FFFFFF', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a5', name: 'Midnight Gold', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#0A0A0A', presetColor: 'custom', customColor: '#FFD700', outerRing: 'dots-lines', innerRing: 'hidden', secondHandMode: 'sweep', showDate: true, tickColor: 'custom', customTickColor: '#FFD700', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a6', name: 'Silver Uniform', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#F2F2F7', presetColor: '#000000', outerRing: 'ticks-uniform', innerRing: 'ticks', secondHandMode: 'hidden', showDate: false, tickColor: '#888888', hHandColor: '#000000', mHandColor: '#000000' } },
    { id: 'a7', name: 'Hermès Classic', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#FF9500', outerRing: 'ticks', innerRing: 'numbers', secondHandMode: 'sweep', showDate: true, numberColor: 'default', tickColor: 'default', hHandColor: 'default', mHandColor: 'default' } },
    { id: 'a8', name: 'Retro Light', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#F2F2F7', presetColor: '#FF3B30', outerRing: 'ticks', innerRing: 'numbers', secondHandMode: 'tick', showDate: true, numberColor: '#000000', tickColor: '#000000', hHandColor: '#000000', mHandColor: '#000000' } },
    { id: 'a9', name: 'Ghost White', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#FFFFFF', outerRing: 'hidden', innerRing: 'hidden', secondHandMode: 'sweep', showDate: false, hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a10', name: 'Pale Explorer', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#007AFF', outerRing: 'numbers', innerRing: 'ticks', secondHandMode: 'sweep', showDate: true, numberColor: 'default', tickColor: 'default', hHandColor: 'default', mHandColor: 'default' } },
    { id: 'a11', name: 'Sage Dots', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: '#798071', presetColor: '#FF9500', outerRing: 'dots-lines', innerRing: 'hidden', secondHandMode: 'sweep', showDate: false, tickColor: '#FFFFFF', hHandColor: '#FFFFFF', mHandColor: '#FFFFFF' } },
    { id: 'a12', name: 'Volt Sport', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#CCFF00', outerRing: 'numbers', innerRing: 'numbers', secondHandMode: 'sweep', showDate: true, tickColor: 'default' } },
    { id: 'a13', name: 'Mint Dense', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#00F5D4', outerRing: 'ticks-dense', innerRing: 'numbers', secondHandMode: 'tick', showDate: true, tickColor: 'default' } },
    { id: 'a14', name: 'Ocean Matrix', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#007AFF', outerRing: 'dots-lines', innerRing: 'hidden', secondHandMode: 'hidden', showDate: false, tickColor: 'default' } },
    { id: 'a15', name: 'Sunset Orange', isCustom: false, visuals: { clockFace: 'analog', dialBgColor: 'none', presetColor: '#FF9500', outerRing: 'ticks-dense', innerRing: 'hidden', secondHandMode: 'sweep', showDate: true, tickColor: 'default' } }
];

const DIGITAL_PRESETS: SavedPreset[] = [
    { id: 'd1', name: 'Pure Minimal', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: 'default', digitalSecColor: 'default', digitalSecSize: 'small', digitalFont: "'Inter', sans-serif" } },
    { id: 'd2', name: 'Terminal Hacker', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: '#00F5D4', digitalSecColor: '#00F5D4', digitalSecSize: 'large', digitalFont: "'Courier New', monospace" } },
    { id: 'd3', name: 'Sport Impact', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: 'default', digitalSecColor: '#FF9500', digitalSecSize: 'small', digitalFont: "Impact, sans-serif" } },
    { id: 'd4', name: 'Classic Red', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: '#FF3B30', digitalSecColor: '#FF3B30', digitalSecSize: 'small', digitalFont: "'Times New Roman', serif" } },
    { id: 'd5', name: 'Ocean Blue', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: 'default', digitalSecColor: '#007AFF', digitalSecSize: 'large', digitalFont: "'Inter', sans-serif" } },
    { id: 'd6', name: 'Cyber Neon', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: 'custom', customDigitalTimeColor: '#FF00FF', digitalSecColor: '#00F5D4', digitalSecSize: 'large', digitalFont: "Impact, sans-serif" } },
    { id: 'd7', name: 'Ghost White', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: '#FFFFFF', digitalSecColor: '#888888', digitalSecSize: 'small', digitalFont: "'Courier New', monospace" } },
    { id: 'd8', name: 'Midnight Bold', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: '#000000', digitalSecColor: '#FF3B30', digitalSecSize: 'large', digitalFont: "Impact, sans-serif" } },
    { id: 'd9', name: 'Classic Gold', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: 'custom', customDigitalTimeColor: '#FFD700', digitalSecColor: 'custom', customDigitalSecColor: '#FFD700', digitalSecSize: 'small', digitalFont: "'Times New Roman', serif" } },
    { id: 'd10', name: 'Hermès Digital', isCustom: false, visuals: { clockFace: 'digital', digitalTimeColor: '#FF9500', digitalSecColor: '#FF9500', digitalSecSize: 'small', digitalFont: "'Inter', sans-serif" } }
];

class TimeEngine {
    static getTimeParts(tz: string, now: Date) {
        const ms = now.getMilliseconds();
        if (tz === 'Local') return { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds(), ms, d: now.getDate() };
        try {
            const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric', day: 'numeric' });
            const parts = (formatter as any).formatToParts(now);
            const getVal = (type: string) => parseInt(parts.find((p: any) => p.type === type)?.value || '0');
            let h = getVal('hour'); if (h === 24) h = 0;
            return { h, m: getVal('minute'), s: getVal('second'), ms, d: getVal('day') };
        } catch (e) { return { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds(), ms, d: now.getDate() }; }
    }
}

// =================================================================
// 4. 核心渲染引擎 
// =================================================================
class ClockRenderer {
    static getRealColor(settings: Partial<MeridianSettings>, type: 'accent'|'bg'|'num'|'tick'|'hHand'|'mHand'|'digiTime'|'digiSec'): string {
        const def = 'var(--text-normal)';
        if (type === 'accent') return (settings.presetColor === 'custom' ? settings.customColor : settings.presetColor) || '#FF9500';
        if (type === 'bg') return (settings.dialBgColor === 'custom' ? settings.customDialBgColor : settings.dialBgColor) || 'none';
        
        let val = '';
        if (type === 'num') val = settings.numberColor === 'custom' ? settings.customNumberColor : settings.numberColor;
        if (type === 'tick') val = settings.tickColor === 'custom' ? settings.customTickColor : settings.tickColor;
        if (type === 'hHand') val = settings.hHandColor === 'custom' ? settings.customHHandColor : settings.hHandColor;
        if (type === 'mHand') val = settings.mHandColor === 'custom' ? settings.customMHandColor : settings.mHandColor;
        if (type === 'digiTime') val = settings.digitalTimeColor === 'custom' ? settings.customDigitalTimeColor : settings.digitalTimeColor;
        if (type === 'digiSec') val = settings.digitalSecColor === 'custom' ? settings.customDigitalSecColor : settings.digitalSecColor;
        
        return (val === 'default' || !val) ? def : (val as string);
    }

    static buildAnalogSVG(settings: Partial<MeridianSettings>, accent: string, bg: string, numC: string, tickC: string): SVGElement {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 200 200");
        svg.classList.add("meridian-svg");

        if (bg !== 'none' && bg) {
            const bgCircle = document.createElementNS(svgNS, "circle");
            bgCircle.setAttribute("cx", "100"); bgCircle.setAttribute("cy", "100");
            bgCircle.setAttribute("r", "94"); bgCircle.setAttribute("fill", bg);
            svg.appendChild(bgCircle);
        }

        const { outerRing, innerRing, showDate } = settings;
        const tickSec = tickC === 'var(--text-normal)' ? 'var(--text-muted)' : tickC;

        if (outerRing !== 'hidden') {
            const segments = outerRing === 'ticks-dense' ? 120 : 60;
            for (let i = 0; i < segments; i++) {
                const angle = i * (360 / segments);
                const isHour = outerRing === 'ticks-dense' ? (i % 10 === 0) : (i % 5 === 0);
                const rad = (angle - 90) * (Math.PI / 180);

                if (outerRing === 'ticks' || outerRing === 'ticks-uniform' || outerRing === 'ticks-dense') {
                    const line = document.createElementNS(svgNS, "line");
                    line.setAttribute("x1", "100"); line.setAttribute("y1", "4"); line.setAttribute("x2", "100"); line.setAttribute("y2", "10");
                    line.setAttribute("stroke-linecap", "round"); line.setAttribute("transform", `rotate(${angle}, 100, 100)`);
                    if (outerRing === 'ticks') { line.setAttribute("stroke", isHour ? tickC : tickSec); line.setAttribute("stroke-width", isHour ? "2.5" : "1"); } 
                    else if (outerRing === 'ticks-dense') { line.setAttribute("stroke", isHour ? tickC : tickSec); line.setAttribute("stroke-width", "1"); } 
                    else { line.setAttribute("stroke", tickSec); line.setAttribute("stroke-width", "1"); }
                    svg.appendChild(line);
                } else if (outerRing === 'dots-lines') {
                    if (isHour) {
                        const line = document.createElementNS(svgNS, "line");
                        line.setAttribute("x1", "100"); line.setAttribute("y1", "7"); line.setAttribute("x2", "100"); line.setAttribute("y2", "27.5"); 
                        line.setAttribute("stroke", tickC); line.setAttribute("stroke-width", "3"); line.setAttribute("stroke-linecap", "round");
                        line.setAttribute("transform", `rotate(${angle}, 100, 100)`); svg.appendChild(line);
                    } else {
                        const dot = document.createElementNS(svgNS, "circle");
                        dot.setAttribute("cx", (100 + 93 * Math.cos(rad)).toString()); dot.setAttribute("cy", (100 + 93 * Math.sin(rad)).toString());
                        dot.setAttribute("r", "1.5"); dot.setAttribute("fill", tickSec); svg.appendChild(dot);
                    }
                } else if (outerRing === 'numbers') {
                    if (isHour) {
                        const numText = i === 0 ? "60" : padZero(i / (segments/12) * 5);
                        const text = document.createElementNS(svgNS, "text");
                        text.setAttribute("x", (100 + 93 * Math.cos(rad)).toString()); text.setAttribute("y", (100 + 93 * Math.sin(rad)).toString());
                        text.classList.add("meridian-svg-text", "outer-number"); text.style.fill = numC; text.textContent = numText;
                        svg.appendChild(text);
                    } else {
                        const line = document.createElementNS(svgNS, "line");
                        line.setAttribute("x1", "100"); line.setAttribute("y1", "4"); line.setAttribute("x2", "100"); line.setAttribute("y2", "10");
                        line.setAttribute("stroke", tickSec); line.setAttribute("stroke-width", "1"); line.setAttribute("stroke-linecap", "round");
                        line.setAttribute("transform", `rotate(${angle}, 100, 100)`); svg.appendChild(line);
                    }
                }
            }
        }

        if (innerRing !== 'hidden') {
            for (let i = 1; i <= 12; i++) {
                const angle = i * 30; const rad = (angle - 90) * (Math.PI / 180);
                if (innerRing === 'ticks') {
                    const line = document.createElementNS(svgNS, "line");
                    line.setAttribute("x1", "100"); line.setAttribute("y1", "22"); line.setAttribute("x2", "100"); line.setAttribute("y2", "33"); 
                    line.setAttribute("transform", `rotate(${angle}, 100, 100)`); line.setAttribute("stroke", tickC); line.setAttribute("stroke-width", "3");
                    line.setAttribute("stroke-linecap", "round"); svg.appendChild(line);
                } else if (innerRing === 'numbers') {
                    const text = document.createElementNS(svgNS, "text");
                    text.setAttribute("x", (100 + 75 * Math.cos(rad)).toString()); text.setAttribute("y", (100 + 75 * Math.sin(rad)).toString());
                    text.classList.add("meridian-svg-text", "inner-number"); text.style.fill = numC; text.textContent = String(i); svg.appendChild(text);
                }
            }
        }

        if (showDate) {
            const dateText = document.createElementNS(svgNS, "text");
            dateText.setAttribute("x", "136"); dateText.setAttribute("y", "100");
            dateText.classList.add("meridian-svg-text", "meridian-date-text");
            dateText.setAttribute("fill", accent); dateText.setAttribute("id", "meridian-date-el"); svg.appendChild(dateText);
        }
        return svg;
    }

    static createHandGroup(tipY: number, baseY: number, stemY: number, weight: number, color: string): SVGGElement {
        const svgNS = "http://www.w3.org/2000/svg";
        const group = document.createElementNS(svgNS, "g");
        const stem = document.createElementNS(svgNS, "line");
        stem.setAttribute("x1", "100"); stem.setAttribute("y1", stemY.toString()); stem.setAttribute("x2", "100"); stem.setAttribute("y2", baseY.toString());
        stem.setAttribute("stroke", "#777777"); stem.setAttribute("stroke-width", "3"); group.appendChild(stem);
        const body = document.createElementNS(svgNS, "line");
        body.setAttribute("x1", "100"); body.setAttribute("y1", baseY.toString()); body.setAttribute("x2", "100"); body.setAttribute("y2", tipY.toString());
        body.setAttribute("stroke", color); body.setAttribute("stroke-width", weight.toString()); body.setAttribute("stroke-linecap", "round"); group.appendChild(body);
        return group;
    }

    static createSecondHand(tipY: number, color: string, tailY: number = 120): SVGLineElement {
        const svgNS = "http://www.w3.org/2000/svg";
        const hand = document.createElementNS(svgNS, "line");
        hand.setAttribute("x1", "100"); hand.setAttribute("y1", tailY.toString()); hand.setAttribute("x2", "100"); hand.setAttribute("y2", tipY.toString());
        hand.setAttribute("stroke", color); hand.setAttribute("stroke-width", "2"); hand.setAttribute("stroke-linecap", "round"); return hand;
    }

    static buildStaticMiniPreview(settings: Partial<MeridianSettings>): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.style.width = "100%"; wrapper.style.height = "100%";

        if (settings.clockFace === 'digital') {
            const timeCol = this.getRealColor(settings, 'digiTime');
            const secCol = this.getRealColor(settings, 'digiSec');
            
            const face = wrapper.createEl('div', { cls: 'meridian-digital-face' });
            face.style.fontFamily = settings.digitalFont || "'Inter', sans-serif";
            
            const dt = face.createEl('div', { cls: 'meridian-digital-time' });
            dt.style.fontSize = settings.digitalSecSize === 'large' ? '18px' : '22px'; 
            
            const secStyle = settings.digitalSecSize === 'large' 
                ? `font-size: 1em; margin-left: 2px; font-weight: inherit; color: ${secCol};`
                : `font-size: 0.4em; margin-left: 2px; font-weight: 700; color: ${secCol}; opacity: 0.9;`;
            const secHTML = settings.digitalSeconds === 'hidden' ? '' : `<span style="${secStyle}">30</span>`;
            dt.innerHTML = `<span style="color: ${timeCol}">10:09</span>${secHTML}`;
            
            return wrapper;
        }

        const accent = this.getRealColor(settings, 'accent');
        const bg = this.getRealColor(settings, 'bg');
        const numC = this.getRealColor(settings, 'num');
        const tickC = this.getRealColor(settings, 'tick');
        const hC = this.getRealColor(settings, 'hHand');
        const mC = this.getRealColor(settings, 'mHand');

        const svg = this.buildAnalogSVG(settings, accent, bg, numC, tickC);
        const sDeg = 30 * 6; const mDeg = (9 + 30/60) * 6; const hDeg = (10 + 9.5/60) * 30; 
        const mHand = this.createHandGroup(13, 88, 100, 6, mC); 
        const hHand = this.createHandGroup(45, 88, 100, 6, hC); 
        mHand.setAttribute("transform", `rotate(${mDeg}, 100, 100)`); hHand.setAttribute("transform", `rotate(${hDeg}, 100, 100)`);
        svg.append(hHand, mHand);

        if (settings.secondHandMode !== 'hidden') { 
            const sHand = this.createSecondHand(6, accent, 120); 
            sHand.setAttribute("transform", `rotate(${sDeg}, 100, 100)`); svg.appendChild(sHand); 
        }
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", "100"); dot.setAttribute("cy", "100"); dot.setAttribute("r", "5"); dot.setAttribute("fill", accent);
        svg.appendChild(dot);
        const dateEl = svg.querySelector("#meridian-date-el");
        if (dateEl) dateEl.textContent = "23";

        wrapper.appendChild(svg);
        return wrapper;
    }
}

// =================================================================
// 5. 主面板视图
// =================================================================
class MeridianView extends ItemView {
    private animationFrameId: number | null = null;
    plugin: MeridianPlugin;
    private activeAnalog: Array<{h: SVGElement, m: SVGElement, s?: SVGElement, dateEl?: SVGTextElement | null, tz: string}> = [];
    private activeDigital: Array<{el: HTMLElement, tz: string}> = [];

    constructor(leaf: WorkspaceLeaf, plugin: MeridianPlugin) { super(leaf); this.plugin = plugin; }
    getViewType() { return VIEW_TYPE_MERIDIAN; } getDisplayText() { return "Meridian"; } getIcon() { return "clock"; }
    public forceRebuild() { this.renderInterface(); } async onOpen() { this.renderInterface(); }

    private renderInterface() {
        if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
        this.activeAnalog = []; this.activeDigital = [];
        const container = this.containerEl.children[1] as HTMLElement; 
        if (!container) return;
        container.empty();
        
        const wrapper = container.createEl("div", { cls: "meridian-clock-wrapper" });
        const { isWorldClock, cityIds } = this.plugin.settings;
        if (isWorldClock) { wrapper.classList.add("meridian-world-clock-grid"); for (let i = 0; i < 4; i++) this.buildSingleClock(wrapper, cityIds[i], true); } 
        else { this.buildSingleClock(wrapper, cityIds[0], false); }
        this.startEngine();
    }

    private buildSingleClock(parent: HTMLElement, cityId: string, showLabel: boolean) {
        const itemBox = parent.createEl("div", { cls: "meridian-clock-item" });
        const cityInfo = getCityById(cityId, this.plugin.settings.customCities);
        
        if (this.plugin.settings.clockFace === 'analog') {
            const accent = ClockRenderer.getRealColor(this.plugin.settings, 'accent');
            const bg = ClockRenderer.getRealColor(this.plugin.settings, 'bg');
            const numC = ClockRenderer.getRealColor(this.plugin.settings, 'num');
            const tickC = ClockRenderer.getRealColor(this.plugin.settings, 'tick');
            const hC = ClockRenderer.getRealColor(this.plugin.settings, 'hHand');
            const mC = ClockRenderer.getRealColor(this.plugin.settings, 'mHand');

            const svg = ClockRenderer.buildAnalogSVG(this.plugin.settings, accent, bg, numC, tickC);
            const mHand = ClockRenderer.createHandGroup(13, 88, 100, 6, mC); 
            const hHand = ClockRenderer.createHandGroup(45, 88, 100, 6, hC); 
            let sHand: SVGLineElement | undefined;
            svg.append(hHand, mHand);
            if (this.plugin.settings.secondHandMode !== 'hidden') { sHand = ClockRenderer.createSecondHand(6, accent, 120); svg.appendChild(sHand); }
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", "100"); dot.setAttribute("cy", "100"); dot.setAttribute("r", "5"); dot.setAttribute("fill", accent); 
            svg.appendChild(dot);
            itemBox.appendChild(svg);
            const dateEl = svg.querySelector("#meridian-date-el") as SVGTextElement | null;
            this.activeAnalog.push({ h: hHand, m: mHand, s: sHand, dateEl: dateEl, tz: cityInfo.tz });
        } else {
            const digitalBox = itemBox.createEl("div", { cls: "meridian-digital-face" });
            digitalBox.style.fontFamily = this.plugin.settings.digitalFont;
            const timeText = digitalBox.createEl("div", { cls: "meridian-digital-time" });
            this.activeDigital.push({ el: timeText, tz: cityInfo.tz });
        }
        
        if (showLabel) {
            const labelText = this.plugin.settings.language === 'zh' ? cityInfo.zh : cityInfo.en;
            itemBox.createEl("div", { cls: "meridian-timezone-label", text: labelText });
        }
    }

    private startEngine() {
        const tick = () => {
            const now = new Date();
            for (const item of this.activeAnalog) {
                const { h, m, s, ms, d } = TimeEngine.getTimeParts(item.tz, now);
                if (item.dateEl && item.dateEl.textContent !== String(d)) item.dateEl.textContent = String(d);
                const exactS = this.plugin.settings.secondHandMode === 'sweep' ? s + ms / 1000 : s;
                const exactM = m + exactS / 60; const exactH = (h % 12) + exactM / 60;
                if (item.s) item.s.setAttribute("transform", `rotate(${exactS * 6}, 100, 100)`);
                item.m.setAttribute("transform", `rotate(${exactM * 6}, 100, 100)`);
                item.h.setAttribute("transform", `rotate(${exactH * 30}, 100, 100)`);
            }
            
            const timeCol = ClockRenderer.getRealColor(this.plugin.settings, 'digiTime');
            const secCol = ClockRenderer.getRealColor(this.plugin.settings, 'digiSec');
            const secStyle = this.plugin.settings.digitalSecSize === 'large' 
                ? `font-size: 1em; margin-left: 6px; font-weight: inherit; color: ${secCol};`
                : `font-size: 0.4em; margin-left: 6px; font-weight: 700; color: ${secCol}; opacity: 0.9;`;

            for (const item of this.activeDigital) {
                const { h, m, s } = TimeEngine.getTimeParts(item.tz, now);
                const hh = padZero(h); const mm = padZero(m); const ss = padZero(s);
                const secHTML = this.plugin.settings.digitalSeconds === 'hidden' ? '' : `<span style="${secStyle}">${ss}</span>`;
                item.el.innerHTML = `<span style="color: ${timeCol}">${hh}:${mm}</span>${secHTML}`;
            }
            this.animationFrameId = requestAnimationFrame(tick);
        };
        tick();
    }
    async onClose() { if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId); }
}

// =================================================================
// 6. 各类原生弹窗 
// =================================================================

// 【新增核心功能】独立的时区搜索器，突破 100 条限制！
class TimezoneSuggestModal extends FuzzySuggestModal<string> {
    plugin: MeridianPlugin; onChoose: (tz: string) => void;
    constructor(app: App, plugin: MeridianPlugin, onChoose: (tz: string) => void) { 
        super(app); this.plugin = plugin; this.onChoose = onChoose; 
        this.setPlaceholder(TEXTS[plugin.settings.language].modalTzDesc); 
        this.limit = 1000; // 突破 Obsidian 默认 100 条渲染限制，直接渲染全球时区！
    }
    getItems() { return Intl.supportedValuesOf('timeZone'); } 
    getItemText(tz: string) { 
        return this.plugin.settings.language === 'zh' ? getTzDisplayName(tz, 'zh') : tz.replace(/_/g, ' '); 
    }
    onChooseItem(tz: string) { this.onChoose(tz); }
}

class CitySuggestModal extends FuzzySuggestModal<CityDef> {
    plugin: MeridianPlugin; onChoose: (city: CityDef) => void;
    constructor(app: App, plugin: MeridianPlugin, onChoose: (city: CityDef) => void) { 
        super(app); this.plugin = plugin; this.onChoose = onChoose; 
        this.setPlaceholder(TEXTS[plugin.settings.language].btnSearch); 
        this.limit = 1000; // 同理，突破 100 条搜索限制
    }
    getItems() { return [...CITY_DB, ...this.plugin.settings.customCities]; }
    getItemText(city: CityDef) { 
        const name = this.plugin.settings.language === 'zh' ? city.zh : city.en; 
        return city.isCustom ? `${name} [Custom]` : name;
    }
    onChooseItem(city: CityDef) { this.onChoose(city); }
}

class PresetNameModal extends Modal {
    plugin: MeridianPlugin; onSubmit: (name: string) => void;
    constructor(app: App, plugin: MeridianPlugin, onSubmit: (name: string) => void) { super(app); this.plugin = plugin; this.onSubmit = onSubmit; }
    onOpen() {
        const { contentEl } = this; 
        const t = TEXTS[this.plugin.settings.language];
        contentEl.createEl('h2', { text: t.saveModalTitle });
        const input = contentEl.createEl('input', { type: 'text', placeholder: t.saveInput });
        input.style.width = '100%'; input.style.marginBottom = '10px';
        const btn = contentEl.createEl('button', { text: t.btnSave, cls: 'mod-cta' });
        btn.onclick = () => { this.onSubmit(input.value || 'My Preset'); this.close(); };
    }
    onClose() { this.contentEl.empty(); }
}

class CustomCityModal extends Modal {
    plugin: MeridianPlugin; onSubmit: (city: CityDef) => void;
    constructor(app: App, plugin: MeridianPlugin, onSubmit: (city: CityDef) => void) { super(app); this.plugin = plugin; this.onSubmit = onSubmit; }
    onOpen() {
        const { contentEl } = this;
        const t = TEXTS[this.plugin.settings.language];
        contentEl.createEl('h2', { text: t.addCityModalTitle });
        
        let enName = '', zhName = '';
        new Setting(contentEl).setName(t.modalEnName).addText(text => text.setPlaceholder("e.g. My Hometown").onChange(v => enName = v));
        new Setting(contentEl).setName(t.modalZhName).addText(text => text.setPlaceholder(t.phZh).onChange(v => zhName = v));
        
        const allZones = Intl.supportedValuesOf('timeZone');
        let selectedTz = allZones.includes('Asia/Shanghai') ? 'Asia/Shanghai' : allZones[0];
        
        const tzSetting = new Setting(contentEl).setName(t.modalTz).setDesc(t.modalTzDesc);
        // 使用独立的智能时区搜索器
        const tzBtn = tzSetting.addButton(btn => btn.setButtonText(getTzDisplayName(selectedTz, this.plugin.settings.language)).onClick(() => {
            new TimezoneSuggestModal(this.app, this.plugin, (tz) => {
                selectedTz = tz;
                btn.setButtonText(getTzDisplayName(tz, this.plugin.settings.language));
            }).open();
        }));

        new Setting(contentEl).addButton(btn => btn.setButtonText(t.btnSave).setCta().onClick(() => {
            if (!enName) enName = selectedTz.split('/').pop()?.replace(/_/g, ' ') || 'Custom City';
            if (!zhName) zhName = enName;
            this.onSubmit({ id: 'custom_' + Date.now(), en: enName, zh: zhName, tz: selectedTz, isCustom: true });
            this.close();
        }));
    }
    onClose() { this.contentEl.empty(); }
}

export default class MeridianPlugin extends Plugin {
    settings!: MeridianSettings;
    async onload() {
        await this.loadSettings();
        this.registerView(VIEW_TYPE_MERIDIAN, (leaf) => new MeridianView(leaf, this));
        this.addSettingTab(new MeridianSettingTab(this.app, this));
        this.addCommand({ id: 'open-meridian-clock', name: 'Open Meridian Clock', callback: () => this.activateView() });
        this.app.workspace.onLayoutReady(() => { this.activateView(); });
    }
    async onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE_MERIDIAN); }
    async activateView() {
        const { workspace } = this.app; let leaf = workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)[0];
        if (!leaf) { leaf = workspace.getRightLeaf(false) as WorkspaceLeaf | undefined; if (leaf) await leaf.setViewState({ type: VIEW_TYPE_MERIDIAN, active: true }); }
        if (leaf) workspace.revealLeaf(leaf);
    }
    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() {
        await this.saveData(this.settings);
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN);
        leaves.forEach(leaf => { if (leaf.view instanceof MeridianView) leaf.view.forceRebuild(); });
    }
}

// =================================================================
// 7. 设置面板 
// =================================================================
class MeridianSettingTab extends PluginSettingTab {
    plugin: MeridianPlugin; 
    private previewFrameId: number | null = null; 
    private previewActiveHands: any = null; 
    private previewDigitalEl: HTMLElement | null = null;
    
    private tabStates: Record<string, boolean> = { official: false, collection: false, lang: false, color: false, geo: false, hands: false, tz: false, digiColor: false, digiFont: false, customCities: false };

    constructor(app: App, plugin: MeridianPlugin) { super(app, plugin); this.plugin = plugin; }
    hide() { if (this.previewFrameId !== null) cancelAnimationFrame(this.previewFrameId); }

    createDetails(container: HTMLElement, title: string, id: string): HTMLElement {
        const d = container.createEl('details', { cls: 'meridian-details' });
        if (this.tabStates[id]) d.setAttribute('open', '');
        d.createEl('summary', { text: title });
        d.ontoggle = () => { this.tabStates[id] = d.open; };
        return d;
    }

    display(): void {
        const { containerEl } = this; containerEl.empty();
        const t = TEXTS[this.plugin.settings.language]; 
        const isAnalog = this.plugin.settings.clockFace === 'analog';

        containerEl.createEl('h2', { text: t.settingsTitle as string });
        
        const tabsContainer = containerEl.createEl('div', { cls: 'meridian-face-tabs' });
        const tabAnalog = tabsContainer.createEl('div', { cls: `meridian-face-tab ${isAnalog ? 'is-active' : ''}`, text: t.tabAnalog as string });
        const tabDigital = tabsContainer.createEl('div', { cls: `meridian-face-tab ${!isAnalog ? 'is-active' : ''}`, text: t.tabDigital as string });
        
        tabAnalog.onclick = async () => { this.plugin.settings.clockFace = 'analog'; await this.plugin.saveSettings(); this.display(); };
        tabDigital.onclick = async () => { this.plugin.settings.clockFace = 'digital'; await this.plugin.saveSettings(); this.display(); };

        const previewBox = containerEl.createEl('div', { cls: 'meridian-settings-preview-container' });
        this.buildPreview(previewBox);

        const secGallery = this.createDetails(containerEl, t.secOfficial as string, 'official'); 
        const galleryGrid = secGallery.createEl('div', { cls: 'meridian-gallery' });
        const activePresets = isAnalog ? ANALOG_PRESETS : DIGITAL_PRESETS;
        activePresets.forEach(preset => this.renderPresetCard(galleryGrid, preset));
        
        const secCollection = this.createDetails(containerEl, t.secCollection as string, 'collection'); 
        const collectionGrid = secCollection.createEl('div', { cls: 'meridian-gallery' });
        const myPresets = this.plugin.settings.userPresets.filter(p => p.visuals.clockFace === this.plugin.settings.clockFace);
        if (myPresets.length === 0) collectionGrid.createEl('div', { text: t.emptyCollection as string, style: 'color: var(--text-muted); font-size: 0.85em;' });
        else myPresets.forEach(preset => this.renderPresetCard(collectionGrid, preset));
        
        new Setting(secCollection).addButton(btn => btn.setButtonText(t.btnSavePreset as string).setCta().onClick(() => {
            new PresetNameModal(this.app, this.plugin, async (name) => {
                const newPreset: SavedPreset = {
                    id: 'usr_' + Date.now(), name: name, isCustom: true,
                    visuals: {
                        clockFace: this.plugin.settings.clockFace, dialBgColor: this.plugin.settings.dialBgColor, customDialBgColor: this.plugin.settings.customDialBgColor,
                        presetColor: this.plugin.settings.presetColor, customColor: this.plugin.settings.customColor, numberColor: this.plugin.settings.numberColor, customNumberColor: this.plugin.settings.customNumberColor,
                        tickColor: this.plugin.settings.tickColor, customTickColor: this.plugin.settings.customTickColor, hHandColor: this.plugin.settings.hHandColor, customHHandColor: this.plugin.settings.customHHandColor, mHandColor: this.plugin.settings.mHandColor, customMHandColor: this.plugin.settings.customMHandColor,
                        outerRing: this.plugin.settings.outerRing, innerRing: this.plugin.settings.innerRing, secondHandMode: this.plugin.settings.secondHandMode, showDate: this.plugin.settings.showDate,
                        digitalTimeColor: this.plugin.settings.digitalTimeColor, customDigitalTimeColor: this.plugin.settings.customDigitalTimeColor, digitalSecColor: this.plugin.settings.digitalSecColor, customDigitalSecColor: this.plugin.settings.customDigitalSecColor, digitalSecSize: this.plugin.settings.digitalSecSize, digitalFont: this.plugin.settings.digitalFont
                    }
                };
                if (!this.plugin.settings.userPresets) this.plugin.settings.userPresets = [];
                this.plugin.settings.userPresets.push(newPreset);
                await this.plugin.saveSettings(); this.display();
            }).open();
        }));

        const secLang = this.createDetails(containerEl, t.secLang as string, 'lang');
        new Setting(secLang).setName(t.langName as string).addDropdown(drop => drop.addOption('zh', '简体中文').addOption('en', 'English').setValue(this.plugin.settings.language).onChange(async (v: 'zh'|'en') => { this.plugin.settings.language = v; await this.plugin.saveSettings(); this.display(); }));

        if (isAnalog) {
            const secColor = this.createDetails(containerEl, t.secColor as string, 'color');
            const addColorSetting = (container: HTMLElement, name: string, dictKey: 'bg'|'accent'|'generic', valKey: string, customKey: string) => {
                const dict = COLOR_OPTIONS[dictKey][this.plugin.settings.language] as Record<string, string>;
                new Setting(container).setName(name).addDropdown(drop => {
                    for (const [hex, label] of Object.entries(dict)) drop.addOption(hex, label);
                    drop.setValue((this.plugin.settings as any)[valKey]).onChange(async (v) => { (this.plugin.settings as any)[valKey] = v; await this.plugin.saveSettings(); this.display(); });
                });
                if ((this.plugin.settings as any)[valKey] === 'custom') new Setting(container).setName(t.colorCustom as string).addColorPicker(color => color.setValue((this.plugin.settings as any)[customKey]).onChange(async (v) => { (this.plugin.settings as any)[customKey] = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
            };
            addColorSetting(secColor, t.bgName as string, 'bg', 'dialBgColor', 'customDialBgColor');
            addColorSetting(secColor, t.colorName as string, 'accent', 'presetColor', 'customColor');
            addColorSetting(secColor, t.numColorName as string, 'generic', 'numberColor', 'customNumberColor');
            addColorSetting(secColor, t.tickColorName as string, 'generic', 'tickColor', 'customTickColor');
            addColorSetting(secColor, t.hHandColorName as string, 'generic', 'hHandColor', 'customHHandColor');
            addColorSetting(secColor, t.mHandColorName as string, 'generic', 'mHandColor', 'customMHandColor');

            const secGeo = this.createDetails(containerEl, t.secGeo as string, 'geo');
            new Setting(secGeo).setName(t.outerRing as string).addDropdown(drop => drop.addOption('ticks', t.optTicks as string).addOption('ticks-dense', t.optDense as string).addOption('ticks-uniform', t.optUniform as string).addOption('dots-lines', t.optDotsLines as string).addOption('numbers', t.optNumbers as string).addOption('hidden', t.optHidden as string).setValue(this.plugin.settings.outerRing).onChange(async (v: any) => { 
                this.plugin.settings.outerRing = v; 
                if (v === 'dots-lines') this.plugin.settings.innerRing = 'hidden';
                await this.plugin.saveSettings(); this.display(); 
            }));
            const innerSet = new Setting(secGeo).setName(t.innerRing as string).addDropdown(drop => drop.addOption('ticks', t.optTicks as string).addOption('numbers', t.optNumbers as string).addOption('hidden', t.optHidden as string).setValue(this.plugin.settings.innerRing).onChange(async (v: any) => { this.plugin.settings.innerRing = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
            if (this.plugin.settings.outerRing === 'dots-lines') innerSet.setDisabled(true);

            const secHands = this.createDetails(containerEl, t.secHands as string, 'hands');
            new Setting(secHands).setName(t.secMode as string).addDropdown(drop => drop.addOption('sweep', t.optSweep as string).addOption('tick', t.optTick as string).addOption('hidden', t.optHidden as string).setValue(this.plugin.settings.secondHandMode).onChange(async (v: any) => { this.plugin.settings.secondHandMode = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
            new Setting(secHands).setName(t.showDate as string).addToggle(toggle => toggle.setValue(this.plugin.settings.showDate).onChange(async (v) => { this.plugin.settings.showDate = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
        
        } else {
            const secColor = this.createDetails(containerEl, t.secColor as string, 'digiColor');
            const addDigiColor = (container: HTMLElement, name: string, dictKey: 'generic', valKey: string, customKey: string) => {
                const dict = COLOR_OPTIONS[dictKey][this.plugin.settings.language] as Record<string, string>;
                new Setting(container).setName(name).addDropdown(drop => {
                    for (const [hex, label] of Object.entries(dict)) drop.addOption(hex, label);
                    drop.setValue((this.plugin.settings as any)[valKey]).onChange(async (v) => { (this.plugin.settings as any)[valKey] = v; await this.plugin.saveSettings(); this.display(); });
                });
                if ((this.plugin.settings as any)[valKey] === 'custom') new Setting(container).setName(t.colorCustom as string).addColorPicker(color => color.setValue((this.plugin.settings as any)[customKey]).onChange(async (v) => { (this.plugin.settings as any)[customKey] = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
            };
            addDigiColor(secColor, t.digiTimeColor as string, 'generic', 'digitalTimeColor', 'customDigitalTimeColor');
            addDigiColor(secColor, t.digiSecColor as string, 'generic', 'digitalSecColor', 'customDigitalSecColor');

            const secFont = this.createDetails(containerEl, t.fontTitle as string, 'digiFont');
            new Setting(secFont).setName(t.digiSecSize as string).addDropdown(drop => drop.addOption('small', t.optSmall as string).addOption('large', t.optLarge as string).addOption('hidden', t.optHidden as string).setValue(this.plugin.settings.digitalSecSize).onChange(async (v: any) => { this.plugin.settings.digitalSecSize = v; await this.plugin.saveSettings(); this.buildPreview(previewBox); }));
            
            const fontGrid = secFont.createEl('div', { cls: 'meridian-font-picker' });
            const fontList = FONTS[this.plugin.settings.language] as Array<any>;
            fontList.forEach(font => {
                const card = fontGrid.createEl('div', { cls: `meridian-font-card ${this.plugin.settings.digitalFont === font.id ? 'is-active' : ''}` });
                card.style.fontFamily = font.id;
                card.createEl('div', { text: '10:09' });
                card.createEl('div', { cls: 'meridian-font-label', text: font.name });
                card.onclick = async () => { this.plugin.settings.digitalFont = font.id; await this.plugin.saveSettings(); this.display(); };
            });
        }

        const secTz = this.createDetails(containerEl, t.secTz as string, 'tz');
        new Setting(secTz).setName(t.worldClock as string).addToggle(toggle => toggle.setValue(this.plugin.settings.isWorldClock).onChange(async (v) => { this.plugin.settings.isWorldClock = v; await this.plugin.saveSettings(); this.display(); }));
        const tzCount = this.plugin.settings.isWorldClock ? 4 : 1;
        for (let i = 0; i < tzCount; i++) {
            const cityInfo = getCityById(this.plugin.settings.cityIds[i], this.plugin.settings.customCities);
            const displayName = this.plugin.settings.language === 'zh' ? cityInfo.zh : cityInfo.en;
            new Setting(secTz).setName(this.plugin.settings.isWorldClock ? `${t.tzWorld} ${i + 1}` : (t.tzMain as string)).addButton(btn => btn.setButtonText(t.btnSearch as string).setCta().onClick(() => { new CitySuggestModal(this.app, this.plugin, async (selectedCity) => { this.plugin.settings.cityIds[i] = selectedCity.id; await this.plugin.saveSettings(); this.display(); }).open(); })).addText(text => text.setValue(displayName).setDisabled(true));
        }

        const secCustomCity = this.createDetails(containerEl, t.customCitiesTitle as string, 'customCities');
        new Setting(secCustomCity).addButton(btn => btn.setButtonText(t.btnAddCity as string).setCta().onClick(() => {
            new CustomCityModal(this.app, this.plugin, async (city) => {
                if (!this.plugin.settings.customCities) this.plugin.settings.customCities = [];
                this.plugin.settings.customCities.push(city);
                await this.plugin.saveSettings(); this.display();
            }).open();
        }));

        const cList = secCustomCity.createEl('div', { cls: 'meridian-city-list' });
        if (!this.plugin.settings.customCities || this.plugin.settings.customCities.length === 0) {
            cList.createEl('div', { text: t.customCityEmpty as string, style: 'color: var(--text-muted); font-size: 0.85em; text-align: center; padding: 10px;' });
        } else {
            this.plugin.settings.customCities.forEach(city => {
                const row = cList.createEl('div', { cls: 'meridian-city-row' });
                const info = row.createEl('div', { cls: 'meridian-city-info' });
                info.createEl('div', { cls: 'meridian-city-name', text: this.plugin.settings.language === 'zh' ? city.zh : city.en });
                info.createEl('div', { cls: 'meridian-city-tz', text: city.tz });
                const delBtn = row.createEl('button', { cls: 'meridian-delete-btn', text: t.btnDelete as string });
                delBtn.onclick = async () => {
                    this.plugin.settings.customCities = this.plugin.settings.customCities.filter(c => c.id !== city.id);
                    await this.plugin.saveSettings(); this.display();
                };
            });
        }
    }

    private renderPresetCard(container: HTMLElement, preset: SavedPreset) {
        const card = container.createEl('div', { cls: 'meridian-preset-card' });
        const svgWrapper = card.createEl('div', { cls: 'meridian-preset-svg-wrapper' });
        const wrapper = ClockRenderer.buildStaticMiniPreview(preset.visuals);
        svgWrapper.appendChild(wrapper);
        card.createEl('div', { cls: 'meridian-preset-name', text: preset.name });
        card.onClickEvent(async (e) => {
            if ((e.target as HTMLElement).tagName === 'BUTTON') return;
            Object.assign(this.plugin.settings, preset.visuals);
            await this.plugin.saveSettings(); this.display(); 
        });

        if (preset.isCustom) {
            const delBtn = card.createEl('button', { cls: 'meridian-delete-btn', text: TEXTS[this.plugin.settings.language].btnDelete });
            delBtn.onclick = async () => {
                this.plugin.settings.userPresets = this.plugin.settings.userPresets.filter(p => p.id !== preset.id);
                await this.plugin.saveSettings(); this.display();
            };
        }
    }

    private buildPreview(container: HTMLElement) {
        if (this.previewFrameId !== null) cancelAnimationFrame(this.previewFrameId);
        container.empty();
        
        if (this.plugin.settings.clockFace === 'analog') {
            const accent = ClockRenderer.getRealColor(this.plugin.settings, 'accent');
            const bg = ClockRenderer.getRealColor(this.plugin.settings, 'bg');
            const numC = ClockRenderer.getRealColor(this.plugin.settings, 'num');
            const tickC = ClockRenderer.getRealColor(this.plugin.settings, 'tick');
            const hC = ClockRenderer.getRealColor(this.plugin.settings, 'hHand');
            const mC = ClockRenderer.getRealColor(this.plugin.settings, 'mHand');
            
            const svg = ClockRenderer.buildAnalogSVG(this.plugin.settings, accent, bg, numC, tickC);
            const mHand = ClockRenderer.createHandGroup(13, 88, 100, 6, mC); 
            const hHand = ClockRenderer.createHandGroup(45, 88, 100, 6, hC); 
            let sHand: SVGLineElement | undefined;
            svg.append(hHand, mHand);
            if (this.plugin.settings.secondHandMode !== 'hidden') { sHand = ClockRenderer.createSecondHand(6, accent, 120); svg.appendChild(sHand); }
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", "100"); dot.setAttribute("cy", "100"); dot.setAttribute("r", "5"); dot.setAttribute("fill", accent);
            svg.appendChild(dot);
            container.appendChild(svg);
            const dateEl = svg.querySelector("#meridian-date-el") as SVGTextElement | null;
            this.previewActiveHands = { h: hHand, m: mHand, s: sHand, dateEl };
            this.previewDigitalEl = null;
        } else {
            const digitalBox = container.createEl("div", { cls: "meridian-digital-face" });
            digitalBox.style.fontFamily = this.plugin.settings.digitalFont;
            this.previewDigitalEl = digitalBox.createEl("div", { cls: "meridian-digital-time" });
            this.previewActiveHands = null;
        }

        const tick = () => {
            const now = new Date();
            if (this.plugin.settings.clockFace === 'analog' && this.previewActiveHands) {
                const ms = now.getMilliseconds(); const s = now.getSeconds(); const m = now.getMinutes(); const h = now.getHours();
                if (this.previewActiveHands.dateEl) this.previewActiveHands.dateEl.textContent = String(now.getDate());
                const exactS = this.plugin.settings.secondHandMode === 'sweep' ? s + ms / 1000 : s;
                const exactM = m + exactS / 60; const exactH = (h % 12) + exactM / 60;
                if (this.previewActiveHands.s) this.previewActiveHands.s.setAttribute("transform", `rotate(${exactS * 6}, 100, 100)`);
                this.previewActiveHands.m.setAttribute("transform", `rotate(${exactM * 6}, 100, 100)`);
                this.previewActiveHands.h.setAttribute("transform", `rotate(${exactH * 30}, 100, 100)`);
            } else if (this.previewDigitalEl) {
                const timeCol = ClockRenderer.getRealColor(this.plugin.settings, 'digiTime');
                const secCol = ClockRenderer.getRealColor(this.plugin.settings, 'digiSec');
                const secStyle = this.plugin.settings.digitalSecSize === 'large' 
                    ? `font-size: 1em; margin-left: 6px; font-weight: inherit; color: ${secCol};`
                    : `font-size: 0.4em; margin-left: 6px; font-weight: 700; color: ${secCol}; opacity: 0.9;`;
                
                const hh = padZero(now.getHours()); const mm = padZero(now.getMinutes()); const ss = padZero(now.getSeconds());
                const secHTML = this.plugin.settings.digitalSeconds === 'hidden' ? '' : `<span style="${secStyle}">${ss}</span>`;
                this.previewDigitalEl.innerHTML = `<span style="color: ${timeCol}">${hh}:${mm}</span>${secHTML}`;
            }
            this.previewFrameId = requestAnimationFrame(tick);
        };
        tick();
    }
}