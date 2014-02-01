@echo off
cd /d %~dp0

node ../../build --dojo --name-maps map1,map2 a.js > out.js

pause
