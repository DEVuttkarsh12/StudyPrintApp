// FILE: src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import Toolbar from "./components/Toolbar";
import TemplateThumb from "./components/TemplateThumb";
import { encodeState, decodeState } from "./Utils/Serializer";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Import your logo (place logo1.png at src/assets/logo1.png)
import logo from "./assets/logo1.png";

/*
  Main App:
  - localStorage auto-save and restore
  - restore from URL hash (share links)
  - encode state to URL hash (share)
  - export PDF of the preview element
*/

const STORAGE_KEY = "study-print:v2";

export default function App() {
  // Multi-sheet and Folder state
  const [folders, setFolders] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.folders || [];
      }
      return [];
    } catch { return []; }
  });

  const [sheets, setSheets] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data.sheets)) return data.sheets;
        // Migration logic...
        if (data.activeSheetId) return sheets;
      }
      return [{
        id: "welcome",
        title: "🚀 Welcome to StudyPrint 3.0",
        content: {
          main: "# Welcome to StudyPrint\n\n## 📁 Folders & Organization\nOrganize your sheets by subject. Create a 'Biology' folder and move your notes there.",
          left: "", right: "", questions: "", answers: "", notes: "", cues: "", summary: ""
        },
        template: "one-column",
        createdAt: new Date().toISOString(),
        folderId: null
      }];
    } catch { return []; }
  });

  const [activeSheetId, setActiveSheetId] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.activeSheetId || (sheets[0]?.id || "welcome");
      }
      return "welcome";
    } catch { return "welcome"; }
  });

  const [focusMode, setFocusMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState(null);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(2);
  const [fontSize, setFontSize] = useState(16);

  const previewRef = useRef(null);

  // Derived
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0] || { content: {}, title: "" };

  const updateActiveSheet = (updates) => {
    setSheets(prev => prev.map(sheet => (sheet.id === activeSheetId ? { ...sheet, ...updates } : sheet)));
  };

  const handleContentChange = (newContent) => updateActiveSheet({ content: newContent });
  const handleTemplateChange = (newTemplate) => updateActiveSheet({ template: newTemplate });
  const handleTitleChange = (newTitle) => updateActiveSheet({ title: newTitle });

  // Folder Actions
  function createFolder() {
    const name = prompt("Folder Name?");
    if (!name) return;
    const newFolder = { id: Date.now().toString(), name };
    setFolders(prev => [...prev, newFolder]);
  }

  function deleteFolder(id) {
    if (!confirm("Delete folder and move its sheets to 'General'?")) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    setSheets(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));
  }

  function moveSheetToFolder(sheetId, folderId) {
    setSheets(prev => prev.map(s => s.id === sheetId ? { ...s, folderId } : s));
  }

  const renameSheet = (id, newTitle) => {
    setSheets(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    setEditingSheetId(null);
  };

  const toggleArchive = (id) => {
    const sheet = sheets.find(s => s.id === id);
    if (!sheet) return;
    const isArchiving = !sheet.archived;
    setSheets(prev => prev.map(s => s.id === id ? { ...s, archived: isArchiving } : s));

    if (isArchiving && activeSheetId === id) {
      const remaining = sheets.filter(s => s.id !== id && !s.archived);
      if (remaining.length > 0) setActiveSheetId(remaining[0].id);
    }
  };

  // Sub-component for individual sheet items
  const SheetItem = ({ s, active }) => (
    <div
      onClick={() => setActiveSheetId(s.id)}
      className={`sheet-item group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-[13px] font-medium border-2 relative transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-gray-50 border-transparent text-gray-600 hover:border-gray-200'}`}
    >
      {editingSheetId === s.id ? (
        <input
          autoFocus
          className="bg-transparent border-b border-white outline-none w-full"
          defaultValue={s.title}
          onBlur={(e) => renameSheet(s.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') renameSheet(s.id, e.target.value);
            if (e.key === 'Escape') setEditingSheetId(null);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="truncate pr-2">{s.title}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <select
              value={s.folderId || ""}
              onChange={(e) => { e.stopPropagation(); moveSheetToFolder(s.id, e.target.value || null); }}
              className={`text-[8px] bg-black/5 border-none rounded p-0.5 outline-none ${active ? 'text-indigo-100' : 'text-gray-400'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">General</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingSheetId(s.id); }}
              className={`p-1 rounded hover:bg-black/10 ${active ? 'text-indigo-200' : 'text-gray-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleArchive(s.id); }}
              className={`p-1 rounded hover:bg-black/10 ${active ? 'text-indigo-200' : 'text-gray-400'}`}
              title={s.archived ? "Restore" : "Archive"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSheet(s.id); }}
              className={`p-1 rounded hover:bg-red-500 hover:text-white transition-all ${active ? 'text-indigo-200' : 'text-gray-400'}`}
              title="Delete Permanently"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

          </div>
        </>
      )}
    </div>
  );

  // Auto-save
  useEffect(() => {
    setSaving(true);
    const payload = { folders, sheets, activeSheetId, updated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const t = setTimeout(() => setSaving(false), 500);
    return () => clearTimeout(t);
  }, [folders, sheets, activeSheetId]);

  // Focus Mode toggle
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("focus-active");
    } else {
      document.body.classList.remove("focus-active");
    }
  }, [focusMode]);

  // Actions
  function createNewSheet() {
    const newSheet = {
      id: Date.now().toString(),
      title: "New Study Sheet",
      content: { main: "", left: "", right: "", questions: "", answers: "", notes: "", cues: "", summary: "" },
      template: "one-column",
      createdAt: new Date().toISOString()
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
  }

  function deleteSheet(id) {
    if (sheets.length === 1) return alert("You need at least one sheet!");
    if (!confirm("Delete this sheet permanently?")) return;

    setSheets(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(filtered[0]?.id || "");
      }
      return filtered;
    });
  }

  function handleShare() {
    const state = { content: activeSheet.content, template: activeSheet.template, title: activeSheet.title };
    const encoded = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard?.writeText(url);
    setShareUrl(url);
    alert("Share link copied to clipboard!");
  }

  async function handleExport() {
    try {
      const previewEl = document.querySelector(".preview.a4");
      const canvas = await html2canvas(previewEl, { scale: scale || 2, useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/png");
      const pageWidth = 210;
      const pxPerMm = canvas.width / pageWidth;
      const imgHeightMm = canvas.height / pxPerMm;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeightMm);
      pdf.save(`${activeSheet.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  }

  const [paperTheme, setPaperTheme] = useState("plain");

  return (
    <div className="max-w-7xl mx-auto p-4 transition-all duration-500">
      <header className="flex items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">StudyPrint <span className="text-gray-400 font-light text-sm ml-1">2.0</span></h1>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">The Productive Student Edition</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${focusMode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {focusMode ? '✨ Exit' : '🧘 Focus'}
          </button>
          <div className="h-8 w-px bg-gray-200" />
          <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all transform hover:scale-105">
            Upgrade
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Multi-sheet Manager */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800">{showArchive ? 'Archive' : 'Spaces'}</h2>
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${showArchive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                >
                  {showArchive ? 'Exit' : 'Trash'}
                </button>
              </div>
              {!showArchive && (
                <div className="flex gap-1">
                  <button onClick={createFolder} className="bg-gray-50 text-gray-400 p-1.5 rounded-lg hover:bg-gray-100" title="New Folder">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </button>
                  <button onClick={createNewSheet} className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100" title="New Sheet">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {/* Folders */}
              {!showArchive && folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">
                    <span>{folder.name}</span>
                    <button onClick={() => deleteFolder(folder.id)} className="hover:text-red-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  {sheets.filter(s => s.folderId === folder.id && !s.archived).map(s => (
                    <SheetItem key={s.id} s={s} active={activeSheetId === s.id} />
                  ))}
                </div>
              ))}

              {/* General/Ungrouped */}
              <div className="space-y-1">
                {!showArchive && <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">General</div>}
                {sheets.filter(s => (showArchive ? !!s.archived : (!s.folderId && !s.archived))).map(s => (
                  <SheetItem key={s.id} s={s} active={activeSheetId === s.id} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <Editor template={activeSheet.template} content={activeSheet.content} onChange={handleContentChange} />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <label className="block font-bold text-gray-800 mb-3">Layout</label>
            <div className="grid grid-cols-2 gap-3">
              <TemplateThumb id="one-column" title="Classic" onClick={handleTemplateChange} selected={activeSheet.template === "one-column"} />
              <TemplateThumb id="two-column" title="Split" onClick={handleTemplateChange} selected={activeSheet.template === "two-column"} />
              <TemplateThumb id="cornell" title="Cornell" onClick={handleTemplateChange} selected={activeSheet.template === "cornell"} />
              <TemplateThumb id="qa" title="Q&A" onClick={handleTemplateChange} selected={activeSheet.template === "qa"} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Text Size</label>
                <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full p-2 bg-gray-50 border-none rounded-lg text-sm font-medium">
                  {[12, 14, 16, 18, 20].map(v => <option key={v} value={v}>{v}px</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Paper Style</label>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setPaperTheme("plain")} title="Plain" className={`h-8 rounded-lg border-2 transition-all ${paperTheme === 'plain' ? 'border-indigo-600 bg-white' : 'border-gray-100 bg-gray-50'}`} />
                  <button onClick={() => setPaperTheme("cream")} title="Cream" className={`h-8 rounded-lg border-2 transition-all ${paperTheme === 'cream' ? 'border-indigo-600 bg-[#fdf6e3]' : 'border-gray-100 bg-[#fdf6e3]/50'}`} />
                  <button onClick={() => setPaperTheme("graph")} title="Graph" className={`h-8 rounded-lg border-2 transition-all ${paperTheme === 'graph' ? 'border-indigo-600 bg-white' : 'border-gray-100 bg-gray-100/20'}`} style={{ backgroundImage: "linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
                  <button onClick={() => setPaperTheme("dot")} title="Dot" className={`h-8 rounded-lg border-2 transition-all ${paperTheme === 'dot' ? 'border-indigo-600 bg-white' : 'border-gray-100 bg-gray-100/20'}`} style={{ backgroundImage: "radial-gradient(#ccc 0.5px, transparent 0.5px)", backgroundSize: "4px 4px" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={handleExport} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-200">
              Export PDF
            </button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={handleShare} className="py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg">Share Link</button>
              <button
                onClick={() => {
                  if (confirm("Reset current sheet?")) {
                    handleContentChange({ main: "", left: "", right: "", questions: "", answers: "", notes: "", cues: "", summary: "" });
                  }
                }}
                className="py-2 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="md:col-span-2 relative">
          <div className="sticky top-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
            <div className="w-full max-w-[210mm] relative">
              {saving && <div className="absolute top-[-10px] right-0 flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase bg-white px-2 py-1 rounded-full shadow-sm z-10 border border-indigo-50 animate-pulse">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Auto-saving
              </div>}
              {focusMode && (
                <button
                  onClick={() => setFocusMode(false)}
                  className="absolute top-2 left-[-60px] p-2 bg-white rounded-full shadow-lg border border-gray-100 text-indigo-600 hover:text-indigo-800 focus:outline-none hidden md:block"
                  title="Exit Focus Mode"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div ref={previewRef} className="preview-scroll-container">
                <Preview
                  content={activeSheet.content}
                  template={activeSheet.template}
                  title={activeSheet.title}
                  onTitleChange={handleTitleChange}
                  fontSize={fontSize}
                  paperTheme={paperTheme}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] space-y-2">
        <p>Made for Productivity — StudyPrint v2.0</p>
        <div className="flex justify-center gap-4 text-[8px] text-gray-300">
          <span>Client-Side Encryption</span>
          <span>•</span>
          <span>A4 Optimized</span>
          <span>•</span>
          <span>KaTeX Powered</span>
        </div>
      </footer>
    </div>
  );
}

