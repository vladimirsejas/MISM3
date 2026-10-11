@echo off
chcp 65001 >nul
rem Localiza os servicos do catalogo (CNEFE + lista de CEPs) e refaz o mapa territorial.
rem Antes de alterar o catalogo, o programa mostra a lista e pergunta se pode aplicar.
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python nao encontrado. Instale em python.org e marque "Add python to PATH".
  pause
  exit /b 1
)
python pipeline\atualizar_localizacoes.py
echo.
echo Terminou. Se algo falhou, copie a mensagem acima e mande para mim.
pause
