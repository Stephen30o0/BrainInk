import React, { useState } from 'react';
import { ArrowLeft, Play, Rotate3D, Info, Maximize, ExternalLink, Share2 } from 'lucide-react';

// Define CoreApiAuthor if not imported (ensure consistency with LibraryHub.tsx)
interface CoreApiAuthor {
  name: string;
}

interface LibraryItem {
  id: string;
  title: string;
  authors: CoreApiAuthor[]; // Changed from author: string
  category: string;
  coverImage: string;
  description: string;
  publishDate: string;
  rating: number;
  views: number;
  readTime: string;
  storedFilename: string | null; // Added for consistency
  mimetype: string | null; // Added for consistency
}

interface InteractiveSimulationsProps {
  item: LibraryItem;
  onBack: () => void;
}

// Mock simulation parameters
interface SimulationParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const simulationParameters: SimulationParameter[] = [
  {
    id: 'voltage',
    name: 'Membrane Potential',
    value: -70,
    min: -90,
    max: 40,
    step: 1,
    unit: 'mV'
  },
  {
    id: 'threshold',
    name: 'Action Potential Threshold',
    value: -55,
    min: -70,
    max: -40,
    step: 1,
    unit: 'mV'
  },
  {
    id: 'stimulation',
    name: 'Stimulation Intensity',
    value: 30,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'calcium',
    name: 'Calcium Concentration',
    value: 2.5,
    min: 0,
    max: 10,
    step: 0.5,
    unit: 'mM'
  }
];

// Mock simulation data points
const simulationData = [
  { x: 0, y: -70 },
  { x: 10, y: -70 },
  { x: 20, y: -65 },
  { x: 30, y: -55 },
  { x: 40, y: 20 },
  { x: 50, y: 30 },
  { x: 60, y: 10 },
  { x: 70, y: -20 },
  { x: 80, y: -60 },
  { x: 90, y: -70 },
  { x: 100, y: -70 }
];

// Simulation control buttons
interface ControlButton {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const controlButtons: ControlButton[] = [
  { id: 'run', name: 'Run Simulation', icon: <Play size={16} /> },
  { id: 'reset', name: 'Reset Parameters', icon: <Rotate3D size={16} /> },
  { id: 'info', name: 'Help', icon: <Info size={16} /> }
];

export const InteractiveSimulations: React.FC<InteractiveSimulationsProps> = ({ item, onBack }) => {
  const [parameters, setParameters] = useState<SimulationParameter[]>(simulationParameters);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Handle parameter change
  const handleParameterChange = (parameterId: string, newValue: number) => {
    setParameters(prevParams => 
      prevParams.map(param => 
        param.id === parameterId ? { ...param, value: newValue } : param
      )
    );
  };

  // Handle button click
  const handleButtonClick = (buttonId: string) => {
    switch (buttonId) {
      case 'run':
        setIsSimulationRunning(true);
        // In a real app, this would start the simulation
        setTimeout(() => setIsSimulationRunning(false), 3000);
        break;
      case 'reset':
        setParameters(simulationParameters);
        break;
      case 'info':
        // Show help modal in a real app
        break;
    }
  };

  // Draw the simulation graph
  const renderGraph = () => {
    const graphHeight = 200;
    const graphWidth = 400;
    
    // Calculate scaling factors
    const xScale = graphWidth / 100;
    const yMin = -90;
    const yMax = 40;
    const yRange = yMax - yMin;
    const yScale = graphHeight / yRange;
    
    // Create SVG path
    const pathData = simulationData.map((point, index) => {
      const x = point.x * xScale;
      // Invert y because SVG coordinates increase downward
      const y = graphHeight - ((point.y - yMin) * yScale);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-primary/20 w-full h-full flex items-center justify-center">
        <svg width={graphWidth} height={graphHeight} className="overflow-visible">
          {/* X and Y axes */}
          <line 
            x1="0" y1={graphHeight} 
            x2={graphWidth} y2={graphHeight} 
            stroke="#4b5563" strokeWidth="1" 
          />
          <line 
            x1="0" y1="0" 
            x2="0" y2={graphHeight} 
            stroke="#4b5563" strokeWidth="1" 
          />
          
          {/* X-axis labels */}
          <text x={graphWidth/2} y={graphHeight + 20} fill="#9ca3af" textAnchor="middle" fontSize="12">Time (ms)</text>
          
          {/* Y-axis labels */}
          <text x="-80" y={graphHeight/2} fill="#9ca3af" textAnchor="middle" transform={`rotate(-90, -80, ${graphHeight/2})`} fontSize="12">Membrane Potential (mV)</text>
          
          {/* Graph line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="#059669" 
            strokeWidth="2" 
            className={isSimulationRunning ? "animate-pulse" : ""}
          />
          
          {/* Threshold line */}
          <line 
            x1="0" 
            y1={graphHeight - ((parameters.find(p => p.id === 'threshold')?.value ?? -55) - yMin) * yScale} 
            x2={graphWidth} 
            y2={graphHeight - ((parameters.find(p => p.id === 'threshold')?.value ?? -55) - yMin) * yScale} 
            stroke="#ef4444" 
            strokeWidth="1" 
            strokeDasharray="4,4" 
          />
          <text 
            x={graphWidth + 10} 
            y={graphHeight - ((parameters.find(p => p.id === 'threshold')?.value ?? -55) - yMin) * yScale} 
            fill="#ef4444" 
            fontSize="10" 
            dominantBaseline="middle"
          >
            Threshold
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <div>
            <h2 className="font-pixel text-xl text-primary">{item.title}</h2>
            <p className="text-gray-400 text-sm" title={item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}>{item.authors ? item.authors.map(a => a.name).join(', ') : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">
            <Share2 size={20} />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">
            <ExternalLink size={20} />
          </button>
          <button 
            onClick={() => setShowFullscreen(!showFullscreen)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
      
      {/* Simulation description */}
      <div className="bg-dark/30 rounded-lg p-4 border border-primary/20 mb-6">
        <p className="text-gray-200">{item.description}</p>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Parameters panel */}
        <div className="bg-dark/30 rounded-lg p-4 border border-primary/20 overflow-y-auto">
          <h3 className="font-pixel text-primary mb-4">Simulation Parameters</h3>
          
          <div className="space-y-6">
            {parameters.map(param => (
              <div key={param.id} className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-gray-300 text-sm">{param.name}</label>
                  <span className="text-primary font-medium text-sm">
                    {param.value} {param.unit}
                  </span>
                </div>
                <input 
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={param.value}
                  onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{param.min} {param.unit}</span>
                  <span>{param.max} {param.unit}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 space-y-2">
            {controlButtons.map(button => (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                disabled={button.id === 'run' && isSimulationRunning}
              >
                {button.icon}
                {button.name}
                {button.id === 'run' && isSimulationRunning && (
                  <span className="ml-2 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Simulation visualization */}
        <div className="md:col-span-2 flex flex-col bg-dark/30 rounded-lg p-4 border border-primary/20 overflow-hidden">
          <h3 className="font-pixel text-primary mb-4">Neural Pathway Simulation</h3>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {renderGraph()}
          </div>
          
          <div className="mt-4 text-gray-300 text-sm">
            <p>
              Adjust the parameters to see how they affect action potential generation and propagation in a neuron.
              The red dotted line indicates the threshold potential for action potential initiation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
