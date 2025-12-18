import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

// Función para escanear un puerto en un host
function scanPort(host: string, port: number, timeout: number = 1000): Promise<{port: number, status: 'open' | 'closed' | 'filtered', banner?: string}> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status: 'open' | 'closed' | 'filtered' = 'closed';

    // Configurar tiempo de espera
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      status = 'open';
      // Intentar obtener banner
      socket.write('HEAD / HTTP/1.0\r\n\r\n');
      socket.destroy();
      resolve({ port, status, banner: 'Service detected' });
    });

    socket.on('timeout', () => {
      status = 'filtered';
      socket.destroy();
      resolve({ port, status });
    });

    socket.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED') {
        status = 'closed';
      } else {
        status = 'filtered';
      }
      socket.destroy();
      resolve({ port, status });
    });

    socket.connect(port, host);
  });
}

// Función para escanear un rango de puertos
async function scanPorts(host: string, ports: number[], timeout: number, maxConcurrent: number) {
  const results = [];
  let currentIndex = 0;

  // Función para procesar un lote de puertos
  async function processBatch(batchPorts: number[]) {
    const batchPromises = batchPorts.map(port => scanPort(host, port, timeout));
    return Promise.all(batchPromises);
  }

  // Procesar en lotes para no exceder el máximo de conexiones concurrentes
  while (currentIndex < ports.length) {
    const batch = ports.slice(currentIndex, currentIndex + maxConcurrent);
    currentIndex += maxConcurrent;
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, ports, timeout = 1000, maxConcurrent = 50 } = body;

    // Validar parámetros
    if (!host) {
      return NextResponse.json({ error: 'Host is required' }, { status: 400 });
    }

    if (!ports || !Array.isArray(ports) || ports.length === 0) {
      return NextResponse.json({ error: 'Ports array is required' }, { status: 400 });
    }

    // Limitar el número de puertos para no exceder el tiempo de ejecución
    const maxPorts = 100; // Límite por seguridad
    const portsToScan = ports.slice(0, maxPorts);

    // Escanear puertos
    const scanResults = await scanPorts(host, portsToScan, timeout, maxConcurrent);

    // Formatear resultados
    const formattedResults = scanResults.map(result => ({
      ip: host,
      port: result.port,
      status: result.status,
      service: getServiceByPort(result.port),
      banner: result.banner,
      scanTime: new Date().toISOString(),
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Función auxiliar para obtener el servicio por puerto
function getServiceByPort(port: number): string {
  const portServices: { [key: number]: string } = {
    20: 'FTP Data',
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    465: 'SMTPS',
    587: 'SMTP Submission',
    993: 'IMAPS',
    995: 'POP3S',
    3389: 'RDP',
    8080: 'HTTP Proxy',
    8443: 'HTTPS Alt',
  };

  return portServices[port] || 'Unknown';
}