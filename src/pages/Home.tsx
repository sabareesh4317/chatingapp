import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Plus } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ChatRoom, PrivateChat } from '../types';

const Home: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [recentRooms, setRecentRooms] = useState<ChatRoom[]>([]);
  const [recentChats, setRecentChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);

  // Fetch recent chat rooms and direct messages
  useEffect(() => {
    if (!currentUser) return;

    const fetchRecentActivity = async () => {
      try {
        // Get recent chat rooms
        const roomsQuery = query(
          collection(db, 'chatRooms'),
          where('members', 'array-contains', currentUser.uid),
          orderBy('lastMessage.createdAt', 'desc'),
          limit(4)
        );
        
        // Get recent private chats
        const chatsQuery = query(
          collection(db, 'privateChats'),
          where('participants', 'array-contains', currentUser.uid),
          orderBy('lastMessage.createdAt', 'desc'),
          limit(4)
        );
        
        try {
          const [roomsSnapshot, chatsSnapshot] = await Promise.all([
            getDocs(roomsQuery),
            getDocs(chatsQuery)
          ]);
          
          const rooms: ChatRoom[] = [];
          roomsSnapshot.forEach((doc) => {
            rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
          });
          
          const chats: PrivateChat[] = [];
          chatsSnapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() } as PrivateChat);
          });
          
          setRecentRooms(rooms);
          setRecentChats(chats);
          setIndexBuilding(false);
        } catch (error: any) {
          if (error.message && error.message.includes('index is currently building')) {
            setIndexBuilding(true);
          } else {
            console.error('Error fetching recent activity:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (indexBuilding) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome{userProfile ? `, ${userProfile.displayName}` : ''}!
          </h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mt-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              We're setting up some things in the background. This might take a minute or two. Please wait...
            </p>
          </div>
          <div className="mt-8">
            <div className="inline-flex items-center px-4 py-2 font-semibold text-yellow-900 bg-yellow-100 border border-yellow-200 rounded-md">
              <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Setting up database indexes...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome{userProfile ? `, ${userProfile.displayName}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect and chat with friends in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Chat Rooms */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Chat Rooms</h2>
            <Link
              to="/create-room"
              className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Room
            </Link>
          </div>
          
          {recentRooms.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/chat-room/${room.id}`}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900 p-2">
                    <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{room.name}</p>
                    {room.lastMessage ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {room.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No messages yet</p>
                    )}
                  </div>
                  <div className="ml-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't joined any chat rooms yet.</p>
              <Link
                to="/create-room"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create a Room
              </Link>
            </div>
          )}
          
          {recentRooms.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-center">
              <Link
                to="/"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              >
                View all chat rooms
              </Link>
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Direct Messages</h2>
            <Link
              to="/users"
              className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              <Users className="w-4 h-4 mr-1" />
              Find Users
            </Link>
          </div>
          
          {recentChats.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/private-chat/${chat.id}`}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Direct Message
                    </p>
                    {chat.lastMessage ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No messages yet</p>
                    )}
                  </div>
                  <div className="ml-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any direct messages yet.</p>
              <Link
                to="/users"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Users
              </Link>
            </div>
          )}
          
          {recentChats.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-center">
              <Link
                to="/"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              >
                View all direct messages
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Create a Room</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Start a new chat room for group discussions.
          </p>
          <Link
            to="/create-room"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Room
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Find Users</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Discover users and start direct conversations.
          </p>
          <Link
            to="/users"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-md hover:bg-secondary-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Browse Users
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Update your personal information and avatar.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-600 rounded-md hover:bg-accent-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;