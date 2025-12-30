import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/*
  Preview component:
  - Receives content object and template type
  - Renders different layouts based on template
  - Supports Markdown and LaTeX math via KaTeX
*/

function tinyParse(text) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let currentList = null;

  lines.forEach((ln) => {
    const t = ln.trim();

    if (t === "---") {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: "hr" });
      return;
    }

    if (t === "") {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: "para", text: "" });
      return;
    }

    const h1Match = t.match(/^# (.*)/);
    if (h1Match) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: "h1", text: h1Match[1] });
      return;
    }

    const h2Match = t.match(/^## (.*)/);
    if (h2Match) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: "h2", text: h2Match[1] });
      return;
    }

    const quoteMatch = t.match(/^> (.*)/);
    if (quoteMatch) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: "quote", text: quoteMatch[1] });
      return;
    }

    const checkMatch = t.match(/^\[( |x)\] (.*)/);
    const listMatch = t.match(/^[-*]\s+(.*)/);

    if (checkMatch || listMatch) {
      if (!currentList) currentList = { type: "list", items: [] };
      if (checkMatch) {
        currentList.items.push({ text: checkMatch[2], checked: checkMatch[1] === "x" });
      } else {
        currentList.items.push({ text: listMatch[1], checked: null });
      }
      return;
    }

    if (currentList) { blocks.push(currentList); currentList = null; }
    blocks.push({ type: "para", text: t });
  });

  if (currentList) blocks.push(currentList);
  return blocks;
}

function inlineFormat(s) {
  let formatted = s.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
    try { return `<div class="katex-block">${katex.renderToString(formula, { displayMode: true })}</div>`; } catch { return match; }
  });

  formatted = formatted.replace(/\$(.*?)\$/g, (match, formula) => {
    try { return katex.renderToString(formula, { displayMode: false }); } catch { return match; }
  });

  return formatted
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

function renderContent(text) {
  const blocks = tinyParse(text);
  return (
    <div className="rendered-content">
      {blocks.map((b, i) => {
        if (b.type === "para") {
          if (b.text === "") return <div key={i} style={{ height: "12px" }} />;
          return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />;
        }
        if (b.type === "h1") return <h3 key={i} className="text-xl font-bold mt-4 mb-2 text-indigo-700 uppercase tracking-wide border-b border-indigo-100" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />;
        if (b.type === "h2") return <h4 key={i} className="text-lg font-bold mt-3 mb-1 text-gray-800" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />;
        if (b.type === "quote") return <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 bg-indigo-50/50 italic text-gray-700" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />;
        if (b.type === "hr") return <hr key={i} className="my-6 border-t border-gray-200" />;
        if (b.type === "list") {
          return (
            <ul key={i} className="list-none ml-2 mb-3">
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2 mb-1">
                  {it.checked !== null ? (
                    <span className={`inline-flex items-center justify-center w-4 h-4 mt-1 border rounded text-[10px] ${it.checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                      {it.checked ? '✓' : ''}
                    </span>
                  ) : (
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(it.text) }} />
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function Preview({ content, template, title = "Study Sheet", onTitleChange, fontSize = 16, paperTheme = "plain" }) {
  const paperStyles = {
    plain: {},
    cream: { backgroundColor: "#fdf6e3" },
    graph: {
      backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    },
    dot: {
      backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    }
  };

  const handleTitleChange = (e) => {
    if (onTitleChange) onTitleChange(e.target.textContent);
  };

  return (
    <div
      className={`preview a4 transition-all duration-300 ${paperTheme !== 'plain' ? 'paper-' + paperTheme : 'bg-white'}`}
      style={{ fontSize: `${fontSize}px`, ...paperStyles[paperTheme] }}
    >
      <div className="preview-header mb-6 pb-2 border-b-2 border-gray-100">
        <h1
          className="text-3xl font-bold outline-none hover:bg-gray-50 px-2 py-1 -mx-2 rounded transition-colors cursor-text text-gray-900"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleChange}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
        >
          {title}
        </h1>
        <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">
          StudyPrint Edition 2.0 • {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="preview-body">
        {template === "one-column" && <div className="space-y-4">{renderContent(content.main)}</div>}

        {template === "two-column" && (
          <div className="grid grid-cols-2 gap-8 min-h-[500px]">
            <div className="border-r border-gray-100 pr-8">{renderContent(content.left)}</div>
            <div>{renderContent(content.right)}</div>
          </div>
        )}

        {template === "cornell" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 border-b border-gray-100 min-h-[600px]">
              <div className="w-1/3 border-r border-gray-200 pr-4">
                <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-tighter">Cues & Questions</div>
                {renderContent(content.cues)}
              </div>
              <div className="w-2/3 pl-4">
                <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-tighter">Lecture Notes</div>
                {renderContent(content.notes)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-tighter">Summary</div>
              {renderContent(content.summary)}
            </div>
          </div>
        )}

        {template === "qa" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase">Questions</div>
              {renderContent(content.questions)}
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/30 border-2 border-indigo-100">
              <div className="text-xs font-bold text-indigo-300 mb-4 uppercase">Answers</div>
              {renderContent(content.answers)}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 pt-4 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
        <span>Generated with StudyPrint 2.0</span>
        <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </footer>
    </div>
  );
}

