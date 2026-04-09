import { useState, useCallback } from "react";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

interface Card { rank: typeof RANKS[number]; suit: typeof SUITS[number]; hidden: boolean; }

function isRed(suit: string) { return suit === "♥" || suit === "♦"; }

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, hidden: false });
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, hidden: false });
  // shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function handValue(hand: Card[]): number {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.hidden) continue;
    total += cardValue(c);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function getBalance(): number { return Number(localStorage.getItem("blackjack-balance") || "1000"); }
function saveBalance(b: number) { localStorage.setItem("blackjack-balance", String(b)); }

const CHIP_VALUES = [10, 25, 50, 100] as const;

function CardView({ card }: { card: Card }) {
  if (card.hidden) {
    return (
      <div className="w-16 h-24 rounded-lg bg-accent flex items-center justify-center border-2 border-white/20 card-deal">
        <span className="text-2xl">?</span>
      </div>
    );
  }
  return (
    <div className={`w-16 h-24 rounded-lg bg-white flex flex-col items-center justify-center border-2 border-white/20 card-deal
      ${isRed(card.suit) ? "text-red-500" : "text-gray-900"}`}>
      <span className="text-sm font-bold leading-none">{card.rank}</span>
      <span className="text-xl leading-none">{card.suit}</span>
    </div>
  );
}

