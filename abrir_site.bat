@echo off
rem Abre o site Mulher em Rede no navegador (http://localhost:8000).
rem Deixe esta janela aberta enquanto usa o site. Para parar, feche a janela.
cd /d "%~dp0web"
where python >nul 2>nul
if errorlevel 1 (
  echo Python nao encontrado. Instale em python.org e marque "Add python to PATH".
  pause
  exit /b 1
)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"
echo Servidor em http://localhost:8000  (feche esta janela para parar)
python -m http.server 8000
pause
