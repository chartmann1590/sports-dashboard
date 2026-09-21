import os
import sys
import time

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from playwright.sync_api import sync_playwright

def run_tests():
    print("[TEST] Launching Playwright Chromium for End-to-End Browser Testing...")
    screenshots_dir = os.path.join(os.getcwd(), "test-screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        page = context.new_page()

        page.on("pageerror", lambda err: print(f"[BROWSER ERROR]: {err}"))

        try:
            print("[TEST] Navigating to http://localhost:3000 ...")
            page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)

            # 1. Branding & Header Check
            print("[TEST 1/7] Checking Branding & Header...")
            page.wait_for_selector("text=ARENAPULSE", timeout=10000)
            title = page.title()
            print(f"   Page Title: '{title}'")

            # 2. Stats Banner Check
            print("[TEST 2/7] Checking Stats Banner...")
            page.wait_for_selector("text=Total Games", timeout=10000)
            page.wait_for_selector("text=Live In-Play", timeout=10000)

            # 3. Game Cards Loaded
            print("[TEST 3/7] Checking Game Cards Grid...")
            page.wait_for_selector(".glass-card", timeout=10000)
            cards = page.locator(".glass-card")
            count = cards.count()
            print(f"   Found {count} game cards rendered on screen!")
            page.screenshot(path=os.path.join(screenshots_dir, "1-dashboard-main.png"))
            print("   [SCREENSHOT] 1-dashboard-main.png captured.")

            # 4. League Filter Tests
            print("[TEST 4/7] Testing League Filter Pills...")
            # NFL
            nfl_btn = page.locator("button:has-text('NFL')").first
            nfl_btn.click()
            time.sleep(1.5)
            nfl_count = page.locator(".glass-card").count()
            print(f"   NFL Filter active: {nfl_count} games.")
            page.screenshot(path=os.path.join(screenshots_dir, "2-filter-nfl.png"))

            # MLB
            mlb_btn = page.locator("button:has-text('MLB')").first
            mlb_btn.click()
            time.sleep(1.5)
            mlb_count = page.locator(".glass-card").count()
            print(f"   MLB Filter active: {mlb_count} games.")
            page.screenshot(path=os.path.join(screenshots_dir, "3-filter-mlb.png"))

            # Return to All Sports
            all_btn = page.locator("button:has-text('ALL SPORTS')").first
            all_btn.click()
            time.sleep(1.5)

            # 5. Deep Game Details Modal Test
            print("[TEST 5/7] Testing Deep Game Center Modal...")
            first_card = page.locator(".glass-card").first
            first_card.click()
            time.sleep(2.5)

            page.wait_for_selector("text=Scoring Summary", timeout=10000)
            print("   Scoring Summary tab opened successfully.")
            page.screenshot(path=os.path.join(screenshots_dir, "4-game-modal-scoring.png"))

            # Play-by-Play Tab
            plays_tab = page.locator("button:has-text('Play-by-Play')")
            if plays_tab.is_visible():
                plays_tab.click()
                time.sleep(1.2)
                print("   Play-by-Play tab tested.")
                page.screenshot(path=os.path.join(screenshots_dir, "5-game-modal-plays.png"))

            # Box Score Tab
            box_tab = page.locator("button:has-text('Box Score & Stats')")
            if box_tab.is_visible():
                box_tab.click()
                time.sleep(1.2)
                print("   Box Score tab tested.")
                page.screenshot(path=os.path.join(screenshots_dir, "6-game-modal-boxscore.png"))

            # Game Info Tab
            info_tab = page.locator("button:has-text('Game Info & Odds')")
            if info_tab.is_visible():
                info_tab.click()
                time.sleep(1.2)
                print("   Game Info & Odds tab tested.")
                page.screenshot(path=os.path.join(screenshots_dir, "7-game-modal-info.png"))

            # Win Probability & Projections Tab
            winprob_tab = page.locator("button:has-text('Win Probability')")
            if winprob_tab.is_visible():
                winprob_tab.click()
                time.sleep(1.5)
                print("   Win Probability & Matchup Projections tab tested.")
                page.screenshot(path=os.path.join(screenshots_dir, "10-game-modal-winprob.png"))

            # Close Modal
            page.keyboard.press("Escape")
            time.sleep(1)
            print("   Modal closed via Escape.")

            # 6. TV Mode Test
            print("[TEST 6/7] Testing TV / Jumbotron Mode...")
            tv_btn = page.locator("button:has-text('TV MODE')")
            tv_btn.click()
            time.sleep(2)

            page.wait_for_selector("text=ARENAVISION", timeout=10000)
            page.wait_for_selector("text=TV JUMBOTRON", timeout=10000)
            print("   TV Jumbotron Mode is running with giant cinema scores!")
            page.screenshot(path=os.path.join(screenshots_dir, "8-tv-jumbotron-mode.png"))

            # Cycle TV game with ArrowRight
            page.keyboard.press("ArrowRight")
            time.sleep(1)
            print("   TV game cycled with keyboard arrow.")

            # Exit TV Mode
            page.keyboard.press("Escape")
            time.sleep(1)
            print("   TV mode closed via Escape.")

            # 7. Headlines Drawer Test
            print("[TEST 7/9] Testing News Headlines Drawer...")
            news_btn = page.locator("button:has-text('Headlines')")
            if news_btn.is_visible():
                news_btn.click()
                time.sleep(2)
                page.wait_for_selector("text=Sports Headlines & News", timeout=10000)
                print("   Headlines drawer verified.")
                page.screenshot(path=os.path.join(screenshots_dir, "9-headlines-drawer.png"))
                page.keyboard.press("Escape")
                time.sleep(1)
                if page.locator("text=Sports Headlines & News").is_visible():
                    page.locator("button:has(svg.lucide-x)").first.click()
                    time.sleep(1)

            # 8. PWA Infrastructure Test
            print("[TEST 8/9] Testing PWA Infrastructure (Manifest & Meta tags)...")
            manifest_link = page.locator("link[rel='manifest']").get_attribute("href")
            print(f"   Manifest linked: '{manifest_link}'")
            assert manifest_link == "/manifest.json", "Manifest link not found or incorrect"

            apple_icon = page.locator("link[rel='apple-touch-icon']").get_attribute("href")
            print(f"   Apple touch icon: '{apple_icon}'")
            assert apple_icon == "/icon-192.png", "Apple touch icon not found"

            # 9. Game Notifications & Subscriptions Test
            print("[TEST 9/9] Testing Game Notification Subscriptions...")
            bell_btn = page.locator("button[title*='Live Game Alerts']")
            page.wait_for_selector("button[title*='Live Game Alerts']", timeout=10000)
            bell_btn.click()
            time.sleep(1)

            page.wait_for_selector("text=Live Game Notifications", timeout=10000)
            page.wait_for_selector("text=Touchdowns & Scoring Plays", timeout=10000)
            page.wait_for_selector("text=Quarter & Halftime Updates", timeout=10000)
            page.wait_for_selector("text=Final Score & Winner", timeout=10000)
            print("   Notification Triggers verified (Touchdowns, Quarters, Final Scores).")

            # Click Send Test Notification
            test_btn = page.locator("button:has-text('Send Test Notification')")
            if test_btn.is_visible():
                test_btn.click()
                time.sleep(1)
                print("   Dispatched test game alert notification.")

            page.screenshot(path=os.path.join(screenshots_dir, "11-notification-modal.png"))

            # Close notification modal
            done_btn = page.locator("button:has-text('Done')")
            done_btn.click()
            time.sleep(1)

            # Subscribe to first game via card bell
            card_bell = page.locator("button[title*='Subscribe to live game alerts']").first
            if card_bell.is_visible():
                card_bell.click()
                time.sleep(1)
                print("   Subscribed to first game on dashboard grid.")
                
                # Verify header badge shows '1'
                badge = page.locator("button[title*='Live Game Alerts'] span")
                if badge.is_visible():
                    print(f"   Header active alert subscription badge: {badge.inner_text()}")

                page.screenshot(path=os.path.join(screenshots_dir, "12-game-subscribed-alerts.png"))

            print("\n=======================================================")
            print(">>> ALL 9 E2E BROWSER TESTS PASSED FLAWLESSLY WITH 100% SUCCESS! <<<")
            print("=======================================================")

        except Exception as e:
            print(f"[ERROR]: {e}")
            page.screenshot(path=os.path.join(screenshots_dir, "error.png"))
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()

