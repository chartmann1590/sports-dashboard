"""Deterministic browser coverage for TV controls; run with the Vite dev server up."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
sys.stdout.reconfigure(encoding='utf-8')

SPORTS = [('football', 'nfl'), ('baseball', 'mlb'), ('basketball', 'wnba'), ('soccer', 'eng.1'), ('hockey', 'nhl')]

def game(sport, league, index):
    def team(side):
        return dict(id=side, abbreviation='AWY' if side == 'a' else 'HME', displayName='Away United' if side == 'a' else 'Home Athletic', score=7 if side == 'a' else 14, recordSummary='2-1', linescores=[])
    return dict(id=str(index), sport=sport, league=league, leagueName=league.upper(), date='2026-09-21T18:00Z', homeTeam=team('h'), awayTeam=team('a'), status=dict(isLive=True, isFinal=False, isScheduled=False, detail='In progress', shortDetail='Live', period=2), broadcasts=['ESPN'], situation={}, headlines=[])

GAMES = [game(s, l, i) for i, (s, l) in enumerate(SPORTS)]
PLAYS = [dict(id=str(i), text=f'Play {i}: reported game action', type='Rush' if i != 2 else 'Touchdown', period='Period 2', clock=f'8:0{i}', start=dict(yardsToEndzone=70-i*10, distance=10), end=dict(yardsToEndzone=60-i*10), awayScore=7, homeScore=14, scoringPlay=i==2) for i in range(4)]
SUMMARY = dict(visualPlays=PLAYS, plays=PLAYS, boxscore=dict(teams=[dict(team=dict(id=t, name=t), statistics=[dict(name='yards', label='Total yards', displayValue='250' if t=='a' else '320')]) for t in ['a','h']], players=[]), scoringPlays=[], gameInfo={}, rawStatus=dict(type=dict(detail='In progress')))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport=dict(width=1920, height=1080), service_workers='block')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def api(route):
        url = route.request.url
        if '/api/scores/all' in url: data = dict(games=GAMES, leagues=[])
        elif '/api/game/' in url: data = SUMMARY
        elif '/api/leagues' in url: data = dict(leagues=[])
        else: data = dict(articles=[])
        route.fulfill(content_type='application/json', body=json.dumps(data))
    page.route('**/api/**', api)
    page.goto(os.environ.get('TV_TEST_URL', 'http://127.0.0.1:5173'), wait_until='domcontentloaded')
    page.get_by_title('Toggle TV / Jumbotron Mode (Big Screen TV Display)').click()
    tv = page.get_by_role('dialog', name='TV mode', exact=True)
    expect(tv).to_be_visible()
    try:
        expect(page.locator('.tv-play-row')).to_have_count(4, timeout=15000)
    except Exception:
        print(page.locator('body').inner_text()[-6000:])
        print(errors)
        raise
    assert page.locator('.tv-mode').evaluate('(el) => el.scrollHeight <= el.clientHeight + 1')
    assert page.locator('.tv-mode').evaluate('(el) => el.scrollWidth <= el.clientWidth')
    page.get_by_role('button', name='Pause auto-cycle', exact=True).click()
    page.get_by_role('button', name='Previous play', exact=True).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 2:')
    page.get_by_role('button', name='Replay play', exact=True).click()
    expect(page.locator('.field-ball-moving')).to_have_count(1)
    page.get_by_role('button', name='Next play', exact=True).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 3:')
    page.get_by_role('button', name='Play sequence', exact=True).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 0:')
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 1:', timeout=6000)
    page.get_by_role('button', name='Follow live', exact=True).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 3:')
    page.get_by_role('tab', name='Team stats', exact=True).click()
    expect(page.get_by_role('tabpanel', name='Team stats')).to_contain_text('Total yards')
    page.get_by_role('tab', name='Play-by-play', exact=False).click()
    page.get_by_role('button', name='Open Full Game Center & Play-by-Play', exact=True).click()
    modal = page.get_by_role('dialog', name='Full game center', exact=True)
    expect(modal).to_be_visible()
    expect(modal).to_contain_text('Play-by-Play Log')
    page.keyboard.press('Escape')
    expect(modal).to_have_count(0)
    expect(tv).to_be_visible()
    expect(page.get_by_role('button', name='Open Full Game Center & Play-by-Play', exact=True)).to_be_focused()
    page.get_by_role('button', name='Previous play', exact=True).click()
    SUMMARY['visualPlays'] = PLAYS + [dict(PLAYS[-1], id='new', text='Newly reported play')]
    expect(page.locator('.tv-play-row')).to_have_count(5, timeout=25000)
    expect(page.locator('.tv-play-caption')).to_contain_text('Play 2:')
    page.get_by_role('button', name='Follow live', exact=True).click()
    expect(page.locator('.tv-play-caption')).to_contain_text('Newly reported play')
    SUMMARY['visualPlays'] = PLAYS
    expect(page.locator('.tv-play-row')).to_have_count(4, timeout=25000)
    Path('test-screenshots').mkdir(exist_ok=True)
    for i, (sport, _) in enumerate(SPORTS):
        if i: page.get_by_role('button', name='Next game', exact=True).click()
        expect(page.locator(f'.field-{sport}')).to_be_visible()
        page.screenshot(path=f'test-screenshots/tv-{sport}.png')
    page.get_by_role('button', name='Overhead view', exact=True).click()
    expect(page.locator('.field-flat')).to_have_count(1)
    page.emulate_media(reduced_motion='reduce')
    assert page.locator('.field-ball').evaluate('(el) => getComputedStyle(el).animationName') == 'none'
    for width, height in [(1280, 720), (390, 844)]:
        page.set_viewport_size(dict(width=width, height=height))
        assert page.locator('.tv-mode').evaluate('(el) => el.scrollWidth <= el.clientWidth'), (width, height)
    page.screenshot(path='test-screenshots/tv-mobile.png')
    page.keyboard.press('Escape')
    expect(tv).to_have_count(0)
    # Empty coverage and error states should keep the TV controls usable.
    SUMMARY['visualPlays'] = []
    SUMMARY['plays'] = []
    page.get_by_title('Toggle TV / Jumbotron Mode (Big Screen TV Display)').click()
    expect(page.locator('.tv-play-list')).to_contain_text('No plays available')
    expect(page.get_by_role('button', name='Replay play', exact=True)).to_be_disabled()
    page.keyboard.press('Escape')
    SUMMARY['error'] = 'Upstream unavailable'
    page.get_by_title('Toggle TV / Jumbotron Mode (Big Screen TV Display)').click()
    expect(page.locator('.tv-feed-error')).to_be_visible()
    del SUMMARY['error']
    SUMMARY['visualPlays'] = PLAYS
    page.get_by_role('button', name='Retry', exact=True).click()
    expect(page.locator('.tv-play-row')).to_have_count(4)
    page.keyboard.press('Escape')
    GAMES.clear()
    page.reload(wait_until='domcontentloaded')
    page.get_by_title('Toggle TV / Jumbotron Mode (Big Screen TV Display)').click()
    expect(page.get_by_role('heading', name='No games on this date')).to_be_visible()
    assert not errors, errors
    browser.close()
    print('PASS: five fields, replay/sequence/live, stats, modal/escape/focus, responsive layout, reduced motion; no browser errors')
