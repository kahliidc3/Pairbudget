import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

export const signUp = async (email: string, password: string, name: string, preferredLanguage?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: name });
    
    // Create user profile in Firestore
    const userProfile: User = {
      uid: user.uid,
      name,
      email,
      pocketIds: [], // Initialize empty array for multiple pockets
      preferredLanguage: preferredLanguage || 'en',
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return { user, userProfile };
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>) => {
  try {
    // Filter out undefined values and handle special cases
    const cleanUpdates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        // For undefined values, use deleteField to remove the field
        cleanUpdates[key] = deleteField();
      } else {
        cleanUpdates[key] = value;
      }
    }
    
    await setDoc(doc(db, 'users', uid), cleanUpdates, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const addPocketToUser = async (uid: string, pocketId: string) => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const currentPocketIds = userProfile.pocketIds || [];
    if (!currentPocketIds.includes(pocketId)) {
      const updatedPocketIds = [...currentPocketIds, pocketId];
      await updateUserProfile(uid, { 
        pocketIds: updatedPocketIds,
        currentPocketId: pocketId // Set as current pocket
      });
    }
  } catch (error) {
    throw error;
  }
};

export const removePocketFromUser = async (uid: string, pocketId: string) => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const currentPocketIds = userProfile.pocketIds || [];
    const updatedPocketIds = currentPocketIds.filter(id => id !== pocketId);
    
    const updates: Partial<User> = { pocketIds: updatedPocketIds };
    
    // If the removed pocket was the current one, clear current pocket or set to another
    if (userProfile.currentPocketId === pocketId) {
      updates.currentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
    }
    
    await updateUserProfile(uid, updates);
  } catch (error) {
    throw error;
  }
}; 