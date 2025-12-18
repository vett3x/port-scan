#!/bin/bash

# ============================================
# INSTALADOR COMPLETO - ESCANEO REAL DE PUERTOS
# Para servidores Proxmox/Debian/Ubuntu
# ============================================

set -e  # Detener en caso de error

echo "============================================"
echo "INSTALADOR DE ESCANEO REAL DE PUERTOS"
echo "============================================"
echo ""
echo "Este script instalará:"
echo "1. Node.js y npm (para la aplicación web)"
echo "2. Nmap (para escaneos reales)"
echo "3. Servidor de escaneo de puertos"
echo "4. Configuración del sistema"
echo ""
echo "============================================"

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Por favor, ejecuta como root: sudo bash $0"
  exit 1
fi

# ========== 1. ACTUALIZAR SISTEMA ==========
echo "🔄 Actualizando sistema..."
apt-get update
apt-get upgrade -y

# ========== 2. INSTALAR NODE.JS ==========
echo "📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "✅ Node.js ya está instalado"
fi

echo "📦 Versión de Node.js: $(node --version)"
echo "📦 Versión de npm: $(npm --version)"

# ========== 3. INSTALAR NMAP (ESENCIAL) ==========
echo "🔍 Instalando nmap (ESENCIAL para escaneos reales)..."
apt-get install -y nmap

# Verificar instalación de nmap
if ! command -v nmap &> /dev/null; then
  echo "❌ Error: No se pudo instalar nmap"
  exit 1
fi

echo "✅ Nmap instalado - Versión: $(nmap --version | head -n 1)"

# ========== 4. INSTALAR DEPENDENCIAS DEL SERVIDOR DE ESCANEO ==========
echo "📦 Instalando dependencias del servidor de escaneo..."
apt-get install -y build-essential python3 python3-pip

# ========== 5. CREAR DIRECTORIOS ==========
echo "📁 Creando estructura de directorios..."
mkdir -p /opt/real-port-scanner
mkdir -p /opt/real-port-scanner/scanner-server
mkdir -p /opt/real-port-scanner/web-app
mkdir -p /var/log/port-scanner

# ========== 6. CONFIGURAR SERVIDOR DE ESCANEO ==========
echo "⚙️ Configurando servidor de escaneo..."

