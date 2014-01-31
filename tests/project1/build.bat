@echo off
cd /d %~dp0
cd ..\..

node amdize tests\project1\a.js

pause