export default function App() {
  const [balance, setBalance] = useState(getBalance());
  const [bet, setBet] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<"bet" | "play" | "dealer" | "result">("bet");
  const [message, setMessage] = useState("");
  const [doubled, setDoubled] = useState(false);

  const dealCards = useCallback(() => {
    if (bet <= 0 || bet > balance) return;
    const d = makeDeck();
    const pHand = [d.pop()!, d.pop()!];
    const dHand = [d.pop()!, { ...d.pop()!, hidden: true }];
    setDeck(d);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDoubled(false);
    setPhase("play");
    setMessage("");

    // check natural blackjack
    if (handValue(pHand) === 21) {
      // reveal dealer
      dHand[1].hidden = false;
      setDealerHand([...dHand]);
      if (handValue(dHand) === 21) {
        setMessage("Push! Both Blackjack");
        setPhase("result");
      } else {
        const winnings = Math.floor(bet * 1.5);
        const newBal = balance + winnings;
        setBalance(newBal); saveBalance(newBal);
        setMessage(`Blackjack! +${winnings}`);
        setPhase("result");
      }
    }
  }, [bet, balance]);

  const hit = useCallback(() => {
    if (phase !== "play") return;
    const d = [...deck];
    const newCard = d.pop()!;
    const newHand = [...playerHand, newCard];
    setDeck(d);
    setPlayerHand(newHand);
    if (handValue(newHand) > 21) {
      // bust - reveal dealer
      const dh = dealerHand.map(c => ({ ...c, hidden: false }));
      setDealerHand(dh);
      const newBal = balance - (doubled ? bet * 2 : bet);
      setBalance(Math.max(0, newBal)); saveBalance(Math.max(0, newBal));
      setMessage(`Bust! -${doubled ? bet * 2 : bet}`);
      setPhase("result");
    }
  }, [phase, deck, playerHand, dealerHand, balance, bet, doubled]);

  const stand = useCallback(() => {
    if (phase !== "play") return;
    // reveal dealer's hidden card
    const dh = dealerHand.map(c => ({ ...c, hidden: false }));
    const d = [...deck];

    // dealer draws to 17
    while (handValue(dh) < 17) {
      dh.push(d.pop()!);
    }
    setDeck(d);
    setDealerHand([...dh]);

    const pVal = handValue(playerHand);
    const dVal = handValue(dh);
    const actualBet = doubled ? bet * 2 : bet;

    if (dVal > 21) {
      const newBal = balance + actualBet;
      setBalance(newBal); saveBalance(newBal);
      setMessage(`Dealer busts! +${actualBet}`);
    } else if (pVal > dVal) {
      const newBal = balance + actualBet;
      setBalance(newBal); saveBalance(newBal);
      setMessage(`You win! +${actualBet}`);
    } else if (pVal < dVal) {
      const newBal = balance - actualBet;
      setBalance(Math.max(0, newBal)); saveBalance(Math.max(0, newBal));
      setMessage(`Dealer wins. -${actualBet}`);
    } else {
      setMessage("Push!");
    }
    setPhase("result");
  }, [phase, dealerHand, deck, playerHand, balance, bet, doubled]);

  const doubleBet = useCallback(() => {
    if (phase !== "play" || playerHand.length !== 2 || balance < bet * 2) return;
    setDoubled(true);
    // draw one card then stand
    const d = [...deck];
    const newCard = d.pop()!;
    const newHand = [...playerHand, newCard];
    setDeck(d);
    setPlayerHand(newHand);

    if (handValue(newHand) > 21) {
      const dh = dealerHand.map(c => ({ ...c, hidden: false }));
      setDealerHand(dh);
      const newBal = balance - bet * 2;
      setBalance(Math.max(0, newBal)); saveBalance(Math.max(0, newBal));
      setMessage(`Bust! -${bet * 2}`);
      setPhase("result");
    } else {
      // auto stand after double
      setTimeout(() => {
        // We need to trigger stand logic manually here
        const dh = dealerHand.map(c => ({ ...c, hidden: false }));
        const dk = [...d];
        while (handValue(dh) < 17) dh.push(dk.pop()!);
        setDeck(dk);
        setDealerHand([...dh]);

        const pVal = handValue(newHand);
        const dVal = handValue(dh);
        const actualBet = bet * 2;
        if (dVal > 21) {
          const nb = balance + actualBet; setBalance(nb); saveBalance(nb);
          setMessage(`Dealer busts! +${actualBet}`);
        } else if (pVal > dVal) {
          const nb = balance + actualBet; setBalance(nb); saveBalance(nb);
          setMessage(`You win! +${actualBet}`);
        } else if (pVal < dVal) {
          const nb = balance - actualBet; setBalance(Math.max(0, nb)); saveBalance(Math.max(0, nb));
          setMessage(`Dealer wins. -${actualBet}`);
        } else {
          setMessage("Push!");
        }
        setPhase("result");
      }, 400);
    }
  }, [phase, playerHand, deck, dealerHand, balance, bet]);

  const newRound = useCallback(() => {
    if (balance <= 0) {
      setBalance(1000); saveBalance(1000);
    }
    setBet(0);
    setPhase("bet");
    setPlayerHand([]);
    setDealerHand([]);
    setMessage("");
  }, [balance]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start">&larr; Hub</a>
      <h1 className="text-3xl font-black text-steel">BLACKJACK</h1>

      {/* Balance */}
      <div className="text-lg">
        Balance: <span className="text-accent font-bold">${balance}</span>
        {bet > 0 && <span className="ml-4 text-steel">Bet: ${doubled ? bet * 2 : bet}</span>}
      </div>

      {/* Betting phase */}
      {phase === "bet" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-slate-400">Place your bet</p>
          <div className="flex gap-2">
            {CHIP_VALUES.map(v => (
              <button key={v} onClick={() => setBet(b => Math.min(b + v, balance))}
                className="w-14 h-14 rounded-full bg-navy-700 border-2 border-accent text-accent font-bold hover:bg-navy-800 transition">
                ${v}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-xl font-bold text-accent">${bet}</span>
            <button onClick={() => setBet(0)} className="text-sm text-slate-400 hover:text-white">Clear</button>
          </div>
          <button onClick={dealCards} disabled={bet <= 0}
            className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-40">
            Deal
          </button>
        </div>
      )}

      {/* Cards */}
      {(phase === "play" || phase === "result") && (
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Dealer */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">Dealer ({phase === "result" ? handValue(dealerHand) : "?"})</p>
            <div className="flex gap-2 justify-center flex-wrap">{dealerHand.map((c, i) => <CardView key={i} card={c} />)}</div>
          </div>

          {/* Player */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">You ({handValue(playerHand)})</p>
            <div className="flex gap-2 justify-center flex-wrap">{playerHand.map((c, i) => <CardView key={i} card={c} />)}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {phase === "play" && (
        <div className="flex gap-3">
          <button onClick={hit}
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:opacity-90 transition">Hit</button>
          <button onClick={stand}
            className="px-6 py-2 rounded-lg bg-red-500 text-white font-bold hover:opacity-90 transition">Stand</button>
          {playerHand.length === 2 && balance >= bet * 2 && (
            <button onClick={doubleBet}
              className="px-6 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:opacity-90 transition">Double</button>
          )}
        </div>
      )}

      {/* Result */}
      {phase === "result" && (
        <div className="flex flex-col items-center gap-3">
          <p className={`text-xl font-bold ${message.includes("+") ? "text-green-400" : message.includes("-") ? "text-red-400" : "text-slate-300"}`}>
            {message}
          </p>
          <button onClick={newRound}
            className="px-8 py-3 rounded-xl bg-accent text-white font-bold hover:opacity-90 transition">
            {balance <= 0 ? "Reset Balance ($1000)" : "Next Hand"}
          </button>
        </div>
      )}
    </div>
  );
}
