@echo off
cd /d %~dp0

node ../../main --dojo --name-maps map1,map2 a.js > out-amd.js
node ../../main --dojo -m cmd --name-maps map1,map2 a.js > out-cmd.js
node ../../main --dojo -m plain --name-maps map1,map2 a.js > out-plain.js

pause
