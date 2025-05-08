import React, { useState, useRef } from 'react';
import { Send, Image, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { User as FirebaseUser } from 'firebase/auth';

interface MessageInputProps {
  roomId: string | undefined;
  currentUser: FirebaseUser | null;
  isPrivateChat: boolean;
  onMessageSent: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId, currentUser, isPrivateChat, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image or video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Please select an image or video file');
        return;
      }
      
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !mediaFile) || !currentUser || !roomId) return;
    
    try {
      setIsLoading(true);
      
      let mediaData = null;
      
      // Upload media if present
      if (mediaFile) {
        const storageRef = ref(storage, `${isPrivateChat ? 'private-chats' : 'chat-rooms'}/${roomId}/${Date.now()}_${mediaFile.name}`);
        await uploadBytes(storageRef, mediaFile);
        const mediaUrl = await getDownloadURL(storageRef);
        
        mediaData = {
          type: mediaFile.type.startsWith('image/') ? 'image' : 'video',
          url: mediaUrl
        };
      }
      
      // Create message
      const messageData = {
        text: message.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderPhotoURL: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        ...(mediaData && { media: mediaData }),
        readBy: [currentUser.uid]
      };
      
      // Add to appropriate collection
      const collectionPath = isPrivateChat 
        ? `privateChats/${roomId}/messages`
        : `chatRooms/${roomId}/messages`;
      
      await addDoc(collection(db, collectionPath), messageData);
      
      // Call the callback
      onMessageSent(message.trim());
      
      // Reset state
      setMessage('');
      clearMedia();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {mediaPreview && (
        <div className="relative inline-block mb-2">
          <div className="relative border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden" style={{ maxWidth: '200px' }}>
            {mediaFile?.type.startsWith('image/') ? (
              <img src={mediaPreview} alt="Preview" className="w-full h-auto max-h-40 object-cover" />
            ) : (
              <video src={mediaPreview} className="w-full h-auto max-h-40 object-cover" controls />
            )}
          </div>
          <button
            onClick={clearMedia}
            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1"
            title="Remove media"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full"
          title="Add media"
        >
          <Image className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:outline-none resize-none"
          disabled={isLoading}
        />
        
        <button
          type="submit"
          disabled={(!message.trim() && !mediaFile) || isLoading}
          className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;