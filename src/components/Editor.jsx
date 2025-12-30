import React from "react";

/*
  Editor: Dynamic component that renders different layouts based on template type
  - One Column: Single textarea for general notes
  - Two Column: Separate left and right textareas
  - Cornell Notes: Cues, Notes, and Summary sections
  - Q&A: Questions and Answers side by side
*/

export default function Editor({ template, content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };


  // One Column Layout
  if (template === "one-column") {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor="notes-main" className="font-medium">
          Notes (plain text)
        </label>
        <textarea
          id="notes-main"
          name="notes-main"
          aria-label="Notes editor"
          value={content.main}
          onChange={(e) => handleChange("main", e.target.value)}
          placeholder="# Project Title&#10;## Sub-section&#10;- Normal list item&#10;[ ] Checkbox item&#10;> Blockquote for key facts&#10;--- (Divider)&#10;$E=mc^2$ (Inline Math)&#10;$$ \text{Math Block} $$"
          className="w-full h-96 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm leading-relaxed"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono"># H1</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">## H2</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">[ ] Todo</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">$ Math $</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">** Bold **</span>
        </div>


        <div className="text-xs text-gray-500 mt-4">
          Auto-saves to browser storage. No server involved.
        </div>
      </div>
    );
  }

  // Two Column Layout
  if (template === "two-column") {
    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium">Two Column Notes</div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes-left" className="text-sm font-medium text-gray-700">
            Left Column
          </label>
          <textarea
            id="notes-left"
            name="notes-left"
            aria-label="Left column notes"
            value={content.left}
            onChange={(e) => handleChange("left", e.target.value)}
            placeholder="Left side notes... Use # for headers"
            className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes-right" className="text-sm font-medium text-gray-700">
            Right Column
          </label>
          <textarea
            id="notes-right"
            name="notes-right"
            aria-label="Right column notes"
            value={content.right}
            onChange={(e) => handleChange("right", e.target.value)}
            placeholder="Right side notes... $x + y = z$"
            className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
          />
        </div>


        <div className="text-xs text-gray-500 mt-4">
          Perfect for comparisons, translations, or parallel notes.
        </div>
      </div>
    );
  }

  // Cornell Notes Layout
  if (template === "cornell") {
    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium">Cornell Notes</div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="notes-cues" className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
              Cues & Questions
            </label>
            <textarea
              id="notes-cues"
              name="notes-cues"
              aria-label="Cornell cues"
              value={content.cues}
              onChange={(e) => handleChange("cues", e.target.value)}
              placeholder="Questions to ask yourself..."
              className="w-full h-24 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="notes-notes" className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
              Lecture Notes
            </label>
            <textarea
              id="notes-notes"
              name="notes-notes"
              aria-label="Cornell notes"
              value={content.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Main notes... Use **bold** and # headers"
              className="w-full h-48 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="notes-summary" className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
              Final Summary
            </label>
            <textarea
              id="notes-summary"
              name="notes-summary"
              aria-label="Cornell summary"
              value={content.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Wait till the end of class..."
              className="w-full h-24 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>
        </div>


        <div className="text-xs text-gray-500 mt-4">
          Classic Cornell method: Cues, Notes, Summary.
        </div>
      </div>
    );
  }

  // Q&A / Flashcards Layout
  if (template === "qa") {
    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium">Q&A / Flashcards</div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes-questions" className="text-sm font-medium text-gray-700">
            Questions
          </label>
          <textarea
            id="notes-questions"
            name="notes-questions"
            aria-label="Questions"
            value={content.questions}
            onChange={(e) => handleChange("questions", e.target.value)}
            placeholder="One question per line..."
            className="w-full h-40 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes-answers" className="text-sm font-medium text-gray-700">
            Answers
          </label>
          <textarea
            id="notes-answers"
            name="notes-answers"
            aria-label="Answers"
            value={content.answers}
            onChange={(e) => handleChange("answers", e.target.value)}
            placeholder="Corresponding answers..."
            className="w-full h-40 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>


        <div className="text-xs text-gray-500 mt-4">
          Great for self-testing and memorization.
        </div>
      </div>
    );
  }

  // Default fallback to one-column
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="notes-main" className="font-medium">
        Notes (plain text)
      </label>
      <textarea
        id="notes-main"
        name="notes-main"
        aria-label="Notes editor"
        value={content.main}
        onChange={(e) => handleChange("main", e.target.value)}
        placeholder="Paste notes here. Use - or * for bullets. Use **bold** and *italic* for emphasis."
        className="w-full h-56 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <ImageGallery />
      <div className="text-xs text-gray-500 mt-4">
        Auto-saves to browser storage. No server involved.
      </div>
    </div>
  );
}
