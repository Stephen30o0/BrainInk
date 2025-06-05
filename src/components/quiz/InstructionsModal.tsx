import React from 'react';
import { X } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Close instructions"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">How to Use the Magic Board</h2>
        
        <div className="space-y-3 text-gray-700 max-h-[70vh] overflow-y-auto pr-2">
          <section>
            <h3 className="font-semibold text-lg mb-1 text-indigo-600">Text Input:</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Click anywhere on the board to start typing. An input box will appear.</li>
              <li>Type your numbers, letters, or math symbols.</li>
              <li>Press 'Enter' or click elsewhere to place the text on the board.</li>
              <li>Use 'Backspace' to delete characters in the active input box.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1 text-indigo-600">Symbol Palette:</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Click a symbol in the palette (e.g., '+', 'sin(', 'frac( , )').</li>
              <li>Then, click on the board where you want to place it. It will appear in an active input box.</li>
              <li>Alternatively, if an input box is already active, clicking a palette symbol will append it to the current text.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1 text-indigo-600">Selecting & Deleting Elements:</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Click the 'Select' button in the palette to enter selection mode.</li>
              <li>In select mode, click on any element on the board to highlight it (blue border).</li>
              <li>You can select multiple elements.</li>
              <li>Once elements are selected, the 'Delete' button (trash icon) in the palette will become active. Click it to remove all selected elements.</li>
              <li>Click 'Select' again to exit selection mode.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1 text-indigo-600">Drawing Tools:</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li><strong>Line Tool:</strong> Click the 'Line' button in the palette. Your cursor will change. Click and drag on the board to draw a straight line. Release the mouse to finish.</li>
              <li><strong>Pen Tool:</strong> (Coming Soon!) This will allow freehand drawing.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1 text-indigo-600">General Tips:</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Elements snap to a grid for neatness.</li>
              <li>Drawing and Select modes are mutually exclusive. Activating one will deactivate the other.</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
