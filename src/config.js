import "dotenv/config";

/**
 * كل الإعدادات القابلة للتعديل في مكان واحد
 * All tunable settings live here so you don't have to dig through the logic.
 */
export const CONFIG = {
    // رابط قائمة المشاريع (يمكن تغييره لأي تصنيف / ترتيب آخر)
    LISTING_URL:
        process.env.LISTING_URL ||
        "https://mostaql.com/projects?category=development&sort=latest",

    // كم صفحة نجلب من القائمة في كل تشغيلة (?page=2, ?page=3 ...)
    PAGES_TO_SCAN: Number(process.env.PAGES_TO_SCAN || 1),

    // الحد الأدنى للميزانية بالدولار حتى يُعتبر المشروع مناسبًا
    MIN_BUDGET: Number(process.env.MIN_BUDGET || 250),

    // أقصى عمر للمشروع بالدقائق (منذ نشره) حتى نعتبره "جديد بما يكفي"
    // بما أن القائمة مرتبة من الأحدث للأقدم، بمجرد الوصول لمشروع أقدم من هذا نتوقف عن الفحص فورًا
    MAX_PROJECT_AGE_MINUTES: Number(process.env.MAX_PROJECT_AGE_MINUTES || 300),

    // الحد الأدنى لمعدل توظيف صاحب المشروع (بالنسبة المئوية)
    MIN_EMPLOYMENT_RATE: Number(process.env.MIN_EMPLOYMENT_RATE || 30),

    // هل نقبل العملاء الجدد الذين لم يُحسب لهم معدل توظيف بعد؟
    ACCEPT_NEW_CLIENTS: (process.env.ACCEPT_NEW_CLIENTS ?? "true") === "true",

    // فترة إعادة التشغيل التلقائي (صيغة cron) - كل 5 دقائق افتراضيًا حسب طلبك
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || "*/5 * * * *",

    // وضع التشغيل: once = مرة واحدة ثم يخرج | cron = يعمل بشكل دوري (الافتراضي الآن)
    RUN_MODE: process.env.RUN_MODE || "cron",

    // إعدادات بوت تيليجرام لإرسال الإشعارات
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",

    // مسار ملف تتبع المشاريع التي تمت معالجتها سابقًا (لتفادي التكرار)
    SEEN_STORE_PATH: "./data/seen.json",

    // مسار ملف نتائج المشاريع المطابقة (تُحفظ هنا مع نص العرض المقترح)
    MATCHES_OUTPUT_PATH: "./data/matches.json",

    // الـ User-Agent المستخدم في الطلبات
    USER_AGENT:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",

    // مهلة الانتظار بين طلب وآخر لصفحات المشاريع الفردية (مللي ثانية) حتى لا يتم حظرك
    DELAY_BETWEEN_REQUESTS_MS: Number(process.env.DELAY_BETWEEN_REQUESTS_MS || 1500),
};

// نص خبرتك ومهاراتك المستخدم في توليد نص العرض المقترح تلقائيًا
export const MY_EXPERIENCE = `
تصميم عصري ومتجاوب مع جميع الأجهزة
سرعة وأداء عالي
تحسين لمحركات البحث (SEO)
سهولة التعديل والإدارة
دعم مجاني لمدة شهر بعد التسليم

الأدوات والتقنيات التي أعمل بها:
- Frontend: React, Next.js
- Backend: Node.js, Express.js
- قواعد البيانات: MongoDB, PostgreSQL, SQL
- ووردبريس: WordPress, WooCommerce, Elementor
- التحكم في الإصدارات: GitHub
- خبرة في الاستضافة على منصات مثل: Hostinger, GoDaddy, Namecheap, Bluehost
`.trim();
