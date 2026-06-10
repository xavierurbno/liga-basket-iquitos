@echo off
setlocal
cd /d "%~dp0.."
node scripts/sync-vercel-operational-env.mjs %*
