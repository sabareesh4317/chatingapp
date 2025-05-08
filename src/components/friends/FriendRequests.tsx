import React, { useState, useEffect } from 'react';
import { User, Check, X, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { FriendRequest, User as UserType } from '../../types';

const FriendRequests: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<(FriendRequest & { sender: UserType })[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<(FriendRequest & { receiver: UserType })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const fetchRequests = async () => {
      try {
        // Fetch incoming requests
        const incomingSnapshot = await getDocs(
          query(
            collection(db, 'friendRequests'),
            where('receiverId', '==', currentUser.uid),
            where('status', '==', 'pending')
          )
        );

        // Fetch outgoing requests
        const outgoingSnapshot = await getDocs(
          query(
            collection(db, 'friendRequests'),
            where('senderId', '==', currentUser.uid),
            where('status', '==', 'pending')
          )
        );

        // Get user data for each request
        const incomingWithUsers = await Promise.all(
          incomingSnapshot.docs.map(async (doc) => {
            const request = { id: doc.id, ...doc.data() } as FriendRequest;
            const senderDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', request.senderId))
            );
            return {
              ...request,
              sender: senderDoc.docs[0].data() as UserType
            };
          })
        );

        const outgoingWithUsers = await Promise.all(
          outgoingSnapshot.docs.map(async (doc) => {
            const request = { id: doc.id, ...doc.data() } as FriendRequest;
            const receiverDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', request.receiverId))
            );
            return {
              ...request,
              receiver: receiverDoc.docs[0].data() as UserType
            };
          })
        );

        setIncomingRequests(incomingWithUsers);
        setOutgoingRequests(outgoingWithUsers);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching friend requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentUser]);

  const handleAcceptRequest = async (request: FriendRequest & { sender: UserType }) => {
    if (!currentUser || !request.id) return;

    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // Add each user to the other's friends list
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayUnion(request.senderId)
      });

      await updateDoc(doc(db, 'users', request.senderId), {
        friends: arrayUnion(currentUser.uid)
      });

      // Update local state
      setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err: any) {
      setError(err.message);
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!requestId) return;

    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error rejecting friend request:', err);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!requestId) return;

    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setOutgoingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error canceling friend request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-error-700 bg-error-100 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Incoming Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Incoming Requests</h3>
        {incomingRequests.length > 0 ? (
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {request.sender.photoURL ? (
                      <img src={request.sender.photoURL} alt={request.sender.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {request.sender.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                  )}
                </div>

                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.sender.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Wants to be your friend
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request)}
                    className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-full"
                    title="Accept request"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id!)}
                    className="p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-full"
                    title="Reject request"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No incoming friend requests</p>
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sent Requests</h3>
        {outgoingRequests.length > 0 ? (
          <div className="space-y-3">
            {outgoingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {request.receiver.photoURL ? (
                      <img src={request.receiver.photoURL} alt={request.receiver.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {request.receiver.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
                  )}
                </div>

                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.receiver.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Request pending
                  </p>
                </div>

                <button
                  onClick={() => handleCancelRequest(request.id!)}
                  className="p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-full"
                  title="Cancel request"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No outgoing friend requests</p>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;