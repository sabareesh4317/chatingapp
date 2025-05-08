import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
  online: boolean;
  friends: string[];
  pendingFriendRequests: {
    incoming: string[];
    outgoing: string[];
  };
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  createdAt: Timestamp;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  readBy: string[];
}

export interface ChatRoom {
  id?: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  createdBy: string;
  members: string[];
  isPrivate: boolean;
  invitedUsers: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
}

export interface PrivateChat {
  id?: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
  createdAt: Timestamp;
}

export interface FriendRequest {
  id?: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export type ThemeMode = 'light' | 'dark';