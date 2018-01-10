@echo off
del /S /F /Q dist
webpack && node upgrade.js && copy dist\* ..\dist