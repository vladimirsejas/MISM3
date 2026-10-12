@echo off
setlocal EnableExtensions
title MISM3 - Mulher Resolve

rem ======================================================================
rem  ABRIR O SITE (um clique)
rem  1) acha o Python   2) escolhe uma porta livre (8000 a 8010)
rem  3) liga o servidor   4) abre o navegador quando o servidor esta pronto
rem  Para parar: feche esta janela ou aperte Ctrl+C.
rem ======================================================================

rem  Tudo (mapa, areas, Entre Mulheres, Rio Claro em numeros) abre dentro do mesmo dashboard.
set "PAGINA=%~1"

cd /d "%~dp0web" || goto erro_pasta

set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY goto sem_python
%PY% --version >nul 2>&1 || goto sem_python

set "PORTA="
for /l %%P in (8000,1,8010) do (
  if not defined PORTA (
    netstat -ano | findstr /r /c:":%%P .*LISTENING" >nul || set "PORTA=%%P"
  )
)
if not defined PORTA goto sem_porta

echo.
echo  MISM3 - Mulher Resolve
echo  ----------------------
echo  Endereco do site: http://localhost:%PORTA%/%PAGINA%
echo  O navegador vai abrir sozinho em instantes.
echo  Para parar: feche esta janela ou aperte Ctrl+C.
echo.

start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:%PORTA%/%PAGINA%"

%PY% "%~dp0pipeline\servidor_ia.py" %PORTA%
echo.
echo  O servidor foi encerrado.
pause
exit /b 0

:erro_pasta
echo.
echo  Nao encontrei a pasta "web" ao lado deste arquivo.
echo  Deixe o abrir_site.bat dentro da pasta MISM3, junto da pasta web.
echo.
pause
exit /b 1

:sem_python
echo.
echo  Nao encontrei o Python neste computador.
echo  1) Instale em https://www.python.org/downloads/
echo  2) Na instalacao, MARQUE a caixa "Add python.exe to PATH".
echo  3) Feche esta janela e de dois cliques neste arquivo de novo.
echo.
pause
exit /b 1

:sem_porta
echo.
echo  As portas 8000 a 8010 estao ocupadas por outros programas.
echo  Feche janelas antigas do servidor (janelas pretas) e tente de novo.
echo.
pause
exit /b 1
