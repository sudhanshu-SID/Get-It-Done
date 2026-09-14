import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AuthUser } from '../services/auth/types';
import { authService } from '../services/auth/firebaseAuthService';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to build an optimistic fallback user from Firebase auth
  const createFallbackUser = (fbUser: any): AuthUser => ({
    id: fbUser.uid,
    firebaseUid: fbUser.uid,
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    email: fbUser.email || '',
    role: 'user',
    photoURL: fbUser.photoURL || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });

  // Sync Firebase user with backend MongoDB database
  const syncWithBackend = async (idToken: string, fbUser: any) => {
    // Optimistically set fallback user so state resolves immediately
    setUser((prev) => prev || createFallbackUser(fbUser));

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
          photoURL: fbUser.photoURL || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
      }
    } catch (err) {
      console.error('Failed to sync user with backend:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (idToken, fbUser) => {
      setToken(idToken);
      setFirebaseUser(fbUser);
      if (idToken && fbUser) {
        setUser(createFallbackUser(fbUser));
        await syncWithBackend(idToken, fbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const idToken = await authService.loginWithEmail(email, pass);
      setToken(idToken);
      const fbUser = authService.getCurrentUser();
      setFirebaseUser(fbUser);
      if (idToken && fbUser) {
        await syncWithBackend(idToken, fbUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const idToken = await authService.registerWithEmail(email, pass, name);
      setToken(idToken);
      const fbUser = authService.getCurrentUser();
      setFirebaseUser(fbUser);
      if (idToken && fbUser) {
        await syncWithBackend(idToken, fbUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const idToken = await authService.loginWithGoogle();
      setToken(idToken);
      const fbUser = authService.getCurrentUser();
      setFirebaseUser(fbUser);
      if (idToken && fbUser) {
        await syncWithBackend(idToken, fbUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const value = useMemo(() => ({
    user,
    firebaseUser,
    token,
    isAuthenticated: !!token && (!!user || !!firebaseUser),
    isLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
  }), [user, firebaseUser, token, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
