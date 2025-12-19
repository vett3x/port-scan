const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configuración de CORS para permitir todas las peticiones (necesario en desarrollo)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Real-Verification', 'X-Real-Scan'],
}));
app.use(express.json());

// Validar que nmap esté instalado
async function checkNmap() {
  try {
    await execPromise('which nmap');
    console.log('✅ Nmap está instalado');
    return true;
  } catch (error) {
    console.error('❌ Nmap no está instalado. Por favor, instálalo con: sudo apt-get install nmap');
    return false;
  }
}

// Función para escanear un host en un puerto específico usando nmap
async function scanPort(host, port) {
  try {
    // Usamos nmap con el puerto específico y algunos argumentos para obtener información
    const { stdout } = await execPromise(`nmap -p ${port} -sV --script=banner ${host}`, {
      timeout: 10000 // 10 segundos de timeout por puerto
    });
    
    // Parsear la salida de nmap
    const lines = stdout.split('\n');
    let status = 'closed';
    let service = 'unknown';
    let banner = '';

    for (let line of lines) {
      // Buscar la línea que contiene el puerto
      if (line.includes(`${port}/tcp`)) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          status = parts[1]; // open, closed, filtered
        }
        // Intentar extraer el servicio
        const serviceMatch = line.match(/(open|closed|filtered)\s+(\S+)/);
        if (serviceMatch && serviceMatch[2]) {
          service = serviceMatch[2];
        }
      }
      // Buscar información de banner o versión
      if (line.includes('Service Info:') || line.includes('banner:')) {
        banner = line.trim();
      }
    }

    return {
      port,
      status: status === 'open' ? 'open' : (status === 'filtered' ? 'filtered' : 'closed'),
      service: service !== 'unknown' ? service : undefined,
      banner: banner || undefined
    };
  } catch (error) {
    console.error(`Error escaneando puerto ${port} en ${host}:`, error.message);
    return {
      port,
      status: 'filtered', // Asumimos filtrado en caso de error
      service: undefined,
      banner: undefined
    };
  }
}

// Endpoint de escaneo
app.post('/scan', async (req, res) => {
  const { host, ports, timeout = 1000, maxConcurrent = 10 } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Host es requerido' });
  }

  if (!ports || !Array.isArray(ports) || ports.length === 0) {
    return res.status(400).json({ error: 'Array de puertos es requerido' });
  }

  // Validar host (simple)
  const hostRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!hostRegex.test(host)) {
    return res.status(400).json({ error: 'Formato de host inválido' });
  }

  // Limitar el número de puertos para no saturar
  const maxPorts = 100;
  const portsToScan = ports.slice(0, maxPorts);

  console.log(`Iniciando escaneo de ${host} en puertos: ${portsToScan.join(',')}`);

  // Escanear puertos concurrentemente con un límite
  const concurrencyLimit = Math.min(maxConcurrent, 10);
  const results = [];

  for (let i = 0; i < portsToScan.length; i += concurrencyLimit) {
    const batch = portsToScan.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(port => scanPort(host, port));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes para no ser demasiado agresivo
      if (i + concurrencyLimit < portsToScan.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error en lote de escaneo:', error);
    }
  }

  // Formatear resultados
  const formattedResults = results.map(result => ({
    ip: host,
    port: result.port,
    status: result.status,
    service: result.service,
    banner: result.banner,
    scanTime: new Date().toISOString()
  }));

  console.log(`Escaneo completado para ${host}. Puertos abiertos: ${formattedResults.filter(r => r.status === 'open').length}`);

  res.json({
    results: formattedResults,
    metadata: {
      host,
      totalScanned: portsToScan.length,
      openPorts: formattedResults.filter(r => r.status === 'open').length,
      scanDuration: 'completado'
    }
  });
});

// Endpoint de estado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de escaneo funcionando' });
});

// Endpoint de verificación (para la aplicación web)
app.get('/api/verify', async (req, res) => {
  const isRealVerification = req.headers['x-real-verification'] === 'true';
  
  if (!isRealVerification) {
    return res.status(403).json({ error: 'Verification header missing' });
  }

  let nmapInstalled = false;
  let nmapPath = 'N/A';
  let nmapVersion = 'N/A';
  let nmapRawOutput = '';
  
  try {
    const { stdout: whichOutput } = await execPromise('which nmap');
    nmapPath = whichOutput.trim();
    
    const { stdout: versionOutput } = await execPromise('nmap --version');
    nmapRawOutput = versionOutput;
    const versionMatch = versionOutput.match(/Nmap version (\S+)/);
    if (versionMatch) {
      nmapVersion = versionMatch[1];
    }
    nmapInstalled = true;
  } catch (error) {
    console.error('Nmap check failed:', error.message);
  }
  
  // Prueba de escaneo real (ej. puerto 22 en localhost)
  let realScanTest = {
    success: false,
    command: 'nmap -p 22 127.0.0.1',
    duration: 0,
    portStatus: 'unknown',
    service: 'N/A',
    rawOutput: '',
    error: 'Test not executed'
  };
  
  if (nmapInstalled) {
    const startTime = Date.now();
    try {
      const { stdout: testOutput } = await execPromise(realScanTest.command, { timeout: 5000 });
      realScanTest.duration = Date.now() - startTime;
      realScanTest.rawOutput = testOutput;
      
      const statusMatch = testOutput.match(/22\/tcp\s+(\S+)\s+(\S+)/);
      if (statusMatch) {
        realScanTest.portStatus = statusMatch[1];
        realScanTest.service = statusMatch[2];
        realScanTest.success = true;
        realScanTest.error = undefined;
      } else {
        realScanTest.error = 'Nmap output format unexpected';
      }
    } catch (error) {
      realScanTest.duration = Date.now() - startTime;
      realScanTest.error = `Nmap test failed: ${error.message}`;
    }
  }

  res.json({
    server: {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    nmap: {
      installed: nmapInstalled,
      path: nmapPath,
      version: nmapVersion,
      rawOutput: nmapRawOutput.substring(0, 500),
    },
    realScanTest,
    proof: {
      isReal: nmapInstalled && realScanTest.success,
      evidence: [
        `Nmap installed: ${nmapInstalled}`,
        `Nmap version: ${nmapVersion}`,
        `Test command executed: ${realScanTest.command}`,
        `Test duration: ${realScanTest.duration}ms`,
        `Test result (Port 22): ${realScanTest.portStatus}`,
        `Server uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      ]
    }
  });
});

// Iniciar servidor
async function startServer() {
  const nmapInstalled = await checkNmap();
  if (!nmapInstalled) {
    console.log('Por favor, instala nmap antes de continuar.');
    // No salir, permitir que el servidor se inicie para mostrar el estado de 'offline'
    // process.exit(1); 
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor de escaneo corriendo en http://localhost:${PORT}`);
    console.log(`📡 Endpoint de escaneo: POST http://localhost:${PORT}/scan`);
    console.log(`❤️  Health check: GET http://localhost:${PORT}/health`);
  });
}

startServer();