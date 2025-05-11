import React, { useState } from 'react';
import { X, Bell, Moon, Volume2, Globe, Shield, Clock, Save } from 'lucide-react';
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    sound: true,
    language: 'English',
    privacy: 'Private',
    timeFormat: '12h'
  });
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="text-lg font-medium">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Bell className="h-4 w-4 mr-2 text-blue-400" />
              Notifications
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable notifications</span>
              <button onClick={() => setSettings(prev => ({
              ...prev,
              notifications: !prev.notifications
            }))} className={`w-11 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-blue-600' : 'bg-[#1a223a]'} relative`}>
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          {/* Appearance */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Moon className="h-4 w-4 mr-2 text-blue-400" />
              Appearance
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark mode</span>
              <button onClick={() => setSettings(prev => ({
              ...prev,
              darkMode: !prev.darkMode
            }))} className={`w-11 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-blue-600' : 'bg-[#1a223a]'} relative`}>
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          {/* Sound */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Volume2 className="h-4 w-4 mr-2 text-blue-400" />
              Sound
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable sound effects</span>
              <button onClick={() => setSettings(prev => ({
              ...prev,
              sound: !prev.sound
            }))} className={`w-11 h-6 rounded-full transition-colors ${settings.sound ? 'bg-blue-600' : 'bg-[#1a223a]'} relative`}>
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${settings.sound ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          {/* Language */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2 text-blue-400" />
              Language
            </h4>
            <select value={settings.language} onChange={e => setSettings(prev => ({
            ...prev,
            language: e.target.value
          }))} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
              <option>German</option>
            </select>
          </div>
          {/* Privacy */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-400" />
              Privacy
            </h4>
            <select value={settings.privacy} onChange={e => setSettings(prev => ({
            ...prev,
            privacy: e.target.value
          }))} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
              <option>Private</option>
              <option>Public</option>
              <option>Friends Only</option>
            </select>
          </div>
          {/* Time Format */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-400" />
              Time Format
            </h4>
            <select value={settings.timeFormat} onChange={e => setSettings(prev => ({
            ...prev,
            timeFormat: e.target.value
          }))} className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 px-3 text-sm">
              <option>12h</option>
              <option>24h</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-[#1a223a] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>;
};
export default SettingsPanel;