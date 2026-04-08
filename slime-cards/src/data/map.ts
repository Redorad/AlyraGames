import type { MapNode, NodeType } from "../types";

let nodeId = 0;

/** Generate a map for one act (7 rows of nodes) */
export function generateMap(act: number): MapNode[][] {
  nodeId = 0;
  const rows: MapNode[][] = [];
  const ROWS = 7;
  const COLS_RANGE = { min: 2, max: 4 };

  for (let r = 0; r < ROWS; r++) {
    const numCols = COLS_RANGE.min + Math.floor(Math.random() * (COLS_RANGE.max - COLS_RANGE.min + 1));
    const row: MapNode[] = [];

    for (let c = 0; c < numCols; c++) {
      const type = getNodeType(r, ROWS, act);
      row.push({
        id: nodeId++,
        row: r,
        col: c,
        type,
        connections: [],
        cleared: false,
      });
    }
    rows.push(row);
  }

  // Create connections between rows
  for (let r = 0; r < ROWS - 1; r++) {
    const current = rows[r];
    const next = rows[r + 1];

    // Ensure every node has at least one connection
    for (const node of current) {
      // Connect to a random node in next row
      const targetIdx = Math.floor(Math.random() * next.length);
      if (!node.connections.includes(next[targetIdx].id)) {
        node.connections.push(next[targetIdx].id);
      }
      // Chance of second connection
      if (Math.random() < 0.4 && next.length > 1) {
        const other = (targetIdx + 1) % next.length;
        if (!node.connections.includes(next[other].id)) {
          node.connections.push(next[other].id);
        }
      }
    }

    // Ensure every next-row node is reachable
    for (const nextNode of next) {
      const hasIncoming = current.some((n) => n.connections.includes(nextNode.id));
      if (!hasIncoming) {
        const randomParent = current[Math.floor(Math.random() * current.length)];
        randomParent.connections.push(nextNode.id);
      }
    }
  }

  return rows;
}

function getNodeType(row: number, totalRows: number, _act: number): NodeType {
  // Last row is always boss
  if (row === totalRows - 1) return "boss";
  // First row is always combat
  if (row === 0) return "combat";

  const r = Math.random();
  if (row === totalRows - 2) {
    // Row before boss: rest or shop
    return r < 0.5 ? "rest" : "shop";
  }

  // Middle rows
  if (r < 0.45) return "combat";
  if (r < 0.6) return "event";
  if (r < 0.72) return "elite";
  if (r < 0.82) return "rest";
  if (r < 0.92) return "shop";
  return "combat";
}

export const NODE_EMOJI: Record<NodeType, string> = {
  combat: "\u{2694}\u{FE0F}",
  elite: "\u{1F480}",
  boss: "\u{1F451}",
  event: "?",
  rest: "\u{1F525}",
  shop: "\u{1F6D2}",
};

export const NODE_COLORS: Record<NodeType, string> = {
  combat: "#ef4444",
  elite: "#f59e0b",
  boss: "#dc2626",
  event: "#8b5cf6",
  rest: "#22c55e",
  shop: "#3b82f6",
};
