/**
 * Tipo de role do utilizador
 */
export type UserRole = 'ADMIN' | 'TECH';

/**
 * Interface do utilizador
 */
export interface User {
  idUser: string;
  name: string;
  username: string;
  email: string;
  active: string;
  roles: UserRole;
  team?: string;
  project?: string;
}

/**
 * Dados para criar utilizador
 */
export interface CreateUserDTO {
  name: string;
  username: string;
  email: string;
  password: string;
  roles: UserRole;
  team?: string;
}

/**
 * Dados para atualizar utilizador
 */
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  active?: string;
  team?: string;
}

/**
 * Filtros de pesquisa de utilizadores
 */
export interface UserFilters {
  name?: string;
  username?: string;
  email?: string;
  roles?: UserRole;
  active?: string;
}