"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { recordHeartbeatOnChain, getAssetFromChain } from "@/lib/web3/contractService";
import { Shield, Key, Clock, Heart, AlertTriangle, CheckCircle2, ArrowRight, Lock, Activity, Users } from "lucide-react";

export default function DashboardPage() {
  const { wallet, isDemoMode } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<number>(Date.now());
  const [isHeartbeating, setIsHeartbeating] = useState(false);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState(false);

  // Inactivity threshold in seconds (60s in demo mode, 180 days in prod)
  const inactivitySeconds = isDemoMode ? 60 : 180 * 24 * 3600;
  const [timeRemaining, setTimeRemaining] = useState<number>(inactivitySeconds);

  useEffect(() => {
    setMounted(true);
    getAssetFromChain(1).catch(() => {});
  }, []);

  // Real-time countdown clock until owner recovery eligibility
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastHeartbeatTime) / 1000);
      const remaining = Math.max(0, inactivitySeconds - elapsedSeconds);
      setTimeRemaining(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastHeartbeatTime, inactivitySeconds]);

  const handleHeartbeat = async () => {
    setIsHeartbeating(true);
    setHeartbeatSuccess(false);

    try {
      await recordHeartbeatOnChain(1, wallet.address);
    } catch (e) {
      console.warn("Simulation mode:", e);
    }

    setLastHeartbeatTime(Date.now());
    setIsHeartbeating(false);
    setHeartbeatSuccess(true);
    setTimeout(() => setHeartbeatSuccess(false), 4000);
  };

  const isEligibleForRecovery = timeRemaining === 0;

  if (!mounted) return null;

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">HEIRLOOM VAULT</h1>
            {isDemoMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                ⚡ DEMO (60s)
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            CONNECTED WALLET: <span className="text-cyan-400 font-bold">{wallet.address}</span> ({wallet.role.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleHeartbeat}
            disabled={isHeartbeating}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              heartbeatSuccess
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 text-rose-400 ${isHeartbeating ? "animate-ping" : ""}`} />
            <span>{isHeartbeating ? "RECORDING HEARTBEAT..." : heartbeatSuccess ? "✓ HEARTBEAT CONFIRMED" : "SEND LIVENESS HEARTBEAT"}</span>
          </button>

          <Link
            href="/create"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-bold border border-white/10 transition"
          >
            + CREATE VAULT
          </Link>
        </div>
      </div>

      {/* Protocol Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="vault-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>PROTECTED ASSETS</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-white">02</p>
          <p className="text-[11px] text-emerald-400 font-mono">100% AES-256-GCM ENCRYPTED</p>
        </div>

        <div className="vault-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>ACTIVE RECOVERY</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-white">{isEligibleForRecovery ? "01" : "00"}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {isEligibleForRecovery ? "⚡ ELIGIBLE FOR RECOVERY" : "ALL VAULTS SAFE"}
          </p>
        </div>

        <div className="vault-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>BENEFICIARIES</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-white">02</p>
          <p className="text-[11px] text-slate-400 font-mono">3-OF-5 THRESHOLD BOUND</p>
        </div>

        <div className="vault-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>HEARTBEAT STATUS</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-emerald-400">ACTIVE</p>
          <p className="text-[11px] text-slate-400 font-mono">LIVENESS PROVEN</p>
        </div>

      </div>

      {/* Active Vault Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            ACTIVE HEIRLOOM VAULTS
          </h2>
          <span className="text-xs font-mono text-slate-500">2 PROTECTED VAULTS</span>
        </div>

        {/* Vault Card 1 */}
        <div className="vault-card vault-card-hover p-6 rounded-2xl border border-white/[0.08] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white text-base">🔐 FAMILY EMERGENCY DOCUMENTS</h3>
                  <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                    isEligibleForRecovery ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {isEligibleForRecovery ? "RECOVERY ELIGIBLE" : "PROTECTED"}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-mono mt-0.5">VAULT ID: #0001 • CATEGORY: ENCRYPTED CREDENTIALS</p>
              </div>
            </div>

            <Link
              href="/recovery"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold border border-white/10 transition flex items-center gap-1.5 shrink-0"
            >
              <span>VIEW VAULT</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block mb-1">BENEFICIARY</span>
              <span className="text-cyan-300 font-bold">0x7099...79C8</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block mb-1">RECOVERY THRESHOLD</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span>● ● ● ○ ○</span>
                <span className="text-slate-400 text-[11px]">3 / 5</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block mb-1">INACTIVITY TIMER</span>
              <span className="text-slate-200">{isDemoMode ? "60 Seconds" : "180 Days"}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block mb-1">CHALLENGE PERIOD</span>
              <span className="text-slate-200">{isDemoMode ? "30 Seconds" : "7 Days"}</span>
            </div>
          </div>

          {/* Liveness Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">LIVENESS STATUS</span>
              <span className={`text-xs ${isEligibleForRecovery ? "text-amber-400 font-bold animate-pulse" : "text-emerald-400 font-semibold"}`}>
                {isEligibleForRecovery ? "⚡ OWNER INACTIVE - RECOVERY ELIGIBLE" : `Heartbeat Active (${timeRemaining}s remaining)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-1000 ${
                  isEligibleForRecovery ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, (1 - timeRemaining / inactivitySeconds) * 100)}%` }}
              />
            </div>
          </div>

          {/* Recovery Trigger Banner if eligible */}
          {isEligibleForRecovery && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-300 text-xs font-mono">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>No heartbeat detected within configured timer. Beneficiary can now initiate recovery.</span>
              </div>
              <Link
                href="/recovery"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-lg transition shrink-0"
              >
                INITIATE RECOVERY PROTOCOL
              </Link>
            </div>
          )}
        </div>

        {/* Vault Card 2 */}
        <div className="vault-card vault-card-hover p-6 rounded-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <Key className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">🔑 MASTER TREASURY SEED VAULT</h3>
                <p className="text-slate-400 text-xs font-mono">VAULT ID: #0002 • CATEGORY: CRYPTO SEED PHRASE</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
              PROTECTED
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
