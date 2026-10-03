"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileCode, FileText, Lock, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#05070c]/90 backdrop-blur-xl py-12 mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="font-bold text-lg text-white tracking-wider">HEIRLOOM</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Trust-Minimized Digital Inheritance Protocol built on BNB Smart Chain.
              Combines AES-256-GCM off-chain encryption, Shamir Secret Sharing over $GF(256)$, independent threshold attestation, and smart contract emergency challenge windows.
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono text-cyan-400">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Client-Side AES-256-GCM</span>
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> BNB Chain ID: 97 / 31337</span>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">PROTOCOL NAVIGATION</h4>
            <div className="flex flex-col space-y-2 text-xs text-slate-400">
              <Link href="/" className="hover:text-indigo-300 transition">Overview</Link>
              <Link href="/dashboard" className="hover:text-indigo-300 transition">Vault Dashboard</Link>
              <Link href="/create" className="hover:text-indigo-300 transition">Create Heirloom</Link>
              <Link href="/recovery" className="hover:text-indigo-300 transition">Recovery Center</Link>
              <Link href="/audit" className="hover:text-indigo-300 transition">Audit Explorer</Link>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">SECURITY RESOURCES</h4>
            <div className="flex flex-col space-y-2 text-xs text-slate-400">
              <a href="https://github.com/PremB2907/Bnb26_Winning-Team_Internal_Round" target="_blank" rel="noreferrer" className="hover:text-indigo-300 transition flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" /> GitHub Repository
              </a>
              <span className="hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Threat Model Specification
              </span>
              <span className="hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Cryptographic Audit Notes
              </span>
            </div>
          </div>

        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono">
          <p>© 2026 HEIRLOOM PROTOCOL. Built for BNB Smart Chain Internal Round.</p>
          <p className="text-slate-400">BNB Smart Chain Testnet (Chain ID 97) • Operational</p>
        </div>
      </div>
    </footer>
  );
}
