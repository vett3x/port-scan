export async function POST(request: Request) {
  const body = await request.json();
  const { start, end } = body as { start: string; end: string };
  const ports = Array.from({ length: 5 }, (_, i) => ({
    ip: `${start}.${i + 1}`,
    port: 80 + i,
    status: 'open',
  }));
  return new Response(JSON.stringify(ports), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}