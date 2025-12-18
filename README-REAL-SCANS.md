# 📡 100% REAL PORT SCANNER - Documentación Técnica

## 🎯 OBJETIVO

Proporcionar escaneos de puertos **100% reales** usando **nmap real** en tu servidor Proxmox, con **pruebas verificables** y **evidencia criptográfica** de autenticidad.

## 🔧 COMPONENTES

### 1. **Servidor de Escaneo REAL** (`/opt/real-port-scanner/scanner-server/`)
- **Node.js + Express** - API server
- **Nmap real** - Motor de escaneo
- **Systemd service** - Inicio automático
- **Logging completo** - Registro de todos los escaneos

### 2. **Aplicación Web Next.js**
- **Interfaz de usuario** - Configuración y visualización
- **Componente de verificación** - Pruebas de autenticidad
- **Exportación con pruebas** - Evidencia criptográfica

### 3. **Script de Instalación** (`install-proxmox.sh`)
- **Instalación automática** en Proxmox/Debian/Ubuntu
- **Configuración completa** - Servicio, logs, firewall
- **Verificación automática** - Pruebas post-instalación

## 🚀 INSTALACIÓN EN PROXMOX

### Opción 1: Script Automático (RECOMENDADO)

```bash
# 1. Descargar script
wget https://tudominio.com/install-proxmox.sh

# 2. Hacer ejecutable
chmod +x install-proxmox.sh

# 3. Ejecutar como root
sudo bash install-proxmox.sh
```

### Opción 2: Instalación Manual

```bash
# 1. Instalar dependencias
sudo apt-get update
sudo apt-get install -y nodejs npm nmap

# 2. Clonar repositorio
git clone https://github.com/tuusuario/real-port-scanner.git
cd real-port-scanner

# 3. Instalar servidor
cd scanner-server
npm install

# 4. Iniciar servidor
node server.js
```

## 🔍 VERIFICACIÓN DE ESCANEOS REALES

### Pruebas Automáticas

1. **Endpoint de verificación**: `GET /api/verify`
2. **Prueba de nmap**: Verifica instalación y versión
3. **Escaneo de prueba**: Puerto 22 en localhost
4. **Evidencia criptográfica**: Hash de comandos ejecutados

### Componente de Pruebas

El componente `RealScanProof` muestra:
- ✅ Estado de nmap instalado
- ✅ Resultados de pruebas reales
- ✅ Output crudo de nmap
- ✅ Timestamps verificables
- ✅ Hash criptográfico de escaneos

## 📊 EVIDENCIA INCLUIDA EN CADA ESCANEO

Cada escaneo incluye los siguientes elementos de prueba:

```json
{
  "proof": {
    "isRealScan": true,
    "nmapUsed": true,
    "evidence": [
      "Comando nmap ejecutado: nmap -p 80,443 google.com",
      "Tiempo de ejecución: 1250ms",
      "Raw output disponible: 4520 bytes",
      "Timestamp: 2024-01-15T10:30:45.123Z",
      "Server hash: sha256-abc123..."
    ]
  },
  "metadata": {
    "nmapCommand": "nmap -p 80,443 -sV --script=banner google.com",
    "scanDuration": "1250ms",
    "host": "google.com"
  },
  "rawOutput": "Nmap scan report for google.com...",
  "results": [...]
}
```

## 🔐 SEGURIDAD

### Características de Seguridad

1. **Validación de objetivos**: Regex estricta para IPs/dominios
2. **Límite de puertos**: Máximo 100 puertos por escaneo
3. **Timeout configurable**: Evita escaneos infinitos
4. **Logging completo**: Todos los escaneos registrados
5. **Verificación de permisos**: Solo objetivos autorizados

### Recomendaciones

1. **Firewall**: Limitar acceso al puerto 3001
2. **Autenticación**: Agregar API keys si es público
3. **Rate limiting**: Limitar escaneos por IP
4. **Monitoring**: Monitorear uso de CPU/memoria

## 🧪 PRUEBAS

### Pruebas Automáticas Incluidas

```bash
# 1. Verificar servidor
curl http://localhost:3001/api/verify | jq .

# 2. Probar escaneo real
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"host": "8.8.8.8", "ports": [53, 80, 443]}' | jq .

# 3. Verificar logs
sudo journalctl -u real-port-scanner -f
```

