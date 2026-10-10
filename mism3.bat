@echo off
setlocal
cd /d "%~dp0"
title MISM3 - Mapa do Cuidado

rem Abre o MISM3: site + API em http://localhost:8000
rem Se existir o arquivo .env com GEMINI_API_KEY e MISM3_PROVEDOR=gemini, a pesquisa real fica ligada.
rem Para parar: feche esta janela ou aperte Ctrl+C.

set "PY="
where py >nul 2>&1 && set "PY=py"
if not defined PY where python >nul 2>&1 && set "PY=python"

if not defined PY (
  echo.
  echo ERRO: Python nao foi encontrado.
  echo Instale o Python 3 e marque a opcao "Add Python to PATH".
  echo.
  pause
  exit /b 1
)

echo.
echo  MISM3 - Mapa do Cuidado Rio-Clarense
echo  Abrindo http://localhost:8000  (feche esta janela para parar)
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"
%PY% pipeline\servidor.py
if errorlevel 1 (
  echo.
  echo O servidor parou com erro. Leia a mensagem acima.
  pause
)
