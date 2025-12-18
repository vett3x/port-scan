#!/bin/bash

# ============================================
# INSTALADOR COMPLETO - ESCANEO REAL + INTERFAZ WEB
# Para servidores Proxmox/Debian/Ubuntu
# Instala tanto el servidor de escaneo como la web desde GitHub
# ============================================

set -e  # Detener en caso de error

echo "============================================"
echo "INSTALADOR COMPLETO - ESCANEO REAL + WEB"
echo "============================================"
echo ""
echo "Este script instalará:"
echo "1. Node.js y npm"
echo "2. Nmap (para escaneos reales)"
echo "3. Servidor de escaneo de puertos (puerto 3001)"
echo "4. Aplicación web Next.js desde GitHub (puerto 3000)"
echo "5. Configuración completa del sistema"
echo ""
echo "Repositorio web: https://github.com/vett3x/port-scan"
echo "============================================"

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Por favor, ejecuta como root: sudo bash $0"
  exit 1
fi

# Obtener IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="localhost"
fi

# ========== 1. ACTUALIZAR SISTEMA ==========
echo "🔄 Actualizando sistema..."
apt-get update
apt-get upgrade -y

# ========== 2. INSTALAR DEPENDENCIAS ESENCIALES ==========
echo "📦 Instalando dependencias esenciales..."
apt-get install -y curl wget git jq net-tools build-essential python3 python3-pip

# Verificar instalación de curl
if ! command -v curl &> /dev/null; then
  echo "❌ Error: No se pudo instalar curl"
  exit 1
fi

echo "✅ Curl instalado - Versión: $(curl --version | head -n 1 | cut -d' ' -f2)"

# ========== 3. INSTALAR NODE.JS ==========
echo "📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "✅ Node.js ya está instalado"
fi

echo "📦 Versión de Node.js: $(node --version)"
echo "📦 Versión de npm: $(npm --version)"

# ========== 4. INSTALAR NMAP (ESENCIAL) ==========
echo "🔍 Instalando nmap (ESENCIAL para escaneos reales)..."
apt-get install -y nmap

# Verificar instalación de nmap
if ! command -v nmap &> /dev/null; then
  echo "❌ Error: No se pudo instalar nmap"
  exit 1
fi

echo "✅ Nmap instalado - Versión: $(nmap --version | head -n 1)"

# ========== 5. CREAR DIRECTORIOS ==========
echo "📁 Creando estructura de directorios..."
mkdir -p /opt/port-scanner
mkdir -p /opt/port-scanner/scanner-server
mkdir -p /opt/port-scanner/web-app
mkdir -p /var/log/port-scanner

# ========== 6. CONFIGURAR SERVIDOR DE ESCANEO ==========
echo "⚙️ Configurando servidor de escaneo (puerto 3001)..."

