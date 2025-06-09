import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import utility functions for Emoji Kitchen
import { getSpecificCombinationUrl } from '../lib/emojiKitchenUtils';



// Helper to convert emoji char to hex codepoint string
const getCodepoint = (emoji: string): string | undefined => {
  if (!emoji || typeof emoji.codePointAt !== 'function') return undefined;
  const codePoint = emoji.codePointAt(0);
  if (codePoint === undefined) return undefined;
  return codePoint.toString(16);
  // The original padding logic like `0000${hex}`.slice(-5) might be needed depending on `pairsStringData` format.
  // For now, using direct hex, assuming pairsStringData matches this.
};

// Placeholder for preset avatars - these are just examples
const presetAvatars = [
  { id: 'pa1', emojis: '✨🧠✨', name: 'Sparkling Mind' },
  { id: 'pa2', emojis: '🚀💡', name: 'Idea Rocket' },
  { id: 'pa3', emojis: '📚🤓', name: 'Bookworm' },
  { id: 'pa4', emojis: '🎮🏆', name: 'Game Champion' },
];

// Placeholder for individual selectable emojis
const emojiPalette = ['😀', '😂', '😍', '🤔', '😎', '🥳', '🤯', '🔥', '✨', '🧠', '💡', '📚', '🚀', '🎮', '🏆', '🎨', '🔬', '💻', '🌟'];

