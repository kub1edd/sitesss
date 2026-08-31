@echo off
chcp 65001 >nul
title CLIP BATTLE - Запуск
echo ==============================================
echo        ЗАПУСК СЕРВЕРА CLIP BATTLE
echo ==============================================
echo.
echo Проверяю наличие Node.js или Python для запуска...

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [УСПЕХ] Найден Node.js! Запускаю...
    start http://localhost:3000
    node server.js
    exit /b
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [УСПЕХ] Node.js не найден, но найден Python! Запускаю...
    start http://localhost:3000
    python server.py
    exit /b
)

echo [ОШИБКА] На вашем компьютере не установлен ни Node.js, ни Python.
echo Пожалуйста, установите Node.js (https://nodejs.org/)
echo Это необходимо для обхода блокировок Твича.
pause
