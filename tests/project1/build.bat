@echo off
cd /d %~dp0
cd ..\..

node bin\amdize tests\project1\a.js > tests\project1\out.js

pause
