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

const STORAGE_KEY = "study-sheet:v1";

export default function App() {
  // App state - content object supports all template types
  const [content, setContent] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Migrate old single text field to new content structure
        if (data.content) {
          return data.content;
        } else if (data.text) {
          // Backward compatibility: migrate old text to main
          return {
            main: data.text,
            left: "",
            right: "",
            questions: "",
            answers: "",
            notes: "",
            cues: "",
            summary: ""
          };
        }
      }
      return {
        main: "",
        left: "",
        right: "",
        questions: "",
        answers: "",
        notes: "",
        cues: "",
        summary: ""
      };
    } catch {
      return {
        main: "",
        left: "",
        right: "",
        questions: "",
        answers: "",
        notes: "",
        cues: "",
        summary: ""
      };
    }
  });
  const [template, setTemplate] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
        ? JSON.parse(localStorage.getItem(STORAGE_KEY)).template
        : "one-column";
    } catch {
      return "one-column";
    }
  });
  const [title, setTitle] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
        ? JSON.parse(localStorage.getItem(STORAGE_KEY)).title || "Study Sheet"
        : "Study Sheet";
    } catch {
      return "Study Sheet";
    }
  });

  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [scale, setScale] = useState(2);
  const [fontSize, setFontSize] = useState(16);

  const previewRef = useRef(null);

  // On mount: check URL hash first, then localStorage fallback
  useEffect(() => {
    const stateFromHash = decodeState(window.location.hash);
    if (stateFromHash) {
      if (stateFromHash.content) {
        setContent(stateFromHash.content);
      } else if (stateFromHash.text) {
        // Backward compatibility for old share links
        setContent(prev => ({ ...prev, main: stateFromHash.text }));
      }
      if (stateFromHash.template) setTemplate(stateFromHash.template);
      if (stateFromHash.title) setTitle(stateFromHash.title);
      // Do not overwrite localStorage here (user intentionally opened a share)
      return;
    }
    // else already initialised from localStorage via lazy initializer
  }, []);

  // Auto-save to localStorage when content/template changes
  useEffect(() => {
    setSaving(true);
    const payload = { content, template, title, updated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // small delay to give UX that saving occurs
    const t = setTimeout(() => setSaving(false), 350);
    return () => clearTimeout(t);
  }, [content, template, title]);

  // Create share link (encode state)
  function handleShare() {
    const state = { content, template, title };
    const encoded = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    // update browser hash without reloading
    try {
      window.history.replaceState(null, "", `#${encoded}`);
    } catch (e) {
      // ignore
    }
    setShareUrl(url);
    // copy to clipboard (best-effort)
    navigator.clipboard?.writeText(url).catch(() => { });
    alert(
      "Share link created and copied to clipboard (if allowed). You can paste it to share.",
    );
  }

  // Clear editor
  function handleClear() {
    if (!confirm("Clear notes? This will remove the current content locally."))
      return;
    setContent({
      main: "",
      left: "",
      right: "",
      questions: "",
      answers: "",
      notes: "",
      cues: "",
      summary: ""
    });
    setTemplate("one-column");
    setTitle("Study Sheet");
    // clear url hash
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch { }
    localStorage.removeItem(STORAGE_KEY);
    setShareUrl("");
  }

  // Export preview to A4 PDF
  async function handleExport() {
    try {
      const previewEl = document.querySelector(".preview.a4");
      if (!previewEl) {
        alert("Preview not available");
        return;
      }

      // Use html2canvas with scale for crisp text
      const scaleVal = scale || 2;
      const origWidth = previewEl.offsetWidth;
      const origHeight = previewEl.offsetHeight;

      const canvas = await html2canvas(previewEl, {
        scale: scaleVal,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });

      // A4 size in points for jsPDF (mm to pt conversion: 1 mm = 2.83464567 px at 96dpi?)
      // Use jsPDF with mm units:
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL("image/png");

      // Calculate dimensions to fit A4 while preserving DPI
      const imgProps = { width: canvas.width, height: canvas.height };
      const pageWidth = 210; // mm
      const pageHeight = 297; // mm

      // Determine image physical dimensions by mapping px->mm using ratio
      // Use canvas.width / pageWidth to compute px per mm
      const pxPerMm = canvas.width / pageWidth;
      const imgHeightMm = canvas.height / pxPerMm;

      // If content longer than page, we will slice vertically (simple approach: draw as single page scaling)
      // For most study sheets fits in single A4. Scale to fit width.
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeightMm);

      // Use blob method for better browser compatibility
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'study-sheet.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting PDF: " + error.message);
    }
  }

  // Restore from hash whenever it changes (optional)
  useEffect(() => {
    function onHashChange() {
      const s = decodeState(window.location.hash);
      if (s) {
        if (s.content) {
          setContent(s.content);
        } else if (s.text !== undefined) {
          // Backward compatibility
          setContent(prev => ({ ...prev, main: s.text }));
        }
        if (s.template) setTemplate(s.template);
        if (s.title) setTitle(s.title);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header with logo on the left of the name */}
      <header className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Logo image */}
          <img
            src={logo}
            alt="StudyPrint logo"
            className="brand-logo object-contain"
            width={40}
            height={40}
          />

          {/* App name */}
          <div className="leading-tight">
            <h1 className="text-xl font-bold text-gray-800">StudyPrint</h1>
            <div className="text-sm text-gray-500 hidden sm:block">
              Create printable study sheets instantly — client-only
            </div>
          </div>
        </div>

        {/* Tagline for small screens - appears under the logo when narrow */}
        <div className="text-sm text-gray-500 block sm:hidden">
          Create printable study sheets instantly — client-only
        </div>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-md text-sm font-semibold transition"
          disabled
        >
          Premium Coming Soon
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: editor & templates */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <Editor template={template} content={content} onChange={setContent} />
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <label className="block font-medium mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              <TemplateThumb
                id="one-column"
                title="One Column"
                onClick={(id) => setTemplate(id)}
                selected={template === "one-column"}
              />
              <TemplateThumb
                id="two-column"
                title="Two Column"
                onClick={(id) => setTemplate(id)}
                selected={template === "two-column"}
              />
              <TemplateThumb
                id="cornell"
                title="Cornell Notes"
                onClick={(id) => setTemplate(id)}
                selected={template === "cornell"}
              />
              <TemplateThumb
                id="qa"
                title="Q&A"
                onClick={(id) => setTemplate(id)}
                selected={template === "qa"}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <label className="block font-medium mb-2">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value={12}>Small (12px)</option>
              <option value={14}>Normal (14px)</option>
              <option value={16}>Medium (16px)</option>
              <option value={18}>Large (18px)</option>
              <option value={20}>Extra Large (20px)</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <Toolbar
              onExport={handleExport}
              onShare={handleShare}
              onClear={handleClear}
              shareUrl={shareUrl}
              saving={saving}
              setScale={setScale}
            />
          </div>
          <div className="bg-white p-4 rounded shadow-sm text-sm text-gray-600">
            <strong>Accessibility</strong>
            <ul className="list-disc ml-6 mt-2">
              <li>Form labels, keyboard-focusable controls</li>
              <li>aria-live for save status</li>
              <li>High contrast and readable fonts</li>
            </ul>
          </div>
        </div>

        {/* Right column: preview */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Preview (A4)</h2>
            <div ref={previewRef} className="overflow-auto">
              {/* The preview element has class preview a4; this is used for html2canvas capture */}
              <Preview content={content} template={template} title={title} onTitleChange={setTitle} fontSize={fontSize} />
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-6 text-sm text-gray-500">
        <div>
          Made with ❤️ — No backend.
        </div>
      </footer>
    </div>
  );
}