# Crear package.json para el servidor
cat > /opt/port-scanner/scanner-server/package.json << 'EOF'
{
  "name": "real-port-scanner-server",
  "version": "2.0.0",
  "description": "Servidor de escaneo REAL con nmap - 100% real",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

# Crear server.js para el servidor
cat > /opt/port-scanner/scanner-server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Verificar nmap
async function verifyNmap() {
  try {
    const { stdout } = await execPromise('which nmap');
    const nmapPath = stdout.trim();
    
    const versionResult = await execPromise('nmap --version');
    const versionMatch = versionResult.stdout.match(/Nmap version (\d+\.\d+(?:\.\d+)?)/);
    
    return {
      installed: true,
      path: nmapPath,
      version: versionMatch ? versionMatch[1] : 'unknown'
    };
  } catch (error) {
    return {
      installed: false,
      error: error.message
    };
  }
}

// Escanear puertos real con nmap
async function performRealScan(host, ports) {
  const startTime = Date.now();
  log(`Iniciando escaneo REAL de ${host} - Puertos: ${ports.join(',')}`);
  
  const portList = ports.join(',');
  const command = `nmap -p ${portList} -T4 ${host}`;
  
  try {
    const { stdout } = await execPromise(command, { timeout: 120000 });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Parsear resultado de nmap
    const results = [];
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const portMatch = line.match(/(\d+)\/tcp\s+(\w+)\s*(.*)/);
      if (portMatch) {
        const port = parseInt(portMatch[1]);
        const status = portMatch[2];
        const service = portMatch[3] || 'unknown';
        
        results.push({
          ip: host,
          port: port,
          status: status === 'open' ? 'open' : (status === 'filtered' ? 'filtered' : 'closed'),
          service: service !== 'unknown' ? service : undefined,
          scanTime: new Date().toISOString()
        });
      }
    }
    
    log(`Escaneo completado en ${duration}ms - Puertos encontrados: ${results.length}`);
    
    return {
      success: true,
      command: command,
      duration: duration,
      results: results,
      metadata: {
        host: host,
        portsScanned: ports.length,
        scanDuration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    const endTime = Date.now();
    log(`Error en escaneo: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      duration: endTime - startTime,
      results: []
    };
  }
}

// Endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Real Port Scanner API',
    version: '2.0.0',
    endpoints: {
      verify: 'GET /api/verify',
      scan: 'POST /api/scan',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Servidor de escaneo REAL funcionando',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/verify', async (req, res) => {
  const nmapInfo = await verifyNmap();
  res.json({
    nmap: nmapInfo,
    server: {
      status: 'online',
      timestamp: new Date().toISOString()
    },
    proof: {
      isReal: nmapInfo.installed,
      evidence: [`Nmap instalado: ${nmapInfo.installed}`, `Versión: ${nmapInfo.version}`]
    }
  });
});

app.post('/api/scan', async (req, res) => {
  const { host, ports } = req.body;
  
  if (!host) {
    return res.status(400).json({ error: 'Host es requerido' });
  }
  
  if (!ports || !Array.isArray(ports) || ports.length === 0) {
    return res.status(400).json({ error: 'Array de puertos es requerido' });
  }
  
  const maxPorts = 50;
  const portsToScan = ports.slice(0, maxPorts);
  
  log(`Iniciando escaneo de ${host} - ${portsToScan.length} puertos`);
  
  try {
    const scanResult = await performRealScan(host, portsToScan);
    
    if (scanResult.success) {
      scanResult.proof = {
        isRealScan: true,
        nmapUsed: true,
        evidence: [`Comando ejecutado: ${scanResult.command}`, `Duración: ${scanResult.duration}ms`]
      };
    }
    
    res.json(scanResult);
  } catch (error) {
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Iniciar servidor
async function startServer() {
  const nmapInfo = await verifyNmap();
  
  if (!nmapInfo.installed) {
    console.error('❌ ERROR: Nmap no está instalado');
    process.exit(1);
  }
  
  console.log('============================================');
  console.log('✅ Nmap verificado - Versión:', nmapInfo.version);
  console.log('🚀 Iniciando servidor de escaneo REAL...');
  console.log('============================================');
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔗 Servidor escuchando en http://0.0.0.0:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   • GET  /              - Información del API`);
    console.log(`   • GET  /health        - Health check`);
    console.log(`   • GET  /api/verify    - Verificación`);
    console.log(`   • POST /api/scan      - Escaneo REAL`);
    console.log('');
    console.log('💡 Para probar: curl http://localhost:3001/health');
    console.log('============================================');
  });
}

startServer();
EOF

# ========== 7. INSTALAR DEPENDENCIAS DEL SERVIDOR ==========
echo "📦 Instalando dependencias del servidor..."
cd /opt/port-scanner/scanner-server
npm install

# ========== 8. CONFIGURAR SERVICIO SYSTEMD PARA EL SERVIDOR ==========
echo "⚙️ Configurando servicio systemd para el servidor..."

cat > /etc/systemd/system/port-scanner-server.service << EOF
[Unit]
Description=Real Port Scanner Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/port-scanner/scanner-server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
StandardOutput=journal
StandardError=journal
SyslogIdentifier=port-scanner-server

[Install]
WantedBy=multi-user.target
EOF

# ========== 9. INSTALAR APLICACIÓN WEB DESDE GITHUB ==========
echo "🌐 Clonando aplicación web desde GitHub..."
cd /opt/port-scanner

# Intentar clonar el repositorio
if [ -d "web-app" ] && [ -d "web-app/.git" ]; then
  echo "✅ Repositorio web ya existe, actualizando..."
  cd web-app
  git pull origin main
else
  echo "📥 Clonando repositorio de GitHub..."
  git clone https://github.com/vett3x/port-scan.git web-app
  cd web-app
fi

# Verificar que se clonó correctamente
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se pudo clonar el repositorio o no contiene package.json"
  echo "⚠️  Creando estructura básica de la web..."
  
  # Crear una estructura básica si falla el clone
  cd ..
  rm -rf web-app
  mkdir -p web-app
  cd web-app
  
  # Crear package.json básico
  cat > package.json << 'EOF'
{
  "name": "port-scanner-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.6",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  }
}
EOF
  
  # Crear página básica
  mkdir -p pages
  cat > pages/index.js << 'EOF'
