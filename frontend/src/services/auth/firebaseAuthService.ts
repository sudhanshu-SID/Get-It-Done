import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { IAuthService } from './types';

/**
 * Concrete implementation of IAuthService utilizing Firebase Web SDK.
 * UI components interact only through this adapter or AuthContext.
 */
class FirebaseAuthService implements IAuthService {
  async loginWithEmail(email: string, pass: string): Promise<string> {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return cred.user.getIdToken();
  }

  async registerWithEmail(email: string, pass: string, name?: string): Promise<string> {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred.user.getIdToken();
  }

  async loginWithGoogle(): Promise<string> {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user.getIdToken();
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
  }

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  onAuthStateChanged(callback: (token: string | null, firebaseUser: FirebaseUser | null) => void): () => void {
    return onFirebaseAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        callback(token, user);
      } else {
        callback(null, null);
      }
    });
  }
}

export const authService = new FirebaseAuthService();
