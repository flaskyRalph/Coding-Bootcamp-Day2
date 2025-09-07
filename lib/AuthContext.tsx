// app/lib/AuthContext.tsx
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { logoutUser } from './Auth';
import { auth } from './firebase';
import { getUserRole } from './User';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');
        setUser(firebaseUser);
        if (firebaseUser) {
          console.log('Fetching user role for:', firebaseUser.uid);
          const role = await getUserRole(firebaseUser.uid);
          console.log('User role fetched:', role);
          setUserRole(role ?? null);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      // The onAuthStateChanged listener will handle updating the state
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
