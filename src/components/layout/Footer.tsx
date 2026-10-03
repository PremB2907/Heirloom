"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileCode, FileText, Lock, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-slate-950/80 backdrop-blur-md py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-wider">HEIRLOOM</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Trust-Minimized Digital Inheritance Protocol built on BNB Smart Chain.
              Combines AES-256-GCM encryption, Shamir Secret Sharing, independent threshold attestation, and emergency challenge periods.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-cyan-400">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Off-Chain Encryption</span>
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> BNB Chain ID: 97 / 31337</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Protocol Links</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-indigo-400 transition">Overview</Link></li>
              <li><Link href="/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link></li>
              <li><Link href="/create" className="hover:text-indigo-400 transition">Create Heirloom</Link></li>
              <li><Link href="/recovery" className="hover:text-indigo-400 transition">Recovery Center</Link></li>
              <li><Link href="/audit" className="hover:text-indigo-400 transition">Audit Log</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Architecture Docs</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="https://github.com/PremB2907/Bnb26_Winning-Team_Internal_Round" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition flex items-center gap-2"><FileCode className="w-3.5 h-3.5" /> GitHub Repository</a></li>
              <li><span className="text-slate-500 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Threat Model Specification</span></li>
              <li><span className="text-slate-500 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Security Audit Notes</span></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Heirloom Protocol. Built for BNB Smart Chain Internal Hackathon.</p>
          <p className="font-mono text-indigo-400/80">AES-256-GCM + Shamir Threshold Secret Sharing</p>
        </div>
      </div>
    </footer>
  );
}
