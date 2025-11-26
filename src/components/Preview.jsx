import React, { useMemo } from "react";

/*
  Preview component:
  - Receives content object and template type
  - Renders different layouts based on template
  - This is the element we capture with html2canvas for PDF export
*/

function tinyParse(text) {
  // Split into paragraphs; detect lists
  const lines = String(text || "").split("\n");
  const blocks = [];
  let currentList = null;

  lines.forEach((ln) => {
    const t = ln.trim();
    if (t === "") {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      // paragraph break
      blocks.push({ type: "para", text: "" });
      return;
    }

    // list item
    if (/^[-*]\s+/.test(t)) {
      const item = t.replace(/^[-*]\s+/, "");
      if (!currentList) currentList = { type: "list", items: [] };
      currentList.items.push(item);
      return;
    }

    // normal paragraph
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
    blocks.push({ type: "para", text: t });
  });

  if (currentList) blocks.push(currentList);
  return blocks;
}

function inlineFormat(s) {
  // Very small formatter: **bold**, *italic*
  return s
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

function renderContent(text) {
  const blocks = tinyParse(text);
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "para") {
          if (b.text === "") return <div key={i} style={{ height: "8px" }} />;
          return (
            <p
              key={i}
              className="leading-6"
              dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }}
            />
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="list-disc ml-5">
              {b.items.map((it, j) => (
                <li
                  key={j}
                  dangerouslySetInnerHTML={{ __html: inlineFormat(it) }}
                />
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function Preview({ content, template, title = "Study Sheet", onTitleChange, fontSize = 16 }) {
  const handleTitleChange = (e) => {
    const newTitle = e.target.textContent;
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent new lines in title
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  };

  return (
    <div className={`preview a4 bg-white`} style={{ fontSize: `${fontSize}px` }}>
      <div style={{ fontFamily: "var(--heading-font)" }}>
        <h1
          className="text-2xl font-semibold mb-2 outline-none hover:bg-gray-50 px-2 py-1 -mx-2 -my-1 rounded transition-colors cursor-text"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleChange}
          onKeyDown={handleKeyDown}
          title="Click to edit title"
        >
          {title}
        </h1>
      </div>

      {/* One Column Layout */}
      {template === "one-column" && (
        <div>{renderContent(content.main)}</div>
      )}

      {/* Two Column Layout */}
      {template === "two-column" && (
        <div className="two-column">
          <div>{renderContent(content.left)}</div>
          <div>{renderContent(content.right)}</div>
        </div>
      )}

      {/* Cornell Notes Layout */}
      {template === "cornell" && (
        <div className="cornell-layout">
          <div className="cornell-main">
            <div className="cornell-cues">
              <div className="text-xs font-semibold text-gray-600 mb-1">CUES</div>
              {renderContent(content.cues)}
            </div>
            <div className="cornell-notes">
              <div className="text-xs font-semibold text-gray-600 mb-1">NOTES</div>
              {renderContent(content.notes)}
            </div>
          </div>
          <div className="cornell-summary">
            <div className="text-xs font-semibold text-gray-600 mb-1">SUMMARY</div>
            {renderContent(content.summary)}
          </div>
        </div>
      )}

      {/* Q&A / Flashcards Layout */}
      {template === "qa" && (
        <div className="qa-layout">
          <div className="qa-questions">
            <div className="text-sm font-semibold text-gray-700 mb-2">Questions</div>
            {renderContent(content.questions)}
          </div>
          <div className="qa-answers">
            <div className="text-sm font-semibold text-gray-700 mb-2">Answers</div>
            {renderContent(content.answers)}
          </div>
        </div>
      )}

      <footer className="mt-6 text-xs text-gray-500">
        Generated with Study Sheet Generator — print-ready A4.
      </footer>
    </div>
  );
}
