import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api/auth.api';
import type { LoginCredentials } from '@/types/auth.types';

export const useAuth = () => {
  const router = useRouter();
  const { login, logout, isAuthenticated, user, role } = useAuthStore();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      // Guardar password para Basic Auth
      await AsyncStorage.setItem('password', credentials.password);
      
      // Fazer login
      await authAPI.login(credentials);
      const roleData = await authAPI.getRole();
      
      const userData = {
        username: credentials.username,
        idUser: '',
        name: '',
        email: '',
        active: 'true',
        roles: roleData.message as 'ADMIN' | 'TECH',
      };
      
      await login(userData, roleData.message);
      
      // Navegar conforme role
      if (roleData.message === 'ADMIN') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/tech');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return {
    handleLogin,
    handleLogout,
    isAuthenticated,
    user,
    role,
  };
};