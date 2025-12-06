// src/hooks/useAuth.ts - VERSÃO CORRIGIDA

import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api/auth.api';
import { usersAPI } from '@/services/api/auth.api';
import type { LoginCredentials } from '@/types/auth.types';

export const useAuth = () => {
  const router = useRouter();
  const { login, logout, isAuthenticated, user, role } = useAuthStore();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      // Guardar password para Basic Auth
      await AsyncStorage.setItem('password', credentials.password);
      await AsyncStorage.setItem('username', credentials.username);
      
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
        cleanRole: roleValue,
        username: credentials.username
      });
      
      // ✅ FIX: Buscar dados completos do utilizador
      let userData;
      try {
        const fullUserData = await usersAPI.getByUsername(credentials.username);
        userData = {
          idUser: fullUserData.idUser || '',
          name: fullUserData.name || credentials.username,
          username: credentials.username,
          email: fullUserData.email || '',
          active: fullUserData.active || 'true',
          roles: roleValue as 'ADMIN' | 'TECH',
        };
        console.log('✅ User data loaded:', { idUser: userData.idUser, name: userData.name });
      } catch (error) {
        console.warn('⚠️ Could not load full user data, using basic info:', error);
        // Fallback: usar dados básicos
        userData = {
          username: credentials.username,
          idUser: '', // Vazio por agora
          name: credentials.username,
          email: '',
          active: 'true',
          roles: roleValue as 'ADMIN' | 'TECH',
        };
      }
      
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