import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';

const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'requests'>('list');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Friends</h2>
          <p>Manage your friends and friend requests</p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                activeTab === 'list'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              Friends List
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5 mx-auto mb-1" />
              Friend Requests
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'list' ? <FriendsList /> : <FriendRequests />}
        </div>
      </div>
    </div>
  );
};

export default Friends;