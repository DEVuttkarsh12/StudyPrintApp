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
          placeholder="Paste notes here. Use - or * for bullets. Use **bold** and *italic* for emphasis."
          className="w-full h-56 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <div className="text-xs text-gray-500">
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
            placeholder="Left column content..."
            className="w-full h-40 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
            placeholder="Right column content..."
            className="w-full h-40 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="text-xs text-gray-500">
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

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="notes-cues" className="text-sm font-medium text-gray-700">
              Cues
            </label>
            <textarea
              id="notes-cues"
              name="notes-cues"
              aria-label="Cornell cues"
              value={content.cues}
              onChange={(e) => handleChange("cues", e.target.value)}
              placeholder="Key points, questions..."
              className="w-full h-32 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-2">
            <label htmlFor="notes-notes" className="text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes-notes"
              name="notes-notes"
              aria-label="Cornell notes"
              value={content.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Main notes during lecture..."
              className="w-full h-32 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes-summary" className="text-sm font-medium text-gray-700">
            Summary
          </label>
          <textarea
            id="notes-summary"
            name="notes-summary"
            aria-label="Cornell summary"
            value={content.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
            placeholder="Summarize the main ideas..."
            className="w-full h-20 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
          />
        </div>

        <div className="text-xs text-gray-500">
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

        <div className="text-xs text-gray-500">
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
      <div className="text-xs text-gray-500">
        Auto-saves to browser storage. No server involved.
      </div>
    </div>
  );
}
