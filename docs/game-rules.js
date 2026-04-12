/**
 * AlyraGames — Shared Rules / How-to-play overlay
 *
 * Adds a floating "?" button to every game that opens a rules modal.
 * The rules content for each game lives in GAME_RULES below.
 *
 * Usage: <script src="/AlyraGames/game-rules.js"></script>
 * (Auto-initializes on load.)
 */
(function () {
  'use strict';

  // Detect game id from URL path, e.g. /AlyraGames/game-snake/ → 'game-snake'
  function getGameId() {
    const m = location.pathname.match(/\/(game-[^/]+|slime-[^/]+)\//);
    return m ? m[1] : null;
  }

  // Rules for every game. Populated by GAME_RULES assignment below.
  const GAME_RULES = {};

  // --- Overlay UI ---------------------------------------------------------

  const STYLES = `
    #ag-help-btn{position:fixed;top:12px;right:12px;z-index:9999;width:36px;height:36px;border-radius:50%;background:rgba(10,14,39,0.85);color:#7ec8e3;border:1px solid rgba(126,200,227,0.35);font:600 18px -apple-system,sans-serif;cursor:pointer;backdrop-filter:blur(4px);box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform .15s,background .15s}
    #ag-help-btn:hover{background:rgba(126,200,227,0.2);transform:scale(1.08)}
    #ag-help-backdrop{position:fixed;inset:0;background:rgba(5,8,22,0.78);backdrop-filter:blur(6px);z-index:10000;display:none;align-items:center;justify-content:center;padding:16px;animation:agFade .2s ease-out}
    #ag-help-backdrop.open{display:flex}
    #ag-help-modal{background:linear-gradient(180deg,#111640 0%,#0a0e27 100%);border:1px solid rgba(126,200,227,0.3);border-radius:16px;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;padding:24px;color:#e6ecff;font-family:-apple-system,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,0.6);animation:agPop .25s ease-out}
    #ag-help-modal h2{margin:0 0 4px;font-size:22px;color:#fff;display:flex;align-items:center;gap:10px}
    #ag-help-modal h2 .ico{font-size:30px}
    #ag-help-modal .sub{color:#7ec8e3;font-size:13px;margin-bottom:18px}
    #ag-help-modal h3{margin:18px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#a78bfa;font-weight:700}
    #ag-help-modal ul{margin:0;padding-left:18px;font-size:14px;line-height:1.55;color:#c9d4ff}
    #ag-help-modal ul li{margin-bottom:4px}
    #ag-help-modal p{margin:0 0 10px;font-size:14px;line-height:1.55;color:#c9d4ff}
    #ag-help-modal kbd{background:rgba(126,200,227,0.15);border:1px solid rgba(126,200,227,0.3);border-radius:4px;padding:1px 6px;font-family:ui-monospace,monospace;font-size:12px;color:#7ec8e3}
    #ag-help-close{position:sticky;top:0;float:right;background:rgba(126,200,227,0.15);border:1px solid rgba(126,200,227,0.3);color:#7ec8e3;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:600}
    #ag-help-close:hover{background:rgba(126,200,227,0.25)}
    @keyframes agFade{from{opacity:0}to{opacity:1}}
    @keyframes agPop{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:none}}
    @media(max-width:480px){#ag-help-btn{top:12px;right:12px;width:32px;height:32px;font-size:16px}#ag-help-modal{padding:20px;border-radius:14px}#ag-help-modal h2{font-size:19px}}
  `;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function listHtml(items) {
    if (!items || !items.length) return '';
    return '<ul>' + items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
  }

  function renderModal(rules) {
    const title = escapeHtml(rules.title || 'How to play');
    const icon = rules.icon || '🎮';
    const tagline = rules.tagline ? '<div class="sub">' + escapeHtml(rules.tagline) + '</div>' : '';
    let body = '';
    if (rules.goal)     body += '<h3>🎯 Goal</h3><p>' + rules.goal + '</p>';
    if (rules.howTo)    body += '<h3>📖 How to play</h3>' + listHtml(rules.howTo);
    if (rules.controls) body += '<h3>🎮 Controls</h3>' + listHtml(rules.controls);
    if (rules.scoring)  body += '<h3>🏆 Scoring</h3><p>' + rules.scoring + '</p>';
    if (rules.tips)     body += '<h3>💡 Tips</h3>' + listHtml(rules.tips);
    return (
      '<button id="ag-help-close">✕ Close</button>' +
      '<h2><span class="ico">' + icon + '</span>' + title + '</h2>' +
      tagline +
      body
    );
  }

  function genericRules(gameId) {
    return {
      title: 'How to play',
      icon: '🎮',
      tagline: 'Rules not available for this game yet',
      howTo: [
        'Use your mouse or keyboard to play.',
        'Your best score is saved automatically.',
        'Log in with a nickname on the Hub to appear on the global leaderboard.',
      ],
    };
  }

  function open() {
    const id = getGameId();
    const rules = (id && GAME_RULES[id]) || genericRules(id);
    const backdrop = document.getElementById('ag-help-backdrop');
    const modal = document.getElementById('ag-help-modal');
    modal.innerHTML = renderModal(rules);
    backdrop.classList.add('open');
    modal.querySelector('#ag-help-close').onclick = close;
  }

  function close() {
    const backdrop = document.getElementById('ag-help-backdrop');
    backdrop.classList.remove('open');
  }

  function init() {
    if (document.getElementById('ag-help-btn')) return; // already injected
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'ag-help-btn';
    btn.title = 'How to play';
    btn.setAttribute('aria-label', 'How to play');
    btn.textContent = '?';
    btn.onclick = open;
    document.body.appendChild(btn);

    const backdrop = document.createElement('div');
    backdrop.id = 'ag-help-backdrop';
    backdrop.innerHTML = '<div id="ag-help-modal"></div>';
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    document.body.appendChild(backdrop);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed so we can append rules from an external file if desired.
  window.AlyraGamesRules = { GAME_RULES, open, close };

  // --- Rules content ------------------------------------------------------

  Object.assign(GAME_RULES, {
    // === ARCADE / ACTION ===
    'game-snake': {
      title: 'Snake Neon', icon: '🐍',
      tagline: 'Classic snake with a neon twist',
      goal: 'Eat food to grow. Avoid hitting walls or yourself.',
      controls: ['<kbd>←↑↓→</kbd> or <kbd>WASD</kbd> to steer', 'Swipe on mobile'],
      scoring: 'Each food = +1 point. Your best length is saved as high score.',
      tips: ['Stay near the center early to keep room to maneuver', 'Plan 2 moves ahead once you\'re long'],
    },
    'game-snake2p': {
      title: '2-Player Snake', icon: '🐍',
      goal: 'Last snake alive wins the round.',
      controls: ['P1: <kbd>WASD</kbd>', 'P2: <kbd>←↑↓→</kbd>'],
      scoring: 'Each win adds to your score. Best-of plays until one side gives up.',
    },
    'game-flappy': {
      title: 'Flappy Clone', icon: '🐦',
      goal: 'Fly through the pipes without touching them.',
      controls: ['<kbd>Space</kbd> / click / tap to flap'],
      scoring: 'One point per pipe cleared. Best score is saved.',
      tips: ['Tap earlier than you think — momentum carries you'],
    },
    'game-tetris': {
      title: 'Falling Blocks', icon: '🧱',
      goal: 'Clear lines by filling horizontal rows.',
      controls: ['<kbd>←→</kbd> move', '<kbd>↑</kbd> rotate', '<kbd>↓</kbd> soft drop', '<kbd>Space</kbd> hard drop'],
      scoring: 'Single/double/triple/tetris clears give progressively more points. Level increases with lines cleared.',
    },
    'game-pong': {
      title: 'Pong Duel', icon: '🏓',
      goal: 'First player to reach the score limit wins.',
      controls: ['P1: <kbd>W / S</kbd>', 'P2: <kbd>↑ / ↓</kbd> (or AI)'],
      scoring: 'One point when the ball passes your opponent.',
    },
    'game-brickbreaker': {
      title: 'Brick Breaker', icon: '🧱',
      goal: 'Smash all the bricks with your ball.',
      controls: ['<kbd>← →</kbd> or mouse to move the paddle'],
      scoring: 'Each brick = points. Don\'t let the ball fall below the paddle.',
    },
    'game-breakout': {
      title: 'Breakout', icon: '🧱',
      goal: 'Clear every brick to beat the level.',
      controls: ['Mouse / finger to move the paddle', '<kbd>Space</kbd> to launch'],
      scoring: 'Tougher bricks are worth more points. Chain without missing for bigger scores.',
    },
    'game-space': {
      title: 'Space Dodge', icon: '🚀',
      goal: 'Survive as long as you can dodging asteroids.',
      controls: ['<kbd>←→</kbd> or touch to move'],
      scoring: 'Score = time survived. Speed ramps up the longer you last.',
    },
    'game-spacewar': {
      title: 'Space War', icon: '👾',
      goal: 'Destroy invaders before they reach the bottom.',
      controls: ['<kbd>←→</kbd> move', '<kbd>Space</kbd> shoot'],
      scoring: 'Each alien destroyed = points. Clear waves for bonus.',
    },
    'game-fruit': {
      title: 'Fruit Ninja', icon: '🍉',
      goal: 'Slice fruits, avoid bombs.',
      controls: ['Click-and-drag or swipe across fruits'],
      scoring: 'Each slice = points. Combos multiply the score. Bombs cost a life.',
    },
    'game-runner': {
      title: 'Cyber Runner', icon: '🏃',
      goal: 'Run as far as you can, dodging obstacles.',
      controls: ['<kbd>Space</kbd> / tap to jump', '<kbd>↓</kbd> to slide'],
      scoring: 'Distance = score. Speed increases over time.',
    },
    'game-runner2': {
      title: 'Endless Runner 2', icon: '🏃',
      goal: 'Stay alive and rack up distance.',
      controls: ['<kbd>Space</kbd> / tap to jump'],
      scoring: 'Distance-based score. Best run saved.',
    },
    'game-geometry': {
      title: 'Geometry Dash', icon: '🔷',
      goal: 'Jump through spikes and obstacles in rhythm.',
      controls: ['<kbd>Space</kbd> / click / tap to jump'],
      scoring: 'Percentage of the level cleared; all-the-way is 100%.',
    },
    'game-gravity': {
      title: 'Gravity Flip', icon: '🌀',
      goal: 'Flip gravity to dodge obstacles and survive.',
      controls: ['<kbd>Space</kbd> / tap to flip gravity'],
      scoring: 'Distance-based score.',
    },
    'game-helicopter': {
      title: 'Helicopter', icon: '🚁',
      goal: 'Pilot the chopper through the tunnel without crashing.',
      controls: ['Hold <kbd>Space</kbd> / tap to rise, release to fall'],
      scoring: 'Distance traveled.',
    },
    'game-bubble': {
      title: 'Bubble Shooter', icon: '🫧',
      goal: 'Match 3+ bubbles of the same color to pop them.',
      controls: ['Aim with mouse / finger, click to shoot'],
      scoring: 'Points per bubble. Chain drops give bonus.',
    },
    'game-frogger': {
      title: 'Frogger', icon: '🐸',
      goal: 'Guide the frog across the road and river.',
      controls: ['<kbd>←↑↓→</kbd> one square at a time'],
      scoring: 'Each frog home = points. Don\'t get hit or fall in the water.',
    },
    'game-avoid': {
      title: 'Avoid!', icon: '⚠️',
      goal: 'Dodge falling objects as long as possible.',
      controls: ['Mouse / touch to move'],
      scoring: 'Time survived = score.',
    },
    'game-shooter': {
      title: 'Top-Down Shooter', icon: '🔫',
      goal: 'Blast enemies, survive the waves.',
      controls: ['<kbd>WASD</kbd> move', 'Mouse aim + click to shoot'],
      scoring: 'Kills = points. Waves get harder.',
    },
    'game-zombiewave': {
      title: 'Zombie Wave', icon: '🧟',
      goal: 'Survive endless zombie waves.',
      controls: ['<kbd>WASD</kbd> move', 'Mouse aim + click to shoot'],
      scoring: 'Zombies killed + waves completed.',
    },
    'game-knifethrow': {
      title: 'Knife Throw', icon: '🔪',
      goal: 'Stick knives into the spinning target without hitting other knives.',
      controls: ['Click / tap to throw'],
      scoring: 'Each knife stuck = points. Clear the target to advance.',
    },
    'game-whack': {
      title: 'Whack-a-Mole', icon: '🔨',
      goal: 'Whack the moles as they pop up.',
      controls: ['Click / tap on a mole'],
      scoring: 'Each hit = points. Miss = -1. 30-second round.',
    },
    'game-whackmonster': {
      title: 'Whack-a-Monster', icon: '👹',
      goal: 'Bop monsters, spare the friendly ones.',
      controls: ['Click / tap a monster'],
      scoring: 'Correct hit = points. Wrong target = penalty.',
    },
    'game-simon': {
      title: 'Simon Says', icon: '🎵',
      goal: 'Repeat the color sequence — it gets longer each round.',
      controls: ['Click / tap the colored pads'],
      scoring: 'One point per round completed. One mistake ends the game.',
    },

    // === PUZZLE ===
    'game-2048': {
      title: '2048 Slime', icon: '🫧',
      goal: 'Slide tiles and merge matching numbers to reach 2048 (or beyond!).',
      controls: ['<kbd>←↑↓→</kbd> or swipe to slide', 'All tiles move at once'],
      scoring: 'Merged tile values sum to your score. Best score saved.',
      tips: ['Keep your biggest tile in one corner', 'Avoid letting tiles spread randomly'],
    },
    'game-2048hex': {
      title: '2048 Hex', icon: '⬡',
      goal: 'Same as 2048 but on a hex grid — merge matching tiles.',
      controls: ['6 directional keys, or click/tap arrows around the board'],
      scoring: 'Highest tile reached = best score.',
    },
    'game-15puzzle': {
      title: '15 Puzzle', icon: '🔢',
      goal: 'Slide the tiles into ascending order (1–15).',
      controls: ['Click a tile next to the empty space to slide it'],
      scoring: 'Best completion time is saved per difficulty.',
    },
    'game-minesweeper': {
      title: 'Minesweeper', icon: '💣',
      goal: 'Uncover every safe cell without hitting a mine.',
      controls: ['Left-click to reveal', 'Right-click to flag'],
      scoring: 'Best time per difficulty is saved.',
      tips: ['Numbers tell you how many mines touch that cell', 'Start from the corners'],
    },
    'game-sudoku': {
      title: 'Sudoku Zen', icon: '🧘',
      goal: 'Fill every row, column and 3×3 box with digits 1–9 (no repeats).',
      controls: ['Click a cell and press a number', '<kbd>Backspace</kbd> to clear'],
      scoring: 'Best time per difficulty is saved.',
    },
    'game-nonogram': {
      title: 'Nonogram', icon: '📏',
      goal: 'Fill cells according to the row/column number clues.',
      controls: ['Click to fill, right-click to mark empty'],
      scoring: 'Puzzles solved + time stats saved.',
    },
    'game-memory': {
      title: 'Memory Cards', icon: '🃏',
      goal: 'Find all matching pairs with as few moves as possible.',
      controls: ['Click two cards to flip them'],
      scoring: 'Best score per difficulty saved (fewer moves = better).',
    },
    'game-matchpairs': {
      title: 'Match Pairs', icon: '🔗',
      goal: 'Flip cards and match pairs across themed decks.',
      controls: ['Click two cards to reveal them'],
      scoring: 'Best time per theme is saved.',
    },
    'game-lightsout': {
      title: 'Lights Out', icon: '💡',
      goal: 'Turn off every light on the grid.',
      controls: ['Click a cell to toggle it and its neighbors'],
      scoring: 'Best move count saved per level.',
    },
    'game-match3': {
      title: 'Match 3', icon: '💎',
      goal: 'Swap adjacent gems to make rows of 3 or more.',
      controls: ['Click/drag two adjacent gems to swap'],
      scoring: 'Each match = points, cascades multiply. Goal score per level.',
    },
    'game-maze': {
      title: 'Maze Runner', icon: '🌀',
      goal: 'Find the exit of the maze.',
      controls: ['<kbd>←↑↓→</kbd> or swipe to move'],
      scoring: 'Best time per maze size is saved.',
    },
    'game-wordle': {
      title: 'Wordle', icon: '🔤',
      goal: 'Guess the 5-letter word in 6 tries.',
      controls: ['Type a word, press <kbd>Enter</kbd>'],
      scoring: 'Green = right letter, right spot. Yellow = wrong spot. Gray = not in word.',
    },
    'game-pictoquiz': {
      title: 'Picto Quiz', icon: '🖼️',
      goal: 'Identify what the emoji combo represents.',
      controls: ['Type the answer and submit'],
      scoring: 'Points per correct guess. Streaks give bonus.',
    },
    'game-crossword': {
      title: 'Crossword', icon: '📝',
      goal: 'Fill in the grid using the clues.',
      controls: ['Click a cell and type'],
      scoring: 'Best time per puzzle.',
    },
    'game-hangman': {
      title: 'Hangman', icon: '🪢',
      goal: 'Guess the word before you run out of tries.',
      controls: ['Click or press letters to guess'],
      scoring: 'Words solved + average tries saved.',
    },
    'game-sequence': {
      title: 'Sequence', icon: '🎵',
      goal: 'Repeat a sequence of notes that gets longer each round.',
      controls: ['Click / tap the pads in the same order'],
      scoring: 'Rounds completed.',
    },
    'game-sokoban': {
      title: 'Sokoban', icon: '📦',
      goal: 'Push every box onto its target spot.',
      controls: ['<kbd>←↑↓→</kbd> to move (boxes can only be pushed)'],
      scoring: 'Best move count per level.',
    },
    'game-pipes': {
      title: 'Pipes', icon: '🚰',
      goal: 'Rotate pipe segments to connect the source to the drain.',
      controls: ['Click a pipe to rotate 90°'],
      scoring: 'Best time per level.',
    },
    'game-puzzle2': {
      title: 'Block Puzzle', icon: '🧩',
      goal: 'Drop block shapes into the grid and clear full rows/columns.',
      controls: ['Drag a block from the tray onto the board'],
      scoring: 'Each cleared line = points. Game ends when no block fits.',
    },
    'game-palindrome': {
      title: 'Palindrome', icon: '🔄',
      goal: 'Spot if the word/phrase reads the same both ways.',
      controls: ['Click YES or NO'],
      scoring: 'Correct answers in a streak.',
    },

    // === STRATEGY / BOARD ===
    'game-chess': {
      title: 'Chess', icon: '♟️',
      goal: 'Checkmate your opponent\'s king.',
      controls: ['Click a piece then click a legal square'],
      scoring: 'Wins, losses and draws are tracked.',
      tips: ['Develop knights and bishops early', 'Castle for king safety'],
    },
    'game-checkers': {
      title: 'Checkers', icon: '⚫',
      goal: 'Capture or block all of your opponent\'s pieces.',
      controls: ['Click a piece, then click a valid diagonal square'],
      scoring: 'Wins vs. the AI are tracked.',
    },
    'game-connect4': {
      title: 'Connect 4', icon: '🔴',
      goal: 'Line up 4 of your discs horizontally, vertically or diagonally.',
      controls: ['Click a column to drop your disc'],
      scoring: 'Wins vs. AI are tracked.',
    },
    'game-reversi': {
      title: 'Reversi / Othello', icon: '⚪',
      goal: 'End the game with more discs of your color than the opponent.',
      controls: ['Click any empty square that flips at least one opponent disc'],
      scoring: 'Wins and disc totals tracked.',
    },
    'game-tictactoe': {
      title: 'Tic Tac Toe', icon: '❌',
      goal: 'Get 3 of your marks in a row.',
      controls: ['Click an empty cell'],
      scoring: 'Wins, losses, draws.',
    },
    'game-battleship': {
      title: 'Battleship', icon: '⚓',
      goal: 'Sink all of the enemy fleet before they sink yours.',
      controls: ['Place ships first, then click a square on the enemy grid to fire'],
      scoring: 'Wins tracked. Fewer shots = better.',
    },
    'game-mastermind': {
      title: 'Mastermind', icon: '🎯',
      goal: 'Guess the secret color code in as few tries as possible.',
      controls: ['Click colors to set your guess, then Submit'],
      scoring: 'Fewer guesses = better score.',
    },
    'game-2p-fight': {
      title: '2-Player Fight', icon: '🥊',
      goal: 'Deplete your opponent\'s HP first.',
      controls: ['P1: <kbd>WASD</kbd> + <kbd>F/G</kbd> attack', 'P2: <kbd>←↑↓→</kbd> + <kbd>K/L</kbd> attack'],
      scoring: 'Rounds won.',
    },

    // === SPORTS ===
    'game-basketball': {
      title: 'Basketball Shot', icon: '🏀',
      goal: 'Shoot hoops before the timer runs out.',
      controls: ['Click-and-drag to aim and set power, release to shoot'],
      scoring: 'Each basket = points. Swishes give bonus.',
    },
    'game-bowling': {
      title: 'Bowling', icon: '🎳',
      goal: 'Knock down all 10 pins.',
      controls: ['Drag to aim, release to bowl'],
      scoring: 'Standard bowling scoring with strikes and spares.',
    },
    'game-darts': {
      title: 'Darts', icon: '🎯',
      goal: 'Hit the bullseye for maximum points.',
      controls: ['Click / tap where you want the dart to land'],
      scoring: 'Bullseye = 50, bull = 25, rings and doubles/triples as in real darts.',
    },
    'game-golf': {
      title: 'Mini Golf', icon: '⛳',
      goal: 'Sink the ball in as few strokes as possible.',
      controls: ['Click-and-drag from the ball to aim and set power'],
      scoring: 'Lower strokes = better. Par per hole.',
    },
    'game-penalty': {
      title: 'Penalty Shootout', icon: '⚽',
      goal: 'Score more penalties than the keeper saves.',
      controls: ['Click / tap where to shoot'],
      scoring: 'Goals scored in a row = score.',
    },
    'game-pinball': {
      title: 'Pinball', icon: '🎪',
      goal: 'Keep the ball in play and rack up points.',
      controls: ['<kbd>←</kbd> left flipper, <kbd>→</kbd> right flipper', '<kbd>Space</kbd> to launch'],
      scoring: 'Hit targets for points. Multipliers stack.',
    },
    'game-racing': {
      title: 'Racing', icon: '🏎️',
      goal: 'Set the fastest lap time.',
      controls: ['<kbd>↑</kbd> accelerate, <kbd>↓</kbd> brake, <kbd>←→</kbd> steer'],
      scoring: 'Best lap time saved.',
    },
    'game-archery': {
      title: 'Archery', icon: '🏹',
      goal: 'Hit the bullseye accounting for wind.',
      controls: ['Drag from the bow to aim, release to shoot'],
      scoring: 'Points per ring. Bonus for bullseyes.',
    },

    // === CARDS / CASINO ===
    'game-solitaire': {
      title: 'Solitaire', icon: '♠️',
      goal: 'Move all cards to the four foundations by suit.',
      controls: ['Click-and-drag cards', 'Double-click to auto-send to foundation'],
      scoring: 'Best time and move count saved.',
    },
    'game-blackjack': {
      title: 'Blackjack', icon: '♦️',
      goal: 'Beat the dealer without going over 21.',
      controls: ['Hit, Stand, Double, or Split buttons'],
      scoring: 'Your balance is your score. Blackjack pays 3:2.',
    },
    'game-highlow': {
      title: 'Higher or Lower', icon: '🃏',
      goal: 'Predict whether the next card is higher or lower.',
      controls: ['Click HIGHER or LOWER'],
      scoring: 'Correct streaks raise your score.',
    },
    'game-slots': {
      title: 'Slot Machine', icon: '🎰',
      goal: 'Match symbols on the payline for a payout.',
      controls: ['Set your bet, click SPIN'],
      scoring: 'Balance grows with wins. Start at 100 credits.',
    },
    'game-dice': {
      title: 'Dice', icon: '🎲',
      goal: 'Beat the target with your dice rolls.',
      controls: ['Click ROLL'],
      scoring: 'Winning rounds in a row = streak score.',
    },
    'game-coinflip': {
      title: 'Coin Flip', icon: '🪙',
      goal: 'Call it right — heads or tails.',
      controls: ['Click HEADS or TAILS'],
      scoring: 'Correct calls in a row.',
    },

    // === QUIZ / SKILL ===
    'game-typing': {
      title: 'Typing Speed', icon: '⌨️',
      goal: 'Type the words correctly as fast as you can.',
      controls: ['Type on your keyboard'],
      scoring: 'WPM (words per minute). Best WPM saved.',
    },
    'game-math': {
      title: 'Math Blitz', icon: '➗',
      goal: 'Solve as many math problems as possible in 60 seconds.',
      controls: ['Type the answer and press <kbd>Enter</kbd>'],
      scoring: 'Correct answers = points.',
    },
    'game-reaction': {
      title: 'Reaction Time', icon: '⚡',
      goal: 'Click as fast as possible when the signal turns green.',
      controls: ['Click / tap when prompted'],
      scoring: 'Best (lowest) time in milliseconds saved.',
      tips: ['Don\'t anticipate — false starts reset you'],
    },
    'game-guess': {
      title: 'Number Guess', icon: '🔢',
      goal: 'Guess the number in as few tries as possible.',
      controls: ['Type a number and submit'],
      scoring: 'Fewer tries = better score.',
    },
    'game-colormatch': {
      title: 'Color Match', icon: '🎨',
      goal: 'Pick the color that matches the word — not what it reads.',
      controls: ['Click the correct color tile'],
      scoring: 'Correct matches before making a mistake.',
    },
    'game-spellit': {
      title: 'Spell It', icon: '🔤',
      goal: 'Spell the word shown correctly.',
      controls: ['Type the word then <kbd>Enter</kbd>'],
      scoring: 'Correct spellings in a row.',
    },
    'game-rps': {
      title: 'Rock Paper Scissors', icon: '✌️',
      goal: 'Beat the computer 2-out-of-3.',
      controls: ['Click rock, paper or scissors'],
      scoring: 'Wins tracked.',
    },
    'game-trivia': {
      title: 'Trivia', icon: '❓',
      goal: 'Answer general-knowledge questions correctly.',
      controls: ['Click an answer'],
      scoring: 'Correct answers in a row.',
    },
    'game-flagquiz': {
      title: 'Flag Quiz', icon: '🏁',
      goal: 'Identify the country from its flag.',
      controls: ['Click the right answer'],
      scoring: 'Correct answers = points.',
    },
    'game-capitalquiz': {
      title: 'Capital Quiz', icon: '🏛️',
      goal: 'Match each country to its capital city.',
      controls: ['Click the correct capital'],
      scoring: 'Correct answers = points.',
    },
    'game-quiz2': {
      title: 'Quiz', icon: '❔',
      goal: 'Answer as many questions as possible correctly.',
      controls: ['Click an answer'],
      scoring: 'Correct answers = points.',
    },
    'game-musicquiz': {
      title: 'Music Quiz', icon: '🎶',
      goal: 'Guess the song / instrument from the clip.',
      controls: ['Click the right answer'],
      scoring: 'Correct answers in a row.',
    },
    'game-colorblind': {
      title: 'Color Vision', icon: '👁️',
      goal: 'Find the odd-one-out tile.',
      controls: ['Click the tile that\'s a different shade'],
      scoring: 'Rounds passed before a miss.',
    },

    // === IDLE / CLICKER ===
    'game-cookie': {
      title: 'Cookie Clicker', icon: '🍪',
      goal: 'Bake as many cookies as you can — and automate it.',
      controls: ['Click the cookie', 'Buy upgrades to auto-produce'],
      scoring: 'Total cookies baked.',
      tips: ['Reinvest in buildings early for compound growth'],
    },
    'game-mining': {
      title: 'Idle Mining', icon: '⛏️',
      goal: 'Dig, collect ore, upgrade gear, and automate the mine.',
      controls: ['Click to mine', 'Hire workers to mine for you'],
      scoring: 'Ore mined total.',
    },
    'game-fish': {
      title: 'Idle Fishing', icon: '🎣',
      goal: 'Catch fish, upgrade rods, automate fishing.',
      controls: ['Click to cast / reel', 'Buy upgrades for passive catches'],
      scoring: 'Fish caught.',
    },
    'game-pottery': {
      title: 'Idle Pottery', icon: '🏺',
      goal: 'Shape clay, fire it, sell it — grow your studio.',
      controls: ['Click to work', 'Hire artisans to produce automatically'],
      scoring: 'Total earnings.',
    },
    'game-farm': {
      title: 'Idle Farm', icon: '🌾',
      goal: 'Plant, harvest, and expand your farm.',
      controls: ['Click to plant/harvest', 'Hire help to automate'],
      scoring: 'Total crops harvested.',
    },
    'game-garden': {
      title: 'Idle Garden', icon: '🌱',
      goal: 'Grow flowers, attract bees, expand your garden.',
      controls: ['Click plots to plant and water'],
      scoring: 'Flowers grown total.',
    },
    'game-potion': {
      title: 'Potion Shop', icon: '🧪',
      goal: 'Brew potions, sell them, upgrade your lab.',
      controls: ['Click to brew', 'Hire alchemists to automate'],
      scoring: 'Potions brewed.',
    },
    'game-spaceship': {
      title: 'Idle Spaceship', icon: '🛸',
      goal: 'Build a spaceship piece by piece, then explore.',
      controls: ['Click to earn resources', 'Buy parts and upgrades'],
      scoring: 'Ship progress + resources.',
    },
    'game-dragon': {
      title: 'Dragon Hatch', icon: '🐉',
      goal: 'Hatch and grow dragons in your colony.',
      controls: ['Click to feed, buy upgrades'],
      scoring: 'Dragons hatched + resources.',
    },
    'game-robot': {
      title: 'Robot Factory', icon: '🤖',
      goal: 'Assemble robots, automate production.',
      controls: ['Click to build, hire workers'],
      scoring: 'Robots built.',
    },
    'game-aquarium': {
      title: 'Idle Aquarium', icon: '🐠',
      goal: 'Breed fish, expand your aquarium.',
      controls: ['Click to feed', 'Buy new fish and tanks'],
      scoring: 'Total fish value.',
    },
    'game-tamagotchi': {
      title: 'Tamagotchi', icon: '🥚',
      goal: 'Keep your virtual pet happy, fed and healthy.',
      controls: ['Click action buttons to feed, play, clean, heal'],
      scoring: 'Days alive + happiness.',
    },

    // === SIM ===
    'game-train': {
      title: 'Train Tycoon', icon: '🚂',
      goal: 'Manage train routes and deliveries.',
      controls: ['Click stations to build routes'],
      scoring: 'Best run score saved.',
    },
    'game-hospital': {
      title: 'Hospital Sim', icon: '🏥',
      goal: 'Run a hospital — treat patients, build rooms, hire staff.',
      controls: ['Click to build, drag patients'],
      scoring: 'Patients healed + money.',
    },
    'game-restaurant': {
      title: 'Restaurant Sim', icon: '🍽️',
      goal: 'Serve customers, cook dishes, upgrade your restaurant.',
      controls: ['Click to cook and serve'],
      scoring: 'Customers served + revenue.',
    },
    'game-weather': {
      title: 'Weather Forecaster', icon: '⛅',
      goal: 'Predict the next day\'s weather from clues.',
      controls: ['Click your forecast'],
      scoring: 'Correct forecasts in a row.',
    },

    // === RPG / ADVENTURE ===
    'game-dungeon': {
      title: 'Dungeon Crawler', icon: '🗡️',
      goal: 'Clear dungeon rooms, level up, find the exit.',
      controls: ['<kbd>WASD</kbd> move, click to attack'],
      scoring: 'Floors cleared + XP gained.',
    },
    'game-rpg': {
      title: 'Mini RPG', icon: '🧙',
      goal: 'Quest, battle monsters, grow stronger.',
      controls: ['Click to explore, battle menu for fights'],
      scoring: 'Level + gold earned.',
    },
    'game-treasurehunt': {
      title: 'Treasure Hunt', icon: '💰',
      goal: 'Find buried treasure using clues.',
      controls: ['Click tiles to dig'],
      scoring: 'Treasures found in fewest digs.',
    },
    'game-monstertamer': {
      title: 'Monster Tamer', icon: '🐲',
      goal: 'Catch, train and battle monsters.',
      controls: ['Click actions in battle menu'],
      scoring: 'Monsters caught + battles won.',
    },
    'game-vampire': {
      title: 'Vampire Survivor', icon: '🧛',
      goal: 'Survive waves of enemies with auto-attacks.',
      controls: ['<kbd>WASD</kbd> move — attacks are automatic'],
      scoring: 'Time survived + enemies killed.',
    },
    'game-wizard': {
      title: 'Wizard Battle', icon: '🧙‍♂️',
      goal: 'Cast spells to defeat waves of foes.',
      controls: ['Click spells on the HUD, move with <kbd>WASD</kbd>'],
      scoring: 'Enemies defeated + mana earned.',
    },
    'game-shadowcat': {
      title: 'Shadow Cat', icon: '🐈‍⬛',
      goal: 'Sneak through levels avoiding guards.',
      controls: ['<kbd>WASD</kbd> move, stay in shadows'],
      scoring: 'Levels cleared.',
    },

    // === MISC ===
    'game-drawing': {
      title: 'Drawing Pad', icon: '🎨',
      goal: 'A simple drawing canvas — no score, just creativity.',
      controls: ['Click-and-drag to draw', 'Pick colors and brush sizes'],
      scoring: 'No score.',
    },

    // === SLIME ===
    'slime-td': {
      title: 'Slime Tower Defense', icon: '🗼',
      goal: 'Defend your base by placing towers along the path.',
      controls: ['Click to place a tower, upgrade via menu'],
      scoring: 'Waves survived + money saved.',
    },
    'slime-run': {
      title: 'Slime Run', icon: '💚',
      goal: 'Run, jump and dodge to set the best distance.',
      controls: ['<kbd>Space</kbd> or tap to jump (hold for higher jump)'],
      scoring: 'Distance traveled.',
      tips: ['Short tap for small jumps, hold for tall ones', 'Watch for upcoming gaps'],
    },
    'slime-cards': {
      title: 'Slime Cards', icon: '🃏',
      goal: 'Build a deck and beat slime-themed battles.',
      controls: ['Click cards to play them from your hand'],
      scoring: 'Battles won + cards collected.',
    },
    'slime-match': {
      title: 'Slime Match', icon: '💎',
      goal: 'Match 3+ slimes to clear them. Match 4 = line-clear. Match 5+ = color bomb.',
      controls: ['Click/drag adjacent slimes to swap'],
      scoring: 'Points per cleared slime. Cascades multiply.',
    },
    'slime-colony': {
      title: 'Slime Colony', icon: '🏘️',
      goal: 'Grow a slime colony — build, gather, expand.',
      controls: ['Click a building to place it', 'Manage slimes from the menu'],
      scoring: 'Colony size + resources.',
    },
    'slime-arena': {
      title: 'Slime Arena', icon: '⚔️',
      goal: 'Beat waves of enemies on the arena grid.',
      controls: ['Click a slime to select, then click a target'],
      scoring: 'Waves cleared.',
    },
    'slime-idle': {
      title: 'Slime Idle', icon: '🫧',
      goal: 'Grow your slime army — click and automate.',
      controls: ['Click slimes to spawn, buy upgrades'],
      scoring: 'Total slimes ever produced.',
    },
  });
})();
