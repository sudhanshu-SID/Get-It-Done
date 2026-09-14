export interface AuthUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  photoURL?: string;
  timezone?: string;
  preferences?: any;
}

export interface IAuthService {
  loginWithEmail(email: string, pass: string): Promise<string>;
  registerWithEmail(email: string, pass: string, name?: string): Promise<string>;
  loginWithGoogle(): Promise<string>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getIdToken(): Promise<string | null>;
  getCurrentUser(): any;
  onAuthStateChanged(callback: (token: string | null, firebaseUser: any) => void): () => void;
}
