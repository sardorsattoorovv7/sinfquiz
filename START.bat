@echo off
cd /d "%~dp0"
title SinfQuiz 4.6 - Vercel va Firebase
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
call npm run dev
pause
exit /b
:failed
echo O'rnatish yoki ishga tushirish bajarilmadi. Yuqoridagi xatoni tekshiring.
pause
exit /b 1
