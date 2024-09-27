@echo off
title Zookeeper

echo Iniciando zookeeper
cd /d C:/kafka
zookeeper-server-start.bat config\zookeeper.properties

pause