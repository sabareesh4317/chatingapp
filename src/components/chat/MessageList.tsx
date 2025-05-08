import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  // Group messages by day
  const groupedMessages: { [key: string]: Message[] } = {};
  
  messages.forEach((message) => {
    // For messages that might not have a timestamp yet (e.g., optimistic updates)
    if (!message.createdAt) return;
    
    const date = message.createdAt.toDate();
    const day = format(date, 'yyyy-MM-dd');
    
    if (!groupedMessages[day]) {
      groupedMessages[day] = [];
    }
    
    groupedMessages[day].push(message);
  });
  
  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([day, dayMessages]) => (
        <div key={day}>
          <div className="flex justify-center mb-4">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
              {format(new Date(day), 'MMMM d, yyyy')}
            </div>
          </div>
          
          <div className="space-y-4">
            {dayMessages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              const hasBeenRead = message.readBy.some((id) => id !== currentUserId);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {message.senderPhotoURL ? (
                            <img
                              src={message.senderPhotoURL}
                              alt={message.senderName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                              {message.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {!isCurrentUser && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{message.senderName}</span>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                        }`}
                      >
                        {message.text}
                        
                        {message.media && (
                          <div className="mt-2">
                            {message.media.type === 'image' ? (
                              <a href={message.media.url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={message.media.url}
                                  alt="Shared image"
                                  className="max-w-full rounded-md"
                                />
                              </a>
                            ) : (
                              <video
                                src={message.media.url}
                                controls
                                className="max-w-full rounded-md"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-1 space-x-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.createdAt && format(message.createdAt.toDate(), 'h:mm a')}
                        </span>
                        
                        {isCurrentUser && (
                          <span className="ml-1">
                            {hasBeenRead ? (
                              <CheckCheck className="h-3 w-3 text-primary-500" />
                            ) : (
                              <Check className="h-3 w-3 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full py-8">
          <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
        </div>
      )}
    </div>
  );
};

export default MessageList;