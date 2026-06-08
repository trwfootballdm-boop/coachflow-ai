import React from 'react';
import AIPlayCreator from './AIPlayCreator';

/**
 * Floating slide-in panel wrapper for the AI Play Creator.
 * Used from the Play Designer header.
 */
export default function AIPlayCreatorPanel({ isOpen, onClose, initialPrompt }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        <AIPlayCreator onClose={onClose} initialPrompt={initialPrompt} />
      </div>
    </>
  );
}