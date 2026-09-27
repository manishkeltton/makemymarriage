import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/bd0f6874-66a6-4304-867c-0cd45d773b9b/m3_ui_verification";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runM3Verification() {
  console.log("🚀 Running Milestone 3 UI Chrome Verification (Expenses & Vendors)...");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `m3_user_${timestamp}@example.com`;

  // 1. Signup user
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (email) => {
    await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav & Meera",
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
        title: "Aarav & Meera Money Workspace",
        bride: { name: "Meera" },
        groom: { name: "Aarav" },
        primaryWeddingDate: "2027-11-20T00:00:00.000Z",
      }),
    });
    return res.json();
  });

  const weddingId = createRes.data?.id;

  if (weddingId) {
    // 3. Create Vendor & Expense
    await page.evaluate(async (wId) => {
      const vRes = await fetch(`/api/v1/weddings/${wId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "PHOTOGRAPHY",
          businessName: "Lens Story Studios",
          contactPerson: { name: "Vikram Mehta" },
          contactPhone: "+91 9876543210",
        }),
      });
      const vData = await vRes.json();
      const vendorId = vData.data?.id;

      await fetch(`/api/v1/weddings/${wId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Catering & Banquet Deposit",
          category: "CATERING",
          vendorId: vendorId,
          totalAmountPaise: 25000000,
        }),
      });
    }, weddingId);

    // 4. Desktop Expenses View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/expenses`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m3_01_expenses_desktop.png"), fullPage: true });

    // 5. Mobile Expenses View
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/expenses`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m3_02_expenses_mobile.png"), fullPage: true });

    // 6. Desktop Vendors View
    await page.setViewport({ width: 1280, height: 960 });
    await page.goto(`${BASE_URL}/workspace/${weddingId}/vendors`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m3_03_vendors_desktop.png"), fullPage: true });

    // 7. Desktop Documents View
    await page.goto(`${BASE_URL}/workspace/${weddingId}/documents`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "m3_04_documents_desktop.png"), fullPage: true });
  }

  await browser.close();
  console.log("✅ Milestone 3 UI Chrome Verification Completed!");
}

runM3Verification().catch(console.error);
