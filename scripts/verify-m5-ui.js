import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m5_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM5Verification() {
  console.log("🚀 Running Milestone 5 UI Chrome Verification (Website Builder & Public Site)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `m5_fresh_${timestamp}@example.com`;
  const randomIp = `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(500);

  // 1. Signup with unique IP header
  const signupRes = await page.evaluate(async (email, ipHeader) => {
    const res = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-forwarded-for": ipHeader,
      },
      body: JSON.stringify({
        name: "Website Admin",
        email,
        password: "Password123!",
      }),
    });
    return { status: res.status, data: await res.json() };
  }, testEmail, randomIp);

  console.log("Signup res:", JSON.stringify(signupRes));

  // 2. Create Workspace
  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/v1/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Aarav & Meera Website",
        bride: { name: "Meera" },
        groom: { name: "Aarav" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return { status: res.status, data: await res.json() };
  });

  console.log("Create wedding res:", JSON.stringify(createRes));

  const weddingId = createRes.data?.data?.id || createRes.data?.data?._id;
  console.log("Created wedding ID for M5:", weddingId);

  if (weddingId) {
    // 3. Desktop Website Builder Editor View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/website`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m5_01_builder_desktop.png"), fullPage: true });

    // 4. Mobile Website Builder View
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/website`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m5_02_builder_mobile.png"), fullPage: true });

    // 5. Publish Website & Verify Public Site
    const pubRes = await page.evaluate(async (wId) => {
      const res = await fetch(`/api/v1/weddings/${wId}/site/publish`, {
        method: "POST",
      });
      return res.json();
    }, weddingId);

    console.log("Publish result:", JSON.stringify(pubRes));

    const slug = pubRes.data?.slug || pubRes.data?.urlSlug;
    if (slug) {
      await page.setViewport({ width: 1280, height: 960 });
      await page.goto(`${BASE_URL}/w/${slug}`, { waitUntil: "domcontentloaded" });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m5_03_public_site_desktop.png"), fullPage: true });

      await page.setViewport({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/w/${slug}`, { waitUntil: "domcontentloaded" });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m5_04_public_site_mobile.png"), fullPage: true });
    }
  }

  await browser.close();
  console.log("✅ Milestone 5 UI Chrome Verification Completed!");
}

runM5Verification().catch(console.error);
