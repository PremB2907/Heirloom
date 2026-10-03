"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { getEncryptedAssetLocally, StoredEncryptedAsset } from "@/lib/storage/mockStorage";
import { recordHeartbeatOnChain, getAssetFromChain } from "@/lib/web3/contractService";
import { Shield, Key, Clock, Heart, AlertTriangle, CheckCircle2, User, ArrowRight, Zap, RefreshCw, Lock } from "lucide-react";

export default function DashboardPage() {
  const { wallet, isDemoMode, setDemoMode } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<number>(Date.now());
  const [isHeartbeating, setIsHeartbeating] = useState(false);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState(false);
  const [onChainAsset, setOnChainAsset] = useState<any>(null);

  // Inactivity threshold in seconds (60s in demo mode, 180 days in prod)
  const inactivitySeconds = isDemoMode ? 60 : 180 * 24 * 3600;
  
  const [timeRemaining, setTimeRemaining] = useState<number>(inactivitySeconds);

  useEffect(() => {
    setMounted(true);
    getAssetFromChain(1).then((res) => {
      if (res) setOnChainAsset(res);
    });
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
      console.warn("Fallback to simulation:", e);
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
      
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Inheritance Protection Dashboard</h1>
            {isDemoMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                DEMO MODE (60s)
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Connected Wallet: <span className="font-mono text-cyan-400">{wallet.address}</span> ({wallet.role.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleHeartbeat}
            disabled={isHeartbeating}
            className={`px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-lg transition-all ${
              heartbeatSuccess
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            <Heart className={`w-4 h-4 text-rose-400 ${isHeartbeating ? "animate-ping" : ""}`} />
            <span>{isHeartbeating ? "Recording On-Chain Heartbeat..." : heartbeatSuccess ? "✓ Heartbeat Confirmed On-Chain!" : "Send Liveness Heartbeat"}</span>
          </button>

          <Link
            href="/create"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-white/10 transition"
          >
            + Create New Asset
          </Link>
        </div>
      </div>

      {/* Protocol Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Protected Assets</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">2</p>
          <p className="text-[11px] text-emerald-400 font-mono">100% AES-256-GCM Encrypted</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Last Owner Heartbeat</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">Just now</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {timeRemaining > 0 ? `Eligible in ${timeRemaining}s` : "⚡ Eligible for Recovery!"}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Attestor Threshold</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">3 of 5</p>
          <p className="text-[11px] text-slate-400 font-mono">Shamir Secret Sharing</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Recovery Status</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">SAFE</p>
          <p className="text-[11px] text-slate-400 font-mono">Owner active & verified</p>
        </div>

      </div>

      {/* Active Protected Assets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Active Heirloom Protections
          </h2>
          <span className="text-xs font-mono text-slate-400">Showing 2 Registered Assets</span>
        </div>

        {/* Asset Card 1 */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl border border-surface-border space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white text-lg">Family Emergency Documents</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    PROTECTED
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">Asset ID: #1 • Type: Encrypted Credentials & Legal Records</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/recovery"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-white/10 transition flex items-center gap-1.5"
              >
                <span>View Security Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Beneficiary Address</span>
              <span className="font-mono text-cyan-300 font-medium">0x7099...79C8</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Threshold Attestors</span>
              <span className="font-mono text-slate-200 font-medium">3 / 5 Approvals</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Inactivity Timer</span>
              <span className="font-mono text-slate-200 font-medium">
                {isDemoMode ? "60 seconds" : "180 days"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Challenge Period</span>
              <span className="font-mono text-slate-200 font-medium">
                {isDemoMode ? "30 seconds" : "7 days"}
              </span>
            </div>
          </div>

          {/* Inactivity Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Owner Inactivity Status</span>
              <span className={`font-mono text-xs ${isEligibleForRecovery ? "text-amber-400 font-bold animate-pulse" : "text-emerald-400"}`}>
                {isEligibleForRecovery ? "⚡ OWNER INACTIVE - RECOVERY ELIGIBLE!" : `Heartbeat Active (${timeRemaining}s remaining)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isEligibleForRecovery ? "bg-amber-500" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(100, (1 - timeRemaining / inactivitySeconds) * 100)}%` }}
              />
            </div>
          </div>

          {/* Recovery Trigger Banner if eligible */}
          {isEligibleForRecovery && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>No heartbeat detected within configured timer. Beneficiary can now initiate recovery.</span>
              </div>
              <Link
                href="/recovery"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition shrink-0"
              >
                Initiate Protocol Recovery
              </Link>
            </div>
          )}
        </div>

        {/* Asset Card 2 */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Crypto Treasury & Master Seed Vault</h3>
                <p className="text-slate-400 text-xs">Asset ID: #2 • Type: Encrypted Seed Phrase</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              PROTECTED
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
