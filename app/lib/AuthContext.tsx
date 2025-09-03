// app/lib/AuthContext.tsx
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { getUserRole } from './User'; // keep your actual path

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  // optional helpers
  // login?: (email: string, pass: string) => Promise<void>;
  // logout?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const role = await getUserRole(firebaseUser.uid);
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

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
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
