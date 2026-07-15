@echo off
title KSP Simpan Pinjam - Starting...
echo ========================================
echo   KSP Simpan Pinjam
echo   Menjalankan aplikasi...
echo ========================================

REM Copy WASM file untuk sql.js
if not exist "dist-electron\main" mkdir dist-electron\main
copy /Y "node_modules\sql.js\dist\sql-wasm.wasm" "dist-electron\main\sql-wasm.wasm" >nul 2>&1

echo.
echo Server dimulai di http://localhost:5173
echo Electron window akan terbuka otomatis.
echo Tekan Ctrl+C untuk menutup.
echo.

npx --no vite --port 5173
