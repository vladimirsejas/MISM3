@echo off
setlocal
cd /d "%~dp0"
title MISM3 - Mapa do Cuidado

rem ======================================================================
rem  ABRIR O MISM3 (um clique)
rem  1) acha o Python   2) atualiza os dados oficiais (saude e secretarias)
rem  3) escolhe uma porta livre   4) liga o servidor   5) abre o navegador
rem  Para parar: feche esta janela ou aperte Ctrl+C.
rem ======================================================================

set "PY="
where py >nul 2>&1 && set "PY=py"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY goto sem_python

echo.
echo  MISM3 - Mapa do Cuidado Rio-Clarense
echo  ------------------------------------
echo  Atualizando os dados oficiais (saude e secretarias)...
%PY% pipeline\institucional.py
if errorlevel 1 (
  echo.
  echo  AVISO: nao consegui atualizar os dados. O site vai usar a ultima versao salva.
  echo  Se a mensagem acima falar de um CSV, confira catalogo\servicos_manuais.csv e catalogo\secretarias.csv.
  echo.
)

rem primeira porta livre entre 8000 e 8010 (assim nao abre por engano um servidor antigo que ficou ligado)
set "PORTA="
for /l %%P in (8000,1,8010) do (
  if not defined PORTA (
    netstat -ano | findstr /r /c:":%%P .*LISTENING" >nul 2>&1
    if errorlevel 1 set "PORTA=%%P"
  )
)
if not defined PORTA set "PORTA=8000"

echo.
echo  Abrindo http://localhost:%PORTA%
echo  (se o navegador nao abrir sozinho, copie o endereco acima)
echo  Para parar: feche esta janela.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORTA%"
%PY% pipeline\servidor.py --porta %PORTA%
echo.
echo  O servidor foi encerrado.
pause
endlocal
exit /b 0

:sem_python
echo.
echo  ERRO: o Python nao foi encontrado neste computador.
echo  Instale o Python 3 (python.org) e marque a opcao "Add Python to PATH".
echo  Depois de instalar, de dois cliques neste arquivo de novo.
echo.
pause
endlocal
exit /b 1
