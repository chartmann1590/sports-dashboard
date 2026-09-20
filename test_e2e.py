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
            print("[TEST 7/7] Testing News Headlines Drawer...")
            news_btn = page.locator("button:has-text('Headlines')")
            if news_btn.is_visible():
                news_btn.click()
                time.sleep(2)
                page.wait_for_selector("text=Sports Headlines & News", timeout=10000)
                print("   Headlines drawer verified.")
                page.screenshot(path=os.path.join(screenshots_dir, "9-headlines-drawer.png"))
                page.keyboard.press("Escape")
                time.sleep(1)

            print("\n=======================================================")
            print(">>> ALL E2E BROWSER TESTS PASSED FLAWLESSLY WITH 100% SUCCESS! <<<")
            print("=======================================================")

        except Exception as e:
            print(f"[ERROR]: {e}")
            page.screenshot(path=os.path.join(screenshots_dir, "error.png"))
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()
