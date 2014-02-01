@echo off
cd /d %~dp0

node ../../bin/amdize --dojo --name-maps map1,map2 a.js > out-amd.js
node ../../bin/amdize --dojo -m cmd --name-maps map1,map2 a.js > out-cmd.js
node ../../bin/amdize --dojo -m plain --name-maps map1,map2 a.js > out-plain.js

pause
