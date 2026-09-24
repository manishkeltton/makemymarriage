import puppeteer from "puppeteer-core";

async function testCookieFlow() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const email = `test.cookie.${timestamp}@example.com`;

  console.log("Navigating to signup...");
  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle0" });

  await page.type('input[name="name"]', "Test User");
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "Password123!");

  console.log("Submitting signup...");
  await page.click('button[type="submit"]');

  // Wait for network response and cookie persistence
  await new Promise((r) => setTimeout(r, 2000));

  console.log("URL after signup submit:", page.url());

  const cookies = await page.cookies();
  console.log("Cookies in browser:", cookies.map(c => c.name));

  // Visit /workspace
  await page.goto("http://localhost:3000/workspace", { waitUntil: "networkidle0" });
  console.log("URL after visiting /workspace:", page.url());

  await browser.close();
}

testCookieFlow();
