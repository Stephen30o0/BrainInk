interface AvatarDisplayProps {
  avatar: string | null | undefined;
  size?: number | string; // Can be number (pixels) or string (e.g., 'w-16 h-16', 'text-4xl')
  className?: string; // Allow additional classes for custom styling
  altText?: string;
  fallbackText?: string; // New prop for custom text fallback
}

const AvatarDisplay = ({ 
  avatar,
  size = 40, // Default size in pixels if number, or can be a class string
  className = '',
  altText = 'User Avatar',
  fallbackText = '👤' // Default fallback emoji
}: AvatarDisplayProps) => {
  const isUrl = avatar && (avatar.startsWith('http') || avatar.includes('/'));
  const isEmoji = avatar && !isUrl && avatar.length <= 2; // Simple check for emoji (1-2 chars)

  let sizeClasses = '';
  let textFontSize = 'text-2xl'; // Default text size if size prop is a string like 'w-10 h-10'

  if (typeof size === 'number') {
    sizeClasses = `w-${size}px h-${size}px`; // Note: Tailwind JIT might need w-[${size}px] h-[${size}px]
    // Determine a somewhat proportional text size if size is numeric
    if (size >= 64) textFontSize = 'text-4xl'; // e.g., 64px avatar, 4xl text
    else if (size >= 40) textFontSize = 'text-2xl'; // e.g., 40px avatar, 2xl text
    else textFontSize = 'text-xl'; // Smaller avatars, xl text
  } else if (typeof size === 'string') {
    // If size is a string, it's assumed to be Tailwind classes like 'w-16 h-16' or 'text-4xl'
    if (size.includes('text-')) {
      textFontSize = size; // If 'text-xl' is passed, use it directly for emoji
      // Try to infer w/h for the container if only text size is given for emoji context
      if (size === 'text-5xl') sizeClasses = 'w-20 h-20'; // Approx for text-5xl
      else if (size === 'text-4xl') sizeClasses = 'w-16 h-16'; // Approx for text-4xl
      else if (size === 'text-2xl') sizeClasses = 'w-10 h-10'; // Approx for text-2xl
      else sizeClasses = 'w-8 h-8'; // Default small size
    } else {
      sizeClasses = size; // Assume 'w-16 h-16' etc.
      // Infer text size from common w/h classes if possible
      if (size.includes('w-20') || size.includes('h-20')) textFontSize = 'text-5xl';
      else if (size.includes('w-16') || size.includes('h-16')) textFontSize = 'text-4xl';
      else if (size.includes('w-10') || size.includes('h-10')) textFontSize = 'text-2xl';
    }
  }

  const containerBaseClasses = 'flex items-center justify-center overflow-hidden rounded-lg';

  if (isUrl) {
    return (
      <img 
        src={avatar} 
        alt={altText} 
        className={`${containerBaseClasses} ${sizeClasses} object-cover ${className}`}
      />
    );
  }

  if (isEmoji) {
    return (
      <span 
        className={`${containerBaseClasses} ${sizeClasses} ${textFontSize} ${className}`}
        role="img"
        aria-label={altText}
      >
        {avatar}
      </span>
    );
  }

  // Default placeholder
  return (
    <span 
      className={`${containerBaseClasses} ${sizeClasses} ${textFontSize} bg-gray-700 text-gray-400 ${className}`}
      role="img"
      aria-label={altText || "User Avatar"} // Use altText for label, or generic if not provided
    >
      {fallbackText}
    </span>
  );
};

export default AvatarDisplay;
