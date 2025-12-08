@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║        VERIFICAR TODOS OS FICHEIROS .TS E .TSX NÃO USADOS     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

if not exist "src\" (
    echo ❌ ERRO: Execute na raiz do projeto!
    pause
    exit /b 1
)

echo 🔍 A procurar todos os ficheiros .ts e .tsx...
echo.

REM Criar ficheiro temporário com todos os .ts e .tsx (usa dir com redirect)
del /f /q temp_all_files.txt 2>nul
dir /s /b "src\*.ts" "src\*.tsx" "app\*.ts" "app\*.tsx" 2>nul > temp_all_files.txt

REM Se não existir o ficheiro (nenhum match), aborta
if not exist temp_all_files.txt (
    echo ❌ Nenhum ficheiro .ts ou .tsx encontrado em src\\ ou app\\
    pause
    exit /b 0
)

REM Contar total
for /f %%a in ('type temp_all_files.txt ^| find /c /v ""') do set TOTAL=%%a
echo 📊 Total de ficheiros: %TOTAL%
echo.
echo ════════════════════════════════════════════════════════════════
echo 🔍 ANALISANDO FICHEIROS...
echo ════════════════════════════════════════════════════════════════
echo.

set UNUSED_COUNT=0

for /f "usebackq delims=" %%f in ("temp_all_files.txt") do (
    set "fullpath=%%f"
    set "filename=%%~nxf"
    set "basename=%%~nf"

    REM Ignorar ficheiros especiais (comparação com findstr com vários /C:)
    echo !filename! | findstr /I /C:"index.tsx" /C:"index.ts" /C:"_layout.tsx" /C:"App.tsx" >nul
    if !errorlevel! equ 0 (
        REM ignorar
    ) else (
        REM Procurar imports deste ficheiro. usamos findstr em todo o src/app (pode devolver linhas)
        REM Filtramos linhas que contenham exactamente o nome do ficheiro para evitar matches na própria definição.
        rem Usa /I insensitive; /S recursivo já no findstr
        findstr /S /I /C:"!basename!" src\*.ts src\*.tsx app\*.ts app\*.tsx 2>nul | findstr /V /I /C:"!filename!" >nul
        if !errorlevel! neq 0 (
            echo ❌ NÃO USADO: !fullpath!
            set /a UNUSED_COUNT+=1
        )
    )
)

del /f /q temp_all_files.txt 2>nul

echo.
echo ════════════════════════════════════════════════════════════════
echo 📊 RESUMO
echo ════════════════════════════════════════════════════════════════
echo.
echo 📁 Total analisado: %TOTAL%
echo ❌ Não usados: %UNUSED_COUNT%
set /a USED=%TOTAL% - %UNUSED_COUNT%
echo ✅ Usados: %USED%
echo.
pause
