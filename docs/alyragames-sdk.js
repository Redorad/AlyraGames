/**
 * AlyraGames SDK - Shared leaderboard library
 *
 * Usage:
 *   <script src="/alyragames-sdk.js"></script>
 *   <script>
 *     const sdk = AlyraGames.init();
 *     sdk.submitScore('game-snake', 1234);
 *     const top = await sdk.getLeaderboard('game-snake');
 *   </script>
 */
(function (global) {
  'use strict';

  const SUPABASE_URL = 'https://kqcqsgepwcrnovdhmflr.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxY3FzZ2Vwd2Nybm92ZGhtZmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDUyMzgsImV4cCI6MjA5MTM4MTIzOH0.MzjGI1J9M2xKZDqU6T3V1pFdjJOEil4SpeTIJ9RjsGE';

  const STORAGE_KEY = 'alyragames_player';

  // ── State ──────────────────────────────────────────
  let player = null; // { id, nickname, isGuest }

  function loadPlayer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.isGuest !== undefined) {
          player = data;
          return player;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function savePlayer(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
    player = p;
  }

  function clearPlayer() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    player = null;
  }

  // ── HTTP helper ────────────────────────────────────
  async function apiCall(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1${path}`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    };
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (e) {
      console.error('[AlyraGames SDK]', e);
      throw e;
    }
  }

  // ── Public API ─────────────────────────────────────

  /** Play as guest (scores local only) */
  function playAsGuest() {
    savePlayer({
      id: null,
      nickname: 'Guest',
      isGuest: true,
    });
    return player;
  }

  /** Set nickname and register in the database */
  async function setNickname(nickname) {
    nickname = String(nickname || '').trim();
    if (nickname.length < 2 || nickname.length > 20) {
      throw new Error('Nickname must be 2-20 characters');
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(nickname)) {
      throw new Error('Only letters, numbers, underscore and dash allowed');
    }

    // Check if nickname exists
    const existing = await apiCall(`/players?nickname=eq.${encodeURIComponent(nickname)}&select=id,nickname`);
    if (existing && existing.length > 0) {
      // Reuse the existing player row — user is claiming that nickname
      const p = {
        id: existing[0].id,
        nickname: existing[0].nickname,
        isGuest: false,
      };
      savePlayer(p);
      return p;
    }

    // Create new player
    const created = await apiCall('/players', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
    if (!created || created.length === 0) {
      throw new Error('Failed to create player');
    }
    const p = {
      id: created[0].id,
      nickname: created[0].nickname,
      isGuest: false,
    };
    savePlayer(p);
    return p;
  }

  /** Log out (clear player) */
  function logout() {
    clearPlayer();
  }

  /** Get current player */
  function getPlayer() {
    return player;
  }

  /** Is user logged in with a nickname? */
  function isLoggedIn() {
    return player && !player.isGuest && player.id;
  }

  /** Submit a score. Returns the submitted row, or null if guest/failed. */
  async function submitScore(gameId, score, metadata = {}) {
    if (!player || player.isGuest || !player.id) {
      // Guest — save to localStorage only
      saveLocalBest(gameId, score);
      return null;
    }
    if (typeof score !== 'number' || !isFinite(score)) {
      throw new Error('Score must be a finite number');
    }
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('gameId required');
    }

    // Rate limiting: max 1 submission per game per 2 seconds
    const now = Date.now();
    const lastKey = `alyragames_last_submit_${gameId}`;
    try {
      const last = Number(localStorage.getItem(lastKey) || 0);
      if (now - last < 2000) {
        // Too soon — queue for local only
        saveLocalBest(gameId, score);
        return null;
      }
    } catch (e) {}

    // Only submit if the score is actually better than previous best
    const localBest = getLocalBest(gameId);
    if (score <= localBest) {
      saveLocalBest(gameId, score); // still save (no-op if lower)
      return null;
    }

    saveLocalBest(gameId, score);

    try {
      localStorage.setItem(lastKey, String(now));
      const created = await apiCall('/scores', {
        method: 'POST',
        body: JSON.stringify({
          player_id: player.id,
          nickname: player.nickname,
          game_id: gameId,
          score,
          metadata,
        }),
      });
      return created && created[0];
    } catch (e) {
      console.error('[AlyraGames SDK] submitScore failed', e);
      return null;
    }
  }

  /** Get top N scores for a game (default 20) */
  async function getLeaderboard(gameId, limit = 20) {
    try {
      const rows = await apiCall(
        `/scores?game_id=eq.${encodeURIComponent(gameId)}&select=nickname,score,created_at,metadata&order=score.desc&limit=${limit}`
      );
      return rows || [];
    } catch (e) {
      return [];
    }
  }

  /** Get player's best score + rank for a game */
  async function getMyRank(gameId) {
    if (!player || player.isGuest || !player.id) return null;
    try {
      // Get player's best score
      const myScores = await apiCall(
        `/scores?game_id=eq.${encodeURIComponent(gameId)}&player_id=eq.${player.id}&select=score&order=score.desc&limit=1`
      );
      if (!myScores || myScores.length === 0) return null;
      const myBest = myScores[0].score;

      // Count players with higher scores (using Postgres aggregate)
      const higher = await apiCall(
        `/scores?game_id=eq.${encodeURIComponent(gameId)}&score=gt.${myBest}&select=player_id`
      );
      // Deduplicate player IDs
      const uniqueHigher = new Set((higher || []).map(r => r.player_id));
      return {
        score: myBest,
        rank: uniqueHigher.size + 1,
      };
    } catch (e) {
      return null;
    }
  }

  /** Get all scores for a specific player (by nickname). Returns best per game. */
  async function getPlayerScores(nickname) {
    try {
      const rows = await apiCall(
        `/scores?nickname=eq.${encodeURIComponent(nickname)}&select=game_id,score,created_at&order=score.desc&limit=500`
      );
      // Keep best score per game
      const bestByGame = {};
      (rows || []).forEach(r => {
        if (!bestByGame[r.game_id] || r.score > bestByGame[r.game_id].score) {
          bestByGame[r.game_id] = r;
        }
      });
      return Object.entries(bestByGame).map(([gameId, row]) => ({
        game_id: gameId,
        score: row.score,
        created_at: row.created_at,
      })).sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }

  /** Get player info by nickname */
  async function getPlayerByNickname(nickname) {
    try {
      const rows = await apiCall(
        `/players?nickname=eq.${encodeURIComponent(nickname)}&select=id,nickname,created_at`
      );
      return rows && rows[0];
    } catch (e) {
      return null;
    }
  }

  /** Local best score (localStorage) */
  function getLocalBest(gameId) {
    try {
      const raw = localStorage.getItem(`alyragames_local_${gameId}`);
      if (raw) return JSON.parse(raw).best || 0;
    } catch (e) { /* ignore */ }
    return 0;
  }

  function saveLocalBest(gameId, score) {
    try {
      const current = getLocalBest(gameId);
      if (score > current) {
        localStorage.setItem(`alyragames_local_${gameId}`, JSON.stringify({ best: score, at: Date.now() }));
      }
    } catch (e) { /* ignore */ }
  }

  // ── Initialization ─────────────────────────────────
  function init() {
    loadPlayer();
    return api;
  }

  const api = {
    init,
    playAsGuest,
    setNickname,
    logout,
    getPlayer,
    isLoggedIn,
    submitScore,
    getLeaderboard,
    getMyRank,
    getPlayerScores,
    getPlayerByNickname,
    getLocalBest,
  };

  global.AlyraGames = api;
})(typeof window !== 'undefined' ? window : this);
