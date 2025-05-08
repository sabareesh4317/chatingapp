import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { doc, collection, query, orderBy, onSnapshot, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PrivateChat as PrivateChatType, Message, User } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const PrivateChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState<PrivateChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch private chat data
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const chatRef = doc(db, 'privateChats', chatId);
    
    const unsubscribe = onSnapshot(chatRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as PrivateChatType;
        setChat(chatData);
        
        // Get the other user's data
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setOtherUser(userDoc.data() as User);
          }
        }
      } else {
        // Chat doesn't exist or user doesn't have access
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [chatId, currentUser, navigate]);

  // Fetch messages
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const q = query(
      collection(db, `privateChats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!chatId || !currentUser || messages.length === 0) return;

    const markMessagesAsRead = async () => {
      // Get messages not read by current user
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== currentUser.uid && !msg.readBy.includes(currentUser.uid)
      );

      // Mark each message as read
      for (const message of unreadMessages) {
        if (message.id) {
          const messageRef = doc(db, `privateChats/${chatId}/messages/${message.id}`);
          await updateDoc(messageRef, {
            readBy: arrayUnion(currentUser.uid)
          });
        }
      }
    };

    markMessagesAsRead();
  }, [chatId, currentUser, messages]);

  if (!chat || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/')} 
          className="md:hidden mr-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {otherUser.photoURL ? (
                <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  {otherUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {otherUser.online && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
            )}
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">{otherUser.displayName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {otherUser.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <MessageList messages={messages} currentUserId={currentUser?.uid || ''} />
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput
          roomId={chatId}
          currentUser={currentUser}
          isPrivateChat={true}
          onMessageSent={(text) => {
            // Update last message in chat
            const chatRef = doc(db, 'privateChats', chatId);
            updateDoc(chatRef, {
              lastMessage: {
                text,
                senderId: currentUser?.uid,
                createdAt: Timestamp.now()
              }
            });
          }}
        />
      </div>
    </div>
  );
};

export default PrivateChat;