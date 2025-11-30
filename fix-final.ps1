Write-Host "GSClimbing Mobile - Script de Correcao" -ForegroundColor Cyan
Write-Host ""

# Garantir que estamos na raiz do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "Erro: package.json nao encontrado." -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "Passo 1: Criar backup..." -ForegroundColor Yellow

$backupPath = ".backup\web-old-files"
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

if (Test-Path "src\api") {
    Copy-Item "src\api" "$backupPath\api" -Recurse -Force
}
if (Test-Path "src\utils") {
    Copy-Item "src\utils" "$backupPath\utils" -Recurse -Force
}

Write-Host "Passo 2: Remover ficheiros antigos da versao web..." -ForegroundColor Yellow

$filesToRemove = @(
    "src\api\auth.api.ts",
    "src\api\projects.api.ts",
    "src\utils\http-interceptor.ts"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removido: $file"
    }
}

Write-Host "Passo 3: Criar ficheiro src\constants\api.ts..." -ForegroundColor Yellow

$apiTsContent = @"
import { Platform } from 'react-native';

const SERVER_IP = '192.168.1.130';
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
  });
}
"@

if (-not (Test-Path "src\constants")) {
    New-Item -ItemType Directory -Path "src\constants" -Force | Out-Null
}

Set-Content -Path "src\constants\api.ts" -Value $apiTsContent -Encoding UTF8

Write-Host "Passo 4: Limpar cache..." -ForegroundColor Yellow

$cachePaths = @(
    "node_modules\.cache",
    ".expo",
    "dist",
    ".expo-shared"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removido: $path"
    }
}

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Correcao concluida." -ForegroundColor Green
Write-Host "Backup criado em: .backup\web-old-files"
Write-Host "Agora execute:"
Write-Host " 1) Remove-Item -Recurse -Force node_modules, package-lock.json"
Write-Host " 2) npm install"
Write-Host " 3) npm start"
Write-Host ""
