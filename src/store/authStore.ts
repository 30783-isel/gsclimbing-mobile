import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  idUser: string;
  name: string;
  username: string;
  email: string;
  active: string;
  roles: 'ADMIN' | 'TECH';
}

interface AuthState {
  user: User | null;
  role: 'ADMIN' | 'TECH' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (user: User, role: 'ADMIN' | 'TECH') => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, role) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('username', user.username);
      
      set({
        user,
        role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'role', 'username', 'password']);
      set({
        user: null,
        role: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },

  initializeAuth: async () => {
    try {
      const [userStr, role] = await AsyncStorage.multiGet(['user', 'role']);

      if (userStr[1] && role[1]) {
        const user = JSON.parse(userStr[1]);
        set({
          user,
          role: role[1] as 'ADMIN' | 'TECH',
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },
}));