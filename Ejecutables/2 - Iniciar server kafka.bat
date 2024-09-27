@echo off
title Server Kafka

echo Iniciando Server Kafka
cd /d C:/kafka
kafka-server-start.bat config\server.properties

pause