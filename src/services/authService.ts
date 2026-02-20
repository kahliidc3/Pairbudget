import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Pocket, User } from '@/types';
import { enforceRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import { writeAuditLog } from '@/lib/audit';

const SIGN_UP_RATE_LIMIT_ERROR = 'Too many sign up attempts. Please wait and try again.';
const SIGN_UP_GENERIC_ERROR = 'Unable to complete signup. Please try again later.';

/**
 * Registers a new user account and creates the corresponding Firestore user profile.
 */
export const signUp = async (email: string, password: string, name: string, preferredLanguage?: string) => {
  try {
    enforceRateLimit({
      key: `sign-up:${email.trim().toLowerCase()}`,
      windowMs: 60_000,
      maxRequests: 3,
      errorMessage: SIGN_UP_RATE_LIMIT_ERROR,
    });

    logger.debug('Starting user registration process', { context: { email } });
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    logger.debug('Firebase Auth user created successfully');
    
    await updateProfile(user, { displayName: name });
    logger.debug('User display name updated successfully');
    
    const userProfile: User = {
      uid: user.uid,
      name,
      email,
      pocketIds: [],
      preferredLanguage: preferredLanguage || 'en',
      preferredCurrency: 'MAD',
      createdAt: new Date(),
    };
    
    logger.debug('Attempting to persist user profile');
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      const verificationDoc = await getDoc(doc(db, 'users', user.uid));
      if (verificationDoc.exists()) {
        logger.debug('User profile verification successful');
        return { user, userProfile };
      }

      logger.error('User profile verification failed after creation.');
      throw new Error(SIGN_UP_GENERIC_ERROR);
    } catch (firestoreError) {
      logger.error('Error during user profile creation', { error: firestoreError });
      
      try {
        await user.delete();
        logger.debug('Rolled back Firebase Auth user after profile creation failure');
      } catch (cleanupError) {
        logger.error('Failed to rollback Firebase Auth user after profile failure', { error: cleanupError });
      }
      
      throw new Error(SIGN_UP_GENERIC_ERROR);
    }
  } catch (error) {
    if (error instanceof Error && (error.message === SIGN_UP_GENERIC_ERROR || error.message === SIGN_UP_RATE_LIMIT_ERROR)) {
      throw error;
    }
    
    logger.error('Sign up error', { error, context: { email } });
    throw new Error(SIGN_UP_GENERIC_ERROR);
  }
};

/**
 * Signs in an existing user with email/password credentials.
 */
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

/**
 * Signs out the current user session.
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches a single user profile by UID.
 */
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
    
    // User document doesn't exist in Firestore
    logger.warn('User profile not found for the requested user.', { context: { uid } });
    return null;
  } catch (error: unknown) {
    logger.error('Error fetching user profile', { error, context: { uid } });
    
    // Check if it's a network error or permission error
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'unavailable' || firebaseError.code === 'permission-denied') {
      logger.error('Network or permission error when fetching user profile', { error, context: { uid } });
      throw error; // Re-throw to trigger sign-out in AuthProvider
    }
    
    return null;
  }
};

/**
 * Fetches multiple user profiles using chunked `in` queries.
 */
export const getUserProfilesBatch = async (uids: string[]): Promise<Record<string, User>> => {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  if (uniqueUids.length === 0) {
    return {};
  }

  const results: Record<string, User> = {};
  const chunkSize = 10; // Firestore "in" queries support up to 10 elements

  for (let i = 0; i < uniqueUids.length; i += chunkSize) {
    const chunk = uniqueUids.slice(i, i + chunkSize);
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', 'in', chunk)
    );

    try {
      const snapshot = await getDocs(usersQuery);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        results[docSnap.id] = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      logger.error('Error fetching user profiles batch', { error, context: { chunkSize: chunk.length } });
      // Continue to next chunk; missing users will fall back to Unknown User
    }
  }

  return results;
};

/**
 * Partially updates user profile fields and removes fields passed as `undefined`.
 */
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

/**
 * Adds a pocket membership to the user profile if it is not already present.
 */
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

/**
 * Removes a pocket membership from the user profile and updates current pocket fallback.
 */
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

/**
 * Creates a missing Firestore profile for an existing Firebase Auth user.
 */
