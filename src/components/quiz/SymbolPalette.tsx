import React from 'react';
import { Trash2, MousePointer2, Minus, Edit3, Info } from 'lucide-react';

interface SymbolPaletteProps {
  onSelectSymbol: (symbol: string | null) => void; // Allow null to clear symbol selection
  isSelectModeActive: boolean;
  onToggleSelectMode: () => void;
  selectedElementIds: string[];
  onDeleteSelected: () => void;
  activeDrawingTool: string | null;
  onSetDrawingTool: (tool: string | null) => void;
  onToggleInstructions: () => void;
}

interface PaletteButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
}

const PaletteButton: React.FC<PaletteButtonProps> = ({ label, icon, onClick, isActive, disabled, className }) => {
  return (
    <button
      onClick={onClick}
      className={`font-bold py-3 px-2 rounded text-md transition-colors duration-150 focus:outline-none focus:ring-2 ${className} ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-400'} ${disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-500' : ''}`}
      title={label}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
};

const basicSymbols = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '+', '-', '×', '÷', '=', 
  'x', 'y', 'z', 'a', 'b', 'c',
  '(', ')', '[', ']', '{', '}', '<', '>', 
];

const structureSymbols = [
  { label: '□/□', value: 'frac( , )', name: 'Fraction' },
  { label: 'x²', value: '^( )', name: 'Exponent' },
  { label: '√□', value: 'sqrt( )', name: 'Square Root' },
  // { label: 'x₀', value: '_( )', name: 'Subscript' }, // Can add later
];

export const SymbolPalette: React.FC<SymbolPaletteProps> = ({ 
  onSelectSymbol, 
  isSelectModeActive, 
  onToggleSelectMode, 
  selectedElementIds, 
  onDeleteSelected,
  activeDrawingTool,
  onSetDrawingTool,
  onToggleInstructions
}) => {
  return (
    <div className="w-64 bg-gray-700 p-4 rounded-lg overflow-y-auto flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-center">Tools</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <PaletteButton label="Select" icon={<MousePointer2 size={20} />} onClick={onToggleSelectMode} isActive={isSelectModeActive} disabled={!!activeDrawingTool} />
          <PaletteButton label="Delete" icon={<Trash2 size={20} />} onClick={onDeleteSelected} disabled={selectedElementIds.length === 0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PaletteButton label="Line" icon={<Minus size={20} />} onClick={() => onSetDrawingTool(activeDrawingTool === 'line' ? null : 'line')} isActive={activeDrawingTool === 'line'} disabled={isSelectModeActive} />
          <PaletteButton label="Pen" icon={<Edit3 size={20} />} onClick={() => onSetDrawingTool(activeDrawingTool === 'pen' ? null : 'pen')} isActive={activeDrawingTool === 'pen'} disabled={isSelectModeActive} />
        </div>
      </div>
      {/* Spacer to push help button to bottom if content is short */}
      <div className="flex-grow"></div>
      {/* Help Button */}
      <div className="mt-auto pt-2 border-t border-gray-300">
        <PaletteButton label="Help" icon={<Info size={20} />} onClick={onToggleInstructions} className="w-full bg-sky-600 hover:bg-sky-700 focus:ring-sky-500" />
      </div>
      <h3 className="text-lg font-semibold mb-3 text-center">Basic Symbols</h3>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {basicSymbols.map(symbol => (
          <button 
            key={symbol}
            onClick={() => onSelectSymbol(symbol)}
            className="bg-gray-600 hover:bg-blue-500 text-white font-bold py-3 px-2 rounded text-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title={symbol} // Tooltip for symbols like <, >
          >
            {symbol}
          </button>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-3 text-center">Structures</h3>
      <div className="grid grid-cols-2 gap-2">
        {structureSymbols.map(item => (
          <button 
            key={item.name}
            onClick={() => onSelectSymbol(item.value)}
            className="bg-gray-500 hover:bg-teal-500 text-white font-bold py-3 px-2 rounded text-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 col-span-1"
            title={item.name}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
