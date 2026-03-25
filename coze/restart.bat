@echo off
chcp 65001 >nul
title Coze Video API - 重启服务

echo ========================================
echo    Coze Video API 重启脚本
echo ========================================
echo.

cd /d %~dp0

:: 步骤1: 停止现有进程
echo [1/3] 停止现有 Java 进程...
set "found=0"
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq java.exe" /fo list 2^>nul ^| findstr "PID:"') do (
    echo       终止进程 PID: %%i
    taskkill /F /PID %%i >nul 2>&1
    set "found=1"
)

if "%found%"=="0" (
    echo       未发现运行中的 Java 进程
) else (
    echo       等待进程完全停止...
    timeout /t 2 /nobreak >nul
)

echo [√] 停止完成
echo.

:: 步骤2: 检查 Maven
echo [2/3] 检查 Maven 环境...
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [×] 错误: 未找到 Maven
    echo     请先安装 Maven 并配置环境变量
    echo.
    pause
    exit /b 1
)
echo [√] Maven 环境正常
echo.

:: 步骤3: 启动服务
echo [3/3] 启动 Spring Boot 应用...
echo ========================================
echo.

mvn spring-boot:run
