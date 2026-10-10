@echo off
rem Servidor local do MISM3 (site + API). Para pesquisa real: crie pipeline\provedor_pesquisa.py (veja docs\api_contrato.md).
cd /d "%~dp0"
start "" http://localhost:8000
python pipeline\servidor.py
