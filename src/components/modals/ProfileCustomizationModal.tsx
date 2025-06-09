import React, { useState, useEffect } from 'react';
import { useProfileCustomizationModal } from '../../contexts/ProfileCustomizationModalContext';
import { getSpecificCombinationUrl } from '../../lib/emojiKitchenUtils'; // Adjusted path
import { X } from 'lucide-react';
import AvatarDisplay from '../shared/AvatarDisplay';

// Helper to convert emoji char to hex codepoint string
const getCodepoint = (emoji: string): string | undefined => {
  if (!emoji || typeof emoji.codePointAt !== 'function') return undefined;
  const codePoint = emoji.codePointAt(0);
  if (codePoint === undefined) return undefined;
  return codePoint.toString(16);
};

const presetAvatars = [
  { id: 'pa1', emojis: '✨🧠✨', name: 'Sparkling Mind' },
  { id: 'pa2', emojis: '🚀💡', name: 'Idea Rocket' },
  { id: 'pa3', emojis: '📚🤓', name: 'Bookworm' },
  { id: 'pa4', emojis: '🎮🏆', name: 'Game Champion' },
];

const emojiPalette = ['😀', '😂', '😍', '🤔', '😎', '🥳', '🤯', '🔥', '✨', '🧠', '💡', '📚', '🚀', '🎮', '🏆', '🎨', '🔬', '💻', '🌟'];

