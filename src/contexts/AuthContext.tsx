import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextProps {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<FirebaseUser>;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  googleSignIn: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const createUserDocument = async (user: FirebaseUser, displayName?: string) => {
    if (!user.uid || !user.email) {
      throw new Error('Invalid user data for profile creation');
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        online: true,
        friends: [],
        pendingFriendRequests: {
          incoming: [],
          outgoing: []
        }
      });
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (!result?.user) {
        throw new Error('Failed to create user account');
      }

      // Update display name
      await updateProfile(result.user, { displayName });
      
      // Create user profile in Firestore
      await createUserDocument(result.user, displayName);
      
      return result.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result?.user) {
        throw new Error('Authentication failed: No user data received');
      }

      // Validate user object
      if (!result.user.uid || !result.user.email) {
        throw new Error('Invalid user data received from authentication');
      }

      // Ensure user document exists
      await createUserDocument(result.user);
      
      // Update user status
      const userRef = doc(db, 'users', result.user.uid);
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        online: true
      });
      
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/invalid-credential') {
          throw new Error('Invalid email or password');
        } else if (authError.code === 'auth/user-disabled') {
          throw new Error('This account has been disabled');
        } else if (authError.code === 'auth/too-many-requests') {
          throw new Error('Too many failed login attempts. Please try again later');
        }
      }
      
      throw error;
    }
  };

  // Sign in with Google
  const googleSignIn = async (): Promise<FirebaseUser> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result?.user) {
        throw new Error('Google authentication failed: No user data received');
      }

      // Validate user object
      if (!result.user.uid || !result.user.email) {
        throw new Error('Invalid user data received from Google authentication');
      }

      // Ensure user document exists
      await createUserDocument(result.user);
      
      // Update user status
      const userRef = doc(db, 'users', result.user.uid);
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        online: true
      });
      
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      
      // Enhanced error handling for Google sign-in
      if (error instanceof Error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in cancelled: The popup was closed');
        } else if (authError.code === 'auth/popup-blocked') {
          throw new Error('Popup blocked: Please allow popups for this site');
        }
      }
      
      throw error;
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp(),
          online: false
        });
      }
    } catch (error) {
      console.warn('Error updating user status on logout:', error);
    } finally {
      await signOut(auth);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    try {
      // Update auth profile if display name or photo URL is included
      if (data.displayName || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL
        });
      }
      
      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get user profile from Firestore
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as User);
          } else {
            // Create user document if it doesn't exist
            await createUserDocument(user);
            const newDocSnap = await getDoc(docRef);
            setUserProfile(newDocSnap.data() as User);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    login,
    googleSignIn,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};