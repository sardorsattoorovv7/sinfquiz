@echo off
cd /d "%~dp0"
title SinfQuiz 7.8 - lokal server
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js topilmadi. Node.js 22.12+ yoki 24 LTS o'rnating.
  pause
  exit /b 1
)
call npm ls --depth=0 >nul 2>nul
if errorlevel 1 (
  echo Kerakli paketlar tekshirilmoqda va o'rnatilmoqda...
  call npm install
  if errorlevel 1 goto failed
)
echo.
echo Local manzilini brauzerda oching. Ushbu terminal oynasini yopmang.
echo 5173 port band bo'lsa, boshqa dev serverni to'xtatib qayta urinib ko'ring.
echo.
call npm run dev
if errorlevel 1 goto failed
pause
exit /b
:failed
echo O'rnatish yoki ishga tushirish bajarilmadi. Yuqoridagi xatoni tekshiring.
pause
exit /b 1
