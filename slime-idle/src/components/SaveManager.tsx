import { useState } from "react";
import { useGameStore } from "../store/gameStore";

export function SaveManager() {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);

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
    const data = exportSave();
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
    const success = importSave(importText);
    if (success) {
      setMessage("Imported!");
      setImportText("");
      setTimeout(() => { setMessage(""); setOpen(false); }, 1500);
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
