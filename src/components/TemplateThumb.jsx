import React from "react";

/*
  Simple thumbnail button showing template preview.
  Accessible with aria-pressed and keyboard support.
*/
export default function TemplateThumb({ id, title, onClick, selected }) {
  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={selected}
      className={`p-2 rounded border ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-300`}
      title={title}
    >
      <div className="text-xs font-semibold">{title}</div>
      <div className="mt-2 w-24 h-16 bg-white border rounded overflow-hidden">
        {id === "two-column" ? (
          <div className="p-1 h-full flex gap-1">
            <div className="w-1/2 bg-gray-100"></div>
            <div className="w-1/2 bg-gray-100"></div>
          </div>
        ) : (
          <div className="p-1 h-full">
            <div className="w-full h-12 bg-gray-100"></div>
          </div>
        )}
      </div>
    </button>
  );
}
