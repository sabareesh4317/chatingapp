import React from 'react';
import { LogOut, User as UserIcon, X, Crown } from 'lucide-react';
import { User } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface UserListProps {
  members: User[];
  currentUserId: string;
  onClose: () => void;
  onLeaveRoom: () => void;
  isCreator: boolean;
}

const UserList: React.FC<UserListProps> = ({ members, currentUserId, onClose, onLeaveRoom, isCreator }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Members ({members.length})</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.uid === currentUserId;
            const isRoomCreator = isCreator && isCurrentUser;
            
            return (
              <div
                key={member.uid}
                className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                        <UserIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  {member.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.displayName || 'User'}{isCurrentUser && ' (You)'}
                    </p>
                    {isRoomCreator && (
                      <span className="ml-2">
                        <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.online ? 'Online' : member.lastSeen ? `Last seen ${formatDistanceToNow(member.lastSeen.toDate(), { addSuffix: true })}` : 'Offline'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLeaveRoom}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default UserList;