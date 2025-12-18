# 📡 INSTALACIÓN COMPLETA - ESCANEO REAL DE PUERTOS

## 🚀 INSTALACIÓN RÁPIDA

```bash
# 1. Descargar script de instalación
curl -O https://raw.githubusercontent.com/tuusuario/port-scan/main/install-complete.sh

# 2. Hacer ejecutable
chmod +x install-complete.sh

# 3. Ejecutar como root
sudo bash install-complete.sh
```

## 📋 QUÉ INSTALA EL SCRIPT

### 1. **Dependencias del sistema**
- Node.js 20.x y npm
- Nmap (para escaneos REALES)
- curl, git, herramientas de red

### 2. **Servidor de escaneo** (puerto 3001)
- API REST para escaneos con nmap real
- Verificación de nmap instalado
- Health checks
- Logs completos

### 3. **Interfaz web** (puerto 3000)
- Aplicación Next.js desde GitHub
- Configuración automática
- Build de producción
- Servicio systemd

## 🔧 GESTIÓN DEL SISTEMA

```bash
# Usar script de gestión (instalado automáticamente)
port-scanner-manage status     # Ver estado
port-scanner-manage start      # Iniciar servicios
port-scanner-manage stop       # Detener servicios
port-scanner-manage restart    # Reiniciar servicios
port-scanner-manage logs       # Ver logs en tiempo real
port-scanner-manage test       # Probar instalación
port-scanner-manage update     # Actualizar desde GitHub
```

## 🌐 ACCESO WEB

Después de la instalación, accede a:

- **Interfaz web**: `http://TU_IP_PROXMOX:3000`
- **API servidor**: `http://TU_IP_PROXMOX:3001`
- **Health check**: `http://TU_IP_PROXMOX:3001/health`

## 🧪 PROBAR INSTALACIÓN

```bash
# Ejecutar prueba completa
/opt/port-scanner/test-installation.sh

# Probar API manualmente
curl http://localhost:3001/health
curl http://localhost:3001/api/verify

# Probar escaneo real
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"host": "8.8.8.8", "ports": [53, 80, 443]}'
```

## 🔍 VERIFICACIÓN DE ESCANEOS REALES

El sistema incluye pruebas de que los escaneos son 100% reales:

1. **Verificación de nmap**: `/api/verify` muestra versión y estado
2. **Comandos reales**: Cada escaneo ejecuta nmap real en el servidor
3. **Logs completos**: Todos los escaneos quedan registrados
4. **Pruebas automáticas**: Script de prueba incluido

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: "Cannot GET /" en la web
```bash
# Esperar 30 segundos para que la web inicie
# Verificar logs
port-scanner-manage logs

# Reiniciar servicios
port-scanner-manage restart
```

### Problema: Servidor no inicia
```bash
# Verificar logs del servidor
journalctl -u port-scanner-server -n 20

# Verificar nmap
nmap --version

# Verificar puertos
netstat -tuln | grep 300
```

### Problema: No se puede conectar a la API
```bash
# Verificar firewall
ufw status

# Probar localmente
curl http://localhost:3001/health

# Verificar servicio
systemctl status port-scanner-server
```

## 📊 ESTRUCTURA DE DIRECTORIOS

```
/opt/port-scanner/
├── scanner-server/     # Servidor de escaneo (API)
├── web-app/           # Interfaz web Next.js
├── manage.sh          # Script de gestión
└── test-installation.sh # Script de pruebas

/var/log/port-scanner/ # Logs del sistema
```

## 🔄 ACTUALIZACIÓN

```bash
# Actualizar desde GitHub
port-scanner-manage update

# O manualmente
cd /opt/port-scanner/web-app
git pull origin main
npm install
npm run build
systemctl restart port-scanner-web
```

## 🔐 SEGURIDAD

### Recomendaciones
1. **Firewall**: Configurar acceso solo desde IPs autorizadas
2. **Nginx reverse proxy**: Para HTTPS y autenticación
3. **Logs**: Revisar periódicamente `/var/log/port-scanner/`
4. **Permisos**: Solo escanear objetivos autorizados

### Comandos de seguridad
```bash
# Limitar acceso por firewall (ufw)
ufw allow from 192.168.1.0/24 to any port 3000
ufw allow from 192.168.1.0/24 to any port 3001

# Ver logs de acceso
journalctl -u port-scanner-server --since "1 hour ago"
```

## 📞 SOPORTE

### Recursos
- **Logs del sistema**: `journalctl -u port-scanner-*`
- **Script de prueba**: `/opt/port-scanner/test-installation.sh`
- **Documentación**: Este archivo README

### Comandos de diagnóstico
```bash
# Estado completo del sistema
port-scanner-manage status

# Prueba de conectividad
/opt/port-scanner/test-installation.sh

# Ver uso de recursos
systemctl status port-scanner-server --no-pager
systemctl status port-scanner-web --no-pager
```

## 🎯 CARACTERÍSTICAS PRINCIPALES

✅ **Escaneos 100% reales** con nmap  
✅ **Interfaz web moderna** desde GitHub  
✅ **Instalación automática** en 5 minutos  
✅ **Gestión simplificada** con un solo comando  
✅ **Logs completos** para auditoría  
✅ **Pruebas automáticas** de funcionamiento  
✅ **Actualización sencilla** desde GitHub  
✅ **Servicios systemd** para inicio automático  

---

**⚠️ ADVERTENCIA LEGAL**: Solo use este sistema para escanear redes que posea o tenga permiso explícito para probar. El escaneo no autorizado es ilegal en la mayoría de países.