import axios from "axios";
import { CONFIG } from "./config.js";

/**
 * يرسل رسالة نصية عبر بوت تيليجرام.
 * يتطلب TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID في ملف .env
 * راجع README.md لمعرفة كيفية الحصول عليهما.
 */
export async function sendTelegramMessage(text) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
        console.warn(
            "⚠️  لم يتم ضبط TELEGRAM_BOT_TOKEN أو TELEGRAM_CHAT_ID في .env — تم تخطي إرسال الإشعار."
        );
        return false;
    }

    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CONFIG.TELEGRAM_CHAT_ID,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
        });
        return true;
    } catch (err) {
        console.error(
            "⚠️  فشل إرسال إشعار تيليجرام:",
            err.response?.data || err.message
        );
        return false;
    }
}

/** يبني نص الإشعار الخاص بمشروع مطابق ويرسله */
export async function notifyMatchedProject(project, details) {
    const budgetText = details.budget
        ? `$${details.budget.min} - $${details.budget.max}`
        : "غير محدد";

    const employmentRateText =
        details.employmentRate === "new"
            ? "عميل جديد (لم يُحسب بعد)"
            : `${details.employmentRate}%`;

    const message = `
🟢 <b>مشروع جديد مطابق للشروط</b>

📌 <b>${escapeHtml(project.title)}</b>

⏱ نُشر: ${escapeHtml(project.postedText || "غير معروف")}
💰 الميزانية: ${budgetText}
👤 العميل: ${escapeHtml(details.clientName || "غير معروف")}
📊 معدل التوظيف: ${employmentRateText}
📨 عدد العروض: ${escapeHtml(project.proposalsText || "-")}

🔗 ${project.link}
`.trim();

    return sendTelegramMessage(message);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
