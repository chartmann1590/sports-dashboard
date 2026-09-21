"""Verify the Docker deployment with real completed-game data (no mocked routes)."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080}, service_workers='block')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://localhost:3000', wait_until='domcontentloaded')
    page.locator('input[type=date]').fill('2026-09-20')
    page.get_by_text('NFL', exact=True).click()
    expect(page.locator('.glass-card').first).to_be_visible(timeout=30000)
    page.get_by_title('Toggle TV / Jumbotron Mode (Big Screen TV Display)').click()
    expect(page.locator('.field-football')).to_be_visible()
    expect(page.locator('.tv-play-row').first).to_be_visible(timeout=30000)
    page.get_by_role('button', name='Pause auto-cycle', exact=True).click()
    page.locator('.tv-play-row').nth(5).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('REPLAY')
    Path('test-screenshots').mkdir(exist_ok=True)
    page.screenshot(path='test-screenshots/tv-real-football.png')
    page.get_by_role('button', name='Open Full Game Center & Play-by-Play', exact=True).click()
    expect(page.get_by_role('dialog', name='Full game center')).to_contain_text('Drive-by-Drive Plays', timeout=30000)
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog', name='TV mode')).to_be_visible()
    assert not errors, errors
    print('PASS: deployed Docker UI, real NFL plays, field replay, full game center, return to TV')
    browser.close()
