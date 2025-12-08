@echo off
setlocal enabledelayedexpansion

echo 🔍 A procurar ficheiros .ts e .tsx...

dir /s /b src\*.ts src\*.tsx app\*.ts app\*.tsx > all.txt
set UNUSED_COUNT=0

for /f "delims=" %%f in (all.txt) do (
    set "FILE=%%~f"
    set "BASE=%%~nf"

    REM Procurar o nome base noutros ficheiros
    findstr /S /I /C:"!BASE!" src\*.ts src\*.tsx app\*.ts app\*.tsx | findstr /V "%%~nxf" >nul

    if errorlevel 1 (
        echo ❌ NÃO REFERENCIADO: !FILE!
        set /a UNUSED_COUNT+=1
    )
)

echo.
echo 📊 Total ficheiros não referenciados: %UNUSED_COUNT%

del all.txt
pause
