# TV mode checks

Run the normalization and field-model tests:

```powershell
node --test tests/tv-plays.test.js
```

Run deterministic browser checks against the Docker app (requires Python Playwright and Chromium):

```powershell
$env:TV_TEST_URL = 'http://localhost:3000'
python tests/test_tv_mode.py
```

Without `TV_TEST_URL`, the browser checks use the Vite server on port 5173. These tests mock API responses and block service workers so every sport, empty/error state, replay, live refresh, modal, and keyboard behavior is reproducible. Screenshots are written to `test-screenshots/tv-*.png`.

`python tests/smoke_tv_live.py` checks the deployed Docker app against a real completed NFL game from September 20, 2026. It requires the upstream feed to remain available.

The TV fields use CSS perspective and SVG markings. Animation represents discrete reported plays, not continuous player tracking. Football uses reported yard positions (or an end position plus reported yardage); other sports use clearly labeled illustrative trajectories. Selecting a play holds the game, and Follow live resumes the latest event. Full Game Center opens above TV mode; Escape returns to TV mode.
