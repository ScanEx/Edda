@echo off
del /S /F /Q dist
webpack && node update.js