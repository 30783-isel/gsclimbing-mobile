/**
 * Credenciais de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Resposta de autenticação
 */
export interface AuthResponse {
  token: string;
  message?: string;
  user?: User;
  role?: string;
}

/**
 * Dados do utilizador
 */
export interface User {
  idUser: string;
  name: string;
  username: string;
  email: string;
  active: string;
  roles: 'ADMIN' | 'TECH';
}

/**
 * Estado de autenticação
 */
export interface AuthState {
  user: User | null;
  role: 'ADMIN' | 'TECH' | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
}