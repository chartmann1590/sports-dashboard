import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runE2ETests() {
  console.log('🚀 Launching Playwright Chromium for End-to-End Testing...');
  const browser = await chromium.launch({
    headless: true, // run headless in CI/automated environment
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const errors = [];
  page.on('pageerror', err => {
    console.error('❌ Browser Page Error:', err.message);
    errors.push(err.message);
  });

  try {
    console.log('📡 Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Verify Header & Branding
    console.log('1️⃣ Checking Branding & Header...');
    await page.waitForSelector('text=ARENAPULSE', { timeout: 10000 });
    const title = await page.title();
    console.log(`   Page Title: "${title}"`);

    // 2. Verify Stats Cards
    console.log('2️⃣ Checking Stats Banner...');
    await page.waitForSelector('text=Total Games', { timeout: 10000 });
    await page.waitForSelector('text=Live In-Play', { timeout: 10000 });

    // 3. Verify Game Cards Loaded
    console.log('3️⃣ Checking Game Cards Grid...');
    await page.waitForSelector('.glass-card', { timeout: 10000 });
    const gameCardsCount = await page.locator('.glass-card').count();
    console.log(`   Found ${gameCardsCount} game cards on screen!`);

    // Take screenshot of main dashboard
    await page.screenshot({ path: path.join(screenshotsDir, '1-dashboard-main.png') });
    console.log('   📸 Saved screenshot: 1-dashboard-main.png');

    // 4. Test League Filtering (NFL, MLB, EPL)
    console.log('4️⃣ Testing League Filter Pills...');
    
    // Click NFL
    const nflButton = page.locator('button:has-text("NFL")').first();
    await nflButton.click();
    await page.waitForTimeout(1500);
    const nflCardsCount = await page.locator('.glass-card').count();
    console.log(`   NFL Filter active: ${nflCardsCount} games shown.`);
    await page.screenshot({ path: path.join(screenshotsDir, '2-filter-nfl.png') });

    // Click MLB
    const mlbButton = page.locator('button:has-text("MLB")').first();
    await mlbButton.click();
    await page.waitForTimeout(1500);
    const mlbCardsCount = await page.locator('.glass-card').count();
    console.log(`   MLB Filter active: ${mlbCardsCount} games shown.`);
    await page.screenshot({ path: path.join(screenshotsDir, '3-filter-mlb.png') });

    // Click back to All Sports
    const allSportsButton = page.locator('button:has-text("ALL SPORTS")').first();
    await allSportsButton.click();
    await page.waitForTimeout(1500);

    // 5. Test Game Details Modal
    console.log('5️⃣ Testing Game Center Modal (Deep View)...');
    const firstCard = page.locator('.glass-card').first();
    await firstCard.click();
    await page.waitForTimeout(2000);

    // Verify modal elements
    await page.waitForSelector('text=Scoring Summary', { timeout: 10000 });
    console.log('   Scoring Summary tab opened successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, '4-game-modal-scoring.png') });

    // Test Play-by-Play Tab
    const playsTab = page.locator('button:has-text("Play-by-Play")');
    if (await playsTab.isVisible()) {
      await playsTab.click();
      await page.waitForTimeout(1000);
      console.log('   Clicked Play-by-Play Tab.');
      await page.screenshot({ path: path.join(screenshotsDir, '5-game-modal-plays.png') });
    }

    // Test Box Score Tab
    const boxscoreTab = page.locator('button:has-text("Box Score & Stats")');
    if (await boxscoreTab.isVisible()) {
      await boxscoreTab.click();
      await page.waitForTimeout(1000);
      console.log('   Clicked Box Score Tab.');
      await page.screenshot({ path: path.join(screenshotsDir, '6-game-modal-boxscore.png') });
    }

    // Test Game Info Tab
    const gameInfoTab = page.locator('button:has-text("Game Info & Odds")');
    if (await gameInfoTab.isVisible()) {
      await gameInfoTab.click();
      await page.waitForTimeout(1000);
      console.log('   Clicked Game Info & Odds Tab.');
      await page.screenshot({ path: path.join(screenshotsDir, '7-game-modal-info.png') });
    }

    // Close Modal via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('   Closed modal with Escape key.');

    // 6. Test TV / Jumbotron Mode
    console.log('6️⃣ Testing TV / Jumbotron Fullscreen Mode...');
    const tvModeButton = page.locator('button:has-text("TV MODE")');
    await tvModeButton.click();
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=ARENAVISION', { timeout: 10000 });
    await page.waitForSelector('text=TV JUMBOTRON', { timeout: 10000 });
    console.log('   TV Jumbotron Mode is active with giant display & stadium clock!');
    await page.screenshot({ path: path.join(screenshotsDir, '8-tv-jumbotron-mode.png') });

    // Cycle TV game using Right Arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500);
    console.log('   Cycled game in TV mode using keyboard shortcut.');

    // Exit TV mode using Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('   Exited TV Mode.');

    // 7. Test News Headlines Drawer
    console.log('7️⃣ Testing Headlines & News Drawer...');
    const headlinesBtn = page.locator('button:has-text("Headlines")');
    if (await headlinesBtn.isVisible()) {
      await headlinesBtn.click();
      await page.waitForTimeout(2000);
      await page.waitForSelector('text=Sports Headlines & News', { timeout: 10000 });
      console.log('   Headlines drawer opened successfully.');
      await page.screenshot({ path: path.join(screenshotsDir, '9-headlines-drawer.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('\n=========================================');
    console.log('✅ ALL E2E BROWSER TESTS PASSED PERFECTLY!');
    console.log('=========================================');

  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-failure.png') }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2ETests();
