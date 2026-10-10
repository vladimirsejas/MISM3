@echo off
setlocal
cd /d "%~dp0"
title MISM3 - Mulher em Rede

set "URL=http://127.0.0.1:8000/index.html"

echo ========================================
echo        MISM3 - MULHER EM REDE
echo ========================================
echo.

REM Se o servidor ja estiver ativo, apenas abre o site.
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/index.html' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
    echo O servidor ja esta funcionando.
    start "" "%URL%"
    exit /b 0
)

REM Confere se o Python esta instalado e acessivel.
where python >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao foi encontrado no PATH.
    echo Instale o Python ou habilite a opcao "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

if not exist "%~dp0web\index.html" (
    echo ERRO: nao encontrei web\index.html.
    echo Este BAT precisa ficar na pasta raiz C:\MISM3.
    echo.
    pause
    exit /b 1
)

echo Abrindo o navegador...
start "" "%URL%"
echo.
echo O servidor vai iniciar agora.
echo Deixe esta janela aberta enquanto usar o MISM3.
echo Para encerrar, pressione Ctrl+C.
echo.
python -m http.server 8000 --bind 127.0.0.1 --directory "%~dp0web"
echo.
echo O servidor foi encerrado.
pause
