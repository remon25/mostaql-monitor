import { saveRawHtmlForDebug } from "./scraper.js";
import { CONFIG } from "./config.js";

const url = process.argv[2] || CONFIG.LISTING_URL;

console.log(`جاري جلب: ${url}`);
await saveRawHtmlForDebug(url, "./data/debug.html");
console.log("افتح data/debug.html وابحث فيه (Ctrl+F) عن كلمات مثل:");
console.log(' - "الميزانية"  (لمعرفة شكل عرض السعر)');
console.log(' - "معدل التوظيف"  (لمعرفة شكل عرض تقييم العميل)');
console.log('إن اختلف الشكل عمّا هو متوقع، عدّل الدوال parseBudgetFromText / parseEmploymentRate في scraper.js');
