import React, { useState, useEffect } from 'react';
import { User, Upload, Camera, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Profile: React.FC = () => {
  const { userProfile, updateUserProfile, currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (!currentUser) {
      setError('No authenticated user found');
      return;
    }
    
    try {
      setLoading(true);
      
      let photoURL = userProfile?.photoURL || '';
      
      // Upload profile photo if changed
      if (photoFile) {
        const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Check if user document exists
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      // If document doesn't exist, create it
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          displayName,
          photoURL,
          email: currentUser.email,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Update user profile
      await updateUserProfile({
        displayName,
        photoURL,
      });
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
          <p>Update your personal information</p>
        </div>
        
        <div className="px-4 py-6 sm:p-6">
          {error && (
            <div className="p-3 mb-4 text-sm text-error-700 bg-error-100 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-3 mb-4 text-sm text-success-700 bg-success-100 rounded-md">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-600 shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                      <User className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click the camera icon to change your photo
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Your display name"
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;