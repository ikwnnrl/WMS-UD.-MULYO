@echo off
echo Memulai UD. Mulyo Warehouse System...
echo.
echo Akses aplikasi di komputer ini: http://localhost:3000
echo Akses dari HP/Laptop lain: http://[ALAMAT_IP_KOMPUTER_INI]:3000
echo.
echo Sedang menyiapkan server...
cmd /c "npm run dev -- -H 0.0.0.0"
pause
