import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Search, MessageSquare } from 'lucide-react';
import { collection, query, getDocs, where, doc, getDoc, setDoc, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

const UserDirectory: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all users
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const usersList: User[] = [];
        
        querySnapshot.forEach((doc) => {
          usersList.push(doc.data() as User);
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Filter by search term
  const filteredUsers = searchTerm
    ? users.filter((user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // Start or continue a private chat
  const startPrivateChat = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      // Check if a chat exists with participants in either order
      const q = query(
        collection(db, 'privateChats'),
        or(
          where('participants', '==', [currentUser.uid, userId]),
          where('participants', '==', [userId, currentUser.uid])
        )
      );
      
      const snapshot = await getDocs(q);
      
      // Use existing chat if found
      if (!snapshot.empty) {
        navigate(`/private-chat/${snapshot.docs[0].id}`);
        return;
      }
      
      // Create a new private chat if none exists
      const chatRef = await addDoc(collection(db, 'privateChats'), {
        participants: [currentUser.uid, userId],
        createdAt: serverTimestamp(),
      });
      
      navigate(`/private-chat/${chatRef.id}`);
    } catch (error) {
      console.error('Error starting private chat:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">User Directory</h2>
          <p>Find people to chat with</p>
        </div>
        
        <div className="p-4">
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading users...</div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    {user.online && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => startPrivateChat(user.uid)}
                    className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Start chat"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No users found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDirectory;