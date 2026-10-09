@echo off
rem Abre o prototipo (arquivo unico, sem servidor e sem internet). Para atualizar depois de mudar web/: python pipeline/gerar_demo_unico.py
start "" "%~dp0demo_unico\index.html"
