import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG, TIMEOUT } from '@/constants/api';

/**
 * Cliente HTTP com interceptors para Basic Auth e suporte offline
 */
class HttpClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.instance = axios.create({
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Monitorar conexão
    this.setupNetworkMonitoring();
    this.setupInterceptors();
  }

  /**
   * Monitorar estado da rede
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (!this.isOnline) {
        console.log('📵 Modo Offline - Pedidos HTTP serão cancelados');
      } else {
        console.log('🌐 Online - Pedidos HTTP permitidos');
      }
    });
  }

  /**
   * Configurar interceptors de request e response
   */
  private setupInterceptors(): void {
    // Request Interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        // ❌ BLOQUEAR pedidos se estiver offline
        if (!this.isOnline) {
          console.log('🚫 Pedido bloqueado (offline):', config.url);
          return Promise.reject({
            message: 'Sem conexão à Internet',
            code: 'OFFLINE',
            config,
          });
        }

        try {
          const username = await AsyncStorage.getItem('username');
          const password = await AsyncStorage.getItem('password');

          if (username && password && !config.url?.includes('basicauth')) {
            const token = btoa(`${username}:${password}`);
            config.headers.Authorization = `Basic ${token}`;
          }

          if (__DEV__) {
            console.log('📤 Request:', config.method?.toUpperCase(), config.url);
          }

          return config;
        } catch (error) {
          console.error('❌ Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('📥 Response:', response.status, response.config.url);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Ignorar erros de pedidos bloqueados por offline
        if (error.code === 'OFFLINE') {
          return Promise.reject(error);
        }

        if (__DEV__) {
          console.error('❌ Response error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
          });
        }

        // Se erro 401, limpar dados
        if (error.response?.status === 401) {
          console.log('🔒 Unauthorized - Clearing auth data');
          await this.clearAuthData();
        }

        if (!error.response) {
          console.error('🌐 Network error - No response');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Limpar dados de autenticação
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'user',
        'role',
        'token',
        'username',
        'password',
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Verificar se está online
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Obter instância do axios
   */
  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Criar e exportar instância única
const httpClient = new HttpClient();

export default httpClient.getInstance();
export { httpClient };