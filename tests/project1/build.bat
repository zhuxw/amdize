@echo off
cd /d %~dp0
cd ..\..

node main tests\project1\a.js > tests\project1\out.js

pause
