@echo off
setlocal

REM ==============================
REM Configuração dos repositórios
REM ==============================

set REPO1=C:\x3la\xyz\GS_Climbing\springApp\0\repositorios\final\gsclimbing-mobile
set REPO2=C:\x3la\xyz\GS_Climbing\springApp\0\repositorios\final\finalissima\gsclimbing-backend

REM ==============================
REM Verificação da mensagem
REM ==============================

IF "%~1"=="" (
    echo Usa: git-commit-push-2-repos "mensagem do commit"
    exit /b 1
)

set COMMIT_MSG=%~1
echo Mensagem do commit: %COMMIT_MSG%
echo.

REM ==============================
REM Repo 1
REM ==============================

echo --- Repositorio 1 ---
cd /d "%REPO1%" || (
    echo Erro ao aceder ao repositorio 1
    exit /b 1
)

git add .
git commit -m "%COMMIT_MSG%"
git push

echo.

REM ==============================
REM Repo 2
REM ==============================

echo --- Repositorio 2 ---
cd /d "%REPO2%" || (
    echo Erro ao aceder ao repositorio 2
    exit /b 1
)

git add .
git commit -m "%COMMIT_MSG%"
git push

echo.
echo ---
echo Operacao concluida nos dois repositorios!

endlocal
