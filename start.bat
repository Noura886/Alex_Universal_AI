@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo        ALEX - FREE AI VERSION
 echo ========================================
echo.
echo Installing/checking dependencies...
npm.cmd install
if errorlevel 1 goto error
echo.
echo Starting Alex...
echo Open http://localhost:3000
npm.cmd start
goto end
:error
echo.
echo Installation failed. Check the error above.
pause
:end
