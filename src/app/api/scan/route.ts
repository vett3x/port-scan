import { NextRequest, NextResponse } from 'next/server';
import portScanner from 'portscanner';

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

    // Validar que el host sea accesible (evitar escaneos maliciosos)
    if (!isValidHost(host)) {
      return NextResponse.json({ error: 'Invalid host format' }, { status: 400 });
    }

    // Limitar el número de puertos para no exceder el tiempo de ejecución
    const maxPorts = 50; // Límite más bajo por seguridad y tiempo
    const portsToScan = ports.slice(0, maxPorts);

    console.log(`[SCAN_INITIATED] Scanning ${host} on ports: ${portsToScan.join(',')}`);

    // Escanear puertos usando portscanner
    const scanPromises = portsToScan.map(port => 
      new Promise<{port: number, status: 'open' | 'closed' | 'filtered', banner?: string}>((resolve) => {
        const startTime = Date.now();
        
        portScanner.checkPortStatus(port, host, { 
          timeout: timeout,
          host: host
        }, (error: any, status: any) => {
          const elapsed = Date.now() - startTime;
          
          // Determinar el estado basado en la respuesta
          let scanStatus: 'open' | 'closed' | 'filtered' = 'closed';
          let banner = undefined;
          
          if (error) {
            // Si hay timeout, probablemente esté filtrado
            scanStatus = elapsed > timeout * 0.8 ? 'filtered' : 'closed';
          } else if (status === 'open') {
            scanStatus = 'open';
            // Intentar obtener información básica del servicio
            banner = guessServiceByPort(port);
          } else {
            scanStatus = 'closed';
          }
          
          resolve({
            port,
            status: scanStatus,
            banner
          });
        });
      })
    );

    // Ejecutar escaneos con límite de concurrencia
    const batchSize = Math.min(maxConcurrent, 10); // Máximo 10 concurrentes por seguridad
    const results = [];
    
    for (let i = 0; i < scanPromises.length; i += batchSize) {
      const batch = scanPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes para no saturar
      if (i + batchSize < scanPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Formatear resultados
    const formattedResults = results.map(result => ({
      ip: host,
      port: result.port,
      status: result.status,
      service: getServiceByPort(result.port),
      banner: result.banner,
      scanTime: new Date().toISOString(),
    }));

    console.log(`[SCAN_COMPLETED] ${host}: Found ${formattedResults.filter(r => r.status === 'open').length} open ports`);
    
    return NextResponse.json({ 
      results: formattedResults,
      metadata: {
        host,
        totalScanned: portsToScan.length,
        openPorts: formattedResults.filter(r => r.status === 'open').length,
        scanDuration: 'completed'
      }
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    67: 'DHCP Server',
    68: 'DHCP Client',
    69: 'TFTP',
    80: 'HTTP',
    110: 'POP3',
    123: 'NTP',
    135: 'MS RPC',
    137: 'NetBIOS',
    138: 'NetBIOS',
    139: 'NetBIOS',
    143: 'IMAP',
    161: 'SNMP',
    162: 'SNMP Trap',
    179: 'BGP',
    389: 'LDAP',
    443: 'HTTPS',
    445: 'SMB',
    465: 'SMTPS',
    514: 'Syslog',
    515: 'LPD',
    587: 'SMTP Submission',
    636: 'LDAPS',
    993: 'IMAPS',
    995: 'POP3S',
    1080: 'SOCKS Proxy',
    1194: 'OpenVPN',
    1433: 'MS SQL',
    1521: 'Oracle DB',
    1723: 'PPTP',
    1883: 'MQTT',
    1900: 'UPnP',
    2082: 'cPanel',
    2083: 'cPanel SSL',
    2086: 'WHM',
    2087: 'WHM SSL',
    2095: 'Webmail',
    2096: 'Webmail SSL',
    2181: 'ZooKeeper',
    2375: 'Docker',
    2376: 'Docker SSL',
    2483: 'Oracle DB SSL',
    2484: 'Oracle DB SSL',
    3000: 'Node.js',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    5938: 'TeamViewer',
    6379: 'Redis',
    6443: 'Kubernetes',
    6667: 'IRC',
    8000: 'HTTP Alt',
    8008: 'HTTP Alt',
    8080: 'HTTP Proxy',
    8081: 'HTTP Proxy Alt',
    8443: 'HTTPS Alt',
    8888: 'HTTP Alt',
    9000: 'SonarQube',
    9001: 'Tor',
    9042: 'Cassandra',
    9092: 'Kafka',
    9200: 'Elasticsearch',
    9300: 'Elasticsearch',
    11211: 'Memcached',
    27017: 'MongoDB',
    27018: 'MongoDB',
    28017: 'MongoDB HTTP',
    50000: 'DB2',
    50070: 'Hadoop',
    50075: 'Hadoop'
  };

  return portServices[port] || 'Unknown';
}

// Función para adivinar el servicio por puerto (para banners)
function guessServiceByPort(port: number): string {
  const commonBanners: { [key: number]: string } = {
    21: '220 FTP Server Ready',
    22: 'SSH-2.0-OpenSSH',
    25: '220 SMTP Service Ready',
    80: 'HTTP/1.1 200 OK',
    110: '+OK POP3 Server Ready',
    143: '* OK IMAP Server Ready',
    443: 'HTTP/1.1 200 OK',
    445: 'SMB Server',
    993: '* OK IMAP Server Ready',
    995: '+OK POP3 Server Ready',
    3306: 'MySQL Server',
    3389: 'RDP Server',
    5432: 'PostgreSQL Server',
    8080: 'HTTP/1.1 200 OK',
    8443: 'HTTP/1.1 200 OK'
  };

  return commonBanners[port] || 'Service detected on port ' + port;
}

// Validar formato de host
function isValidHost(host: string): boolean {
  // Validar IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // Validar dominio (solo para demostración - en producción ser más restrictivo)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  
  // Permitir localhost para pruebas
  if (host === 'localhost' || host === '127.0.0.1') {
    return false; // Por seguridad, no permitir escaneos locales desde frontend
  }
  
  return ipv4Regex.test(host) || domainRegex.test(host);
}