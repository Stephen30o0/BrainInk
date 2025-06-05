import React, { useState } from 'react';
import { MagicBoard } from './MagicBoard.tsx';
import { SymbolPalette } from './SymbolPalette';
import { InstructionsModal } from './InstructionsModal.tsx';
import { QuestionDisplay } from './QuestionDisplay.tsx';
import { QuizTimer } from './QuizTimer.tsx';

export type BoardElementType = 'text' | 'line' | 'pen'; // Add 'pen' for freehand later

export interface BoardElement {
  id: string;
  type: BoardElementType;
  x: number; // Primary x position (e.g., center for text, top-left for bounding box of line/pen)
  y: number; // Primary y position
  content?: string;       // For 'text' elements
  x1?: number; // For 'line' elements, start x
  y1?: number; // For 'line' elements, start y
  x2?: number; // For 'line' elements, end x
  y2?: number; // For 'line' elements, end y
  points?: { x: number, y: number }[]; // For 'pen' elements
  // Future: color, strokeWidth for drawings
}

export const QuizInterface: React.FC = () => {
  const [selectedSymbol, setSelectedSymbolInternal] = useState<string | null>(null);
  const [boardElements, setBoardElements] = useState<BoardElement[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isSelectModeActive, setIsSelectModeActive] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

  // Wrapper for setSelectedSymbol to also handle mode deactivation
  const setSelectedSymbol = (symbol: string | null) => {
    setSelectedSymbolInternal(symbol);
    if (symbol) {
      setIsSelectModeActive(false);
      setActiveDrawingTool(null);
      setSelectedElementIds([]); // Clear selections when selecting a symbol for input
    }
  };

  const handleSetDrawingTool = (tool: string | null) => {
    setActiveDrawingTool(tool);
    if (tool) {
      setIsSelectModeActive(false);
      setSelectedSymbol(null);
      setSelectedElementIds([]); // Clear selections when switching to a drawing tool
    }
  };

  const handleToggleSelectMode = () => {
    const newSelectModeState = !isSelectModeActive;
    setIsSelectModeActive(newSelectModeState);
    if (newSelectModeState) { // If activating select mode
      setActiveDrawingTool(null); // Deactivate any drawing tool
      setSelectedSymbol(null); // Deactivate symbol selection
      // setSelectedElementIds([]); // Already handled or should be based on context
    } else { // If deactivating select mode
      setSelectedElementIds([]); // Clear selections when turning off select mode
    }
  };

  const handleSelectElement = (id: string) => {
    if (isSelectModeActive) {
      if (selectedElementIds.includes(id)) {
        setSelectedElementIds(selectedElementIds.filter((elementId) => elementId !== id));
      } else {
        setSelectedElementIds([...selectedElementIds, id]);
      }
    }
  };

  const handleDeleteSelectedElements = () => {
    setBoardElements(boardElements.filter((element) => !selectedElementIds.includes(element.id)));
    setSelectedElementIds([]);
  };

  const toggleInstructionsModal = () => {
    setIsInstructionsModalOpen(prev => !prev);
  };

  // Placeholder question and time
  const question = "Solve for x: 2x + 5 = 15";
  const timeLimit = 300; // 5 minutes in seconds

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <QuestionDisplay question={question} />
        <QuizTimer initialTime={timeLimit} />
      </div>
      <div className="flex flex-1 gap-4 overflow-hidden">
        <MagicBoard 
          elements={boardElements} 
          setElements={setBoardElements} 
          selectedSymbol={selectedSymbol} // This is now the internal state variable
          setSelectedSymbol={setSelectedSymbol} // This is the wrapper function
          isSelectModeActive={isSelectModeActive}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          activeDrawingTool={activeDrawingTool} // Pass active drawing tool
        />
        <SymbolPalette 
          onSelectSymbol={setSelectedSymbol} // Pass the wrapper function
          isSelectModeActive={isSelectModeActive}
          onToggleSelectMode={handleToggleSelectMode}
          onDeleteSelected={handleDeleteSelectedElements}
          selectedElementIds={selectedElementIds}
          activeDrawingTool={activeDrawingTool}
          onSetDrawingTool={handleSetDrawingTool}
          onToggleInstructions={toggleInstructionsModal} // New prop
        />
      </div>
      <InstructionsModal isOpen={isInstructionsModalOpen} onClose={toggleInstructionsModal} />
    </div>
  );
};
