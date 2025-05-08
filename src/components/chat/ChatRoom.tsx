import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { doc, collection, query, orderBy, onSnapshot, getDoc, updateDoc, arrayUnion, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType, Message, User } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ChatRoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat room data
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const roomRef = doc(db, 'chatRooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoom({ id: doc.id, ...doc.data() } as ChatRoomType);
      } else {
        // Room doesn't exist or user doesn't have access
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [roomId, currentUser, navigate]);

  // Fetch messages
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const q = query(
      collection(db, `chatRooms/${roomId}/messages`),
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
  }, [roomId, currentUser]);

  // Fetch room members
  useEffect(() => {
    if (!room || !room.members || room.members.length === 0) return;

    const fetchMembers = async () => {
      const memberPromises = room.members.map(async (userId) => {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return { id: userDoc.id, ...userDoc.data() } as User;
        }
        return null;
      });

      const memberData = await Promise.all(memberPromises);
      setMembers(memberData.filter((user): user is User => user !== null));
    };

    fetchMembers();
  }, [room]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle leaving the chat room
  const handleLeaveRoom = async () => {
    if (!roomId || !currentUser || !room) return;

    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      
      // If user is the only member or the creator, delete the room
      if (room.members.length === 1 || room.createdBy === currentUser.uid) {
        await deleteDoc(roomRef);
      } else {
        // Otherwise just remove the user from members
        await updateDoc(roomRef, {
          members: room.members.filter((id) => id !== currentUser.uid)
        });
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')} 
            className="md:hidden mr-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">{room.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{room.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
            title="Show members"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <MessageList messages={messages} currentUserId={currentUser?.uid || ''} />
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <MessageInput
              roomId={roomId}
              currentUser={currentUser}
              isPrivateChat={false}
              onMessageSent={(text) => {
                // Update last message in room
                const roomRef = doc(db, 'chatRooms', roomId);
                updateDoc(roomRef, {
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

        {showUserList && (
          <div className="w-64 border-l border-gray-200 dark:border-gray-700 overflow-y-auto animate-fade-in">
            <UserList
              members={members}
              currentUserId={currentUser?.uid || ''}
              onClose={() => setShowUserList(false)}
              onLeaveRoom={handleLeaveRoom}
              isCreator={room.createdBy === currentUser?.uid}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;