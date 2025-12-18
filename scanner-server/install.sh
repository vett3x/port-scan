#!/bin/bash

# Script de instalación para el servidor de escaneo de puertos
# Debe ejecutarse como root o con sudo

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Instalando servidor de escaneo de puertos...${NC}"

# Actualizar sistema
echo -e "${YELLOW}Actualizando sistema...${NC}"
apt-get update
apt-get upgrade -y

# Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js ya está instalado.${NC}"
fi

# Instalar nmap si no está instalado
if ! command -v nmap &> /dev/null; then
    echo -e "${YELLOW}Instalando nmap...${NC}"
    apt-get install -y nmap
else
    echo -e "${GREEN}nmap ya está instalado.${NC}"
fi

# Crear directorio para la aplicación
APP_DIR="/opt/port-scanner-server"
echo -e "${YELLOW}Creando directorio en $APP_DIR...${NC}"
mkdir -p $APP_DIR

# Copiar archivos (asumiendo que este script se ejecuta desde el directorio que contiene los archivos)
echo -e "${YELLOW}Copiando archivos del servidor...${NC}"
cp index.js package.json $APP_DIR/

# Instalar dependencias de Node.js
echo -e "${YELLOW}Instalando dependencias de Node.js...${NC}"
cd $APP_DIR
npm install

# Crear servicio systemd
echo -e "${YELLOW}Creando servicio systemd...${NC}"
cat > /etc/systemd/system/port-scanner-server.service << EOF
[Unit]
Description=Real Port Scanner Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd, habilitar e iniciar servicio
systemctl daemon-reload
systemctl enable port-scanner-server
systemctl start port-scanner-server

echo -e "${GREEN}Instalación completada!${NC}"
echo -e "${GREEN}El servidor de escaneo está corriendo en http://localhost:3001${NC}"
echo -e "${GREEN}Para ver los logs: sudo journalctl -u port-scanner-server -f${NC}"
echo -e "${GREEN}Para reiniciar: sudo systemctl restart port-scanner-server${NC}"