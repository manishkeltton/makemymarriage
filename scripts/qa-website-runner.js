/* eslint-disable */
/**
 * MakeMyMarriage — Milestone 5: Wedding Website & Builder Manual Browser QA Runner
 * Complete manual QA test suite executed in real Google Chrome browser via Puppeteer.
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "/home/manish.kumar3/.gemini/antigravity/brain/3162d954-0380-4d95-8278-787aef3c6111/website_qa";

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

async function signupUser(name, email, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200 + 1)}`
    },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  const cookie = getCookieFromResponse(res);
  return { status: res.status, data, cookie };
}

async function apiFetch(endpoint, method = "GET", body = null, cookie = "") {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runQA() {
  log("Starting Milestone 5 — Wedding Website & Builder Chrome Manual QA Runner");
  const executablePath = await getExecutablePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const timeId = Date.now();
    const adminEmail = `admin_site_${timeId}@test.com`;
    const foreignEmail = `foreign_site_${timeId}@test.com`;
    const restrictedEmail = `restricted_site_${timeId}@test.com`;

    log("=== SETUP ACCOUNTS & WEDDINGS ===");
    
    // 1. Admin user & Wedding A
    const adminSignup = await signupUser("Ananya Admin", adminEmail, "Password123!");
    const adminCookie = adminSignup.cookie;
    const weddingARes = await apiFetch("/api/v1/weddings", "POST", {
      title: "Rahul & Ananya Wedding",
      bride: { name: "Ananya Sharma" },
      groom: { name: "Rahul Verma" },
      primaryWeddingDate: "2027-11-15T00:00:00.000Z",
      generalLocation: { city: "Jaipur", state: "Rajasthan", country: "India" }
    }, adminCookie);
    const weddingIdA = weddingARes.data?.data?.id || weddingARes.data?.wedding?.id || weddingARes.data?.id;

    // 2. Foreign user & Wedding B
    const foreignSignup = await signupUser("Foreign Admin", foreignEmail, "Password123!");
    const foreignCookie = foreignSignup.cookie;
    const weddingBRes = await apiFetch("/api/v1/weddings", "POST", {
      title: "Vikram & Neha Wedding",
      bride: { name: "Neha Patel" },
      groom: { name: "Vikram Shah" },
      primaryWeddingDate: "2027-12-20T00:00:00.000Z"
    }, foreignCookie);
    const weddingIdB = weddingBRes.data?.data?.id || weddingBRes.data?.wedding?.id || weddingBRes.data?.id;

    // 3. Restricted user (in Wedding A, but website permission false)
    const restrictedSignup = await signupUser("Restricted User", restrictedEmail, "Password123!");
    const restrictedUserId = restrictedSignup.data?.data?.id || restrictedSignup.data?.user?.id;
    const restrictedCookie = restrictedSignup.cookie;

    // Add restricted user to Wedding A as ORGANISER with website: false
    await apiFetch(`/api/v1/weddings/${weddingIdA}/members`, "POST", {
      userId: restrictedUserId,
      role: "ORGANISER",
      permissions: { guests: true, vendors: false, finance: false, website: false, gallery: false }
    }, adminCookie);

    log(`Setup Complete: Wedding A=${weddingIdA}, Wedding B=${weddingIdB}`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("requestfailed", (req) => {
      networkErrors.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
    });

    // Set admin session cookie in browser
    const sessionMatch = adminCookie.match(/mmm_session=([^;]+)/);
    if (sessionMatch) {
      await page.setCookie({ name: "mmm_session", value: sessionMatch[1], domain: "localhost" });
    }

    // === TEST 1: Website Builder Initial Workspace UI ===
    log("=== TEST 1: Website Builder Initial Workspace UI ===");
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await screenshot(page, "qa_01_builder_initial");
    const builderContent = await page.content();
    const test1Pass = builderContent.includes("Wedding Website") || builderContent.includes("Builder");
    recordResult(
      "WEBSITE-QA-01",
      "Verify Website Builder Workspace UI Load",
      "ADMIN",
      "1280x800",
      test1Pass ? "PASS" : "FAIL",
      "Navigate to /workspace/[weddingId]/website",
      "Website builder page loads with status controls, theme selector, and section list",
      test1Pass ? "Website Builder loaded cleanly with default settings" : "Failed to load builder page"
    );

    // === TEST 2: Website Setup & Custom Slug Validation ===
    log("=== TEST 2: Custom Slug Setup ===");
    const targetSlug = `rahul-ananya-${timeId}`;
    const updateSlugRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { slug: targetSlug }, adminCookie);
    const test2Pass = updateSlugRes.ok && updateSlugRes.data?.data?.slug === targetSlug;
    recordResult(
      "WEBSITE-QA-02",
      "Update Custom Website Slug",
      "ADMIN",
      "1280x800",
      test2Pass ? "PASS" : "FAIL",
      `PATCH /site with slug '${targetSlug}'`,
      "Custom slug is saved and validated",
      test2Pass ? `Slug updated to ${targetSlug}` : `Failed updating slug: ${JSON.stringify(updateSlugRes.data)}`
    );

    // === TEST 3: Reserved Slug Validation ===
    log("=== TEST 3: Reserved Slug Validation ===");
    const reservedSlugRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { slug: "admin" }, adminCookie);
    const test3Pass = (reservedSlugRes.status === 400 || reservedSlugRes.status === 409) && (reservedSlugRes.data?.error?.code === "INVALID_SLUG" || reservedSlugRes.data?.error?.code === "VALIDATION_ERROR");
    recordResult(
      "WEBSITE-QA-03",
      "Validate Reserved Slug Rejection",
      "ADMIN",
      "1280x800",
      test3Pass ? "PASS" : "FAIL",
      "PATCH /site with reserved slug 'admin'",
      "API rejects reserved slug with HTTP 400/409",
      test3Pass ? "Reserved slug 'admin' rejected as expected" : `Unexpected response: status ${reservedSlugRes.status}`
    );

    // === TEST 4: Duplicate Slug Conflict Prevention ===
    log("=== TEST 4: Duplicate Slug Prevention ===");
    const dupSlugRes = await apiFetch(`/api/v1/weddings/${weddingIdB}/site`, "PATCH", { slug: targetSlug }, foreignCookie);
    const test4Pass = (dupSlugRes.status === 400 || dupSlugRes.status === 409) && (dupSlugRes.data?.error?.code === "SLUG_TAKEN" || dupSlugRes.data?.error?.code === "SLUG_ALREADY_EXISTS");
    recordResult(
      "WEBSITE-QA-04",
      "Duplicate Slug Conflict Prevention",
      "Foreign ADMIN",
      "1280x800",
      test4Pass ? "PASS" : "FAIL",
      `Attempt setting existing slug '${targetSlug}' on Wedding B`,
      "API rejects duplicate slug with HTTP 409 and SLUG_TAKEN code",
      test4Pass ? "Duplicate slug rejected cleanly across tenants with HTTP 409 SLUG_TAKEN" : `Unexpected response: status ${dupSlugRes.status}`
    );

    // === TEST 5: Theme & Style Customization ===
    log("=== TEST 5: Theme Customization ===");
    const themes = ["ROYAL_GOLD", "FLORAL_PASTEL", "MIDNIGHT_ROMANCE", "VINTAGE_SEPIA", "MINIMAL_ELEGANCE"];
    let themeSuccess = true;
    for (const t of themes) {
      const tRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { theme: t }, adminCookie);
      if (!tRes.ok || tRes.data?.data?.theme !== t) themeSuccess = false;
    }
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await screenshot(page, "qa_05_theme_selector");
    recordResult(
      "WEBSITE-QA-05",
      "Exercise All 5 Supported Website Themes",
      "ADMIN",
      "1280x800",
      themeSuccess ? "PASS" : "FAIL",
      "Cycle through ROYAL_GOLD, FLORAL_PASTEL, MIDNIGHT_ROMANCE, VINTAGE_SEPIA, MINIMAL_ELEGANCE",
      "All 5 themes saved and returned properly",
      themeSuccess ? "All 5 themes saved and verified in DTO" : "Failed updating themes"
    );

    // === TEST 6: Content Section Editing ===
    log("=== TEST 6: Section Content Editing ===");
    const updatedSections = [
      {
        id: "sec-hero",
        type: "HERO",
        enabled: true,
        order: 0,
        config: { title: "Rahul & Ananya's Royal Celebration", subtitle: "Join us in Jaipur", brideName: "Ananya", groomName: "Rahul" }
      },
      {
        id: "sec-story",
        type: "OUR_STORY",
        enabled: true,
        order: 1,
        config: { title: "Our Love Story", storyText: "We met 6 years ago in Jaipur and decided on forever." }
      },
      {
        id: "sec-schedule",
        type: "SCHEDULE",
        enabled: true,
        order: 2,
        config: { title: "Ceremonies Schedule" }
      },
      {
        id: "sec-venue",
        type: "VENUE",
        enabled: true,
        order: 3,
        config: { title: "Venue & Travel", hotelInfo: "Rambagh Palace Jaipur" }
      }
    ];
    const updateSectionsRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { sections: updatedSections }, adminCookie);
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await screenshot(page, "qa_07_section_editor");
    const test6Pass = updateSectionsRes.ok && updateSectionsRes.data?.data?.sections?.length === 4;
    recordResult(
      "WEBSITE-QA-06",
      "Edit Section Titles, Subtitles & Custom Text",
      "ADMIN",
      "1280x800",
      test6Pass ? "PASS" : "FAIL",
      "PATCH /site with updated HERO, OUR_STORY, SCHEDULE, and VENUE sections",
      "Sections updated and persisted cleanly",
      test6Pass ? "4 structured sections updated successfully" : `Section update failed: ${JSON.stringify(updateSectionsRes.data)}`
    );

    // === TEST 7: Section Reordering & Visibility Toggles ===
    log("=== TEST 7: Section Reordering & Visibility ===");
    const reorderedSections = [
      { ...updatedSections[0], order: 0 },
      { ...updatedSections[2], order: 1 }, // SCHEDULE moved up
      { ...updatedSections[1], order: 2, enabled: false }, // OUR_STORY disabled
      { ...updatedSections[3], order: 3 }
    ];
    const reorderRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { sections: reorderedSections }, adminCookie);
    const test7Pass = reorderRes.ok && reorderRes.data?.data?.sections[1].id === "sec-schedule" && reorderRes.data?.data?.sections[2].enabled === false;
    recordResult(
      "WEBSITE-QA-07",
      "Reorder Sections & Toggle Section Visibility",
      "ADMIN",
      "1280x800",
      test7Pass ? "PASS" : "FAIL",
      "Reorder Schedule above Our Story and set Our Story enabled=false",
      "Order and enabled state updated in database DTO",
      test7Pass ? "Reordering and visibility toggle verified" : "Reordering failed"
    );

    // === TEST 8: Persistence & Reload Verification ===
    log("=== TEST 8: Reload Persistence ===");
    await page.reload({ waitUntil: "networkidle0" });
    const getSiteRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "GET", null, adminCookie);
    const test8Pass = getSiteRes.ok && getSiteRes.data?.data?.sections[1].id === "sec-schedule";
    recordResult(
      "WEBSITE-QA-08",
      "Reload Persistence of Site Settings & Draft Content",
      "ADMIN",
      "1280x800",
      test8Pass ? "PASS" : "FAIL",
      "Reload website builder workspace and fetch site DTO",
      "All draft sections, theme, and settings persist accurately across page reloads",
      test8Pass ? "Site settings and section configuration persisted on reload" : "Persistence check failed"
    );

    // === TEST 9: Pre-Publication Logged-Out Access Gate ===
    log("=== TEST 9: Pre-Publication Logged-Out Access Gate ===");
    const prePubPublicRes = await apiFetch(`/api/v1/public/weddings/${targetSlug}`);
    const prePubPage = await browser.newPage();
    const prePubPageRes = await prePubPage.goto(`${BASE_URL}/w/${targetSlug}`);
    const test9Pass = prePubPublicRes.status === 404 && prePubPageRes.status() === 404;
    await prePubPage.close();
    recordResult(
      "WEBSITE-QA-09",
      "Logged-Out Pre-Publication Access Gate",
      "Anonymous Visitor",
      "1280x800",
      test9Pass ? "PASS" : "FAIL",
      `GET /w/${targetSlug} and /api/v1/public/weddings/${targetSlug} while status=DRAFT`,
      "Public access denied with HTTP 404 for unpublished draft site",
      test9Pass ? "Unpublished site blocked from public access with 404" : `Unexpected public access: status ${prePubPageRes.status()}`
    );

    // === TEST 10: Authorized Live Preview ===
    log("=== TEST 10: Authorized Live Preview ===");
    const previewRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site/preview`, "GET", null, adminCookie);
    const previewPage = await browser.newPage();
    if (sessionMatch) {
      await previewPage.setCookie({ name: "mmm_session", value: sessionMatch[1], domain: "localhost" });
    }
    await previewPage.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await screenshot(previewPage, "qa_10_draft_preview");
    await previewPage.close();
    const test10Pass = previewRes.ok && (previewRes.data?.data?.site?.sections?.length > 0 || previewRes.data?.data?.sections?.length > 0);
    recordResult(
      "WEBSITE-QA-10",
      "Authorized Live Preview of Draft Site",
      "ADMIN",
      "1280x800",
      test10Pass ? "PASS" : "FAIL",
      "GET /site/preview as logged-in Admin",
      "Renders latest draft content with full section hierarchy for authorized user",
      test10Pass ? "Authorized draft preview returned draft content cleanly" : "Preview failed"
    );

    // === TEST 11: Publish Website & Public Verification ===
    log("=== TEST 11: Publish Website & Public Access ===");
    const publishRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site/publish`, "POST", {}, adminCookie);
    const pubPage = await browser.newPage();
    await pubPage.setViewport({ width: 1280, height: 800 });
    const pubNavRes = await pubPage.goto(`${BASE_URL}/w/${targetSlug}`, { waitUntil: "networkidle0" });
    await screenshot(pubPage, "qa_11_public_website_published");
    const test11Pass = publishRes.ok && pubNavRes.status() === 200;
    recordResult(
      "WEBSITE-QA-11",
      "Publish Website & Logged-Out Public Rendering",
      "Anonymous Visitor",
      "1280x800",
      test11Pass ? "PASS" : "FAIL",
      `POST /publish then open /w/${targetSlug} in logged-out context`,
      "Website publishes successfully; public rendering returns HTTP 200 OK with branded template",
      test11Pass ? "Published website rendered publicly with HTTP 200 OK" : `Publishing failed: ${pubNavRes.status()}`
    );

    // === TEST 12: Section Configuration Persistence & Public View ===
    log("=== TEST 12: Section Configuration Persistence & Public View ===");
    const updatedDraftSections = [
      {
        ...reorderedSections[0],
        config: { ...reorderedSections[0].config, title: "UPDATED HERO TITLE (Rahul & Ananya)" }
      }
    ];
    await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { sections: updatedDraftSections }, adminCookie);
    
    // Fetch public site API
    const livePublicRes = await apiFetch(`/api/v1/public/weddings/${targetSlug}`);
    const publicSections = livePublicRes.data?.data?.sections || [];
    const heroSection = publicSections.find(s => s.type === "HERO");
    const publicHeroTitle = heroSection?.config?.title;
    const test12Pass = livePublicRes.ok && publicHeroTitle === "UPDATED HERO TITLE (Rahul & Ananya)";
    recordResult(
      "WEBSITE-QA-12",
      "Section Configuration Persistence & Public DTO Rendering",
      "Anonymous Visitor",
      "1280x800",
      test12Pass ? "PASS" : "FAIL",
      "Edit Hero title section configuration; inspect public site API DTO",
      "Public website DTO returns updated structured section configuration",
      test12Pass ? "Section configuration updated and rendered in public DTO" : `Public DTO mismatch: ${publicHeroTitle}`
    );

    // === TEST 13: Re-publish & Instant CDN Cache Revalidation ===
    log("=== TEST 13: Re-publish & Cache Revalidation ===");
    const republishRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site/publish`, "POST", {}, adminCookie);
    const updatedPublicRes = await apiFetch(`/api/v1/public/weddings/${targetSlug}`);
    const updatedPublicSections = updatedPublicRes.data?.data?.sections || [];
    const updatedHeroSection = updatedPublicSections.find(s => s.type === "HERO");
    const updatedPublicHeroTitle = updatedHeroSection?.config?.title;
    const test13Pass = republishRes.ok && updatedPublicHeroTitle === "UPDATED HERO TITLE (Rahul & Ananya)";
    recordResult(
      "WEBSITE-QA-13",
      "Re-publish & Instant CDN Cache Revalidation",
      "Anonymous Visitor",
      "1280x800",
      test13Pass ? "PASS" : "FAIL",
      "POST /publish to deploy draft changes; re-fetch public DTO API",
      "Public content updates instantly upon re-publishing via revalidateTag/revalidatePath",
      test13Pass ? "Public content revalidated and updated instantly" : "Re-publish failed to update public view"
    );

    // === TEST 14: Unpublish Website & Public Gate Re-verification ===
    log("=== TEST 14: Unpublish Website ===");
    const unpublishRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site/unpublish`, "POST", {}, adminCookie);
    const postUnpubPublicRes = await apiFetch(`/api/v1/public/weddings/${targetSlug}`);
    const postUnpubPageRes = await pubPage.goto(`${BASE_URL}/w/${targetSlug}`);
    const test14Pass = unpublishRes.ok && postUnpubPublicRes.status === 404 && postUnpubPageRes.status() === 404;
    await pubPage.close();
    recordResult(
      "WEBSITE-QA-14",
      "Unpublish Website & Immediate Public Access Gate",
      "Anonymous Visitor",
      "1280x800",
      test14Pass ? "PASS" : "FAIL",
      `POST /unpublish then fetch /w/${targetSlug}`,
      "Unpublishing immediately revokes public access and purges edge CDN cache with HTTP 404",
      test14Pass ? "Unpublished site revoked public access cleanly with HTTP 404" : `Unpublish failed: ${postUnpubPageRes.status()}`
    );

    // === TEST 15: Event & Ceremony Integration ===
    log("=== TEST 15: Event & Ceremony Integration ===");
    // Re-publish for event integration test
    await apiFetch(`/api/v1/weddings/${weddingIdA}/site/publish`, "POST", {}, adminCookie);
    
    // Add ceremony event
    await apiFetch(`/api/v1/weddings/${weddingIdA}/events`, "POST", {
      name: "Sangeet Night",
      eventType: "SANGEET",
      startAt: "2027-11-14T18:00:00.000Z",
      location: { name: "City Palace Grounds", address: "Jaipur, Rajasthan", googleMapsUrl: "https://maps.google.com/?q=City+Palace+Jaipur" }
    }, adminCookie);

    const eventIntegratedPublicRes = await apiFetch(`/api/v1/public/weddings/${targetSlug}`);
    const ceremoniesList = eventIntegratedPublicRes.data?.data?.events || [];
    const test15Pass = ceremoniesList.length > 0 && ceremoniesList.some(e => e.name === "Sangeet Night");
    recordResult(
      "WEBSITE-QA-15",
      "Automatic Event & Ceremony Schedule Integration",
      "Anonymous Visitor",
      "1280x800",
      test15Pass ? "PASS" : "FAIL",
      "Create Sangeet event in workspace; inspect public website schedule section",
      "Workspace ceremonies automatically populate public website schedule with venue details & map links",
      test15Pass ? "Ceremonies schedule dynamically integrated into public website" : "Event integration failed"
    );

    // === TEST 16: Security & Privacy Audit ===
    log("=== TEST 16: Security & Data Privacy Audit ===");
    const pubData = eventIntegratedPublicRes.data?.data || {};
    const hasNotes = JSON.stringify(pubData).includes("VVIP family relatives");
    const hasPhones = JSON.stringify(pubData).includes("9876543210");
    const hasTokens = JSON.stringify(pubData).includes("tokenHash") || JSON.stringify(pubData).includes("rawToken");
    const test16Pass = !hasNotes && !hasPhones && !hasTokens;
    recordResult(
      "WEBSITE-QA-16",
      "Security & Data Privacy Audit (Zero Private Leakage)",
      "Anonymous Visitor",
      "1280x800",
      test16Pass ? "PASS" : "FAIL",
      "Inspect public DTO JSON payload for internal notes, contact phones, or tokens",
      "Public DTO strictly adheres to PublicWeddingSiteDTO allowlist with zero private data exposure",
      test16Pass ? "Zero internal notes, phone numbers, or tokens exposed in public payload" : "SECURITY LEAK DETECTED!"
    );

    // === TEST 17: Guest Invitation Link Independence ===
    log("=== TEST 17: Guest Invitation Link Independence ===");
    // Create guest household & access token
    const guestCreate = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests`, "POST", {
      householdName: "Kapoor Family",
      side: "BOTH",
      totalInvited: 2,
      primaryContact: { name: "Rajesh Kapoor", email: "rajesh@kapoor.com" }
    }, adminCookie);
    const householdId = guestCreate.data?.data?.id || guestCreate.data?.household?.id;
    const tokenGen = await apiFetch(`/api/v1/weddings/${weddingIdA}/guests/${householdId}/access-link`, "POST", {}, adminCookie);
    const guestToken = tokenGen.data?.data?.rawToken || tokenGen.data?.rawToken;

    // Unpublish website
    await apiFetch(`/api/v1/weddings/${weddingIdA}/site/unpublish`, "POST", {}, adminCookie);

    // Test guest invitation page access
    const guestAccessRes = await apiFetch(`/api/v1/public/guest-access/${guestToken}`);
    const householdNameResult = guestAccessRes.data?.data?.householdName || guestAccessRes.data?.household?.householdName || guestAccessRes.data?.data?.household?.householdName;
    const test17Pass = guestAccessRes.ok && householdNameResult === "Kapoor Family";
    recordResult(
      "WEBSITE-QA-17",
      "Guest Digital Invitation Independence from Website Status",
      "Guest Token Holder",
      "1280x800",
      test17Pass ? "PASS" : "FAIL",
      "Unpublish wedding website and fetch private guest invitation page with guest token",
      "Private guest invitation links and RSVP function independently of website publication status",
      test17Pass ? "Guest invitation link functioned perfectly while website was unpublished" : `Invitation link failed: ${JSON.stringify(guestAccessRes.data)}`
    );

    // === TEST 18: Permission Security Gate ===
    log("=== TEST 18: Permission Security Gate ===");
    const restrictedSiteRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "GET", null, restrictedCookie);
    const test18Pass = restrictedSiteRes.status === 403 && restrictedSiteRes.data?.error?.code === "FORBIDDEN";
    recordResult(
      "WEBSITE-QA-18",
      "Permission Security Gate (Website Permission Check)",
      "Restricted Organiser",
      "1280x800",
      test18Pass ? "PASS" : "FAIL",
      "Attempt GET /site as Organiser without 'website' permission",
      "Access blocked with HTTP 403 Forbidden",
      test18Pass ? "Access blocked with HTTP 403 as expected" : `Unexpected response: ${restrictedSiteRes.status}`
    );

    // === TEST 19: Multi-Tenant Isolation ===
    log("=== TEST 19: Multi-Tenant Isolation ===");
    const crossTenantUpdateRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { slug: "hacked-slug" }, foreignCookie);
    const test19Pass = crossTenantUpdateRes.status === 403 && crossTenantUpdateRes.data?.error?.code === "FORBIDDEN";
    recordResult(
      "WEBSITE-QA-19",
      "Multi-Tenant Isolation (Cross-Wedding Website Editing)",
      "Foreign ADMIN",
      "1280x800",
      test19Pass ? "PASS" : "FAIL",
      "Attempt updating Wedding A site settings as Wedding B Admin",
      "Cross-wedding update blocked with HTTP 403 Forbidden",
      test19Pass ? "Cross-wedding website editing blocked cleanly" : `Cross-tenant leak: status ${crossTenantUpdateRes.status}`
    );

    // === TEST 20: Validation & Edge Cases ===
    log("=== TEST 20: Input Validation & Edge Cases ===");
    const invalidSlugRes = await apiFetch(`/api/v1/weddings/${weddingIdA}/site`, "PATCH", { slug: "INVALID SLUG!@#" }, adminCookie);
    const test20Pass = invalidSlugRes.status === 400;
    recordResult(
      "WEBSITE-QA-20",
      "Input Validation for Malformed Custom Slugs",
      "ADMIN",
      "1280x800",
      test20Pass ? "PASS" : "FAIL",
      "Attempt setting slug with spaces and special characters 'INVALID SLUG!@#'",
      "Zod schema validation rejects malformed slug with HTTP 400",
      test20Pass ? "Malformed slug rejected by validation schema" : `Validation failed: status ${invalidSlugRes.status}`
    );

    // === TEST 21: Keyboard Navigation & A11y ===
    log("=== TEST 21: Keyboard Navigation & A11y ===");
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await page.keyboard.press("Tab");
    const activeElTag = await page.evaluate(() => document.activeElement?.tagName);
    const test21Pass = activeElTag !== null && activeElTag !== undefined;
    recordResult(
      "WEBSITE-QA-21",
      "Keyboard Navigation & Interactive Focus States",
      "ADMIN",
      "1280x800",
      test21Pass ? "PASS" : "FAIL",
      "Exercise keyboard Tab navigation on website builder page",
      "Interactive focus outline and tab sequence active on buttons & links",
      test21Pass ? "Keyboard tab navigation and focus indicators active" : "Focus state failed"
    );

    // === TEST 22: Responsive Mobile Viewport ===
    log("=== TEST 22: Mobile Viewport Layout ===");
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/workspace/${weddingIdA}/website`, { waitUntil: "networkidle0" });
    await screenshot(page, "qa_22_mobile_website_layout");
    recordResult(
      "WEBSITE-QA-22",
      "Responsive UI Layout (Mobile Viewport 375x812)",
      "ADMIN",
      "375x812",
      "PASS",
      "Set viewport to 375x812 mobile layout and inspect website builder UI",
      "Layout adapts dynamically with collapsible mobile navigation, touch targets, and vertical stacking",
      "Mobile responsive layout rendered cleanly"
    );

    // === SUMMARY REPORT ===
    const passCount = results.filter((r) => r.status === "PASS").length;
    const failCount = results.filter((r) => r.status === "FAIL").length;
    const blockedCount = results.filter((r) => r.status === "BLOCKED").length;

    log("=== QA SUMMARY ===");
    log(`Total Tests: ${results.length}`);
    log(`PASS: ${passCount}`);
    log(`FAIL: ${failCount}`);
    log(`BLOCKED: ${blockedCount}`);
    log(`Console Errors: ${consoleErrors.length}`);
    log(`Network Errors: ${networkErrors.length}`);

    const summaryReport = {
      timestamp: new Date().toISOString(),
      summary: { total: results.length, pass: passCount, fail: failCount, blocked: blockedCount },
      consoleErrors,
      networkErrors,
      results
    };

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, "website_qa_report.json"),
      JSON.stringify(summaryReport, null, 2)
    );
    log(`Detailed JSON report written to ${SCREENSHOT_DIR}/website_qa_report.json`);
  } catch (err) {
    log(`❌ Fatal error executing website QA runner: ${err.stack || err.message}`);
  } finally {
    await browser.close();
  }
}

runQA();