cat > /opt/real-port-scanner/scanner-server/package.json << 'EOF'
{
  "name": "real-port-scanner-server",
  "version": "2.0.0",
  "description": "Servidor de escaneo REAL con nmap - 100% real",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test-scan.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "child-process-promise": "^2.2.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

cat > /opt/real-port-scanner/scanner-server/server.js << 'EOF'
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

// Logging detallado
const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// ========== VERIFICACIÓN DE NMAP ==========
async function verifyNmap() {
  try {
    const { stdout, stderr } = await execPromise('which nmap');
    const nmapPath = stdout.trim();
    
    const versionResult = await execPromise('nmap --version');
    const versionMatch = versionResult.stdout.match(/Nmap version (\d+\.\d+(?:\.\d+)?)/);
    
    return {
      installed: true,
      path: nmapPath,
      version: versionMatch ? versionMatch[1] : 'unknown',
      rawOutput: versionResult.stdout.substring(0, 500)
    };
  } catch (error) {
    return {
      installed: false,
      error: error.message
    };
  }
}

// ========== PRUEBA DE ESCANEO REAL ==========
async function testRealScan() {
  // Escanear localhost (puerto 22 normalmente)
  const testCommand = 'nmap -p 22 localhost';
  try {
    const startTime = Date.now();
    const { stdout, stderr } = await execPromise(testCommand, { timeout: 10000 });
    const endTime = Date.now();
    
    // Parsear resultado REAL
    const lines = stdout.split('\n');
    let portStatus = 'unknown';
    let service = 'unknown';
    
    for (const line of lines) {
      if (line.includes('22/tcp')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          portStatus = parts[1];
          if (parts[2]) service = parts[2];
        }
      }
    }
    
    return {
      success: true,
      command: testCommand,
      duration: endTime - startTime,
      portStatus: portStatus,
      service: service,
      rawOutput: stdout.substring(0, 1000),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      command: testCommand,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ========== ENDPOINT DE VERIFICACIÓN ==========
app.get('/api/verify', async (req, res) => {
  log('Verificación solicitada');
  
  const nmapInfo = await verifyNmap();
  const testScan = await testRealScan();
  
  const verificationResult = {
    server: {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    nmap: nmapInfo,
    realScanTest: testScan,
    proof: {
      isReal: nmapInfo.installed && testScan.success,
      evidence: [
        `Nmap instalado: ${nmapInfo.installed}`,
        `Versión nmap: ${nmapInfo.version}`,
        `Prueba de escaneo completada: ${testScan.success}`,
        `Estado puerto 22 localhost: ${testScan.portStatus}`
      ]
    }
  };
  
  log('Resultado de verificación:', verificationResult);
  res.json(verificationResult);
});

// ========== ESCANEO REAL DE PUERTOS ==========
async function performRealScan(host, ports) {
  const startTime = Date.now();
  log(`Iniciando escaneo REAL de ${host} - Puertos: ${ports.join(',')}`);
  
  // Comando nmap REAL
  const portList = ports.join(',');
  const command = `nmap -p ${portList} -sV --script=banner -T4 ${host}`;
  
  try {
    const { stdout, stderr } = await execPromise(command, { 
      timeout: 300000 // 5 minutos máximo
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Parsear resultado REAL de nmap
    const results = [];
    const lines = stdout.split('\n');
    let currentPort = null;
    
    for (const line of lines) {
      // Buscar líneas de puertos (ej: "22/tcp open  ssh")
      const portMatch = line.match(/(\d+)\/tcp\s+(\w+)\s*(.*)/);
      if (portMatch) {
        const port = parseInt(portMatch[1]);
        const status = portMatch[2];
        const serviceInfo = portMatch[3] || '';
        
        let service = 'unknown';
        let banner = '';
        
        // Extraer servicio si está disponible
        if (serviceInfo) {
          const serviceMatch = serviceInfo.match(/^(\S+)/);
          if (serviceMatch) service = serviceMatch[1];
          banner = serviceInfo;
        }
        
        results.push({
          port: port,
          status: status,
          service: service,
          banner: banner,
          rawLine: line.trim()
        });
        
        currentPort = port;
      }
      
      // Buscar información adicional del servicio
      if (currentPort && line.includes('Service Info:')) {
        const bannerInfo = line.replace('Service Info:', '').trim();
        const resultIndex = results.findIndex(r => r.port === currentPort);
        if (resultIndex !== -1) {
          results[resultIndex].banner = results[resultIndex].banner 
            ? `${results[resultIndex].banner}; ${bannerInfo}`
            : bannerInfo;
        }
      }
    }
    
    log(`Escaneo completado en ${duration}ms - Puertos encontrados: ${results.length}`);
    
    return {
      success: true,
      command: command,
      duration: duration,
      results: results.map(r => ({
        ip: host,
        port: r.port,
        status: r.status === 'open' ? 'open' : (r.status === 'filtered' ? 'filtered' : 'closed'),
        service: r.service !== 'unknown' ? r.service : undefined,
        banner: r.banner || undefined,
        rawData: r.rawLine,
        scanTime: new Date().toISOString()
      })),
      rawOutput: stdout.substring(0, 5000), // Primeros 5000 caracteres como prueba
      metadata: {
        nmapCommand: command,
        timestamp: new Date().toISOString(),
        host: host,
        portsScanned: ports.length,
        scanDuration: `${duration}ms`
      }
    };
    
  } catch (error) {
    const endTime = Date.now();
    log(`Error en escaneo: ${error.message}`);
    
    return {
      success: false,
      command: command,
      error: error.message,
      duration: endTime - startTime,
      results: [],
      rawOutput: error.stderr || '',
      timestamp: new Date().toISOString()
    };
  }
}

// ========== ENDPOINT DE ESCANEO ==========
app.post('/api/scan', async (req, res) => {
  const { host, ports, scanId = Date.now().toString(36) } = req.body;
  
  if (!host) {
    return res.status(400).json({ 
      error: 'Host es requerido',
      proof: 'VALIDATION_ERROR' 
    });
  }
  
  if (!ports || !Array.isArray(ports) || ports.length === 0) {
    return res.status(400).json({ 
      error: 'Array de puertos es requerido',
      proof: 'VALIDATION_ERROR' 
    });
  }
  
  // Validar host
  const hostRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!hostRegex.test(host)) {
    return res.status(400).json({ 
      error: 'Formato de host inválido',
      proof: 'VALIDATION_ERROR' 
    });
  }
  
  // Limitar número de puertos para seguridad
  const maxPorts = 100;
  const portsToScan = ports.slice(0, maxPorts);
  
  log(`[SCAN-${scanId}] Iniciando escaneo REAL`, { host, portCount: portsToScan.length });
  
  try {
    const scanResult = await performRealScan(host, portsToScan);
    
    // Agregar prueba de realidad
    scanResult.proof = {
      isRealScan: true,
      nmapUsed: true,
      scanId: scanId,
      evidence: [
        `Comando nmap ejecutado: ${scanResult.command}`,
        `Tiempo de ejecución: ${scanResult.duration}ms`,
        `Raw output disponible: ${scanResult.rawOutput ? 'Sí' : 'No'}`,
        `Timestamp: ${scanResult.metadata.timestamp}`
      ]
    };
    
    log(`[SCAN-${scanId}] Escaneo completado`, {
      success: scanResult.success,
      portsFound: scanResult.results.length,
      duration: scanResult.duration
    });
    
    res.json(scanResult);
    
  } catch (error) {
    log(`[SCAN-${scanId}] Error`, error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      proof: 'SCAN_EXECUTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ========== ENDPOINT DE ESTADO ==========
app.get('/api/status', async (req, res) => {
  const nmapInfo = await verifyNmap();
  
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    nmap: nmapInfo,
    endpoints: {
      scan: 'POST /api/scan',
      verify: 'GET /api/verify',
      status: 'GET /api/status',
      health: 'GET /health'
    },
    proof: {
      isRealServer: true,
      nmapInstalled: nmapInfo.installed,
      serverUptime: process.uptime()
    }
  });
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Servidor de escaneo REAL funcionando',
    timestamp: new Date().toISOString()
  });
});

// ========== INICIAR SERVIDOR ==========
async function startServer() {
  // Verificar nmap al inicio
  const nmapInfo = await verifyNmap();
  
  if (!nmapInfo.installed) {
    console.error('❌ ERROR CRÍTICO: Nmap no está instalado');
    console.error('   Instala nmap con: apt-get install nmap');
    process.exit(1);
  }
  
  console.log('============================================');
  console.log('✅ Nmap verificado:');
  console.log(`   Versión: ${nmapInfo.version}`);
  console.log(`   Ruta: ${nmapInfo.path}`);
  console.log('');
  console.log('🚀 Iniciando servidor de escaneo REAL...');
  console.log('============================================');
  
  // Prueba inicial de escaneo
  console.log('🧪 Realizando prueba de escaneo inicial...');
  const testResult = await testRealScan();
  
  if (testResult.success) {
    console.log(`✅ Prueba exitosa - Puerto 22: ${testResult.portStatus}`);
  } else {
    console.log(`⚠️  Prueba fallida: ${testResult.error}`);
  }
  
  app.listen(PORT, () => {
    console.log(`🔗 Servidor escuchando en http://0.0.0.0:${PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   • POST /api/scan    - Escaneo REAL de puertos`);
    console.log(`   • GET  /api/verify  - Verificación completa`);
    console.log(`   • GET  /api/status  - Estado del sistema`);
    console.log(`   • GET  /health      - Health check`);
    console.log('');
    console.log('💡 Para probar rápidamente:');
    console.log(`   curl http://localhost:${PORT}/api/verify | jq .`);
    console.log('');
    console.log('============================================');
  });
}

startServer();
EOF

# ========== 7. CREAR SCRIPT DE INICIO AUTOMÁTICO ==========
echo "⚙️ Configurando inicio automático..."

cat > /etc/systemd/system/real-port-scanner.service << EOF
[Unit]
Description=Real Port Scanner Server - 100% real nmap scans
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/real-port-scanner/scanner-server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=real-port-scanner
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# ========== 8. INSTALAR DEPENDENCIAS NPM ==========
echo "📦 Instalando dependencias NPM..."
cd /opt/real-port-scanner/scanner-server
npm install

# ========== 9. CONFIGURAR LOGS ==========
echo "📝 Configurando sistema de logs..."
cat > /etc/rsyslog.d/real-port-scanner.conf << EOF
if \$programname == 'real-port-scanner' then /var/log/port-scanner/server.log
& stop
EOF

systemctl restart rsyslog
touch /var/log/port-scanner/server.log
chmod 644 /var/log/port-scanner/server.log

# ========== 10. CONFIGURAR ROTACIÓN DE LOGS ==========
cat > /etc/logrotate.d/real-port-scanner << EOF
/var/log/port-scanner/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF

# ========== 11. INICIAR SERVICIO ==========
echo "🚀 Iniciando servicio..."
systemctl daemon-reload
systemctl enable real-port-scanner
systemctl start real-port-scanner

# Esperar a que el servicio inicie
echo "⏳ Esperando inicio del servicio..."
sleep 5

# ========== 12. VERIFICAR INSTALACIÓN ==========
echo "🔍 Verificando instalación..."

# Verificar servicio
if systemctl is-active --quiet real-port-scanner; then
  echo "✅ Servicio corriendo correctamente"
else
  echo "❌ Error: Servicio no se pudo iniciar"
  journalctl -u real-port-scanner -n 20 --no-pager
  exit 1
fi

# Verificar nmap
if command -v nmap &> /dev/null; then
  echo "✅ Nmap instalado correctamente"
else
  echo "❌ Error: Nmap no instalado"
  exit 1
fi

# Verificar API
echo "🌐 Probando API del servidor..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
  echo "✅ API respondiendo correctamente"
else
  echo "⚠️  API no responde, revisando logs..."
  journalctl -u real-port-scanner -n 20 --no-pager
fi

# ========== 13. CREAR SCRIPT DE PRUEBA ==========
cat > /opt/real-port-scanner/test-scan.sh << 'EOF'
#!/bin/bash

echo "============================================"
echo "PRUEBA DE ESCANEO REAL"
echo "============================================"

echo "1. Verificando servidor..."
curl -s http://localhost:3001/api/verify | jq '.'

echo ""
echo "2. Probando escaneo REAL (Google DNS)..."
curl -s -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "host": "8.8.8.8",
    "ports": [53, 80, 443]
  }' | jq '.proof, .metadata, .results[0:3]'

echo ""
echo "3. Verificando logs del servicio..."
journalctl -u real-port-scanner -n 5 --no-pager

echo ""
echo "============================================"
echo "Para ver logs completos: sudo journalctl -u real-port-scanner -f"
echo "Para probar manualmente: curl http://localhost:3001/api/verify"
echo "============================================"
EOF

chmod +x /opt/real-port-scanner/test-scan.sh

# ========== 14. CREAR DOCUMENTACIÓN ==========
cat > /opt/real-port-scanner/README-PROXMOX.md << 'EOF'
# REAL PORT SCANNER - Instalación en Proxmox

## ✅ INSTALACIÓN COMPLETADA

El sistema de escaneo REAL de puertos ha sido instalado correctamente.

## 📍 SERVICIO INSTALADO

- **Nombre del servicio:** `real-port-scanner`
- **Puerto:** 3001
- **Usuario:** root
- **Logs:** `/var/log/port-scanner/server.log`

## 🔧 COMANDOS ÚTILES

```bash
# Ver estado del servicio
sudo systemctl status real-port-scanner

# Iniciar/Detener/Reiniciar
sudo systemctl start real-port-scanner
sudo systemctl stop real-port-scanner
sudo systemctl restart real-port-scanner

# Ver logs en tiempo real
sudo journalctl -u real-port-scanner -f

# Ver logs específicos
sudo journalctl -u real-port-scanner -n 50 --no-pager
```

## 🌐 ENDPOINTS DISPONIBLES

- `GET http://TU_IP_PROXMOX:3001/health` - Health check
- `GET http://TU_IP_PROXMOX:3001/api/verify` - Verificación completa
- `GET http://TU_IP_PROXMOX:3001/api/status` - Estado del sistema
- `POST http://TU_IP_PROXMOX:3001/api/scan` - Escaneo REAL

## 🧪 PROBAR INSTALACIÓN

```bash
# Ejecutar prueba completa
cd /opt/real-port-scanner
./test-scan.sh

# Probar verificación
curl http://localhost:3001/api/verify | jq .

# Probar escaneo real
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"host": "8.8.8.8", "ports": [53, 80, 443]}' | jq .
```

## 🔒 CONFIGURAR LA APLICACIÓN WEB

En tu aplicación web Next.js, configura la variable de entorno:

```bash
NEXT_PUBLIC_SCAN_SERVER_URL="http://TU_IP_PROXMOX:3001"
```

## 📊 EVIDENCIA DE ESCANEOS REALES

El sistema incluye pruebas verificables:
1. **Comandos nmap reales** ejecutados en el servidor
2. **Output crudo** de nmap disponible en las respuestas
3. **Timestamps** precisos de cada escaneo
4. **Verificación** de instalación de nmap

## 🚨 SEGURIDAD

1. El servidor solo escucha en el puerto 3001
2. Se recomienda usar firewall para limitar acceso
3. Solo escanear objetivos autorizados
4. Los logs mantienen registro de todos los escaneos

## 🆘 SOLUCIÓN DE PROBLEMAS

Si el servicio no funciona:

1. Verificar nmap: `nmap --version`
2. Verificar logs: `journalctl -u real-port-scanner -n 50`
3. Probar manualmente: `nmap -p 80 google.com`
4. Reiniciar servicio: `systemctl restart real-port-scanner`
```

## 🎉 INSTALACIÓN COMPLETADA

echo "============================================"
echo "🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "============================================"
echo ""
echo "📋 RESUMEN:"
echo "✅ Node.js instalado"
echo "✅ Nmap instalado - Versión: $(nmap --version | head -n 1 | cut -d ' ' -f 3)"
echo "✅ Servidor de escaneo instalado"
echo "✅ Servicio systemd configurado"
echo "✅ Sistema de logs configurado"
echo ""
echo "🌐 SERVICIO DISPONIBLE EN:"
echo "   http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "🧪 PARA PROBAR:"
echo "   cd /opt/real-port-scanner"
echo "   ./test-scan.sh"
echo ""
echo "📖 DOCUMENTACIÓN:"
echo "   cat /opt/real-port-scanner/README-PROXMOX.md"
echo ""
echo "============================================"
echo "⚠️  IMPORTANTE: Configura el firewall si es necesario"
echo "   ufw allow 3001/tcp"
echo "============================================"
EOF

echo "📖 Documentación creada en /opt/real-port-scanner/README-PROXMOX.md"

# ========== 15. CREAR SCRIPT DE ACTUALIZACIÓN ==========
cat > /opt/real-port-scanner/update-scanner.sh << 'EOF'
#!/bin/bash

echo "Actualizando Real Port Scanner..."
cd /opt/real-port-scanner/scanner-server

echo "1. Deteniendo servicio..."
systemctl stop real-port-scanner

echo "2. Actualizando código..."
git pull origin main 2>/dev/null || echo "No hay repositorio git, continuando..."

echo "3. Actualizando dependencias..."
npm install

echo "4. Reiniciando servicio..."
systemctl start real-port-scanner

echo "5. Verificando..."
sleep 3
systemctl status real-port-scanner --no-pager | head -20

echo "✅ Actualización completada"
EOF

chmod +x /opt/real-port-scanner/update-scanner.sh

echo ""
echo "============================================"
echo "🎊 INSTALACIÓN 100% COMPLETADA"
echo "============================================"
echo ""
echo "El escaneo será 100% REAL usando nmap en tu servidor Proxmox."
echo ""
echo "Próximos pasos:"
echo "1. Configura la aplicación web con la IP de este servidor"
echo "2. Prueba con: cd /opt/real-port-scanner && ./test-scan.sh"
echo "3. Revisa la documentación: cat /opt/real-port-scanner/README-PROXMOX.md"
echo ""
echo "⚠️  RECUERDA: Solo escanea objetivos que tienes permiso para probar."