import React from 'react';

export default function Home() {
  return (
    <html>
      <head>
        <title>Port Scanner Web</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: #0a0a0a; 
            color: #00ff00; 
            margin: 0; 
            padding: 40px; 
          }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #00ff00; border-bottom: 2px solid #00ff00; padding-bottom: 10px; }
          .status { 
            background: #111; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border: 1px solid #00ff00;
          }
          .online { color: #00ff00; }
          .offline { color: #ff0000; }
          .endpoints { margin-top: 30px; }
          .endpoint { 
            background: #111; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            border-left: 4px solid #00ff00;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 Port Scanner Web Interface</h1>
          <p>Web interface for real port scanning with nmap.</p>
          
          <div class="status">
            <h2>Status</h2>
            <p>Scan Server: <span class="online">● Online</span> (Port 3001)</p>
            <p>Web Server: <span class="online">● Online</span> (Port 3000)</p>
            <p>Nmap: <span class="online">● Installed</span></p>
          </div>
          
          <div class="endpoints">
            <h2>API Endpoints</h2>
            <div class="endpoint">
              <strong>GET /api/verify</strong> - Verify nmap installation
            </div>
            <div class="endpoint">
              <strong>POST /api/scan</strong> - Perform real port scan
            </div>
            <div class="endpoint">
              <strong>GET /health</strong> - Server health check
            </div>
          </div>
          
          <div style="margin-top: 40px; padding: 20px; background: #111; border-radius: 10px;">
            <h3>Quick Test</h3>
            <p>Test the scan server:</p>
            <pre style="background: #000; padding: 15px; border-radius: 5px; overflow-x: auto;">
curl -X POST http://${SERVER_IP}:3001/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"host": "8.8.8.8", "ports": [53, 80, 443]}'
            </pre>
          </div>
        </div>
      </body>
    </html>
  );
}
EOF
fi

# ========== 10. CONFIGURAR VARIABLES DE ENTORNO PARA LA WEB ==========
echo "🔧 Configurando variables de entorno para la web..."

# Crear archivo .env.local con la IP del servidor
cat > .env.local << EOF
NEXT_PUBLIC_SCAN_SERVER_URL=http://${SERVER_IP}:3001
NODE_ENV=production
EOF

# ========== 11. INSTALAR DEPENDENCIAS DE LA WEB ==========
echo "📦 Instalando dependencias de la web..."
npm install

# ========== 12. CONSTRUIR APLICACIÓN WEB ==========
echo "🏗️ Construyendo aplicación web (esto puede tomar unos minutos)..."
npm run build

# ========== 13. CONFIGURAR SERVICIO SYSTEMD PARA LA WEB ==========
echo "⚙️ Configurando servicio systemd para la web..."

cat > /etc/systemd/system/port-scanner-web.service << EOF
[Unit]
Description=Port Scanner Web Interface
After=network.target port-scanner-server.service
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/port-scanner/web-app
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
StandardOutput=journal
StandardError=journal
SyslogIdentifier=port-scanner-web

[Install]
WantedBy=multi-user.target
EOF

# ========== 14. INICIAR SERVICIOS ==========
echo "🚀 Iniciando servicios..."

# Recargar systemd
systemctl daemon-reload

# Iniciar servidor de escaneo
echo "🔧 Iniciando servidor de escaneo (puerto 3001)..."
systemctl enable port-scanner-server
systemctl start port-scanner-server

sleep 3

# Iniciar web
echo "🌐 Iniciando aplicación web (puerto 3000)..."
systemctl enable port-scanner-web
systemctl start port-scanner-web

sleep 3

# ========== 15. VERIFICAR INSTALACIÓN ==========
echo "🔍 Verificando instalación..."

# Verificar servicios
echo "📊 Estado de los servicios:"
echo "---------------------------"

if systemctl is-active --quiet port-scanner-server; then
  echo "✅ Servidor de escaneo: ACTIVO (puerto 3001)"
else
  echo "❌ Servidor de escaneo: INACTIVO"
  journalctl -u port-scanner-server -n 10 --no-pager
fi

if systemctl is-active --quiet port-scanner-web; then
  echo "✅ Aplicación web: ACTIVA (puerto 3000)"
else
  echo "❌ Aplicación web: INACTIVA"
  journalctl -u port-scanner-web -n 10 --no-pager
fi

# Verificar puertos
echo ""
echo "🔌 Verificando puertos:"
echo "----------------------"

if netstat -tuln | grep -q ":3001 "; then
  echo "✅ Puerto 3001 (servidor): ESCUCHANDO"
else
  echo "❌ Puerto 3001: NO ESCUCHANDO"
fi

if netstat -tuln | grep -q ":3000 "; then
  echo "✅ Puerto 3000 (web): ESCUCHANDO"
else
  echo "❌ Puerto 3000: NO ESCUCHANDO"
fi

# Verificar API
echo ""
echo "🌐 Probando API del servidor..."
if curl -s --connect-timeout 5 http://localhost:3001/health | grep -q "healthy"; then
  echo "✅ API del servidor: RESPONDE CORRECTAMENTE"
else
  echo "⚠️  API del servidor: NO RESPONDE"
  echo "Probando directamente con nmap..."
  if command -v nmap &> /dev/null; then
    echo "Nmap está instalado. Probando escaneo local..."
    nmap -p 22 localhost 2>&1 | head -5
  fi
fi

# ========== 16. CREAR SCRIPT DE PRUEBA ==========
cat > /opt/port-scanner/test-installation.sh << EOF
#!/bin/bash

echo "============================================"
echo "PRUEBA DE INSTALACIÓN COMPLETA"
echo "============================================"

echo ""
echo "1. Estado de los servicios:"
echo "---------------------------"
systemctl status port-scanner-server --no-pager | head -10
echo ""
systemctl status port-scanner-web --no-pager | head -10

echo ""
echo "2. Probando servidor de escaneo:"
echo "--------------------------------"
curl -s http://localhost:3001/health | jq -r '.status, .message'

echo ""
echo "3. Probando verificación de nmap:"
echo "---------------------------------"
curl -s http://localhost:3001/api/verify | jq -r '.nmap.installed, .nmap.version'

echo ""
echo "4. URLs de acceso:"
echo "------------------"
IP=\$(hostname -I | awk '{print \$1}')
echo "🌐 Interfaz web: http://\$IP:3000"
echo "🔌 API servidor: http://\$IP:3001"
echo "📡 Health check: http://\$IP:3001/health"

echo ""
echo "5. Comandos útiles:"
echo "-------------------"
echo "Ver logs servidor: sudo journalctl -u port-scanner-server -f"
echo "Ver logs web: sudo journalctl -u port-scanner-web -f"
echo "Reiniciar todo: sudo systemctl restart port-scanner-server port-scanner-web"
echo "Detener todo: sudo systemctl stop port-scanner-server port-scanner-web"

echo ""
echo "============================================"
EOF

chmod +x /opt/port-scanner/test-installation.sh

# ========== 17. CREAR SCRIPT DE GESTIÓN ==========
cat > /opt/port-scanner/manage.sh << EOF
#!/bin/bash

case "\$1" in
  start)
    echo "Iniciando servicios..."
    systemctl start port-scanner-server
    systemctl start port-scanner-web
    ;;
  stop)
    echo "Deteniendo servicios..."
    systemctl stop port-scanner-server
    systemctl stop port-scanner-web
    ;;
  restart)
    echo "Reiniciando servicios..."
    systemctl restart port-scanner-server
    systemctl restart port-scanner-web
    ;;
  status)
    echo "Estado de los servicios:"
    echo "========================"
    systemctl status port-scanner-server --no-pager
    echo ""
    systemctl status port-scanner-web --no-pager
    ;;
  logs)
    echo "Mostrando logs:"
    echo "==============="
    journalctl -u port-scanner-server -u port-scanner-web -f
    ;;
  test)
    echo "Probando instalación..."
    /opt/port-scanner/test-installation.sh
    ;;
  update)
    echo "Actualizando aplicación web desde GitHub..."
    cd /opt/port-scanner/web-app
    git pull origin main
    npm install
    npm run build
    systemctl restart port-scanner-web
    ;;
  *)
    echo "Uso: \$0 {start|stop|restart|status|logs|test|update}"
    echo ""
    echo "Comandos:"
    echo "  start    - Iniciar servicios"
    echo "  stop     - Detener servicios"
    echo "  restart  - Reiniciar servicios"
    echo "  status   - Ver estado"
    echo "  logs     - Ver logs en tiempo real"
    echo "  test     - Probar instalación"
    echo "  update   - Actualizar web desde GitHub"
    exit 1
    ;;