export const createMissingUserProfile = async (uid: string, email: string, name: string, preferredLanguage = 'en') => {
  try {
    logger.debug('Creating missing user profile record', { context: { uid } });
    
    const userProfile: User = {
      uid,
      name,
      email,
      pocketIds: [],
      preferredLanguage,
      preferredCurrency: 'MAD',
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', uid), userProfile);
    logger.debug('Missing user profile created successfully', { context: { uid } });
    
    // Verify creation
    const verificationDoc = await getDoc(doc(db, 'users', uid));
    if (verificationDoc.exists()) {
      logger.debug('User profile verification successful', { context: { uid } });
      return userProfile;
    } else {
      throw new Error('Unable to verify user profile creation.');
    }
  } catch (error) {
    logger.error('Error creating missing user profile', { error, context: { uid } });
    throw error;
  }
};

const commitDeletesInChunks = async (refs: DocumentReference[]) => {
  if (refs.length === 0) {
    return;
  }

  let batch = writeBatch(db);
  let operations = 0;
  const commits: Promise<void>[] = [];

  refs.forEach((ref, index) => {
    batch.delete(ref);
    operations++;

    if (operations === 400 || index === refs.length - 1) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      operations = 0;
    }
  });

  await Promise.all(commits);
};

const ensurePocketCleanup = async (pocketId: string, userUid: string) => {
  const pocketRef = doc(db, 'pockets', pocketId);
  const pocketSnapshot = await getDoc(pocketRef);

  if (!pocketSnapshot.exists()) {
    return;
  }

  const pocketData = pocketSnapshot.data() as Pocket;
  const participants = (pocketData.participants || []).filter(id => id !== userUid);
  const updatedRoles = { ...(pocketData.roles || {}) };
  delete updatedRoles[userUid];

  const updates: Record<string, unknown> = {
    participants,
    roles: updatedRoles,
  };

  if (participants.length === 0) {
    updates.deleted = true;
    updates.deletedAt = new Date();
    updates.deletedBy = userUid;
  } else if (!Object.values(updatedRoles).includes('provider')) {
    const reassignedProvider = participants[0];
    if (reassignedProvider) {
      updatedRoles[reassignedProvider] = 'provider';
      updates.roles = updatedRoles;
      await writeAuditLog({
        actorUid: userUid,
        action: 'pocket.role.reassigned',
        targetId: pocketId,
        targetType: 'pocket',
        metadata: { reassignedProvider },
      });
    }
  }

  await updateDoc(pocketRef, updates);

  if (participants.length === 0) {
    const pocketTransactionsSnapshot = await getDocs(
      query(collection(db, 'transactions'), where('pocketId', '==', pocketId))
    );

    if (!pocketTransactionsSnapshot.empty) {
      const refs = pocketTransactionsSnapshot.docs.map(docSnap => docSnap.ref);
      await commitDeletesInChunks(refs);
    }
  }
};

/**
 * Deletes the currently authenticated user account and cascades cleanup of related data.
 */
export const deleteUserAccountAndData = async (): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be signed in to delete your account.');
  }

  const userUid = currentUser.uid;

  try {
    const userProfile = await getUserProfile(userUid);

    if (userProfile?.pocketIds?.length) {
      for (const pocketId of userProfile.pocketIds) {
        await ensurePocketCleanup(pocketId, userUid);
      }
    }

    const userTransactionsSnapshot = await getDocs(
      query(collection(db, 'transactions'), where('userId', '==', userUid))
    );

    if (!userTransactionsSnapshot.empty) {
      const refs = userTransactionsSnapshot.docs.map(docSnap => docSnap.ref);
      await commitDeletesInChunks(refs);
    }

    await deleteDoc(doc(db, 'users', userUid));
    await writeAuditLog({
      actorUid: userUid,
      action: 'account.delete',
      targetId: userUid,
      targetType: 'user',
    });
  } catch (error) {
    logger.error('Error deleting user data', { error, context: { userUid } });
    throw new Error('Unable to delete account data at this time. Please try again later.');
  }

  try {
    await currentUser.delete();
  } catch (error) {
    logger.error('Error deleting Firebase Auth user', { error, context: { userUid } });
    const firebaseError = error as { code?: string };

    if (firebaseError.code === 'auth/requires-recent-login') {
      throw new Error('Please reauthenticate before deleting your account.');
    }

    throw new Error('Account data removed, but the authentication record could not be deleted. Please contact support.');
  }
}; 
