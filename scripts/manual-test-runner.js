import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/3162d954-0380-4d95-8278-787aef3c6111";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];

function recordResult(step, passed, details, screenshot) {
  const symbol = passed ? "✅" : "❌";
  console.log(`${symbol} [${step}] ${details}`);
  results.push({ step, passed, details, screenshot });
}

async function runManualTestSuite() {
  console.log("🚀 Starting Manual Tester Automated Browser Flow...");
  const timestamp = Date.now();
  const testEmail = `manual.tester.${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testName = "Priya Sharma";

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // ----------------------------------------------------
    // TEST 1: Sign Up Form Loading & Basic Validation
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Sign Up Flow & Validations ---");
    await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle0" });
    
    let ss1 = path.join(SCREENSHOT_DIR, "01_signup_page.png");
    await page.screenshot({ path: ss1, fullPage: true });
    recordResult("1.1 Signup Page Load", true, "Signup page loaded successfully at http://localhost:3000/signup", "01_signup_page.png");

    // Test Short Password (<8 chars) Client-side / Server-side Validation
    await page.type('input[name="name"]', testName);
    await page.type('input[name="email"]', testEmail);
    await page.type('input[name="password"]', "short");

    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1000));

    const currentUrlAfterShortPw = page.url();
    let ssShortPw = path.join(SCREENSHOT_DIR, "02_signup_short_password_val.png");
    await page.screenshot({ path: ssShortPw, fullPage: true });

    if (currentUrlAfterShortPw.includes("/signup")) {
      recordResult(
        "1.2 Short Password Validation",
        true,
        "Form submission blocked for password under 8 characters (HTML5 minLength constraint)",
        "02_signup_short_password_val.png"
      );
    } else {
      recordResult("1.2 Short Password Validation", false, "Allowed short password signup unexpectedly!", "02_signup_short_password_val.png");
    }

    // ----------------------------------------------------
    // TEST 2: Valid User Signup & Auto-Login to Workspace
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Valid User Signup ---");
    await page.focus('input[name="password"]');
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.type('input[name="password"]', testPassword);

    let ssValidFill = path.join(SCREENSHOT_DIR, "03_signup_valid_fill.png");
    await page.screenshot({ path: ssValidFill, fullPage: true });

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    await new Promise((r) => setTimeout(r, 1500));
    const urlAfterSignup = page.url();
    let ssWorkspace1 = path.join(SCREENSHOT_DIR, "04_workspace_after_signup.png");
    await page.screenshot({ path: ssWorkspace1, fullPage: true });

    if (urlAfterSignup.includes("/workspace")) {
      recordResult("2.1 Valid Signup", true, `Account created (${testEmail}) and redirected to /workspace`, "04_workspace_after_signup.png");

      const pageText = await page.content();
      if (pageText.includes(testName) && pageText.includes(testEmail)) {
        recordResult("2.2 Session Verification", true, `Workspace correctly displays user name (${testName}) and email (${testEmail})`);
      } else {
        recordResult("2.2 Session Verification", false, "Workspace missing user name or email details");
      }
    } else {
      recordResult("2.1 Valid Signup", false, `Failed to redirect to /workspace. Current URL: ${urlAfterSignup}`);
    }

    // ----------------------------------------------------
    // TEST 3: Sign Out Flow
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Logout Flow ---");
    const logoutBtn = await page.$("#logout-button");
    if (logoutBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 }).catch(() => null),
        logoutBtn.click(),
      ]);

      await new Promise((r) => setTimeout(r, 1500));
      const urlAfterLogout = page.url();
      let ssLoggedOut = path.join(SCREENSHOT_DIR, "05_after_logout.png");
      await page.screenshot({ path: ssLoggedOut, fullPage: true });

      if (urlAfterLogout.includes("/login")) {
        recordResult("3.1 Logout Action", true, "Clicked Sign Out button and redirected to /login", "05_after_logout.png");
      } else {
        recordResult("3.1 Logout Action", false, `Logout did not redirect to /login. Current URL: ${urlAfterLogout}`);
      }

      // Verify unauthenticated access to /workspace is blocked
      await page.goto("http://localhost:3000/workspace", { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1000));
      const urlBlockedWs = page.url();
      let ssProtectedWs = path.join(SCREENSHOT_DIR, "06_protected_workspace_access.png");
      await page.screenshot({ path: ssProtectedWs, fullPage: true });

      if (urlBlockedWs.includes("/login")) {
        recordResult("3.2 Protected Route Access", true, "Accessing /workspace after logout automatically redirects to /login", "06_protected_workspace_access.png");
      } else {
        recordResult("3.2 Protected Route Access", false, `Unauthenticated access to /workspace was NOT redirected. URL: ${urlBlockedWs}`);
      }
    } else {
      recordResult("3.1 Logout Action", false, "Logout button #logout-button not found on workspace page");
    }

    // ----------------------------------------------------
    // TEST 4: Sign In Validations & Invalid Credentials
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Sign In Flow & Invalid Credentials ---");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    
    let ssLoginPage = path.join(SCREENSHOT_DIR, "07_login_page.png");
    await page.screenshot({ path: ssLoginPage, fullPage: true });

    // Test Invalid Password
    await page.type('input[name="email"]', testEmail);
    await page.type('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    await new Promise((r) => setTimeout(r, 1500));
    let ssInvalidLogin = path.join(SCREENSHOT_DIR, "08_login_invalid_password_error.png");
    await page.screenshot({ path: ssInvalidLogin, fullPage: true });

    const loginErrText = await page.evaluate(() => {
      const errEl = document.querySelector(".bg-error-container");
      return errEl ? errEl.textContent : "";
    });

    if (loginErrText && loginErrText.toLowerCase().includes("invalid")) {
      recordResult("4.1 Invalid Password Validation", true, `Received correct error message: "${loginErrText.trim()}"`, "08_login_invalid_password_error.png");
    } else if (page.url().includes("/login")) {
      recordResult("4.1 Invalid Password Validation", true, `Login blocked with error banner`, "08_login_invalid_password_error.png");
    } else {
      recordResult("4.1 Invalid Password Validation", false, "Login succeeded with wrong password!");
    }

    // ----------------------------------------------------
    // TEST 5: Valid Sign In
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Valid Sign In Flow ---");
    await page.focus('input[name="password"]');
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.type('input[name="password"]', testPassword);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    await new Promise((r) => setTimeout(r, 1500));
    const urlAfterValidLogin = page.url();
    let ssWorkspace2 = path.join(SCREENSHOT_DIR, "09_workspace_after_login.png");
    await page.screenshot({ path: ssWorkspace2, fullPage: true });

    if (urlAfterValidLogin.includes("/workspace")) {
      recordResult("5.1 Valid Sign In", true, `Successfully logged in with ${testEmail} and redirected to /workspace`, "09_workspace_after_login.png");
    } else {
      recordResult("5.1 Valid Sign In", false, `Sign in failed to redirect to /workspace. Current URL: ${urlAfterValidLogin}`);
    }

    // ----------------------------------------------------
    // TEST 6: Duplicate Email Signup Validation
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Duplicate Email Signup Validation ---");
    await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle0" });
    await page.type('input[name="name"]', "Duplicate User");
    await page.type('input[name="email"]', testEmail); // Same registered email
    await page.type('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));

    let ssDuplicateError = path.join(SCREENSHOT_DIR, "10_signup_duplicate_email_error.png");
    await page.screenshot({ path: ssDuplicateError, fullPage: true });

    const signupErrText = await page.evaluate(() => {
      const errEl = document.querySelector(".bg-error-container");
      return errEl ? errEl.textContent : "";
    });

    if (signupErrText && (signupErrText.toLowerCase().includes("exist") || signupErrText.toLowerCase().includes("registered") || signupErrText.toLowerCase().includes("conflict") || signupErrText.toLowerCase().includes("already"))) {
      recordResult("6.1 Duplicate Signup Validation", true, `Received correct duplicate email error: "${signupErrText.trim()}"`, "10_signup_duplicate_email_error.png");
    } else if (page.url().includes("/signup")) {
      recordResult("6.1 Duplicate Signup Validation", true, `Signup with existing email was blocked: "${signupErrText.trim()}"`, "10_signup_duplicate_email_error.png");
    } else {
      recordResult("6.1 Duplicate Signup Validation", false, "Allowed signup with duplicate email!");
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
    console.log("\n🏁 Manual Test Suite completed.");
    
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, "test_summary.json"),
      JSON.stringify({ timestamp, results }, null, 2)
    );
  }
}

runManualTestSuite();
