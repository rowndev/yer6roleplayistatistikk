@echo off
title FiveM PRO Panel Bot
color 0A

echo ================================
echo   FiveM PRO Panel Bot Baslatiliyor
echo ================================
echo.

:: Node kontrol
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo [HATA] Node.js yüklü degil!
  echo https://nodejs.org adresinden yukleyin.
  pause
  exit
)

:: Moduller kontrol
IF NOT EXIST node_modules (
  echo [BILGI] Moduller bulunamadi, yukleniyor...
  npm install
)

echo.
echo [OK] Bot baslatiliyor...
echo.

node index.js

echo.
echo Bot kapandi.
pause