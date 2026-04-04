import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { doGlobalSave } from "../hooks/useSaveLoad";

const ALL_SAVE_KEYS = [
  "slime-idle-save",
  "slime-idle-extra",
  "slime-idle-skilltree",
  "slime-idle-worldmap",
  "slime-idle-equipment",
  "slime-idle-army",
  "slime-idle-research",
  "slime-idle-bossrush",
  "slime-idle-leaderboard",
];

// Unicode-safe base64 encode/decode
function toBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
}

function fromBase64(b64: string): string {
  return decodeURIComponent(
    Array.from(atob(b64), (c) =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
    ).join("")
  );
}

function exportFullSave(): string {
  doGlobalSave();
  const bundle: Record<string, string | null> = {};
  for (const key of ALL_SAVE_KEYS) {
    bundle[key] = localStorage.getItem(key);
  }
  return toBase64(JSON.stringify(bundle));
}

function importFullSave(data: string): boolean {
  try {
    const json = fromBase64(data.trim());
    const bundle = JSON.parse(json);

    // Support old single-key format (just gameStore data)
    if (typeof bundle === "object" && !bundle["slime-idle-save"] && bundle.magicules !== undefined) {
      localStorage.setItem("slime-idle-save", json);
      useGameStore.getState().load();
      return true;
    }

    // New full bundle format
    for (const key of ALL_SAVE_KEYS) {
      if (bundle[key] != null) {
        localStorage.setItem(key, bundle[key]);
      }
    }
    useGameStore.getState().load();
    useExtraStore.getState().loadExtra();
    return true;
  } catch {
    return false;
  }
}

export function SaveManager({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"menu" | "export" | "import">("menu");

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        💾 Save
      </button>
    );
  }

  const handleExport = () => {
    try {
      const data = exportFullSave();
      setExportText(data);
      setMode("export");
      // Try clipboard but don't rely on it
      try {
        navigator.clipboard.writeText(data).then(() => {
          setMessage("Copied to clipboard! You can also copy from the box below.");
          setTimeout(() => setMessage(""), 3000);
        }).catch(() => {});
      } catch {}
    } catch (err) {
      setMessage("Export failed: " + (err instanceof Error ? err.message : "unknown error"));
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleSelectAll = () => {
    const el = document.getElementById("export-textarea") as HTMLTextAreaElement | null;
    if (el) {
      el.select();
      el.setSelectionRange(0, el.value.length);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importFullSave(importText);
    if (success) {
      setMessage("Imported! Reloading...");
      setImportText("");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMessage("Invalid save data");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setOpen(false);
    }
    setExportText("");
    setImportText("");
    setMessage("");
    setMode("menu");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full">
        <h2 className="text-steel font-bold mb-3">💾 Save Manager</h2>

        {mode === "menu" && (
          <>
            <button
              onClick={handleExport}
              className="w-full mb-2 py-2 bg-steel/20 text-steel rounded-lg text-sm border border-steel/30 hover:bg-steel/30"
            >
              Export Save (Phone → PC)
            </button>
            <button
              onClick={() => setMode("import")}
              className="w-full mb-3 py-2 bg-accent/20 text-accent rounded-lg text-sm border border-accent/30 hover:bg-accent/30"
            >
              Import Save (Paste data)
            </button>
          </>
        )}

        {mode === "export" && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">
              Copy this text and paste it on your other device:
            </p>
            <textarea
              id="export-textarea"
              value={exportText}
              readOnly
              onFocus={handleSelectAll}
              className="w-full h-28 bg-navy-900 border border-steel/40 rounded-lg p-2 text-xs text-cyan-300 resize-none focus:outline-none focus:border-steel/60 font-mono break-all"
            />
            <button
              onClick={handleSelectAll}
              className="mt-1 w-full py-2 bg-steel/20 text-steel rounded-lg text-sm border border-steel/30 hover:bg-steel/30"
            >
              Select All Text
            </button>
          </div>
        )}

        {mode === "import" && (
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Paste save data:</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste save data here..."
              className="w-full h-28 bg-navy-900 border border-navy-700 rounded-lg p-2 text-xs text-white resize-none focus:outline-none focus:border-steel/50"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="mt-1 w-full py-2 bg-accent/20 text-accent rounded-lg text-sm border border-accent/30 hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        )}

        {message && (
          <div className="text-center text-xs text-yellow-400 mb-2">{message}</div>
        )}

        <button
          onClick={handleClose}
          className="w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          {mode === "menu" ? "Close" : "Back"}
        </button>
      </div>
    </div>
  );
}
