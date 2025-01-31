#!/bin/bash

# Crear directorio static si no existe
mkdir -p static

# Descargar las fuentes
wget -O static/Montserrat-Regular.ttf https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf
wget -O static/Montserrat-Bold.ttf https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf

# Dar permisos de ejecución
chmod 644 static/Montserrat-Regular.ttf static/Montserrat-Bold.ttf 