export const ProfileCustomizationModal: React.FC = () => {
  const { isProfileModalOpen, closeProfileModal, notifyProfileUpdate } = useProfileCustomizationModal();
  
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [avatarDisplay, setAvatarDisplay] = useState<string | { type: 'combined'; url: string } | null>(null);

  useEffect(() => {
    // Load existing profile from localStorage if available when modal opens
    // This is useful if the user is editing their profile, not just initial setup
    const storedProfile = localStorage.getItem('userProfile');
    console.log('[ModalEffect] Checking for stored profile. Modal open:', isProfileModalOpen);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      console.log('[ModalEffect] Found stored profile:', profile);
      setUsername(profile.username || '');
      console.log('[ModalEffect] Set username to:', profile.username || '');
      // For avatar, we need to determine if it's a URL or single emoji
      if (profile.avatar) {
        if (profile.avatar.startsWith('http') || profile.avatar.includes('/')) {
          setAvatarDisplay({ type: 'combined', url: profile.avatar });
        } else {
          setAvatarDisplay(profile.avatar);
          // If it's a simple emoji, we might want to pre-select it in the palette
          // For simplicity now, just displaying it. Could also try to parse selectedEmojis from it.
        }
      }
    }
  }, [isProfileModalOpen]); // Re-run when modal opens

  useEffect(() => {
    if (selectedEmojis.length === 0) {
      setAvatarDisplay(null);
      return;
    }
    const firstEmoji = selectedEmojis[0];
    if (selectedEmojis.length >= 2) {
      const secondEmoji = selectedEmojis[1];
      const cp1 = getCodepoint(firstEmoji);
      const cp2 = getCodepoint(secondEmoji);
      if (cp1 && cp2) {
        const combinationUrl = getSpecificCombinationUrl(cp1, cp2);
        if (combinationUrl && combinationUrl.endsWith('.png')) {
          setAvatarDisplay({ type: 'combined', url: combinationUrl });
        } else {
          setAvatarDisplay(firstEmoji);
        }
        return;
      }
    }
    setAvatarDisplay(firstEmoji);
  }, [selectedEmojis]);

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) {
        return prev.filter(e => e !== emoji);
      }
      if (prev.length < 2) {
        return [...prev, emoji];
      }
      return [prev[1], emoji]; // Keep last selected and add new one
    });
  };

  const handlePresetSelect = (preset: { emojis: string }) => {
    // Basic preset handling: just use the first one or two emojis from the preset string
    const emojis = Array.from(preset.emojis).slice(0, 2);
    setSelectedEmojis(emojis);
  };

  const handleSaveProfile = () => {
    if (!username.trim()) {
      setFeedbackMessage('Username cannot be empty.');
      return;
    }

    let finalAvatarValue: string;
    if (typeof avatarDisplay === 'string') {
      finalAvatarValue = avatarDisplay;
    } else if (avatarDisplay && avatarDisplay.type === 'combined') {
      finalAvatarValue = avatarDisplay.url;
    } else {
      finalAvatarValue = '👤'; // Default if somehow nothing is set
    }
    
    // Validate avatar URL (redundant if already checked, but good for safety)
    if (finalAvatarValue.startsWith('http') && !finalAvatarValue.endsWith('.png')) {
        console.error('Attempted to save an invalid avatar URL:', finalAvatarValue);
        setFeedbackMessage('Invalid avatar image. Please try another combination.');
        return;
    }

    const userProfile = {
      username: username.trim(),
      avatar: finalAvatarValue,
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('userAvatar', finalAvatarValue); // Keep separate for ProfilePanel quick access
    localStorage.setItem('userDisplayName', username.trim()); // Keep separate for ProfilePanel quick access
    localStorage.setItem('profileCustomized', 'true');
    setFeedbackMessage('Profile saved successfully!');
    
    // Optionally, give feedback then close, or close immediately
    notifyProfileUpdate(); // Notify that the profile has been updated
    setTimeout(() => {
      closeProfileModal();
      setFeedbackMessage(''); // Clear feedback for next time
    }, 1000); // Close after 1 second to show success message
  };

  if (!isProfileModalOpen) {
    return null;
  }

  // Using styles similar to CustomizeProfilePage for now
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-dark-background/90 border border-primary/30 p-6 rounded-xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeProfileModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 transition-colors z-10"
          aria-label="Close profile customization"
        >
          <X size={28} />
        </button>
        
        {/* Content from CustomizeProfilePage */}
        <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
          Customize Your Profile
        </h1>

        {/* Avatar Display Area */}
        <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
          <AvatarDisplay avatar={typeof avatarDisplay === 'string' ? avatarDisplay : (avatarDisplay?.url || null)} size="w-full h-full" altText="Selected Avatar" className="text-7xl" />
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2 text-purple-300">Choose Your Avatar Emojis (up to 2)</h2>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2 mb-2">
            {emojiPalette.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className={`p-2 rounded-lg text-xl transition-all duration-200 ease-in-out transform hover:scale-110 focus:ring-2 focus:ring-pink-500
                  ${selectedEmojis.includes(emoji) ? 'bg-pink-600 ring-2 ring-pink-400' : 'bg-white/20 hover:bg-white/30'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="text-xs text-purple-400 mb-2 h-4">
            Selected: {selectedEmojis.join(' ')}
          </div>
          <h3 className="text-md font-semibold mb-1 text-purple-300">Or pick a preset:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presetAvatars.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-pink-500 text-center"
              >
                <AvatarDisplay avatar={preset.emojis} size="text-xl" className="block mb-0.5" altText={preset.name} />
                <span className="text-xs text-purple-300 block">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="username-modal" className="block text-lg font-semibold mb-1 text-purple-300">Username</label>
          <input 
            type="text" 
            id="username-modal" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your awesome username"
            className="w-full p-3 bg-white/20 border border-transparent rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-purple-400/70 text-white transition-shadow shadow-sm hover:shadow-md focus:shadow-lg"
          />
        </div>

        <button 
          onClick={handleSaveProfile}
          className="w-full py-3 px-6 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 rounded-lg text-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-pink-500/50 shadow-md"
        >
          Save Profile
        </button>
        {feedbackMessage && (
          <p className={`mt-3 text-center text-sm ${feedbackMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
            {feedbackMessage}
          </p>
        )}
      </div>
    </div>
  );
};
