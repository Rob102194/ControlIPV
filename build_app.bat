@echo off
echo === Iniciando proceso de Build Completa ===

echo [1/4] Limpiando archivos temporales antiguos...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist frontend\dist rmdir /s /q frontend\dist

echo [2/4] Instalando dependencias y compilando Frontend...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Error en la compilacion del frontend.
    pause
    exit /b %errorlevel%
)
cd ..

echo [3/4] Generando Ejecutable con PyInstaller...
call backend\venv\Scripts\activate
python -m PyInstaller "Control IPV.spec" --noconfirm
if %errorlevel% neq 0 (
    echo Error en la generacion del ejecutable.
    pause
    exit /b %errorlevel%
)

echo [4/4] ¡Proceso completado! El ejecutable esta en: dist\Control IPV.exe
pause
