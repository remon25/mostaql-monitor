import cron from "node-cron";
import { CONFIG } from "./config.js";
import { getProjectList, getProjectDetails } from "./scraper.js";
import { isProjectSuitable, generateProposalDraft } from "./filterAndProposal.js";
import { loadSeenIds, saveSeenIds, appendMatch } from "./storage.js";
import { notifyMatchedProject } from "./notifier.js";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
    console.log(`\n[${new Date().toLocaleString("ar-EG")}] بدء فحص المشاريع...`);

    const seenIds = await loadSeenIds();
    const projects = await getProjectList();
    console.log(`تم العثور على ${projects.length} مشروع في القائمة.`);

    const newProjects = projects.filter((p) => !seenIds.has(p.id));
    console.log(`منها ${newProjects.length} مشروع جديد لم تتم معالجته سابقًا.`);

    let matchCount = 0;

    for (const project of newProjects) {
        try {
            const details = await getProjectDetails(project.link);
            const { suitable, reasons } = isProjectSuitable(details);

            console.log(
                `- ${project.title} (${project.postedText || "?"}) | ${suitable ? "✅ مطابق" : "❌ غير مطابق"} (${reasons.join(", ")})`
            );

            if (suitable) {
                matchCount++;
                const proposal = generateProposalDraft(project);
                await appendMatch({
                    id: project.id,
                    title: project.title,
                    link: project.link,
                    budget: details.budget,
                    employmentRate: details.employmentRate,
                    clientName: details.clientName,
                    proposalsText: project.proposalsText,
                    proposalDraft: proposal,
                    foundAt: new Date().toISOString(),
                });

                await notifyMatchedProject(project, details);
            }

            seenIds.add(project.id);
        } catch (err) {
            console.error(`⚠️  خطأ أثناء معالجة المشروع ${project.link}:`, err.message);
        }

        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS_MS);
    }

    await saveSeenIds(seenIds);
    console.log(`تم الانتهاء. عدد المشاريع المطابقة الجديدة: ${matchCount}.`);
    console.log(`راجع النتائج في: ${CONFIG.MATCHES_OUTPUT_PATH}`);
}

if (CONFIG.RUN_MODE === "cron") {
    console.log(`تشغيل دوري مفعّل حسب الجدول: ${CONFIG.CRON_SCHEDULE}`);
    runOnce(); // تشغيل فوري عند البدء
    cron.schedule(CONFIG.CRON_SCHEDULE, runOnce);
} else {
    await runOnce();
}
