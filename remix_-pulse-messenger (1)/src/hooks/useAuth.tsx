import React, { createContext, useContext, useEffect, useState } from 'react';

interface MockUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USERS = [
  { uid: 'user-1', displayName: 'Alex Rivera', photoURL: 'https://i.pravatar.cc/150?u=user-1', email: 'alex@pulse.com' },
  { uid: 'user-2', displayName: 'Sarah Chen', photoURL: 'https://i.pravatar.cc/150?u=user-2', email: 'sarah@pulse.com' },
  { uid: 'user-3', displayName: 'Jordan Sky', photoURL: 'https://i.pravatar.cc/150?u=user-3', email: 'jordan@pulse.com' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pulse_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = () => {
    // Pick a random user for demo or just the first one
    const mockUser = GUEST_USERS[0];
    localStorage.setItem('pulse_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('pulse_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
