import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MessageSquare, UserMinus, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserType } from '../../types';

const FriendsList: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [friends, setFriends] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser || !userProfile?.friends) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const friendsData: UserType[] = [];
        
        for (const friendId of userProfile.friends) {
          const friendDoc = await getDocs(
            query(collection(db, 'users'), where('uid', '==', friendId))
          );
          
          if (!friendDoc.empty) {
            friendsData.push(friendDoc.docs[0].data() as UserType);
          }
        }
        
        setFriends(friendsData);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser, userProfile]);

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      // Remove friend from current user's friends list
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayRemove(friendId)
      });

      // Remove current user from friend's friends list
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(currentUser.uid)
      });

      // Update local state
      setFriends(friends.filter(friend => friend.uid !== friendId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error removing friend:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-error-700 bg-error-100 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div
              key={friend.uid}
              className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                {friend.online && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                )}
              </div>

              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{friend.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {friend.online ? 'Online' : 'Offline'}
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/chat/${friend.uid}`}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Send message"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => removeFriend(friend.uid)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Remove friend"
                >
                  <UserMinus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any friends yet.</p>
          <Link
            to="/users"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <User className="w-4 h-4 mr-2" />
            Find Users
          </Link>
        </div>
      )}
    </div>
  );
};

export default FriendsList;