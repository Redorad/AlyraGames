/**
 * AlyraGames Game Integration
 *
 * Auto-submits local high scores to the global leaderboard by watching localStorage.
 * Usage: <script src="/AlyraGames/game-integration.js"></script>
 *        <script>AlyraGamesIntegration.watch('game-snake');</script>
 */
(function (global) {
  'use strict';

  // Map of gameId → localStorage keys to watch. Scores are parsed as numbers.
  // For keys that store objects (JSON), we extract the max value.
  const GAME_KEYS = {
    'game-2048':        ['2048-slime-best'],
    'game-2048hex':     ['2048hex-best'],
    'game-basketball':  ['basketball_best'],
    'game-battleship':  ['battleship-highscore'],
    'game-breakout':    ['breakout-best'],
    'game-brickbreaker':['brickbreaker-highscore'],
    'game-checkers':    ['checkers-highscore'],
    'game-darts':       ['darts_best'],
    'game-flappy':      ['flappy-clone-highscore'],
    'game-frogger':     ['frogger-best'],
    'game-fruit':       ['fruit-ninja-hi'],
    'game-geometry':    ['geo_best'],
    'game-gravity':     ['gravity-best'],
    'game-helicopter':  ['heli_best'],
    'game-highlow':     ['hl_best'],
    'game-lightsout':   ['lo_best'],
    'game-match3':      ['match3-best'],
    'game-math':        ['math-blitz-hi'],
    'game-maze':        ['maze-best'],
    'game-memory':      ['memory-best-scores'],
    'game-minesweeper': ['minesweeper-best-times'],
    'game-penalty':     ['penalty_hi'],
    'game-pinball':     ['pinball_hi'],
    'game-pong':        ['pong-duel-highscore'],
    'game-reaction':    ['reaction-best'],
    'game-runner':      ['cyber-runner-hi'],
    'game-sequence':    ['seq-best'],
    'game-shooter':     ['shooter-best'],
    'game-snake':       ['snake-neon-high', 'snake-neon-highscore'],
    'game-solitaire':   ['solitaire-best'],
    'game-space':       ['space-dodge-hi', 'space-dodge-highscore'],
    'game-sudoku':      ['sudoku-zen-best-times'],
    'game-tetris':      ['fallingblocks-highscore'],
    'game-typing':      ['typing-speed-bests', 'typing-speed-best-wpm'],
    'game-whack':       ['whack-hi'],
  };

  // Lower-is-better games (time-based): rank by lowest, but we still submit highest for now
  const LOW_IS_BETTER = ['game-reaction', 'game-minesweeper', 'game-sudoku', 'game-maze', 'game-solitaire'];

  let currentGameId = null;
  let lastSubmitted = {};
  const SUBMIT_COOLDOWN = 2000; // 2s between submits per key

  function parseScore(value) {
    if (value == null) return null;
    // Try as number first
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;
    // Try as JSON
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'number') return obj;
      if (obj && typeof obj === 'object') {
        // For memory-best-scores, minesweeper-best-times, etc. — find max (or best)
        let max = 0;
        const extract = (v) => {
          if (typeof v === 'number' && isFinite(v) && v > max) max = v;
          else if (v && typeof v === 'object') {
            Object.values(v).forEach(extract);
          }
        };
        extract(obj);
        if (max > 0) return max;
      }
    } catch (e) {}
    return null;
  }

  async function submitIfNew(gameId, key, value) {
    const score = parseScore(value);
    if (score == null || score <= 0) return;
    const cacheKey = gameId + ':' + key;
    const now = Date.now();
    if (lastSubmitted[cacheKey] && now - lastSubmitted[cacheKey].time < SUBMIT_COOLDOWN) return;
    if (lastSubmitted[cacheKey] && lastSubmitted[cacheKey].score >= score) return;

    lastSubmitted[cacheKey] = { score, time: now };

    if (global.AlyraGames && global.AlyraGames.isLoggedIn && global.AlyraGames.isLoggedIn()) {
      try {
        await global.AlyraGames.submitScore(gameId, score, { key });
        showToast('🏆 Score submitted: ' + formatScore(score));
      } catch (e) { /* ignore */ }
    }
  }

  function formatScore(s) {
    if (s >= 1000000) return (s / 1000000).toFixed(1) + 'M';
    if (s >= 1000) return (s / 1000).toFixed(1) + 'K';
    return Math.floor(s).toLocaleString();
  }

  function showToast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,14,39,0.95);color:#fbbf24;padding:10px 18px;border-radius:10px;border:1px solid rgba(251,191,36,0.4);font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:fadeInUp 0.3s ease-out;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function watch(gameId, customKeys) {
    currentGameId = gameId;
    const keys = customKeys || GAME_KEYS[gameId] || [];
    if (keys.length === 0) return;

    // Check current values on load
    setTimeout(() => {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value != null) submitIfNew(gameId, key, value);
      });
    }, 2000);

    // Hook setItem to detect changes
    const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      orig(key, value);
      if (keys.includes(key)) {
        submitIfNew(gameId, key, value);
      }
    };
  }

  global.AlyraGamesIntegration = { watch, GAME_KEYS };
})(typeof window !== 'undefined' ? window : this);
