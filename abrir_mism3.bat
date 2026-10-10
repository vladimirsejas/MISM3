@echo off
setlocal
cd /d "%~dp0"

title MISM3 - Mapa do Cuidado

where py >nul 2>&1
if %errorlevel%==0 goto usar_py

where python >nul 2>&1
if %errorlevel%==0 goto usar_python

echo.
echo ERRO: Python nao foi encontrado.
echo Instale o Python 3 e marque a opcao "Add Python to PATH".
echo.
pause
exit /b 1

:usar_py
echo Iniciando o MISM3 em http://localhost:8000
start "" cmd /c "timeout /t 2 /nobreak ^>nul ^& start http://localhost:8000"
py -m http.server 8000 --directory "%~dp0web"
goto fim

:usar_python
echo Iniciando o MISM3 em http://localhost:8000
start "" cmd /c "timeout /t 2 /nobreak ^>nul ^& start http://localhost:8000"
python -m http.server 8000 --directory "%~dp0web"

:fim
echo.
echo O servidor foi encerrado.
pause
endlocal