### Script de Pruebas

El instalador incluye `test-scan.sh` con pruebas completas.

## 📈 MONITOREO

### Métricas Disponibles

1. **Uptime del servidor**: `GET /api/status`
2. **Estadísticas de nmap**: Versión, estado
3. **Historial de escaneos**: Logs en `/var/log/port-scanner/`
4. **Uso de recursos**: CPU, memoria, red

### Integración con Monitoreo

```bash
# Health check para monitoreo
curl -s http://localhost:3001/health | grep -q "healthy"

# Métricas para Prometheus
# (Se puede agregar endpoint /metrics)
```

## 🔄 MANTENIMIENTO

### Actualizaciones

```bash
# Script de actualización incluido
cd /opt/real-port-scanner
./update-scanner.sh
```

### Backup

1. **Configuración**: `/opt/real-port-scanner/scanner-server/`
2. **Logs**: `/var/log/port-scanner/`
3. **Service file**: `/etc/systemd/system/real-port-scanner.service`

### Troubleshooting

#### Servidor no inicia
```bash
# Verificar logs
sudo journalctl -u real-port-scanner -n 50 --no-pager

# Verificar nmap
nmap --version

# Verificar puerto
sudo netstat -tlnp | grep 3001
```

#### Escaneos fallan
```bash
# Probar nmap manualmente
nmap -p 80 google.com

# Verificar permisos
sudo nmap -p 80 google.com

# Verificar conectividad
ping google.com
```

## 🌐 CONFIGURACIÓN DE LA APLICACIÓN WEB

### Variables de Entorno

```bash
# URL del servidor de escaneos REALES
NEXT_PUBLIC_SCAN_SERVER_URL="http://TU_PROXMOX_IP:3001"

# Modo de desarrollo
NODE_ENV="production"

# Configuración adicional
SCAN_TIMEOUT="30000"
MAX_PORTS="100"
```

### Deployment

```bash
# Build de producción
npm run build

# Iniciar servidor
npm start

# Usar PM2 para producción
pm2 start npm --name "real-port-scanner-web" -- start
```

## 🎨 PERSONALIZACIÓN

### Temas y Estilos

1. **Tema hacker**: Verde sobre negro (por defecto)
2. **Componentes Shadcn/UI**: Fácil personalización
3. **Tailwind CSS**: Utility-first styling

### Configuración Avanzada

1. **Tipos de escaneo**: Stealth, agresivo, completo
2. **Puertos predefinidos**: Listas personalizables
3. **Timeout por puerto**: Configuración granular
4. **Concurrencia**: Control de escaneos paralelos

## 📄 LICENCIA Y USO LEGAL

### Advertencia Legal

⚠️ **SOLO PARA USO ÉTICO**

1. **Permisos requeridos**: Solo escanee redes propias o con autorización
2. **Responsabilidad**: El usuario es responsable del uso
3. **Cumplimiento legal**: Siga las leyes locales e internacionales
4. **Educación**: Use para aprendizaje y hardening de seguridad

### Características Éticas

1. **Rate limiting**: Evita DoS accidental
2. **Validación de objetivos**: Previene escaneos no autorizados
3. **Logging**: Registro completo para auditoría
4. **Advertencias**: Claras sobre uso legal

## 🤝 CONTRIBUCIONES

### Mejoras Planeadas

1. **Autenticación**: API keys, OAuth
2. **Reportes PDF**: Exportación profesional
3. **API GraphQL**: Consultas avanzadas
4. **Plugins**: Integración con otras herramientas
5. **Docker**: Contenedores para fácil deployment

### Reportar Issues

1. **GitHub Issues**: Para bugs y features
2. **Discusión**: Para preguntas y ayuda
3. **Pull Requests**: Bienvenidos

## 📞 SOPORTE

### Recursos

1. **Documentación**: Este archivo
2. **Ejemplos**: En `/examples/`
3. **Comunidad**: Foro/GitHub discussions
4. **Contacto**: Correo para soporte empresarial

### Niveles de Soporte

1. **Community**: GitHub Issues
2. **Business**: Soporte prioritario por correo
3. **Enterprise**: Soporte 24/7, características personalizadas

---

**🎯 Objetivo Cumplido**: Escaneos 100% reales con pruebas verificables y evidencia criptográfica.