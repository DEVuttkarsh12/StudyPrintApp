import React from "react";

export default function Toolbar({ onExport, onShare, onClear, shareUrl, saving, setScale }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Actions</h3>
                {saving && <span className="text-xs text-gray-500 animate-pulse">Saving...</span>}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onExport}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
                    title="Download as PDF"
                >
                    <span>📄</span> Export PDF
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onShare}
                    className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors text-sm"
                >
                    Share Link
                </button>
                <button
                    onClick={onClear}
                    className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-red-50 text-red-600 transition-colors text-sm"
                    title="Clear all content"
                >
                    Clear
                </button>
            </div>

            {shareUrl && (
                <div className="text-xs p-2 bg-gray-50 rounded border border-gray-200 break-all">
                    <p className="font-semibold mb-1 text-gray-500">Share Link:</p>
                    <a href={shareUrl} className="text-indigo-600 hover:underline">
                        {shareUrl}
                    </a>
                </div>
            )}

            <div className="border-t pt-3 mt-1">
                <label className="flex items-center justify-between text-sm text-gray-600">
                    <span>Export Scale</span>
                    <select
                        onChange={(e) => setScale(Number(e.target.value))}
                        defaultValue="2"
                        className="ml-2 border-gray-300 rounded text-sm p-1"
                    >
                        <option value="1">1x (Fast)</option>
                        <option value="2">2x (Good)</option>
                        <option value="3">3x (High)</option>
                    </select>
                </label>
            </div>
        </div>
    );
}
