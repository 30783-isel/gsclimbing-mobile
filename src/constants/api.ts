import { Platform } from 'react-native';

const SERVER_IP = '192.168.1.64';
const PORT = '8080';

const getBaseURL = (): string => {
  return `http://${SERVER_IP}:${PORT}`;
};

const BASE_URL = getBaseURL();

export const API_CONFIG = {
  baseUrl: `${BASE_URL}/api/`,
  baseLogUrl: `${BASE_URL}/auth/`,
  baseProjectsUrl: `${BASE_URL}/api/project/`,
  baseUsersUrl: `${BASE_URL}/api/user/`,
  baseReportsUrl: `${BASE_URL}/api/reports/`,
  baseFilesUrl: `${BASE_URL}/api/reports/files/`,
};

export const TIMEOUT = 30000;

export const REPORT_NAMES: Record<number, string> = {
  0: 'Defect Inspection Report',
  1: 'Examination transformer',
  2: 'Measurements of MV Switchgear and Stator Cabinet',
  3: 'Medidas 6Kv',
  4: 'Medidas 690V400V',
  5: 'Onboard crane Inspection Report',
  6: 'Performance Report Repair Elevator',
  7: 'Statutory Inspection Report',
};

if (__DEV__) {
  console.log('API Configuration:', {
    platform: Platform.OS,
    baseUrl: API_CONFIG.baseUrl,
    serverIP: SERVER_IP,
    port: PORT,
  });
}
