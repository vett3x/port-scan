export interface ScanResult {
  ip: string;
  port: number;
  status: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
  scanTime: string;
}