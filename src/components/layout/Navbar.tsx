"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { DEFAULT_DEMO_ATTESTORS } from "@/lib/web3/config";
import { Shield, Key, Lock, Zap, ChevronDown, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { wallet, connectWallet, switchRole, isDemoMode, setDemoMode, switchNetwork } = useWeb3();

  const navItems = [
    { label: "Overview", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Create", href: "/create" },
    { label: "Recovery", href: "/recovery" },
    { label: "Audit", href: "/audit" },
  ];

  const shortenAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const isSupportedChain = wallet.chainId === 97 || wallet.chainId === 31337;

  return (
    <>
      {/* Wrong Network Warning Banner */}
      {!isSupportedChain && (
        <div className="w-full bg-rose-600/90 text-white py-2 px-4 text-center font-mono text-xs font-bold flex items-center justify-center gap-3 z-50 shadow-lg">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>WRONG NETWORK DETECTED (Chain ID: {wallet.chainId}). Heirloom requires BNB Smart Chain Testnet (97) or Hardhat Localnet (31337).</span>
          <button
            onClick={() => switchNetwork(97)}
            className="px-3 py-1 rounded-lg bg-white text-rose-950 font-bold hover:bg-slate-100 transition text-[11px]"
          >
            SWITCH TO BNB TESTNET (97)
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full bg-[#05070c]/85 border-b border-white/[0.08] backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">HEIRLOOM</span>
                <span className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                  PROTOCOL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Trust-Minimized Infrastructure</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls / Telemetry Badges */}
          <div className="flex items-center gap-3">
            
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{wallet.chainId === 97 ? "BNB TESTNET" : "LOCALNET (31337)"}</span>
            </div>

            {/* Demo Mode Badge */}
            <button
              onClick={() => setDemoMode(!isDemoMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all ${
                isDemoMode
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
              title="Toggle between Demo Mode (60s timers) and Production Mode (180d timers)"
            >
              <Zap className={`w-3.5 h-3.5 ${isDemoMode ? "animate-pulse text-amber-400" : ""}`} />
              <span>{isDemoMode ? "⚡ DEMO MODE" : "PROD MODE"}</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-[11px] font-mono text-slate-200 hover:bg-slate-800 transition">
                <span className="capitalize font-semibold text-cyan-400">{wallet.role.replace("_", " ")}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-2 w-60 vault-card rounded-2xl p-2 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Simulate Participant Role</p>
                </div>
                <button
                  onClick={() => switchRole("owner")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-200 hover:bg-indigo-600/20 transition font-mono"
                >
                  <span>👑 Owner (0xf39F...2266)</span>
                  {wallet.role === "owner" && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => switchRole("beneficiary")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-200 hover:bg-indigo-600/20 transition font-mono"
                >
                  <span>🎁 Beneficiary (0x7099...79C8)</span>
                  {wallet.role === "beneficiary" && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => switchRole("attestor_a")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-200 hover:bg-indigo-600/20 transition font-mono"
                >
                  <span>⚖️ Attestor A (Legal)</span>
                  {wallet.address === DEFAULT_DEMO_ATTESTORS[0].address && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => switchRole("attestor_b")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-200 hover:bg-indigo-600/20 transition font-mono"
                >
                  <span>📜 Attestor B (Executor)</span>
                  {wallet.address === DEFAULT_DEMO_ATTESTORS[1].address && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => switchRole("attestor_c")}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-200 hover:bg-indigo-600/20 transition font-mono"
                >
                  <span>🏛️ Attestor C (Institutional)</span>
                  {wallet.address === DEFAULT_DEMO_ATTESTORS[2].address && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              </div>
            </div>

            {/* Wallet Address Button */}
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
            >
              <Key className="w-3.5 h-3.5 text-cyan-300" />
              <span>{wallet.isConnected ? shortenAddr(wallet.address) : "Connect Wallet"}</span>
            </button>
          </div>

        </div>
      </header>
    </>
  );
}
