@echo off
setlocal
cd /d "%~dp0"
echo Mandadito - configurar dominio y soporte del servidor
node scripts\configure.mjs
if errorlevel 1 exit /b 1
echo.
echo Lee README.md y docs\ACTIVAR.md para conectar SMS, rutas y notificaciones.
pause
