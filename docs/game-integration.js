/**
 * AlyraGames Game Integration
 *
 * Include this script in any game's index.html AFTER the SDK to automatically:
 * - Submit local high scores to the global leaderboard
 * - Work without modifying the game's source code
 *
 * Usage:
 *   <script src="/AlyraGames/alyragames-sdk.js"></script>
 *   <script>
 *     AlyraGamesIntegration.watch('game-snake', 'snake-neon-highscore');
 *   </script>
 */
(function (global) {
  'use strict';

  // Map of gameId → localStorage key(s) to watch
  const GAME_KEYS = {
    'game-snake':       ['snake-neon-highscore'],
    'game-2048':        ['2048-slime-best'],
    'game-flappy':      ['flappy-clone-highscore'],
    'game-tetris':      ['fallingblocks-highscore'],
    'game-space':       ['space-dodge-highscore'],
    'game-pong':        ['pong-duel-highscore'],
    'game-brickbreaker':['brickbreaker-highscore'],
    'game-breakout':    ['breakout-highscore'],
    'game-typing':      ['typing-speed-best-wpm'],
    'game-reaction':    ['reaction-best'],
    'game-math':        ['math-blitz-highscore'],
    'game-minesweeper': ['minesweeper-best-easy', 'minesweeper-best-medium', 'minesweeper-best-hard'],
    'game-memory':      ['memory-best-scores'],
    'game-sudoku':      ['sudoku-zen-best-times'],
  };

  let currentGameId = null;
  let lastSubmitted = {};
  const SUBMIT_COOLDOWN = 3000; // 3s between submits per key

  function parseScore(value) {
    if (value == null) return null;
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;
    // Try to parse as JSON (some games store objects)
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'number') return obj;
      if (obj && typeof obj === 'object') {
        // Find the highest number in the object
        let max = 0;
        for (const v of Object.values(obj)) {
          if (typeof v === 'number' && v > max) max = v;
        }
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
        // Show a brief toast
        showToast('🏆 Score submitted: ' + Math.floor(score));
      } catch (e) { /* ignore */ }
    }
  }

  function showToast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,14,39,0.95);color:#fbbf24;padding:10px 18px;border-radius:10px;border:1px solid rgba(251,191,36,0.4);font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function watch(gameId, customKeys) {
    currentGameId = gameId;
    const keys = customKeys || GAME_KEYS[gameId] || [];
    if (keys.length === 0) {
      console.warn('[AlyraGames Integration] No keys defined for', gameId);
      return;
    }

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

  global.AlyraGamesIntegration = { watch };
})(typeof window !== 'undefined' ? window : this);
