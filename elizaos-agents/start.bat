@echo off
cd /d C:\Users\user\Desktop\BrainInk\elizaos-agents
set PORT=3001
set NODE_ENV=development
echo Starting Brain Ink Agent Manager...
node dist/index.js
pause