export const CustomizeProfilePage = () => {
  const navigate = useNavigate();
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [avatarDisplay, setAvatarDisplay] = useState<string | { type: 'combined'; url: string } | null>(null);
  // Removed validPairsMap state and the useEffect that called getProcessedEmojiData

  useEffect(() => {
    console.log('[EFFECT] selectedEmojis changed:', JSON.stringify(selectedEmojis)); // Log 0
    if (selectedEmojis.length === 0) {
      console.log('[EFFECT] Path A: No emojis selected, setting avatarDisplay to null.');
      setAvatarDisplay(null);
      return;
    }

    const firstEmoji = selectedEmojis[0];
    console.log(`[EFFECT] firstEmoji: ${firstEmoji}`); // Log 1
    if (selectedEmojis.length >= 2) {
      const secondEmoji = selectedEmojis[1];
      console.log(`[EFFECT] secondEmoji: ${secondEmoji}`); // Log 2
      const cp1 = getCodepoint(firstEmoji);
      const cp2 = getCodepoint(secondEmoji);
      console.log(`[EFFECT] cp1: ${cp1}, cp2: ${cp2}`); // Log 3

      if (cp1 && cp2) {
        const combinationUrl = getSpecificCombinationUrl(cp1, cp2);
        console.log('[EFFECT] Raw combinationUrl from util:', combinationUrl); // Log the raw URL
        if (combinationUrl && combinationUrl.endsWith('.png')) { // Check for .png
          console.log(`[EFFECT] Combination URL found and valid: ${combinationUrl}`);
          setAvatarDisplay({ type: 'combined', url: combinationUrl });
        } else {
          if (combinationUrl) { // Log if URL exists but is invalid
            console.error(`[EFFECT] Invalid combination URL (expected .png): ${combinationUrl}`);
          }
          console.log('[EFFECT] Path C: No valid combination found, setting avatarDisplay to firstEmoji.');
          setAvatarDisplay(firstEmoji); // Fallback if no specific or valid combination
        }
        return; // Processed two emojis, exit effect
      } else { 
        // This case implies one or both codepoints failed, despite selectedEmojis.length >= 2
        // This might be redundant if getCodepoint handles errors robustly by returning undefined
        // and the outer if (!cp1 || !cp2) catches it. However, to be safe:
        console.log('[EFFECT] Path B: Codepoint failed for one or both emojis, setting avatarDisplay to firstEmoji.');
        setAvatarDisplay(firstEmoji); 
        return;
      }
    }
    // If only one emoji is selected, or if cp1/cp2 failed above and it fell through
    // (though the 'return' statements should prevent fall-through for the cp1/cp2 failure case)
    // The original logic had a path for !cp1 || !cp2 which set avatarDisplay to firstEmoji.
    // If selectedEmojis.length is 1, it will also fall here.
    console.log('[EFFECT] Path D: Single emoji or fallback, setting avatarDisplay to firstEmoji.');
    setAvatarDisplay(firstEmoji);

  }, [selectedEmojis]);

  // Helper function to get codepoint (ensure it's defined or moved if not already)
  // function getCodepoint(emoji: string): string | undefined { ... }
  // Assuming getCodepoint is defined above or imported

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmojis(prev => {
      let newSelection = [...prev];
      if (newSelection.includes(emoji)) {
        newSelection = newSelection.filter(e => e !== emoji);
      } else {
        if (newSelection.length < 2) {
          newSelection.push(emoji);
        } else {
          // Replace the last selected emoji if already two are selected
          newSelection = [newSelection[0], emoji]; 
        }
      }
      console.log('[handleEmojiSelect] newSelection:', newSelection);
      return newSelection;
    });
  };

  const handlePresetSelect = (preset: { emojis: string }) => {
    // Assuming preset.emojis is a string of 1 or 2 emojis
    const emojis = Array.from(preset.emojis).slice(0, 2);
    setSelectedEmojis(emojis);
    console.log('[handlePresetSelect] selectedEmojis set to:', emojis);
  };

  const handleSaveProfile = async () => {
    setFeedbackMessage(''); // Clear previous messages
    if (!username.trim()) {
      setFeedbackMessage('Username cannot be empty.');
      return;
    }
    if (selectedEmojis.length === 0) { // Check if any emoji is selected for the avatar
      setFeedbackMessage('Please select at least one emoji for your avatar.');
      return;
    }

    console.log('Saving profile with:', { username, selectedEmojis, avatarDisplay });

    // Determine avatarToSave based on avatarDisplay state
    let avatarToSave: string;
    if (avatarDisplay === null) {
      // This case implies no specific avatar was formed or selected, 
      // default to the first selected emoji if available, or empty if none (though caught by above check).
      avatarToSave = selectedEmojis.length > 0 ? selectedEmojis[0] : ''; 
    } else if (typeof avatarDisplay === 'string') {
      avatarToSave = avatarDisplay; // Single emoji or preset string
    } else { // Combined emoji: avatarDisplay is { type: 'combined'; url: string }
      if (avatarDisplay.url && avatarDisplay.url.endsWith('.png')) {
        avatarToSave = avatarDisplay.url;
      } else {
        console.error('Attempted to save invalid avatar URL:', avatarDisplay.url);
        // Fallback to first selected emoji or empty string if URL is bad
        avatarToSave = selectedEmojis.length > 0 ? selectedEmojis[0] : ''; 
        setFeedbackMessage('Error with avatar image, using fallback.'); // User feedback
      }
    }

    localStorage.setItem('userAvatar', avatarToSave);
    localStorage.setItem('userDisplayName', username);
    localStorage.setItem('profileCustomized', 'true');

    setFeedbackMessage('Profile saved successfully! Redirecting...');
    setTimeout(() => {
      navigate('/townsquare'); // Navigate to a common authenticated entry point
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex flex-col items-center p-4 md:p-8">
      <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
          Customize Your Profile
        </h1>

        {/* Avatar Display */}
        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center text-6xl md:text-7xl overflow-hidden shadow-lg ring-4 ring-purple-500/50">
          {typeof avatarDisplay === 'string' ? (
            <span>{avatarDisplay || '👤'}</span>
          ) : avatarDisplay && avatarDisplay.type === 'combined' ? (
            <img src={avatarDisplay.url} alt="Combined Emoji Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>

        {/* Emoji Selection for Avatar */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-purple-300">Choose Your Avatar Emojis (up to 2)</h2>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-3">
            {emojiPalette.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className={`p-2 rounded-lg text-2xl transition-all duration-200 ease-in-out transform hover:scale-110 focus:ring-2 focus:ring-pink-500
                  ${selectedEmojis.includes(emoji) ? 'bg-pink-600 ring-2 ring-pink-400' : 'bg-white/20 hover:bg-white/30'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="text-sm text-purple-400 mb-3">
            Selected: {selectedEmojis.join(' ')}
          </div>
          <h3 className="text-lg font-semibold mb-2 text-purple-300">Or pick a preset:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {presetAvatars.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-pink-500 text-center"
              >
                <span className="text-2xl block mb-1">{preset.emojis}</span>
                <span className="text-xs text-purple-300">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Username Input */}
        <div className="mb-8">
          <label htmlFor="username" className="block text-xl font-semibold mb-2 text-purple-300">Username</label>
          <input 
            type="text" 
            id="username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your awesome username"
            className="w-full p-3 bg-white/20 border border-transparent rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-purple-400/70 text-white transition-shadow shadow-md hover:shadow-lg focus:shadow-xl"
          />
        </div>

        {/* Save Button and Feedback */}
        <button 
          onClick={handleSaveProfile}
          className="w-full py-3 px-6 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 rounded-lg text-xl font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-pink-500/50 shadow-lg"
        >
          Save Profile
        </button>
        {feedbackMessage && (
          <p className={`mt-4 text-center ${feedbackMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
            {feedbackMessage}
          </p>
        )}

      </div>
      
      <button 
        onClick={() => navigate(-1)} 
        className="mt-8 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors duration-150 focus:ring-2 focus:ring-pink-500"
      >
        Back
      </button>
    </div>
  );
};
