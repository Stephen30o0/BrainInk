import React, { useState } from 'react';
import { X, File, Upload, Folder, Search, Plus, ExternalLink } from 'lucide-react';
interface StudyMaterialsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
const StudyMaterialsPanel: React.FC<StudyMaterialsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  if (!isOpen) return null;
  const folders = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
  const materials = [{
    id: 1,
    name: 'Calculus Notes.pdf',
    folder: 'Mathematics',
    date: '2024-02-15',
    size: '2.4 MB'
  }, {
    id: 2,
    name: 'Physics Formula Sheet.pdf',
    folder: 'Physics',
    date: '2024-02-14',
    size: '1.1 MB'
  }
  // Add more materials as needed
  ];
  const filteredMaterials = materials.filter(material => (selectedFolder === 'All' || material.folder === selectedFolder) && material.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="text-lg font-medium flex items-center">
            <File className="h-5 w-5 mr-2 text-blue-400" />
            Study Materials
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-[#1a223a] p-4">
            <button className="w-full mb-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium flex items-center justify-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </button>
            <div className="space-y-1">
              {folders.map(folder => <button key={folder} onClick={() => setSelectedFolder(folder)} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${selectedFolder === folder ? 'bg-[#1a223a] text-white' : 'text-gray-400 hover:bg-[#141b2d]'}`}>
                  <Folder className="h-4 w-4 mr-2" />
                  {folder}
                </button>)}
            </div>
          </div>
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[#1a223a]">
              <div className="relative">
                <input type="text" placeholder="Search materials..." className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 pl-8 pr-3 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            {/* Materials list */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredMaterials.map(material => <div key={material.id} className="flex items-center justify-between p-3 bg-[#141b2d] rounded-lg border border-[#1a223a] hover:border-blue-500 transition-colors">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-blue-400 mr-3" />
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-400">
                          {material.folder} • {material.size}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-[#1a223a] rounded-md transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default StudyMaterialsPanel;