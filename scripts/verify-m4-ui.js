import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m4_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM4Verification() {
  console.log("🚀 Running Milestone 4 UI Chrome Verification (Guests & RSVP)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `m4_user_${timestamp}@example.com`;

  // 1. Signup user
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (email) => {
    await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Guest Host",
        email,
        password: "Password123!",
      }),
    });
  }, testEmail);

  // 2. Create Workspace
  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/v1/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Sharma Family Celebration",
        bride: { name: "Ananya" },
        groom: { name: "Rohan" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return res.json();
  });

  const weddingId = createRes.data?.id;

  if (weddingId) {
    // 3. Create Household & Guest
    const hRes = await page.evaluate(async (wId) => {
      const res = await fetch(`/api/v1/weddings/${wId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Kapoor Family",
          paxInvited: 4,
          side: "GROOM",
          tier: "VIP",
          members: [
            { name: "Rajesh Kapoor", ageGroup: "ADULT" },
            { name: "Sunita Kapoor", ageGroup: "ADULT" },
          ],
        }),
      });
      return res.json();
    }, weddingId);

    const householdId = hRes.data?.id;

    // 4. Desktop Guests Directory View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/guests`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m4_01_guests_desktop.png"), fullPage: true });

    // 5. Mobile Guests Directory View
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/guests`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m4_02_guests_mobile.png"), fullPage: true });

    // 6. Mobile Public Invitation & RSVP Page View
    if (householdId) {
      const tokenRes = await page.evaluate(async (wId, hId) => {
        const res = await fetch(`/api/v1/weddings/${wId}/guests/${hId}/access-link`, {
          method: "POST",
        });
        return res.json();
      }, weddingId, householdId);

      const rawToken = tokenRes.data?.token || tokenRes.data?.rawToken;
      if (rawToken) {
        await page.goto(`${BASE_URL}/invite/${rawToken}`, { waitUntil: "domcontentloaded" });
        await sleep(1500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m4_03_rsvp_mobile.png"), fullPage: true });

        await page.setViewport({ width: 1280, height: 960 });
        await page.goto(`${BASE_URL}/invite/${rawToken}`, { waitUntil: "domcontentloaded" });
        await sleep(1500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m4_04_rsvp_desktop.png"), fullPage: true });
      }
    }
  }

  await browser.close();
  console.log("✅ Milestone 4 UI Chrome Verification Completed!");
}

runM4Verification().catch(console.error);
