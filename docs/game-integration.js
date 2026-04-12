/**
 * AlyraGames Game Integration
 *
 * Auto-submits local high scores to the global leaderboard by watching localStorage.
 * Usage: <script src="/game-integration.js"></script>
 *        <script>AlyraGamesIntegration.watch('game-snake');</script>
 */
(function (global) {
  'use strict';

  // Map of gameId → localStorage keys to watch.
  const GAME_KEYS = {
    // Puzzle
    'game-2048':        ['2048-slime-best'],
    'game-2048hex':     ['2048hex-best'],
    'game-15puzzle':    ['15puzzle-stats'],
    'game-minesweeper': ['minesweeper-best-times'],
    'game-sudoku':      ['sudoku-zen-best-times'],
    'game-nonogram':    ['nonogram-stats'],
    'game-memory':      ['memory-best-scores'],
    'game-matchpairs':  ['matchpairs_best_food', 'matchpairs_best_countries', 'matchpairs_best_animals'],
    'game-lightsout':   ['lo_best'],
    'game-match3':      ['match3-best'],
    'game-maze':        ['maze-best'],
    'game-wordle':      ['wordle-stats'],
    'game-pictoquiz':   ['pictoquiz-stats'],
    'game-crossword':   ['crossword-stats'],
    'game-hangman':     ['hangman-stats'],
    'game-sequence':    ['seq-best'],

    // Arcade / Action
    'game-snake':       ['snake-neon-high', 'snake-neon-highscore'],
    'game-snake2p':     ['snake2p_high_score'],
    'game-flappy':      ['flappy-clone-highscore'],
    'game-tetris':      ['fallingblocks-highscore'],
    'game-pong':        ['pong-duel-highscore'],
    'game-brickbreaker':['brickbreaker-highscore'],
    'game-breakout':    ['breakout-best'],
    'game-space':       ['space-dodge-hi', 'space-dodge-highscore'],
    'game-spacewar':    ['spacewar-stats'],
    'game-fruit':       ['fruit-ninja-hi'],
    'game-runner':      ['cyber-runner-hi'],
    'game-runner2':     ['runner2_high_score'],
    'game-geometry':    ['geo_best'],
    'game-gravity':     ['gravity-best'],
    'game-helicopter':  ['heli_best'],
    'game-bubble':      ['bubble-stats'],
    'game-frogger':     ['frogger-best'],
    'game-avoid':       ['avoid_high_score'],
    'game-shooter':     ['shooter-best'],
    'game-zombiewave':  ['zombiewave-stats'],
    'game-knifethrow':  ['knifethrow-stats'],
    'game-whack':       ['whack-hi'],
    'game-whackmonster':['whackmonster_high_score'],
    'game-simon':       ['simon_high_score'],

    // Strategy / Board
    'game-chess':       ['chess-stats'],
    'game-checkers':    ['checkers-highscore'],
    'game-connect4':    ['connect4-stats'],
    'game-reversi':     ['reversi-stats'],
    'game-tictactoe':   ['tictactoe-stats'],
    'game-battleship':  ['battleship-highscore'],
    'game-mastermind':  ['mastermind-stats'],

    // Sports
    'game-basketball':  ['basketball_best'],
    'game-bowling':     ['bowling-stats'],
    'game-darts':       ['darts_best'],
    'game-golf':        ['golf-stats'],
    'game-penalty':     ['penalty_hi'],
    'game-pinball':     ['pinball_hi'],
    'game-racing':      ['racing-best-lap'],
    'game-archery':     ['archery-best'],

    // Cards / Casino
    'game-solitaire':   ['solitaire-best'],
    'game-blackjack':   ['blackjack-balance'],
    'game-highlow':     ['hl_best'],
    'game-slots':       ['slots_balance'],
    'game-dice':        ['dice-stats'],
    'game-coinflip':    ['coinflip-stats'],

    // Quiz / Skill
    'game-typing':      ['typing-speed-bests', 'typing-speed-best-wpm'],
    'game-math':        ['math-blitz-hi'],
    'game-reaction':    ['reaction-best'],
    'game-guess':       ['guess_best_scores'],
    'game-colormatch':  ['colormatch_high_score'],
    'game-spellit':     ['spellit_high_score'],
    'game-rps':         ['rps-stats'],
    'game-trivia':      ['trivia-stats'],
    'game-flagquiz':    ['flagquiz-stats'],
    'game-capitalquiz': ['capitalquiz-stats'],
    'game-quiz2':       ['quiz2-stats'],
    'game-musicquiz':   ['musicquiz-stats'],
    'game-colorblind':  ['colorblind-stats'],
    'game-palindrome':  ['palindrome-stats'],

    // Idle / Clicker
    'game-cookie':      ['cookie-save'],
    'game-mining':      ['mining_save'],
    'game-fish':        ['fish_save'],
    'game-pottery':     ['pottery_save'],
    'game-farm':        ['farm_save'],
    'game-garden':      ['garden_save'],
    'game-potion':      ['potion_save'],
    'game-spaceship':   ['spaceship-save'],
    'game-dragon':      ['dragon-save'],
    'game-robot':       ['robot-save'],
    'game-aquarium':    ['aquarium-save'],
    'game-tamagotchi':  ['tamagotchi-save'],

    // Sim
    'game-train':       ['train-best'],
    'game-hospital':    ['hospital-save'],
    'game-restaurant':  ['restaurant-save'],
    'game-weather':     ['weather-stats'],

    // RPG / Adventure
    'game-dungeon':     ['dungeon-best'],
    'game-rpg':         ['rpg-stats'],
    'game-treasurehunt':['treasurehunt-stats'],
    'game-monstertamer':['monstertamer-save'],
    'game-vampire':     ['vampire-best'],
    'game-wizard':      ['wizard-best'],
    'game-shadowcat':   ['shadowcat-best'],

    // Misc
    'game-drawing':     [],  // no score
    'game-2p-fight':    ['2pfight-stats'],
    'game-pipes':       ['pipes-stats'],
    'game-sokoban':     ['sokoban-stats'],
    'game-puzzle2':     ['puzzle2-stats'],

    // Slime games
    'slime-td':         ['slime-td-progress'],
    'slime-run':        ['slime-run-progress'],
    'slime-cards':      ['slime-cards-progress'],
    'slime-match':      ['slime-match-progress'],
    'slime-colony':     ['slime-colony-save'],
    'slime-arena':      ['slime-arena-progress'],
    'slime-idle':       ['slime-idle-save', 'slime-idle-leaderboard'],
  };

  let currentGameId = null;
  let lastSubmitted = {};
  const SUBMIT_COOLDOWN = 2000;

  function parseScore(value) {
    if (value == null) return null;
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'number') return obj;
      if (obj && typeof obj === 'object') {
        // Find best numeric value in object (recursive)
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
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,14,39,0.95);color:#fbbf24;padding:10px 18px;border-radius:10px;border:1px solid rgba(251,191,36,0.4);font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function watch(gameId, customKeys) {
    currentGameId = gameId;
    const keys = customKeys || GAME_KEYS[gameId] || [];
    if (keys.length === 0) return;

    setTimeout(() => {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value != null) submitIfNew(gameId, key, value);
      });
    }, 2000);

    const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      orig(key, value);
      if (keys.includes(key)) {
        submitIfNew(gameId, key, value);
      }
    };
  }

  /** Track this game visit in recently-played list */
  function trackVisit(gameId) {
    const KEY = 'alyragames_recent';
    const MAX = 12;
    try {
      let list = JSON.parse(localStorage.getItem(KEY) || '[]');
      list = list.filter(s => s !== gameId);
      list.unshift(gameId);
      if (list.length > MAX) list = list.slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }

  /** Auto-detect game from URL path and start watching */
  function autoWatch() {
    const path = location.pathname;
    const match = path.match(/\/(game-[^/]+|slime-[^/]+)\//);
    if (match && GAME_KEYS[match[1]]) {
      watch(match[1]);
      trackVisit(match[1]);
    }
  }

  global.AlyraGamesIntegration = { watch, autoWatch, GAME_KEYS };
})(typeof window !== 'undefined' ? window : this);
