"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, Shield, Terminal, Cpu, Lock, Zap } from 'lucide-react';
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [terminalText, setTerminalText] = useState("");
  const commands = [
    "> scan --target 192.168.1.0/24 --ports 1-1000",
    "> nmap -sS -sV -O target.com",
    "> vulnerability_scan --intensive",
    "> analyze --report --export pdf",
    "> penetration_test --auto",
  ];
  
  useEffect(() => {
    let currentIndex = 0;
    let currentChar = 0;
    let isDeleting = false;
    
    const typeEffect = () => {
      const currentCommand = commands[currentIndex];
      
      if (!isDeleting && currentChar <= currentCommand.length) {
        setTerminalText(currentCommand.substring(0, currentChar));
        currentChar++;
        setTimeout(typeEffect, 50);
      } else if (isDeleting && currentChar >= 0) {
        setTerminalText(currentCommand.substring(0, currentChar));
        currentChar--;
        setTimeout(typeEffect, 30);
      } else {
        isDeleting = !isDeleting;
        if (!isDeleting) {
          currentIndex = (currentIndex + 1) % commands.length;
        }
        setTimeout(typeEffect, 1000);
      }
    };
    
    typeEffect();
    
    return () => {};
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] h-[1px] bg-green-500 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: '0 0 10px 2px #22c55e'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">
        {/* Header with glitch effect */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 text-5xl md:text-7xl font-bold tracking-tighter opacity-5 blur-sm">
            <span className="text-gradient">ETHICAL_H4CK3R</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 relative">
            <span className="text-gradient font-mono tracking-tighter">PORTSCANNER</span>
            <span className="text-green-500 font-mono ml-2">v2.0</span>
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-green-400 font-mono text-sm">SYSTEM: ONLINE</p>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-gray-400 max-w-2xl mx-auto mb-8 font-mono">
            [ Advanced Network Security Scanner | Penetration Testing Tool | Security Audit Suite ]
          </p>
          
          {/* Animated terminal */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="hacker-card rounded-lg p-0 overflow-hidden">
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 border-b border-green-900/50">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-green-400 text-sm font-mono">terminal@hacker:~</span>
              </div>
              <div className="p-4 font-mono text-green-300 h-20">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">$</span>
                  <span className="animate-pulse">|</span>
                  <span className="ml-1">{terminalText}</span>
                </div>
                <div className="text-green-500/50 text-sm mt-2">
                  // Scanning in progress... Detecting vulnerabilities
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 hacker-card border-green-500 hover:border-green-400">
              <Link href="/scan-ports">
                <Scan className="h-5 w-5" />
                <span className="font-mono">INITIATE_SCAN</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-green-900 text-green-400 hover:bg-green-950">
              <Link href="#features">
                <Terminal className="h-5 w-5" />
                <span className="font-mono">VIEW_FEATURES</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mb-20">
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            <h2 className="text-2xl font-bold font-mono text-green-400">[CORE_FEATURES]</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hacker-card hover:scale-[1.02] transition-transform">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 border border-green-500/30">
                  <Cpu className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="font-mono text-green-300">ADVANCED_SCANNING</CardTitle>
                <CardDescription className="text-gray-400">
                  Multi-threaded port scanning with stealth techniques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm font-mono">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    SYN/ACK Stealth Scanning
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    OS & Service Detection
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Banner Grabbing
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Vulnerability Assessment
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hacker-card hover:scale-[1.02] transition-transform">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 border border-green-500/30">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="font-mono text-green-300">SECURITY_AUDIT</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive security analysis and reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm font-mono">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Risk Assessment
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Compliance Checking
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Detailed Reporting
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Export in Multiple Formats
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hacker-card hover:scale-[1.02] transition-transform">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 border border-green-500/30">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="font-mono text-green-300">PERFORMANCE</CardTitle>
                <CardDescription className="text-gray-400">
                  High-speed scanning with optimized algorithms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm font-mono">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Async Concurrent Scans
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Intelligent Throttling
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Real-time Monitoring
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    Resource Optimization
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="hacker-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">24/7</div>
              <div className="text-sm text-gray-400 mt-2">UPTIME</div>
            </div>
            <div className="hacker-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">100+</div>
              <div className="text-sm text-gray-400 mt-2">SCANS/MONTH</div>
            </div>
            <div className="hacker-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">99.9%</div>
              <div className="text-sm text-gray-400 mt-2">ACCURACY</div>
            </div>
            <div className="hacker-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">0</div>
              <div className="text-sm text-gray-400 mt-2">FALSE_POSITIVES</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 blur-3xl"></div>
          
          <Card className="hacker-card border-green-500/50 max-w-2xl mx-auto relative">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="h-6 w-6 text-green-400" />
                <CardTitle className="font-mono text-green-300 text-2xl">READY_TO_HACK?</CardTitle>
                <Lock className="h-6 w-6 text-green-400" />
              </div>
              <CardDescription className="text-gray-400 font-mono">
                // For educational and authorized security testing only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Start scanning networks, identifying vulnerabilities, and securing systems with professional-grade tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="gap-2 hacker-card border-green-500 hover:border-green-400">
                    <Link href="/scan-ports">
                      <Scan className="h-5 w-5" />
                      <span className="font-mono">LAUNCH_SCANNER</span>
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2 border-green-900 text-green-400 hover:bg-green-950">
                    <Link href="/scan-ports">
                      <Terminal className="h-5 w-5" />
                      <span className="font-mono">VIEW_DOCS</span>
                    </Link>
                  </Button>
                </div>
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
                  <p className="font-mono">WARNING: Use only on networks you own or have explicit permission to test.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-green-400">ETHICAL_H4CK3R_TOOLS</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">v2.0.1 | Built for Security Professionals</p>
            </div>
            <div className="text-gray-500 text-sm">
              <p className="font-mono">© 2024 Ethical Hacker Tools. All rights reserved.</p>
              <p className="mt-1">For authorized security testing only.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}