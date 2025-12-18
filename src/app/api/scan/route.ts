import { NextRequest, NextResponse } from 'next/server';

// Esta API ahora actúa como proxy hacia el servidor de escaneo real
// o devuelve un error si no está configurado.

const SCAN_SERVER_URL = process.env.NEXT_PUBLIC_SCAN_SERVER_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // Si no hay servidor de escaneo configurado, devolver error
    if (!SCAN_SERVER_URL || SCAN_SERVER_URL === '') {
      return NextResponse.json({ 
        error: 'Scan server not configured',
        message: 'Please set up the real scan server and configure NEXT_PUBLIC_SCAN_SERVER_URL'
      }, { status: 503 });
    }

    const body = await request.json();
    
    // Reenviar la solicitud al servidor de escaneo real
    const response = await fetch(`${SCAN_SERVER_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Scan server error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy scan error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'Make sure your scan server is running and accessible'
    }, { status: 500 });
  }
}