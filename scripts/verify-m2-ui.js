import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m2_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM2Verification() {
  console.log("🚀 Running Milestone 2 UI Chrome Verification (Events & Tasks)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `m2_user_${timestamp}@example.com`;

  // 1. Signup user
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (email) => {
    await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rohan & Ananya",
        email,
        password: "Password123!",
      }),
    });
  }, testEmail);

  // 2. Create Wedding Workspace
  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/v1/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Rohan & Ananya's Hindu Wedding",
        bride: { name: "Ananya Sharma" },
        groom: { name: "Rohan Kapoor" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return res.json();
  });

  const weddingId = createRes.data?.id;

  if (weddingId) {
    // 3. Create sample events
    await page.evaluate(async (wId) => {
      await fetch(`/api/v1/weddings/${wId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sangeet & Musical Night",
          type: "SANGEET",
          startAt: "2027-11-19T18:00:00.000Z",
          venue: { name: "Rambagh Palace", city: "Jaipur" },
          dressCode: "Royal Ethnic / Indo-Western",
        }),
      });

      await fetch(`/api/v1/weddings/${wId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Main Wedding Muhurat",
          type: "WEDDING",
          startAt: "2027-11-20T10:00:00.000Z",
          venue: { name: "Palace Courtyard", city: "Jaipur" },
          dressCode: "Traditional Royal Silk",
        }),
      });
    }, weddingId);

    // 4. Desktop Dashboard View
    await page.goto(`${BASE_URL}/workspace/${weddingId}`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m2_01_dashboard_desktop.png"), fullPage: true });

    // 5. Desktop Events Timeline View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/events`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m2_02_events_desktop.png"), fullPage: true });

    // 6. Mobile Events Timeline View
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/events`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m2_03_events_mobile.png"), fullPage: true });

    // 7. Desktop Tasks View
    await page.setViewport({ width: 1280, height: 960 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/tasks`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m2_04_tasks_desktop.png"), fullPage: true });
  }

  await browser.close();
  console.log("✅ Milestone 2 UI Chrome Verification Completed!");
}

runM2Verification().catch(console.error);
