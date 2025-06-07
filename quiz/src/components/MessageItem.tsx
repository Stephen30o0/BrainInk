import * as React from 'react';
import { MessageWithSubject } from '../lib/store';

// Helper function to render structured content from backend
const renderStructuredContent = (content: any): React.ReactNode => {
  if (typeof content !== 'object' || content === null || React.isValidElement(content)) {
    return content; // Primitives, null, or already a valid React element
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => {
      const key = item?.props?.key || item?.key || index;
      const element = renderStructuredContent(item);
      return element ? <React.Fragment key={key}>{element}</React.Fragment> : null;
    });
  }

  const { type, props, ...rest } = content;

  if (typeof type !== 'string' || !type) {
    // console.warn('renderStructuredContent: Skipping element with invalid or missing type:', content);
    return null; // Skip elements with invalid type (e.g., {"type": {}} or data blobs without type)
  }

  const elementProps: { [key: string]: any } = { ...props };
  let renderedChildren: React.ReactNode = null;

  if (props && props.hasOwnProperty('children')) {
    const propChildren = props.children;
    if (propChildren) {
      if (Array.isArray(propChildren)) {
        renderedChildren = propChildren.map((child, index) => {
          const childKey = child?.props?.key || child?.key || index;
          const childElement = renderStructuredContent(child);
          return childElement ? <React.Fragment key={childKey}>{childElement}</React.Fragment> : null;
        });
      } else {
        renderedChildren = renderStructuredContent(propChildren);
      }
    }
    delete elementProps.children; // Handled as 3rd arg to createElement
  }

  // Remove string-based onClick handlers from backend, as they are not directly executable
  if (typeof elementProps.onClick === 'string') {
    // console.warn(`Stripping string onClick handler for type ${type}`);
    delete elementProps.onClick;
  }
  
  // Remove React internal-like props if they are still there
  if (rest.hasOwnProperty('_owner')) delete rest._owner;
  if (rest.hasOwnProperty('_store')) delete rest._store;

  // Combine rest with elementProps, preferring elementProps if collision
  const finalProps = {...rest, ...elementProps};

  try {
    return React.createElement(type, finalProps, renderedChildren);
  } catch (e) {
    // console.error(`Error creating element type "${type}" with props:`, finalProps, e);
    return <span className="text-red-500 p-2 bg-red-100 rounded">[Render Error for type: {type}]</span>;
  }
}; // Assuming MessageWithSubject is the correct type from your store
// import { User, Bot } from 'lucide-react'; // Example icons, can be adjusted. Using initials for now.

interface MessageItemProps {
  message: MessageWithSubject;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isKana = message.sender === 'kana';
  const isTyping = message.type === 'typing';

  // Timestamp formatting
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isTyping && isKana) {
    return (
      <div className="flex items-end space-x-2 mb-2 justify-start">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
          K {/* K.A.N.A. Avatar */}
        </div>
        <div className="px-4 py-3 rounded-xl bg-purple-700 text-white shadow-md max-w-xs md:max-w-md lg:max-w-lg">
          <p className="italic text-sm">{typeof message.content === 'string' ? message.content : 'K.A.N.A. is typing...'}</p>
        </div>
      </div>
    );
  }
  
  let bubbleClasses = "px-4 py-3 rounded-xl shadow-md max-w-xs md:max-w-md lg:max-w-lg";
  let wrapperClasses = "flex items-end space-x-2 mb-2";
  let avatarInitial = '';
  let avatarBgColor = '';
  let timestampAlignment = "text-right";

  if (isUser) {
    bubbleClasses += " bg-blue-600 text-white";
    wrapperClasses += " justify-end";
    avatarInitial = 'U';
    avatarBgColor = 'bg-blue-500';
  } else if (isKana) {
    bubbleClasses += " bg-purple-700 text-white"; 
    wrapperClasses += " justify-start";
    avatarInitial = 'K';
    avatarBgColor = 'bg-purple-600';
    timestampAlignment = "text-left"; // KANA's timestamp can be left aligned if preferred, or keep right
  } else { 
    bubbleClasses += " bg-gray-500 text-white";
    wrapperClasses += " justify-start";
    avatarInitial = '?';
    avatarBgColor = 'bg-gray-400';
  }

  return (
    <div className={wrapperClasses}>
      {isKana && (
        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${avatarBgColor} flex items-center justify-center text-white font-semibold`}>
          {avatarInitial}
        </div>
      )}
      <div className={bubbleClasses}>
        {/* Special rendering for image_with_explanation type */}
        {(message.type === 'image_with_explanation' || message.type === 'mathematical_graph') && message.imageUrl && (
          <img src={message.imageUrl} alt={typeof message.content === 'string' ? message.content.substring(0,50) : 'Generated image'} className="my-2 rounded-lg max-w-full h-auto shadow-md" />
        )}
        {/* Render message content: string, valid React element, or attempt to render structured object */}
        {(typeof message.content === 'string') ?
          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p> :
          (React.isValidElement(message.content)) ?
            message.content :
            (typeof message.content === 'object' && message.content !== null) ?
              renderStructuredContent(message.content) :
              <p className="text-sm break-words whitespace-pre-wrap text-orange-500">[Unsupported Message Content Type]</p>
        }
        <p className={`text-xs text-gray-300 mt-1 ${timestampAlignment}`}>{formatTimestamp(message.timestamp)}</p>
      </div>
      {isUser && (
        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${avatarBgColor} flex items-center justify-center text-white font-semibold`}>
          {avatarInitial}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
