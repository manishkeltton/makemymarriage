import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m1_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM1Verification() {
  console.log("🚀 Running Milestone 1 UI Chrome Verification (Desktop & Mobile)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // 1. Desktop Login Page
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m1_01_login_desktop.png"), fullPage: true });

  // 2. Mobile Login Page
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m1_02_login_mobile.png"), fullPage: true });

  // 3. Desktop Signup Page
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "domcontentloaded" });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m1_03_signup_desktop.png"), fullPage: true });

  // 4. Authenticate & Create Workspace for Settings verification
  const timestamp = Date.now();
  const testEmail = `m1_user_${timestamp}@example.com`;
  
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (email) => {
    await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav Sharma",
        email,
        password: "Password123!",
      }),
    });
  }, testEmail);

  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/v1/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Aarav & Meera's Wedding",
        bride: { name: "Meera Kapoor" },
        groom: { name: "Aarav Sharma" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return res.json();
  });

  const weddingId = createRes.data?.id;

  if (weddingId) {
    // 5. Desktop Workspace Settings
    await page.setViewport({ width: 1280, height: 960 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/settings`, { waitUntil: "domcontentloaded" });
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m1_04_settings_desktop.png"), fullPage: true });

    // 6. Mobile Workspace Settings
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/settings`, { waitUntil: "domcontentloaded" });
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m1_05_settings_mobile.png"), fullPage: true });
  }

  await browser.close();
  console.log("✅ Milestone 1 UI Chrome Verification Completed!");
}

runM1Verification().catch(console.error);
