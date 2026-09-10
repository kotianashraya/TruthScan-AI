import React from 'react';

export default function ScannerInstructions() {
  return (
    <div className="p-4 bg-white/3 rounded-lg">
      <h4 className="font-semibold">For best results</h4>
      <ul className="text-sm text-gray-300 mt-2 space-y-1">
        <li>• Keep the product centered</li>
        <li>• Use good lighting</li>
        <li>• Avoid glare</li>
        <li>• Capture the complete packaging</li>
        <li>• Keep text and labels visible</li>
      </ul>
    </div>
  );
}
