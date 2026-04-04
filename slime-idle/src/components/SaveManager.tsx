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
];

function exportFullSave(): string {
  doGlobalSave();
  const bundle: Record<string, string | null> = {};
  for (const key of ALL_SAVE_KEYS) {
    bundle[key] = localStorage.getItem(key);
  }
  return btoa(JSON.stringify(bundle));
}

function importFullSave(data: string): boolean {
  try {
    const json = atob(data.trim());
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

export function SaveManager() {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");

  if (!open) {
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
    const data = exportFullSave();
    navigator.clipboard.writeText(data).then(() => {
      setMessage("Copied to clipboard!");
      setTimeout(() => setMessage(""), 2000);
    }).catch(() => {
      setImportText(data);
      setMessage("Copy the text above manually");
      setTimeout(() => setMessage(""), 3000);
    });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full">
        <h2 className="text-steel font-bold mb-3">💾 Save Manager</h2>

        <button
          onClick={handleExport}
          className="w-full mb-3 py-2 bg-steel/20 text-steel rounded-lg text-sm border border-steel/30 hover:bg-steel/30"
        >
          Export Save to Clipboard
        </button>

        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Import Save:</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste save data here..."
            className="w-full h-20 bg-navy-900 border border-navy-700 rounded-lg p-2 text-xs text-white resize-none focus:outline-none focus:border-steel/50"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="mt-1 w-full py-2 bg-accent/20 text-accent rounded-lg text-sm border border-accent/30 hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>

        {message && (
          <div className="text-center text-xs text-yellow-400 mb-2">{message}</div>
        )}

        <button
          onClick={() => { setOpen(false); setImportText(""); setMessage(""); }}
          className="w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
