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
      
      console.log('💾 Saved to AsyncStorage:', { role });
      
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
      const [userStr, roleStr] = await AsyncStorage.multiGet(['user', 'role']);

      console.log('🔄 Initializing auth from AsyncStorage:', {
        hasUser: !!userStr[1],
        rawRole: roleStr[1]
      });

      if (userStr[1] && roleStr[1]) {
        const user = JSON.parse(userStr[1]);
        
        // ⚠️ IMPORTANTE: Remover o prefixo "ROLE_" se existir
        let cleanRole = roleStr[1];
        if (cleanRole.startsWith('ROLE_')) {
          cleanRole = cleanRole.replace('ROLE_', '');
        }
        
        console.log('✅ Auth initialized:', {
          username: user.username,
          role: cleanRole
        });
        
        set({
          user,
          role: cleanRole as 'ADMIN' | 'TECH',
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.log('❌ No auth data found');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },
}));