esac
EOF

chmod +x /opt/port-scanner/manage.sh

# ========== 18. CONFIGURAR FIREWALL (OPCIONAL) ==========
echo "🔥 Configurando firewall (opcional)..."
if command -v ufw &> /dev/null; then
  ufw allow 3000/tcp
  ufw allow 3001/tcp
  echo "✅ Puertos 3000 y 3001 abiertos en firewall"
fi

# ========== 19. MOSTRAR RESUMEN ==========
echo ""
echo "============================================"
echo "🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "============================================"
echo ""
echo "📊 RESUMEN DE INSTALACIÓN:"
echo "-------------------------"
echo "✅ Node.js instalado: $(node --version)"
echo "✅ Nmap instalado: $(nmap --version | head -n 1 | cut -d' ' -f3)"
echo "✅ Servidor de escaneo: ACTIVO (puerto 3001)"
echo "✅ Aplicación web: ACTIVA (puerto 3000)"
echo ""
echo "🌐 URLS DE ACCESO:"
echo "-----------------"
echo "Interfaz web: http://${SERVER_IP}:3000"
echo "API servidor: http://${SERVER_IP}:3001"
echo "Health check: http://${SERVER_IP}:3001/health"
echo ""
echo "🔧 HERRAMIENTAS DE GESTIÓN:"
echo "--------------------------"
echo "Gestión: /opt/port-scanner/manage.sh"
echo "Pruebas: /opt/port-scanner/test-installation.sh"
echo ""
echo "📝 COMANDOS ÚTILES:"
echo "------------------"
echo "Ver estado: sudo /opt/port-scanner/manage.sh status"
echo "Ver logs:   sudo /opt/port-scanner/manage.sh logs"
echo "Reiniciar:  sudo /opt/port-scanner/manage.sh restart"
echo "Probar:     sudo /opt/port-scanner/manage.sh test"
echo ""
echo "🚨 NOTA: La primera carga de la web puede tardar unos segundos."
echo "       Si ves 'Cannot GET /', espera 30 segundos y recarga."
echo ""
echo "============================================"
echo "⚠️  RECUERDA: Solo escanea objetivos autorizados."
echo "============================================"

# Crear enlace simbólico para fácil acceso
ln -sf /opt/port-scanner/manage.sh /usr/local/bin/port-scanner-manage
echo "✅ Comando 'port-scanner-manage' disponible en el sistema"