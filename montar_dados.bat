@echo off
rem Monta os dados reais do site a partir das fontes publicas que voce ja tem. Veja pipeline\montar_dados.py
cd /d "%~dp0"
python pipeline\montar_dados.py
echo.
pause
