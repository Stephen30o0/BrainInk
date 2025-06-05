import React, { useState, useEffect, useRef, useCallback, ChangeEvent, SyntheticEvent } from 'react';
import type { BoardElement } from './QuizInterface';

interface MagicBoardProps {
  elements: BoardElement[];
  setElements: React.Dispatch<React.SetStateAction<BoardElement[]>>;
  selectedSymbol: string | null; // This is the internal state value from QuizInterface
  setSelectedSymbol: (symbol: string | null) => void; // This is the wrapper function from QuizInterface
  isSelectModeActive: boolean;
  selectedElementIds: string[];
  onSelectElement: (elementId: string) => void;
  activeDrawingTool: string | null;
}

const GRID_SIZE = 20; // Snap to a 20x20 grid

export const MagicBoard: React.FC<MagicBoardProps> = ({ 
  elements, 
  setElements, 
  selectedSymbol, 
  setSelectedSymbol, 
  isSelectModeActive, 
  selectedElementIds, 
  onSelectElement,
  activeDrawingTool
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  // activeInput stores the state of the current text being typed directly onto the board
  const [activeInput, setActiveInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [drawingLineStart, setDrawingLineStart] = useState<{ x: number; y: number } | null>(null);
  const [previewLine, setPreviewLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[] | null>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);

  const [editingTextElementInfo, setEditingTextElementInfo] = useState<{
    id: string;
    currentDisplayContent: string;
    selectionStart: number;
    selectionEnd: number;
  } | null>(null);

  const handlePartialDelete = useCallback(() => {
    if (!editingTextElementInfo) return;

    const {
      id,
      currentDisplayContent,
      selectionStart,
      selectionEnd,
    } = editingTextElementInfo;

    let newContent = currentDisplayContent;
    let newCursorPos = selectionStart;

    if (selectionStart === selectionEnd) { // No range selected, behave like backspace
      if (selectionStart > 0) {
        newContent = 
          currentDisplayContent.substring(0, selectionStart - 1) + 
          currentDisplayContent.substring(selectionStart);
        newCursorPos = selectionStart - 1;
      }
    } else { // Range selected, delete the range
      newContent = 
        currentDisplayContent.substring(0, selectionStart) + 
        currentDisplayContent.substring(selectionEnd);
      newCursorPos = selectionStart;
    }

    setEditingTextElementInfo({
      id,
      currentDisplayContent: newContent,
      selectionStart: newCursorPos,
      selectionEnd: newCursorPos,
    });

    // Refocus and set cursor. Needs to happen after state update is processed.
    // Using a microtask (setTimeout 0) to allow React to update the input value first.
    setTimeout(() => {
      if (editingInputRef.current) {
        editingInputRef.current.focus();
        editingInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [editingTextElementInfo, setEditingTextElementInfo]);

  const commitCurrentTextEdit = useCallback(() => {
    if (editingTextElementInfo) {
      setElements(prevElements =>
        prevElements
          .map(elem =>
            elem.id === editingTextElementInfo.id
              ? { ...elem, content: editingTextElementInfo.currentDisplayContent } // Update content
              : elem
          )
          .filter(elem => !(elem.id === editingTextElementInfo.id && elem.type === 'text' && editingTextElementInfo.currentDisplayContent.trim() === '')) // Remove if text content is empty
      );
      setEditingTextElementInfo(null);
    }
  }, [editingTextElementInfo, setElements, setEditingTextElementInfo]);

  const handleBoardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // If select mode is active, board clicks should not create new inputs.
    // Clicks on existing elements will be handled by their own onClick handlers.
    if (editingTextElementInfo) {
      commitCurrentTextEdit(); // Commit active text edit if board is clicked elsewhere
    }
    if (isSelectModeActive || activeDrawingTool) {
      // If in select mode or a drawing tool is active, board clicks are handled by onMouseDown/Move/Up for drawing
      // or not at all for select mode's general board click (element clicks are separate).
      // Active input should not be started here.
      return;
    }
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // Snap to grid
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;

    // Case 1: A symbol is selected from the palette AND was NOT consumed by the useEffect
    // (meaning there was no activeInput when it was selected, or it's a click to place it).
    if (selectedSymbol) { 
      // Commit existing activeInput if it has content and is at a different location
      // This handles committing text before placing a new palette symbol that starts its own input field.
      if (activeInput && activeInput.text.trim() !== '') {
        if (activeInput.x !== x || activeInput.y !== y || activeInput.text !== selectedSymbol) { // Avoid re-adding if it's the same text at same spot
          const newElement: BoardElement = {
            id: Date.now().toString(),
            type: 'text',
            content: activeInput.text,
            x: activeInput.x,
            y: activeInput.y,
          };
          setElements(prev => [...prev, newElement]);
        }
      }
      // Start a new activeInput with the selected symbol from the palette
      setActiveInput({ x, y, text: selectedSymbol });
      setSelectedSymbol(null); // Consume the symbol
      console.log(`Board clicked at: x=${x}, y=${y}. Started activeInput with palette symbol: ${selectedSymbol}`);
    } else { 
      // Case 2: No symbol selected from palette for this click (or already consumed by useEffect into an existing activeInput).
      // This click is to either commit current activeInput or start/move to a new empty one.
      if (activeInput) {
        if (activeInput.text.trim() !== '') {
          const newElement: BoardElement = {
            id: Date.now().toString(),
            type: 'text',
            content: activeInput.text,
            x: activeInput.x,
            y: activeInput.y,
          };
          setElements(prev => [...prev, newElement]);
        }
      }
      // Start a new empty activeInput at the clicked position
      // (or reopen if clicked on the same spot as a just-committed input, now empty)
      setActiveInput({ x, y, text: "" });
      console.log(`Board clicked at: x=${x}, y=${y}. Started/Moved empty activeInput.`);
    }
  };

  // Effect to commit text edit when select mode is deactivated or drawing tool changes
  useEffect(() => {
    if (!isSelectModeActive || activeDrawingTool) {
      if (editingTextElementInfo) {
        commitCurrentTextEdit();
      }
    }
  }, [isSelectModeActive, activeDrawingTool, commitCurrentTextEdit]);

  // Effect to focus input and set selection when a text element starts editing
  useEffect(() => {
    if (editingTextElementInfo && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.setSelectionRange(
        editingTextElementInfo.selectionStart,
        editingTextElementInfo.selectionEnd
      );
    }
  }, [editingTextElementInfo]);

  useEffect(() => {
    if (isSelectModeActive) {
      if (activeInput && activeInput.text.trim() !== '') {
        // Create a new element from the active input
        const newElement: BoardElement = {
          id: Date.now().toString(),
          type: 'text',
          content: activeInput.text,
          x: activeInput.x,
          y: activeInput.y,
        };
        setElements(prevElements => [...prevElements, newElement]);
      }
      setActiveInput(null);
    }
  }, [isSelectModeActive, activeInput, setElements]);

  // Effect for handling keyboard input
  const getSnappedCoords = (clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const rect = boardRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    return { x, y };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeInput) setActiveInput(null); // Clear text input if starting any drawing or selection interaction
    const { x, y } = getSnappedCoords(event.clientX, event.clientY);

    if (activeDrawingTool === 'line') {
      setDrawingLineStart({ x, y });
      setPreviewLine({ x1: x, y1: y, x2: x, y2: y });
      event.preventDefault();
    } else if (activeDrawingTool === 'pen') {
      setCurrentPath([{ x, y }]);
      event.preventDefault();
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getSnappedCoords(event.clientX, event.clientY);
    if (activeDrawingTool === 'line' && drawingLineStart) {
      setPreviewLine({ x1: drawingLineStart.x, y1: drawingLineStart.y, x2: x, y2: y });
      event.preventDefault();
    } else if (activeDrawingTool === 'pen' && currentPath) {
      // Check if the new point is different enough from the last point to avoid too many points
      const lastPoint = currentPath[currentPath.length - 1];
      if (Math.abs(lastPoint.x - x) > 5 || Math.abs(lastPoint.y - y) > 5 || currentPath.length === 1) {
         setCurrentPath(prevPath => prevPath ? [...prevPath, { x, y }] : null);
      }
      event.preventDefault();
    }
  };



  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeDrawingTool === 'line' && drawingLineStart && previewLine) {
      const { x: x2, y: y2 } = getSnappedCoords(event.clientX, event.clientY);
      // Ensure the line has some length to avoid zero-length lines if mouse didn't move
      if (drawingLineStart.x !== x2 || drawingLineStart.y !== y2) {
        const newLine: BoardElement = {
          id: Date.now().toString(),
          type: 'line',
          x1: drawingLineStart.x,
          y1: drawingLineStart.y,
          x2: x2,
          y2: y2,
          // x, y for lines could be top-left of bounding box or not used if x1,y1,x2,y2 define it
          x: Math.min(drawingLineStart.x, x2), 
          y: Math.min(drawingLineStart.y, y2),
        };
        setElements(prev => [...prev, newLine]);
      }
      setDrawingLineStart(null);
      setPreviewLine(null);
      event.preventDefault();
    } else if (activeDrawingTool === 'pen' && currentPath && currentPath.length > 1) {
      // Calculate bounding box for x, y
      const minX = Math.min(...currentPath.map(p => p.x));
      const minY = Math.min(...currentPath.map(p => p.y));

      const newElement: BoardElement = {
        id: Date.now().toString(),
        type: 'pen',
        points: currentPath,
        x: minX,
        y: minY,
      };
      setElements(prev => [...prev, newElement]);
      setCurrentPath(null);
      event.preventDefault();
    } else if (activeDrawingTool === 'pen' && currentPath && currentPath.length <= 1) {
      // Path too short, clear it without adding
      setCurrentPath(null);
      event.preventDefault();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeInput) {
        event.preventDefault(); // Prevent default browser actions if we're handling input
        const key = event.key;
        if (key.length === 1) { // Printable characters
          setActiveInput(prev => prev ? { ...prev, text: prev.text + key } : null);
        } else if (key === 'Backspace') {
          setActiveInput(prev => prev ? { ...prev, text: prev.text.slice(0, -1) } : null);
        } else if (key === 'Enter') {
          if (activeInput.text.trim() !== '') {
            const newElement: BoardElement = {
              id: Date.now().toString(),
              type: 'text',
              content: activeInput.text,
              x: activeInput.x,
              y: activeInput.y
            };
            setElements(prev => [...prev, newElement]);
          }
          setActiveInput(null); // Commit and clear active input
        } else if (key === 'Tab') {
          event.preventDefault(); // Prevent default Tab behavior (focus change)
          const currentText = activeInput.text;
          let newText = currentText;

          // Regex to find if we are inside frac( and before the comma
          const fracMatchNum = currentText.match(/frac\(([^,]*)$/);
          const fracMatchDen = currentText.match(/frac\(([^,]+),([^)]*)$/);
          const expMatch = currentText.match(/\^\(([^)]*)$/);
          const sqrtMatch = currentText.match(/sqrt\(([^)]*)$/);

          if (fracMatchNum && fracMatchNum.index !== undefined && !currentText.substring(fracMatchNum.index + 5).includes(',')) {
            // Inside frac(), before comma
            newText += ', ';
          } else if (fracMatchDen && fracMatchDen.index !== undefined && fracMatchDen[1] && !currentText.substring(fracMatchDen.index + fracMatchDen[1].length + 1).includes(')')) {
            // Inside frac(), after comma, before closing paren
            newText += ')';
          } else if (expMatch && expMatch.index !== undefined && !currentText.substring(expMatch.index + 2).includes(')')) {
            // Inside ^(), before closing paren
            newText += ')';
          } else if (sqrtMatch && sqrtMatch.index !== undefined && !currentText.substring(sqrtMatch.index + 5).includes(')')) {
            // Inside sqrt(), before closing paren
            newText += ')';
          }
          // Add more rules here for other structures if needed
          
          if (newText !== currentText) {
            setActiveInput(prev => prev ? { ...prev, text: newText } : null);
          }
        }
      } else {
        // No active input, so Backspace can delete the last committed element
        if (event.key === 'Backspace') {
          event.preventDefault(); // Prevent browser back navigation
          setElements(prev => prev.slice(0, -1));
          console.log('Backspace pressed: Deleting last element');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeInput, setElements, setSelectedSymbol]);

  return (
    <div 
      ref={boardRef}
      className={`flex-1 bg-white border-2 border-gray-600 rounded-lg relative overflow-hidden 
        ${activeDrawingTool === 'line' || activeDrawingTool === 'pen' ? 'cursor-crosshair' : 'cursor-text'}
        ${isSelectModeActive ? 'cursor-default' : ''}
      `}
      onClick={handleBoardClick} // General click for text input when no tool is active
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ minHeight: '400px' }} // Ensure it has some height
    >
      {/* Display active text input area */}
      {activeInput && (
        <div 
          className="absolute select-none text-black text-xl bg-yellow-100 border border-yellow-400 px-1 pointer-events-none whitespace-nowrap"
          style={{ 
            left: activeInput.x, 
            top: activeInput.y, 
            transform: 'translateY(-100%)', // Position above the grid line
            lineHeight: 'normal', // Allow natural line height for text
            padding: '2px 4px', // Some padding for the text
            zIndex: 10 // Ensure it's above other elements
          }}
        >
          {activeInput.text}
          <span className="animate-pulse">|</span> {/* Blinking cursor */}
        </div>
      )}
      {/* Display committed elements */}
      {elements.map(el => {
        const isCurrentlyEditingThisText = el.type === 'text' && editingTextElementInfo && editingTextElementInfo.id === el.id;
        const baseDivStyle: React.CSSProperties = {
          left: el.x,
          top: el.y,
          position: 'absolute',
        };
        if (el.type === 'text') {
          baseDivStyle.transform = 'translate(-50%, -50%)'; // Center text elements
        }

        return (
          <div
            key={el.id}
            onClick={(e) => {
              if (isSelectModeActive && el.type === 'text' && el.content !== undefined) {
                e.stopPropagation();
                onSelectElement(el.id);
                if (editingTextElementInfo?.id !== el.id) {
                  if (editingTextElementInfo) commitCurrentTextEdit();
                  setEditingTextElementInfo({
                    id: el.id,
                    currentDisplayContent: el.content || '',
                    selectionStart: (el.content || '').length,
                    selectionEnd: (el.content || '').length,
                  });
                }
              } else if (isSelectModeActive && el.type !== 'text') {
                e.stopPropagation();
                if (editingTextElementInfo) commitCurrentTextEdit();
                onSelectElement(el.id);
              } else if (!isSelectModeActive && editingTextElementInfo) {
                commitCurrentTextEdit();
              }
            }}
            className={`select-none p-1 transition-all duration-150 
              ${el.type === 'text' ? 'text-black text-2xl cursor-pointer' : 'cursor-default'} 
              ${isSelectModeActive && selectedElementIds.includes(el.id) ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-100' : ''} 
              ${isSelectModeActive ? 'hover:ring-1 hover:ring-blue-400' : ''}
            `}
            style={baseDivStyle}
          >
            {el.type === 'text' ? (
              isCurrentlyEditingThisText && editingTextElementInfo ? (
                <div className="relative flex items-center">
                  <input
                    ref={editingInputRef}
                    type="text"
                    value={editingTextElementInfo.currentDisplayContent}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEditingTextElementInfo(prev => prev ? { 
                      ...prev, 
                      currentDisplayContent: e.target.value, 
                      selectionStart: e.target.selectionStart ?? 0, 
                      selectionEnd: e.target.selectionEnd ?? 0 
                    } : null);
                  }}
                  onSelect={(e: SyntheticEvent<HTMLInputElement>) => {
                    const target = e.target as HTMLInputElement;
                    setEditingTextElementInfo(prev => prev ? { 
                      ...prev, 
                      selectionStart: target.selectionStart ?? 0, 
                      selectionEnd: target.selectionEnd ?? 0 
                    } : null);
                  }}
                  onBlur={() => setTimeout(() => commitCurrentTextEdit(), 100)} // Small delay to allow other clicks like delete button
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitCurrentTextEdit();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (editingTextElementInfo) { // Guard against null
                        const originalElement = elements.find(elem => elem.id === editingTextElementInfo.id);
                        if (originalElement) {
                           setEditingTextElementInfo(prev => {
                             if (prev && prev.id === originalElement.id) {
                               return {
                                 ...prev,
                                 currentDisplayContent: originalElement.content || '',
                                 selectionStart: (originalElement.content || '').length,
                                 selectionEnd: (originalElement.content || '').length,
                               };
                             }
                             return prev;
                           });
                        }
                        setTimeout(() => commitCurrentTextEdit(), 0); // Commit reverted or current state
                      }
                    }
                  }}
                  className="text-black text-2xl p-0 m-0 bg-transparent outline-none border-none w-auto h-auto min-w-full"
                  style={{ /* Input takes full space of parent div effectively */ }}
                  onClick={(e) => e.stopPropagation()} // Prevent wrapper div's onClick from re-triggering edit logic
                  autoFocus
                />
                {editingTextElementInfo && editingTextElementInfo.currentDisplayContent.length > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent other click handlers
                            handlePartialDelete();
                        }}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-1 p-0.5 bg-red-500 text-white rounded-full text-xs leading-none hover:bg-red-700 z-10"
                        aria-label="Delete part of text"
                        style={{ height: '16px', width: '16px', lineHeight: '1' /* ensure X is centered */ }}
                    >
                        ✕
                    </button>
                )}
                </div>
              ) : (
                <span className="whitespace-nowrap">
                  {el.content}
                </span>
              )
            ) : null /* Lines and Pens are rendered in SVG, this div is for interaction/highlighting if needed */}
          </div>
        );
      })}
      {/* SVG Overlay for drawings and highlights */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {elements.map(el => {
          if (el.type === 'line' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
            return (
              <line 
                key={`${el.id}-line`}
                x1={el.x1} 
                y1={el.y1} 
                x2={el.x2} 
                y2={el.y2} 
                stroke="black" 
                strokeWidth="2" 
              />
            );
          }
          return null;
        })}
        {previewLine && (
          <line 
            x1={previewLine.x1} 
            y1={previewLine.y1} 
            x2={previewLine.x2} 
            y2={previewLine.y2} 
            stroke="rgba(0,0,255,0.5)" 
            strokeWidth="2" 
            strokeDasharray="4 4"
          />
        )}
        {currentPath && currentPath.length > 0 && (
          <polyline
            points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(0,100,255,0.7)" // Different color for pen preview
            strokeWidth="2"
          />
        )}
        {elements.map(el => {
          if (el.type === 'pen' && el.points && el.points.length > 0) {
            return (
              <polyline
                key={`${el.id}-pen`}
                points={el.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="purple" // Pen drawings in purple
                strokeWidth="2"
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};
