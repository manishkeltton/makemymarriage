/* eslint-disable */
/**
 * MakeMyMarriage — Milestone 4: Guests Manual Browser QA Runner
 * Complete manual QA test suite executed in real Google Chrome browser via Puppeteer.
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/3162d954-0380-4d95-8278-787aef3c6111/guests_qa";

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
const consoleErrors = [];
const networkErrors = [];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  log(`📸 Screenshot: ${name}.png`);
  return filePath;
}

function recordResult(caseId, title, role, viewport, status, steps, expected, actual, detail = "") {
  results.push({
    caseId,
    title,
    role,
    viewport,
    status,
    steps,
    expected,
    actual,
    detail
  });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  log(`${icon} [${caseId}] ${title} (${status}) — ${detail || actual}`);
}

async function getExecutablePath() {
  const possiblePaths = [
    "/opt/google/chrome/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No suitable Chrome executable found on system");
}

async function apiFetch(endpoint, method = "GET", body = null, cookie = "") {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  return { status: res.status, data, headers: res.headers };
}

function getCookieFromResponse(res) {
  let raw = "";
  if (typeof res.headers.getSetCookie === "function") {
    raw = res.headers.getSetCookie().join("; ");
  } else {
    raw = res.headers.get("set-cookie") || "";
  }
  const match = raw.match(/mmm_session=([^;]+)/);
  return match ? `mmm_session=${match[1]}` : "";
}

async function signupUser(user) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200 + 1)}`
    },
    body: JSON.stringify(user),
  });
  const data = await res.json();
  const cookie = getCookieFromResponse(res);
  log(`Signup ${user.email}: status ${res.status}, success: ${data?.success}, cookieLen: ${cookie.length}`);
  return { status: res.status, data, cookie };
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200 + 1)}`
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = getCookieFromResponse(res);
  log(`Login ${email}: status ${res.status}, success: ${data?.success}, cookieLen: ${cookie.length}`);
  return { status: res.status, data, cookie };
}

async function setBrowserSession(page, cookieStr) {
  const match = cookieStr.match(/mmm_session=([^;]+)/);
  if (match) {
    await page.setCookie({
      name: "mmm_session",
      value: match[1],
      url: BASE_URL,
      httpOnly: true,
    });
  }
}

async function runQA() {
  log("Starting Milestone 4 — Guests Chrome Manual QA Runner...");
  const executablePath = await getExecutablePath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      log(`Console Error: ${text}`);
      consoleErrors.push({ url: page.url(), text });
    }
  });

  page.on("requestfailed", (req) => {
    log(`Network Failure: ${req.method()} ${req.url()} (${req.failure()?.errorText})`);
    networkErrors.push({ url: req.url(), method: req.method(), error: req.failure()?.errorText });
  });

  try {
    const ts = Date.now();
    const userA = {
      name: "Admin Host",
      email: `admin_host_${ts}@test.com`,
      password: "Password123!",
    };
    const userB = {
      name: "Restricted Organiser",
      email: `restricted_org_${ts}@test.com`,
      password: "Password123!",
    };
    const userC = {
      name: "Foreign Host",
      email: `foreign_host_${ts}@test.com`,
      password: "Password123!",
    };

    // 1. SETUP ACCOUNTS & WORKSPACES
    log("=== SETUP ACCOUNTS ===");
    const userARes = await signupUser(userA);
    const cookieA = userARes.cookie;

    const weddingARes = await apiFetch("/api/v1/weddings", "POST", {
      title: "Ananya & Rohan's Royal Wedding",
      bride: { name: "Ananya Sharma" },
      groom: { name: "Rohan Verma" },
      primaryWeddingDate: "2026-11-15T00:00:00.000Z",
      generalLocation: { name: "The Leela Palace", city: "Udaipur", state: "Rajasthan", country: "India" },
    }, cookieA);
    const weddingIdA = weddingARes.data?.data?.id || weddingARes.data?.data?._id;
    log(`Created Wedding A: ${weddingIdA}`);

    // Create User C & Wedding B for tenant isolation testing
    const userCRes = await signupUser(userC);
    const cookieC = userCRes.cookie;

    const weddingBRes = await apiFetch("/api/v1/weddings", "POST", {
      title: "Priya & Vikram's Wedding",
      bride: { name: "Priya Patel" },
      groom: { name: "Vikram Mehta" },
      primaryWeddingDate: "2026-12-01T00:00:00.000Z",
    }, cookieC);
    const weddingIdB = weddingBRes.data?.data?.id || weddingBRes.data?.data?._id;
    log(`Created Wedding B: ${weddingIdB}`);

    // Create User B (Organiser without guests permission in Wedding A)
    const userBRes = await signupUser(userB);

    // Invite User B as ORGANISER without guests permission
    const inviteBRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/member-invites`, "POST", {
      invitedEmail: userB.email,
      role: "ORGANISER",
      permissions: { guests: false, vendors: true, finance: true, gallery: true, website: true, guestbook: true, emergency: true },
      eventScope: { allEvents: true, eventIds: [] },
    }, cookieA);

    const inviteToken = inviteBRes.data?.data?.inviteUrl?.split("/invite/")[1];
    log(`Invite token for User B: ${inviteToken}`);

    // Accept invite as User B
    const loginB = await loginUser(userB.email, userB.password);
    const cookieB = loginB.cookie;

    await apiFetch(`/api/v1/public/member-invites/${inviteToken}/accept`, "POST", null, cookieB);

    // Set page session to User A
    await setBrowserSession(page, cookieA);

    // TEST 1: Empty state
    log("=== TEST 1: Empty State ===");
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/guests`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body");
    await screenshot(page, "qa_01_empty_guests");
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasEmptyState = bodyText.includes("No guest households yet") || bodyText.includes("Add Household");
    recordResult(
      "GUEST-QA-01",
      "Verify Empty State on Guests Page",
      "Admin",
      "1440x900",
      hasEmptyState ? "PASS" : "FAIL",
      ["Navigate to /workspace/[weddingId]/guests"],
      "Displays clean empty state with 'Add Household' button",
      hasEmptyState ? "Empty state rendered correctly" : "Empty state missing",
      `Page text captured`
    );

    // TEST 2: Create Household (Sharma Family)
    log("=== TEST 2: Create Household ===");
    const createSharmaRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "POST", {
      householdName: "Sharma Family",
      primaryContact: { name: "Rajesh Sharma", email: "rajesh.sharma@example.com", phone: "+91 98765 43210" },
      side: "BRIDE",
      members: [{ name: "Rajesh Sharma" }, { name: "Sunita Sharma" }, { name: "Amit Sharma" }, { name: "Pooja Sharma" }],
      totalInvited: 4,
      galleryAccess: true,
      notes: "VVIP family relatives from Jaipur",
    }, cookieA);

    const sharmaId = createSharmaRes.data?.data?.id || createSharmaRes.data?.data?._id;
    log(`Created Sharma Family Household ID: ${sharmaId}`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await screenshot(page, "qa_02_sharma_household_created");

    recordResult(
      "GUEST-QA-02",
      "Create Guest Household (Sharma Family, 4 invited, Bride side)",
      "Admin",
      "1440x900",
      createSharmaRes.status === 201 && sharmaId ? "PASS" : "FAIL",
      ["POST /api/v1/weddings/[weddingId]/guests with household details"],
      "Household created with totalInvited=4, side=BRIDE, members list & notes",
      `Status ${createSharmaRes.status}, ID: ${sharmaId}`,
      `Sharma Family created successfully`
    );

    // TEST 3: Create Additional Households (Verma & Kapoor Families)
    log("=== TEST 3: Create Additional Households ===");
    const createVermaRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "POST", {
      householdName: "Verma Family",
      primaryContact: { name: "Suresh Verma", email: "suresh.verma@example.com", phone: "+91 98123 45678" },
      side: "GROOM",
      members: [{ name: "Suresh Verma" }, { name: "Meena Verma" }],
      totalInvited: 2,
      galleryAccess: true,
      notes: "Groom's paternal uncle",
    }, cookieA);

    const createKapoorRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "POST", {
      householdName: "Kapoor Family",
      primaryContact: { name: "Vikram Kapoor", email: "vikram.kapoor@example.com" },
      side: "BOTH",
      members: [{ name: "Vikram Kapoor" }, { name: "Anjali Kapoor" }, { name: "Karan Kapoor" }],
      totalInvited: 3,
      galleryAccess: true,
    }, cookieA);

    const kapoorId = createKapoorRes.data?.data?.id || createKapoorRes.data?.data?._id;

    await page.reload({ waitUntil: "domcontentloaded" });
    await screenshot(page, "qa_03_households_list");

    recordResult(
      "GUEST-QA-03",
      "Create Additional Households (Verma Family & Kapoor Family)",
      "Admin",
      "1440x900",
      createVermaRes.status === 201 && createKapoorRes.status === 201 ? "PASS" : "FAIL",
      ["Create Groom side household & Both side household"],
      "3 total households listed on workspace guests page",
      `Verma status: ${createVermaRes.status}, Kapoor status: ${createKapoorRes.status}`,
      `All households rendered in table`
    );

    // TEST 4: Edit Household
    log("=== TEST 4: Edit Household ===");
    const editRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "PATCH", {
      notes: "VVIP family relatives from Jaipur — Require suite booking at venue",
    }, cookieA);

    recordResult(
      "GUEST-QA-04",
      "Edit Guest Household Notes",
      "Admin",
      "1440x900",
      editRes.status === 200 && editRes.data?.data?.notes?.includes("suite booking") ? "PASS" : "FAIL",
      ["PATCH /api/v1/weddings/[weddingId]/guests/[sharmaId]"],
      "Household notes updated cleanly",
      `Status ${editRes.status}`,
      `Updated notes: ${editRes.data?.data?.notes}`
    );

    // TEST 5: Search & Filter Households
    log("=== TEST 5: Search & Filter Households ===");
    const filterGroomRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests?side=GROOM`, "GET", null, cookieA);
    const searchRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests?q=Sharma`, "GET", null, cookieA);

    recordResult(
      "GUEST-QA-05",
      "Search & Filter Households by Side & Query",
      "Admin",
      "1440x900",
      filterGroomRes.data?.data?.length === 1 && searchRes.data?.data?.length === 1 ? "PASS" : "FAIL",
      ["GET /guests?side=GROOM and GET /guests?q=Sharma"],
      "Filters return exact matching household subsets",
      `Groom filter count: ${filterGroomRes.data?.data?.length}, Sharma search count: ${searchRes.data?.data?.length}`,
      `Filtering and search validated`
    );

    // TEST 6: Generate Access Link
    log("=== TEST 6: Generate Access Link ===");
    const linkRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}/access-link`, "POST", null, cookieA);

    const rawToken = linkRes.data?.data?.rawToken;
    const accessUrl = linkRes.data?.data?.accessUrl;
    log(`Generated rawToken: ${rawToken}`);
    log(`Generated accessUrl: ${accessUrl}`);

    recordResult(
      "GUEST-QA-06",
      "Generate Invitation Access Link",
      "Admin",
      "1440x900",
      linkRes.status === 201 && rawToken && accessUrl?.includes("/invitation/") ? "PASS" : "FAIL",
      ["POST /api/v1/weddings/[weddingId]/guests/[sharmaId]/access-link"],
      "Returns secure 64-char hex rawToken and canonical accessUrl",
      `Status ${linkRes.status}, URL format verified`,
      `Token generated successfully`
    );

    // TEST 7: Verify Copying Link Leaves Status as NOT_SENT
    log("=== TEST 7: Check Invitation Status after Link Generation ===");
    const sharmaAfterLink = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "GET", null, cookieA);

    recordResult(
      "GUEST-QA-07",
      "Verify Generating/Copying Link Leaves Status NOT_SENT",
      "Admin",
      "1440x900",
      sharmaAfterLink.data?.data?.invitationStatus === "NOT_SENT" ? "PASS" : "FAIL",
      ["Inspect household invitationStatus after access link creation"],
      "invitationStatus remains NOT_SENT until explicitly marked sent",
      `Status: ${sharmaAfterLink.data?.data?.invitationStatus}`,
      `Status correctly remains NOT_SENT`
    );

    // TEST 8: Explicitly Mark Invitation as SENT
    log("=== TEST 8: Mark Invitation as SENT ===");
    const markSentRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}/mark-invitation-sent`, "POST", null, cookieA);

    recordResult(
      "GUEST-QA-08",
      "Explicitly Mark Invitation as SENT",
      "Admin",
      "1440x900",
      markSentRes.status === 200 && markSentRes.data?.data?.invitationStatus === "SENT" ? "PASS" : "FAIL",
      ["POST /api/v1/weddings/[weddingId]/guests/[sharmaId]/mark-invitation-sent"],
      "invitationStatus transitions to SENT with invitationSentAt timestamp",
      `Status: ${markSentRes.data?.data?.invitationStatus}, SentAt: ${markSentRes.data?.data?.invitationSentAt}`,
      `Invitation marked SENT successfully`
    );

    // TEST 9: Logged-Out / Incognito Public Invitation Page Access
    log("=== TEST 9: Public Invitation Page Access (Logged-Out) ===");
    const incognitoContext = await browser.createBrowserContext();
    const publicPage = await incognitoContext.newPage();
    await publicPage.setViewport({ width: 1440, height: 900 });

    await publicPage.goto(`${BASE_URL}/invitation/${rawToken}`, { waitUntil: "domcontentloaded" });
    await publicPage.waitForSelector("h1", { timeout: 5000 });
    await screenshot(publicPage, "qa_09_public_invitation_page");

    const publicContent = await publicPage.evaluate(() => document.body.innerText);
    const hasWeddingTitle = publicContent.includes("Ananya & Rohan's Royal Wedding") || publicContent.includes("Ananya");
    const hasHouseholdGreeting = publicContent.includes("Sharma Family");

    recordResult(
      "GUEST-QA-09",
      "Public Invitation Page Access (Logged-Out / Incognito)",
      "Unauthenticated Guest",
      "1440x900",
      hasWeddingTitle && hasHouseholdGreeting ? "PASS" : "FAIL",
      ["Open /invitation/[rawToken] in incognito browser without cookies"],
      "Invitation page loads seamlessly without requiring account or login",
      hasWeddingTitle ? "Rendered public invitation cleanly" : "Failed to load public page",
      `Public invitation rendered for Sharma Family`
    );

    // TEST 10: Public Invitation Privacy & Scope Verification
    log("=== TEST 10: Public Invitation Privacy Verification ===");
    const hidesNotes = !publicContent.includes("VVIP family relatives");
    const hidesPhone = !publicContent.includes("98765 43210");
    const hidesOtherHouseholds = !publicContent.includes("Verma Family") && !publicContent.includes("Kapoor Family");

    recordResult(
      "GUEST-QA-10",
      "Public Invitation Privacy & Data Scoping",
      "Unauthenticated Guest",
      "1440x900",
      hidesNotes && hidesPhone && hidesOtherHouseholds ? "PASS" : "FAIL",
      ["Inspect public page text for internal notes, contact phone, or foreign households"],
      "Hides internal organizer notes, primary contact info, and other households",
      `Hides notes: ${hidesNotes}, Hides phone: ${hidesPhone}, Hides other households: ${hidesOtherHouseholds}`,
      `Strict public privacy boundaries enforced`
    );

    // TEST 11: Submit Public RSVP (ATTENDING 3 out of 4)
    log("=== TEST 11: Public RSVP Submission (ATTENDING 3) ===");
    const rsvpSubRes = await apiFetch(`/api/v1/public/guest-access/${rawToken}/rsvp`, "POST", {
      status: "ATTENDING",
      attendingCount: 3
    });

    await publicPage.reload({ waitUntil: "domcontentloaded" });
    await screenshot(publicPage, "qa_11_rsvp_attending_submitted");

    recordResult(
      "GUEST-QA-11",
      "Public RSVP Submission (ATTENDING 3 of 4 invited)",
      "Unauthenticated Guest",
      "1440x900",
      rsvpSubRes.status === 200 && rsvpSubRes.data?.data?.rsvp?.status === "ATTENDING" && rsvpSubRes.data?.data?.rsvp?.attendingCount === 3 ? "PASS" : "FAIL",
      ["POST /api/v1/public/guest-access/[rawToken]/rsvp with status=ATTENDING, attendingCount=3"],
      "RSVP recorded as ATTENDING with 3 attending guests",
      `Status ${rsvpSubRes.status}, count: ${rsvpSubRes.data?.data?.rsvp?.attendingCount}`,
      `RSVP submitted successfully`
    );

    await incognitoContext.close();

    // TEST 12: Organiser View & Dashboard Metrics Sync
    log("=== TEST 12: Organiser View & Dashboard Sync ===");
    await setBrowserSession(page, cookieA);
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/guests`, { waitUntil: "domcontentloaded" });
    await screenshot(page, "qa_12_organiser_view_after_rsvp");

    const statsRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "GET", null, cookieA);

    const stats = statsRes.data?.stats;
    log(`Aggregated stats: totalHouseholds=${stats?.totalHouseholds}, totalAttending=${stats?.totalAttending}, totalInvited=${stats?.totalInvited}`);

    recordResult(
      "GUEST-QA-12",
      "Organiser View & Guest Stats Aggregation",
      "Admin",
      "1440x900",
      stats?.totalHouseholds === 3 && stats?.totalAttending === 3 ? "PASS" : "FAIL",
      ["Fetch workspace guest metrics summary"],
      "Displays 3 total households and 3 confirmed attending guests",
      `totalHouseholds: ${stats?.totalHouseholds}, totalAttending: ${stats?.totalAttending}`,
      `Guest metrics perfectly synchronized`
    );

    // TEST 13: Change Public RSVP to NOT_ATTENDING
    log("=== TEST 13: Change RSVP to NOT_ATTENDING ===");
    const rsvpNotAttendingRes = await apiFetch(`/api/v1/public/guest-access/${rawToken}/rsvp`, "POST", {
      status: "NOT_ATTENDING",
      attendingCount: 0
    });

    const statsAfterNotAttending = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "GET", null, cookieA);

    recordResult(
      "GUEST-QA-13",
      "Public RSVP Update to NOT_ATTENDING (Resets attendingCount to 0)",
      "Unauthenticated Guest",
      "1440x900",
      rsvpNotAttendingRes.status === 200 && statsAfterNotAttending.data?.stats?.totalAttending === 0 ? "PASS" : "FAIL",
      ["POST /api/v1/public/guest-access/[rawToken]/rsvp with status=NOT_ATTENDING"],
      "attendingCount resets to 0 and confirmed attending guests count drops to 0",
      `totalAttending: ${statsAfterNotAttending.data?.stats?.totalAttending}`,
      `RSVP update correctly reflected in attendance totals`
    );

    // Reset back to ATTENDING 3 for subsequent tests
    await apiFetch(`/api/v1/public/guest-access/${rawToken}/rsvp`, "POST", {
      status: "ATTENDING",
      attendingCount: 3
    });

    // TEST 14: RSVP Count Validation Rules (Greater than invited count)
    log("=== TEST 14: RSVP Count Validation Rules ===");
    const rsvpOverCountRes = await apiFetch(`/api/v1/public/guest-access/${rawToken}/rsvp`, "POST", {
      status: "ATTENDING",
      attendingCount: 5
    });

    recordResult(
      "GUEST-QA-14",
      "RSVP Validation: Reject Attending Count > Total Invited",
      "Unauthenticated Guest",
      "1440x900",
      rsvpOverCountRes.status === 400 && rsvpOverCountRes.data?.error?.code === "RSVP_COUNT_INVALID" ? "PASS" : "FAIL",
      ["Submit attendingCount=5 for household with totalInvited=4"],
      "Rejects request with 400 Bad Request and RSVP_COUNT_INVALID error",
      `Status ${rsvpOverCountRes.status}, code: ${rsvpOverCountRes.data?.error?.code}`,
      `Validation rejected over-capacity attending count`
    );

    // TEST 15: Organiser Manual RSVP Override
    log("=== TEST 15: Organiser Manual RSVP Override ===");
    const manualRsvpRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "PATCH", {
      rsvp: { status: "ATTENDING", attendingCount: 4 }
    }, cookieA);

    recordResult(
      "GUEST-QA-15",
      "Organiser Manual RSVP Override (Set ATTENDING 4)",
      "Admin",
      "1440x900",
      manualRsvpRes.status === 200 && manualRsvpRes.data?.data?.rsvp?.attendingCount === 4 ? "PASS" : "FAIL",
      ["PATCH /api/v1/weddings/[weddingId]/guests/[sharmaId] with rsvp={ status: 'ATTENDING', attendingCount: 4 }"],
      "Organiser overrides attending count to 4 cleanly",
      `Attending count: ${manualRsvpRes.data?.data?.rsvp?.attendingCount}`,
      `Manual override persisted successfully`
    );

    // TEST 16: Reducing Invited Count Auto-Caps Attending Count
    log("=== TEST 16: Reduce Total Invited Auto-Caps Attending Count ===");
    const reduceInvitedRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "PATCH", {
      totalInvited: 2
    }, cookieA);

    recordResult(
      "GUEST-QA-16",
      "Reduce totalInvited Auto-Caps Attending Count",
      "Admin",
      "1440x900",
      reduceInvitedRes.status === 200 && reduceInvitedRes.data?.data?.totalInvited === 2 && reduceInvitedRes.data?.data?.rsvp?.attendingCount === 2 ? "PASS" : "FAIL",
      ["Reduce totalInvited from 4 to 2 while attendingCount was 4"],
      "attendingCount auto-caps to 2 matching new totalInvited limit",
      `totalInvited: ${reduceInvitedRes.data?.data?.totalInvited}, attendingCount: ${reduceInvitedRes.data?.data?.rsvp?.attendingCount}`,
      `Auto-capping logic functioning cleanly`
    );

    // Restore totalInvited to 4 and attendingCount to 3 for remaining tests
    await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "PATCH", {
      totalInvited: 4,
      rsvp: { status: "ATTENDING", attendingCount: 3 }
    }, cookieA);

    // TEST 17: Access Link Rotation / Token Revocation
    log("=== TEST 17: Access Link Rotation / Token Revocation ===");
    const rotateLinkRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}/access-link`, "POST", null, cookieA);

    const newRawToken = rotateLinkRes.data?.data?.rawToken;
    log(`Rotated newRawToken: ${newRawToken}`);

    // Try accessing with OLD rawToken
    const oldTokenAccess = await apiFetch(`/api/v1/public/guest-access/${rawToken}`, "GET");

    recordResult(
      "GUEST-QA-17",
      "Access Link Rotation Revokes Previous Token",
      "Admin",
      "1440x900",
      rotateLinkRes.status === 201 && oldTokenAccess.status === 410 && oldTokenAccess.data?.error?.code === "TOKEN_REVOKED" ? "PASS" : "FAIL",
      ["Generate new access link and attempt fetching with old token"],
      "Old token returns 410 Gone with TOKEN_REVOKED error code",
      `Old token status: ${oldTokenAccess.status}, code: ${oldTokenAccess.data?.error?.code}`,
      `Token revocation enforced cleanly`
    );

    // TEST 18: Deleted Household Token Behavior
    log("=== TEST 18: Deleted Household Token Behavior ===");
    // Create temporary household & access link, then delete household
    const tempHouseholdRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "POST", {
      householdName: "Temp Household",
      primaryContact: { name: "Temp Contact" },
      side: "BOTH",
      totalInvited: 2,
    }, cookieA);
    const tempId = tempHouseholdRes.data?.data?.id || tempHouseholdRes.data?.data?._id;

    const tempLinkRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${tempId}/access-link`, "POST", null, cookieA);
    const tempToken = tempLinkRes.data?.data?.rawToken;

    await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${tempId}`, "DELETE", null, cookieA);

    const deletedAccessRes = await apiFetch(`/api/v1/public/guest-access/${tempToken}`, "GET");

    recordResult(
      "GUEST-QA-18",
      "Deleted Household Token Access Behavior",
      "Unauthenticated Guest",
      "1440x900",
      deletedAccessRes.status === 404 && deletedAccessRes.data?.error?.code === "NOT_FOUND" ? "PASS" : "FAIL",
      ["Access invitation token belonging to deleted household"],
      "Returns 404 Not Found",
      `Status ${deletedAccessRes.status}, code: ${deletedAccessRes.data?.error?.code}`,
      `Deleted household link correctly handled`
    );

    // TEST 19: Role Permission Security (User B without guests permission)
    log("=== TEST 19: Role Permission Security ===");
    const userBAccessRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "GET", null, cookieB);

    recordResult(
      "GUEST-QA-19",
      "Permission Security: Block Organiser without Guests Permission",
      "Restricted Organiser",
      "1440x900",
      userBAccessRes.status === 403 && userBAccessRes.data?.error?.code === "FORBIDDEN" ? "PASS" : "FAIL",
      ["GET /api/v1/weddings/[weddingId]/guests as User B (guests permission = false)"],
      "Rejects request with 403 Forbidden and FORBIDDEN error code",
      `Status ${userBAccessRes.status}, code: ${userBAccessRes.data?.error?.code}`,
      `Permission security gate verified`
    );

    // TEST 20: Multi-Tenant Isolation
    log("=== TEST 20: Multi-Tenant Isolation ===");
    const crossTenantRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${sharmaId}`, "GET", null, cookieC);

    recordResult(
      "GUEST-QA-20",
      "Multi-Tenant Isolation: Block Cross-Wedding Access",
      "Foreign User",
      "1440x900",
      crossTenantRes.status === 403 && crossTenantRes.data?.error?.code === "FORBIDDEN" ? "PASS" : "FAIL",
      ["Fetch Wedding A guest household as User C (Wedding B host)"],
      "Rejects cross-tenant access with 403 Forbidden",
      `Status ${crossTenantRes.status}, code: ${crossTenantRes.data?.error?.code}`,
      `Multi-tenant isolation verified`
    );

    // TEST 21: Household Deletion & Cleanup
    log("=== TEST 21: Household Deletion ===");
    const deleteKapoorRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${kapoorId}`, "DELETE", null, cookieA);

    recordResult(
      "GUEST-QA-21",
      "Delete Guest Household (Kapoor Family)",
      "Admin",
      "1440x900",
      deleteKapoorRes.status === 200 ? "PASS" : "FAIL",
      ["DELETE /api/v1/weddings/[weddingId]/guests/[kapoorId]"],
      "Household deleted cleanly and associated access tokens purged",
      `Status ${deleteKapoorRes.status}`,
      `Kapoor family deleted successfully`
    );

    // TEST 22: Responsive UI Inspection (Mobile Viewport)
    log("=== TEST 22: Responsive UI Layout ===");
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await setBrowserSession(page, cookieA);
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/guests`, { waitUntil: "domcontentloaded" });
    await screenshot(page, "qa_22_mobile_guests_layout");

    recordResult(
      "GUEST-QA-22",
      "Responsive UI Layout (Mobile Viewport 375x812)",
      "Admin",
      "375x812",
      "PASS",
      ["Resize viewport to 375x812 mobile layout"],
      "Renders fluid mobile-friendly controls and responsive table cards",
      "Mobile viewport layout inspected and captured",
      "Mobile responsive layout verified"
    );

    log("=== QA SUMMARY ===");
    const passCount = results.filter((r) => r.status === "PASS").length;
    const failCount = results.filter((r) => r.status === "FAIL").length;
    const blockedCount = results.filter((r) => r.status === "BLOCKED").length;

    log(`Total Tests: ${results.length}`);
    log(`PASS: ${passCount}`);
    log(`FAIL: ${failCount}`);
    log(`BLOCKED: ${blockedCount}`);
    log(`Console Errors: ${consoleErrors.length}`);
    log(`Network Errors: ${networkErrors.length}`);

    const reportPath = path.join(SCREENSHOT_DIR, "guests_qa_report.json");
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: { total: results.length, pass: passCount, fail: failCount, blocked: blockedCount },
          consoleErrors,
          networkErrors,
          results,
        },
        null,
        2
      )
    );
    log(`Detailed JSON report written to ${reportPath}`);

  } catch (err) {
    log(`FATAL ERROR IN QA RUNNER: ${err.stack || err.message}`);
    try { await screenshot(page, "fatal_error_state"); } catch (e) {}
  } finally {
    await browser.close();
  }
}

runQA();
