import axios from "axios";
import * as cheerio from "cheerio";
import { CONFIG } from "./config.js";

const httpClient = axios.create({
    headers: {
        "User-Agent": CONFIG.USER_AGENT,
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout: 20000,
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * يحوّل نص وقت نسبي بالعربية (مثال: "منذ 12 دقيقة"، "منذ ساعة"، "منذ يومين")
 * إلى عدد الدقائق التي مرت. يرجع null إن لم يستطع الفهم.
 */
function parseRelativeMinutes(text) {
    if (!text) return null;
    const t = text.trim();

    if (/لحظات|الآن/.test(t)) return 0;

    // دقيقة / دقائق
    let m = t.match(/(\d+)\s*(دقيقة|دقائق)/);
    if (m) return Number(m[1]);
    if (/دقيقة/.test(t)) return 1; // "منذ دقيقة" بدون رقم

    // ساعة / ساعتين / ساعات
    m = t.match(/(\d+)\s*(ساعة|ساعات)/);
    if (m) return Number(m[1]) * 60;
    if (/ساعتين/.test(t)) return 120;
    if (/ساعة/.test(t)) return 60;

    // يوم / يومين / أيام
    m = t.match(/(\d+)\s*(يوم|أيام)/);
    if (m) return Number(m[1]) * 1440;
    if (/يومين/.test(t)) return 2880;
    if (/يوم/.test(t)) return 1440;

    // أسبوع فأكثر: بعيد جدًا، تُعتبر قديمة قطعًا
    if (/أسبوع|أسابيع|شهر|أشهر|سنة|سنوات/.test(t)) return 999999;

    return null;
}

/** يستخرج رقم المشروع من الرابط، مثال: .../project/1259141-عنوان... => "1259141" */
export function extractProjectId(link) {
    const match = link?.match(/\/project\/(\d+)/);
    return match ? match[1] : link;
}

/**
 * يجلب قائمة المشاريع من صفحة (أو عدة صفحات) القائمة الرئيسية.
 * ملاحظة: أسماء الـ classes هنا (project-row, project__brief, project__meta)
 * مأخوذة من الكود الأصلي الذي كان لديك، إن تغيّر تصميم الموقع مستقبلًا
 * راجع دالة saveRawHtmlForDebug أدناه لمعاينة الـ HTML الفعلي وتحديث المحددات.
 */
export async function getProjectList() {
    const allProjects = [];

    for (let page = 1; page <= CONFIG.PAGES_TO_SCAN; page++) {
        const url = page === 1 ? CONFIG.LISTING_URL : `${CONFIG.LISTING_URL}&page=${page}`;

        const { data } = await httpClient.get(url);
        const $ = cheerio.load(data);

        let hitOldProject = false;

        $(".project-row").each((_, element) => {
            const el = $(element);
            const titleAnchor = el.find("h2 a").first();

            const title = titleAnchor.text().trim();
            const link = titleAnchor.attr("href");

            if (!title || !link) return; // تجاهل أي صف غير متوقع الشكل

            const description = el.find(".project__brief").text().trim();

            const metaItems = el.find(".project__meta li");
            const proposalsText = metaItems.last().text().trim();

            // نبحث بين عناصر الـ meta عن النص الذي يحمل الوقت النسبي (مثال: "منذ 12 دقيقة")
            let postedText = null;
            metaItems.each((__, li) => {
                const t = $(li).text().trim();
                if (/منذ|لحظات|الآن/.test(t)) postedText = t;
            });
            const postedMinutesAgo = parseRelativeMinutes(postedText);

            // بما أن القائمة مرتبة من الأحدث للأقدم، أول مشروع نجده أقدم من الحد الأقصى
            // يعني أن كل ما بعده في القائمة أقدم أيضًا، فنتوقف فورًا عن الفحص
            if (postedMinutesAgo !== null && postedMinutesAgo > CONFIG.MAX_PROJECT_AGE_MINUTES) {
                hitOldProject = true;
                return false; // يوقف .each() الحالي
            }

            allProjects.push({
                id: extractProjectId(link),
                title,
                link: link.startsWith("http") ? link : `https://mostaql.com${link}`,
                description,
                proposalsText,
                postedText,
                postedMinutesAgo,
            });
        });

        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS_MS);

        if (hitOldProject) break; // لا داعي لفحص صفحات أقدم
    }

    return allProjects;
}

/**
 * يحلل نصًا مثل "$250.00 - $500.00" أو "$250.00"
 * ويرجع { min, max } بالدولار، أو null إن لم يُعثر على شيء.
 */
function parseBudgetFromText(text) {
    if (!text) return null;

    const rangeMatch = text.match(
        /\$?\s?([\d,]+(?:\.\d+)?)\s?\$?\s*(?:-|إلى|to)\s*\$?\s?([\d,]+(?:\.\d+)?)\s?\$?/i
    );
    if (rangeMatch) {
        return {
            min: Number(rangeMatch[1].replace(/,/g, "")),
            max: Number(rangeMatch[2].replace(/,/g, "")),
        };
    }

    const singleMatch = text.match(/\$\s?([\d,]+(?:\.\d+)?)/);
    if (singleMatch) {
        const value = Number(singleMatch[1].replace(/,/g, ""));
        return { min: value, max: value };
    }

    return null;
}

/**
 * يحلل نص معدل التوظيف (مثال: "لم يحسب بعد" أو "45%")
 * يرجع رقم (0-100) أو "new" إذا كانت "لم يحسب بعد"، أو null إن لم يُفهم النص.
 */
function parseEmploymentRateText(text) {
    if (!text) return null;
    if (text.includes("لم يحسب")) return "new";

    const percentMatch = text.match(/(\d{1,3})/);
    if (percentMatch) return Number(percentMatch[1]);

    return null;
}

/**
 * يجلب تفاصيل مشروع واحد: الميزانية، اسم العميل، ومعدل توظيفه.
 *
 * تم تأكيد هذه المحددات (selectors) على صفحة مشروع حقيقية بتاريخ 2026-07-13:
 * - الميزانية: عنصر يحمل data-type="project-budget_range" (مثال: "$50.00 - $100.00")
 * - بطاقة صاحب المشروع بأكملها: عنصر يحمل data-type="employer_widget"
 *   - اسم العميل: h5.profile__name bdi (أول واحد داخل بطاقة صاحب المشروع تحديدًا،
 *     وليس داخل قائمة العروض المقدمة التي تستخدم نفس الكلاس لأسماء المستقلين)
 *   - معدل التوظيف: صف الجدول (tr) الذي يحتوي على نص "معدل التوظيف"، والقيمة في الخانة (td) الثانية
 *
 * ملاحظة: الصفحة تكرر بطاقة صاحب المشروع مرتين (نسخة لسطح المكتب ونسخة للموبايل)
 * بنفس المحتوى بالضبط، لذلك نأخذ أول نسخة فقط (.first()).
 */
export async function getProjectDetails(projectUrl) {
    const { data } = await httpClient.get(projectUrl);
    const $ = cheerio.load(data);

    // الميزانية
    const budgetText = $('[data-type="project-budget_range"]').first().text().trim();
    const budget = parseBudgetFromText(budgetText);

    // بطاقة صاحب المشروع (نأخذ أول نسخة فقط لتفادي تكرار سطح المكتب/الموبايل)
    const employerWidget = $('[data-type="employer_widget"]').first();

    // اسم العميل
    const clientName =
        employerWidget.find("h5.profile__name bdi").first().text().trim() || null;

    // معدل التوظيف: نبحث عن صف الجدول الذي يذكر "معدل التوظيف"
    let employmentRateText = null;
    employerWidget.find("table tr").each((_, tr) => {
        const $tr = $(tr);
        if ($tr.text().includes("معدل التوظيف")) {
            employmentRateText = $tr.find("td").eq(1).text().trim();
        }
    });
    const employmentRate = parseEmploymentRateText(employmentRateText);

    // وصف المشروع الكامل (من قسم "تفاصيل المشروع")
    const description = $("#project-brief .text-wrapper-div").first().text().trim().slice(0, 3000);

    return {
        url: projectUrl,
        budget, // { min, max } أو null
        clientName,
        employmentRate, // number | "new" | null
        description,
    };
}

/** يحفظ الـ HTML الخام لأي رابط في ملف محلي، مفيد لمراجعة التصميم وتحديث المحددات لاحقًا */
export async function saveRawHtmlForDebug(url, outPath = "./data/debug.html") {
    const { data } = await httpClient.get(url);
    const fs = await import("fs/promises");
    await fs.writeFile(outPath, data, "utf-8");
    console.log(`تم حفظ الصفحة في: ${outPath}`);
}
