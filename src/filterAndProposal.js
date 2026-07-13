import { CONFIG, MY_EXPERIENCE } from "./config.js";

/**
 * يقرر إن كان المشروع مناسبًا حسب شرطين:
 * 1) الميزانية 250$ فأعلى (نعتمد على الحد الأعلى للميزانية إن وُجد نطاق)
 * 2) معدل توظيف العميل 30% فأعلى، أو عميل جديد (لم يُحسب بعد) إن كان مسموحًا
 */
export function isProjectSuitable(details) {
    const reasons = [];

    // شرط الميزانية
    if (!details.budget) {
        reasons.push("لم يتم العثور على الميزانية في صفحة المشروع");
        return { suitable: false, reasons };
    }
    const effectiveBudget = details.budget.max ?? details.budget.min;
    if (effectiveBudget < CONFIG.MIN_BUDGET) {
        reasons.push(
            `الميزانية (${effectiveBudget}$) أقل من الحد الأدنى (${CONFIG.MIN_BUDGET}$)`
        );
        return { suitable: false, reasons };
    }

    // شرط معدل التوظيف
    if (details.employmentRate === "new") {
        if (!CONFIG.ACCEPT_NEW_CLIENTS) {
            reasons.push("العميل جديد (لم يُحسب بعد) والإعدادات لا تقبل العملاء الجدد");
            return { suitable: false, reasons };
        }
    } else if (typeof details.employmentRate === "number") {
        if (details.employmentRate < CONFIG.MIN_EMPLOYMENT_RATE) {
            reasons.push(
                `معدل التوظيف (${details.employmentRate}%) أقل من الحد الأدنى (${CONFIG.MIN_EMPLOYMENT_RATE}%)`
            );
            return { suitable: false, reasons };
        }
    } else {
        // لم نستطع تحديد معدل التوظيف إطلاقًا من الصفحة
        reasons.push("تعذر تحديد معدل توظيف العميل من الصفحة");
        return { suitable: false, reasons };
    }

    return { suitable: true, reasons: ["مطابق للشروط"] };
}

/** يولّد نص عرض مبدئي جاهز للتعديل قبل الإرسال الفعلي (لا يتم إرساله تلقائيًا) */
export function generateProposalDraft(project) {
    return `السلام عليكم،

بعد الاطلاع على تفاصيل مشروعكم "${project.title}"، يسعدني تقديم خبرتي للمساعدة في تنفيذه بأفضل جودة ممكنة.

ما يمكنني تقديمه لكم:
${MY_EXPERIENCE}

يسعدني مناقشة تفاصيل المشروع أكثر والاتفاق على أفضل حل يناسب احتياجاتكم.

تحياتي.`;
}
