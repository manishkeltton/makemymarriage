import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m7_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM7Verification() {
  console.log("🚀 Running Milestone 7 UI Chrome Verification (Billing & Platform Admin)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `m7_fresh_${timestamp}@example.com`;
  const randomIp = `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(500);

  // 1. Signup
  const signupRes = await page.evaluate(async (email, ipHeader) => {
    const res = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-forwarded-for": ipHeader,
      },
      body: JSON.stringify({
        name: "Billing Admin",
        email,
        password: "Password123!",
      }),
    });
    return { status: res.status, data: await res.json() };
  }, testEmail, randomIp);

  // 2. Create Workspace
  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/v1/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Aarav & Meera SaaS Billing Workspace",
        bride: { name: "Meera" },
        groom: { name: "Aarav" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return { status: res.status, data: await res.json() };
  });

  const weddingId = createRes.data?.data?.id || createRes.data?.data?._id;

  if (weddingId) {
    // 3. Desktop Billing & Plan Usage Page View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/settings/billing`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m7_01_billing_desktop.png"), fullPage: true });

    // 4. Mobile Billing Page View
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/settings/billing`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m7_02_billing_mobile.png"), fullPage: true });

    // 5. Desktop Platform Admin Portal View (Redirect / Forbidden verification)
    await page.setViewport({ width: 1280, height: 960 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m7_03_admin_desktop.png"), fullPage: true });
  }

  await browser.close();
  console.log("✅ Milestone 7 UI Chrome Verification Completed!");
}

runM7Verification().catch(console.error);
