import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Users, MessageCircle, Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChatRoom, PrivateChat, User } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [privateChats, setPrivateChats] = useState<{ chat: PrivateChat; user: User | null }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Fetch chat rooms
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessage.createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch private chats
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'privateChats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessage.createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats: { chat: PrivateChat; user: User | null }[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as PrivateChat;
        
        // Find the other participant
        const otherUserId = chatData.participants.find((id) => id !== currentUser.uid);
        
        if (otherUserId) {
          // Get user data using the correct doc reference
          const userDocRef = doc(db, 'users', otherUserId);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? { id: userDocSnap.id, ...userDocSnap.data() } as User : null;
          
          chats.push({ chat: chatData, user: userData });
        }
      }
      
      setPrivateChats(chats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter by search term
  const filteredChatRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrivateChats = privateChats.filter((chat) =>
    chat.user?.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 w-64 h-full border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Chat Rooms
            </h3>
            <Link
              to="/create-room"
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Create a new chat room"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-1">
            {filteredChatRooms.length > 0 ? (
              filteredChatRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/chat-room/${room.id}`}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === `/chat-room/${room.id}`
                      ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <MessageSquare className="h-5 w-5 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{room.name}</p>
                    {room.lastMessage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {room.lastMessage.text.substring(0, 20)}
                        {room.lastMessage.text.length > 20 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                No chat rooms found
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Direct Messages
            </h3>
            <Link
              to="/users"
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Find users to chat with"
            >
              <Users className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-1">
            {filteredPrivateChats.length > 0 ? (
              filteredPrivateChats.map(({ chat, user }) => (
                <Link
                  key={chat.id}
                  to={`/private-chat/${chat.id}`}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === `/private-chat/${chat.id}`
                      ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <MessageCircle className="w-full h-full p-1 text-gray-500" />
                      )}
                    </div>
                    {user?.online && (
                      <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="truncate">{user?.displayName || 'Unknown User'}</p>
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage.text.substring(0, 20)}
                        {chat.lastMessage.text.length > 20 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  {chat.lastMessage?.createdAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatDistanceToNow(chat.lastMessage.createdAt.toDate(), { addSuffix: true })}
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                No direct messages found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;