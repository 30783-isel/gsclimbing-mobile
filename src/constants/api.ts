const SERVER_IP = '192.168.1.130'; // ALTERE AQUI!
const PORT = '8080';

export const API_CONFIG = {
  // Use o IP da sua máquina, não localhost
  baseUrl: `http://${SERVER_IP}:${PORT}/api/`,
  baseLogUrl: `http://${SERVER_IP}:${PORT}/auth/`,
  baseProjectsUrl: `http://${SERVER_IP}:${PORT}/api/project/`,
  baseUsersUrl: `http://${SERVER_IP}:${PORT}/api/user/`,
  baseReportsUrl: `http://${SERVER_IP}:${PORT}/api/reports/`,
  baseFilesUrl: `http://${SERVER_IP}:${PORT}/api/reports/files/`,
};

export const TIMEOUT = 30000; // 30 segundos