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
      
      // ⚠️ IMPORTANTE: O backend retorna "ROLE_ADMIN" ou "ROLE_TECH"
      // Precisamos remover o prefixo "ROLE_"
      let roleValue = roleData.message;
      if (roleValue.startsWith('ROLE_')) {
        roleValue = roleValue.replace('ROLE_', '') as 'ADMIN' | 'TECH';
      }
      
      console.log('🔐 Login Debug:', {
        rawRole: roleData.message,
        cleanRole: roleValue
      });
      
      const userData = {
        username: credentials.username,
        idUser: '',
        name: '',
        email: '',
        active: 'true',
        roles: roleValue as 'ADMIN' | 'TECH',
      };
      
      await login(userData, roleValue as 'ADMIN' | 'TECH');
      
      // Navegar conforme role
      if (roleValue === 'ADMIN') {
        console.log('➡️ Navigating to ADMIN tab');
        router.replace('/(tabs)/admin');
      } else if (roleValue === 'TECH') {
        console.log('➡️ Navigating to TECH tab');
        router.replace('/(tabs)/tech');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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