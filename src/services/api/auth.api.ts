import httpClient from '../httpClient';
import { API_CONFIG } from '@/constants/api';
import type { LoginCredentials, AuthResponse } from '@/types/auth.types';

export const authAPI = {
  /**
   * Fazer login com Basic Auth
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const token = btoa(`${credentials.username}:${credentials.password}`);
    const response = await httpClient.get(`${API_CONFIG.baseLogUrl}basicauth`, {
      headers: {
        Authorization: `Basic ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Obter role do utilizador
   */
  getRole: async (): Promise<{ message: 'ADMIN' | 'TECH' }> => {
    const response = await httpClient.get(`${API_CONFIG.baseLogUrl}role`);
    return response.data;
  },

  /**
   * Recuperar password
   */
  forgotPassword: async (email: string): Promise<any> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseLogUrl}forgetpassword/${email}`
    );
    return response.data;
  },

  /**
   * Validar token
   */
  validateToken: async (): Promise<boolean> => {
    try {
      await httpClient.get(`${API_CONFIG.baseLogUrl}validate`);
      return true;
    } catch (error) {
      return false;
    }
  },
};