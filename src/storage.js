import fs from "fs/promises";
import path from "path";
import { CONFIG } from "./config.js";

async function ensureFile(filePath, defaultContent) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
    }
}

export async function loadSeenIds() {
    await ensureFile(CONFIG.SEEN_STORE_PATH, []);
    const raw = await fs.readFile(CONFIG.SEEN_STORE_PATH, "utf-8");
    try {
        return new Set(JSON.parse(raw));
    } catch {
        return new Set();
    }
}

export async function saveSeenIds(seenSet) {
    await fs.writeFile(
        CONFIG.SEEN_STORE_PATH,
        JSON.stringify([...seenSet], null, 2),
        "utf-8"
    );
}

export async function appendMatch(match) {
    await ensureFile(CONFIG.MATCHES_OUTPUT_PATH, []);
    const raw = await fs.readFile(CONFIG.MATCHES_OUTPUT_PATH, "utf-8");
    let list = [];
    try {
        list = JSON.parse(raw);
    } catch {
        list = [];
    }
    list.unshift(match); // الأحدث أولاً
    await fs.writeFile(
        CONFIG.MATCHES_OUTPUT_PATH,
        JSON.stringify(list, null, 2),
        "utf-8"
    );
}
