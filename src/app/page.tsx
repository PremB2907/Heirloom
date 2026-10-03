"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Key, Lock, Clock, CheckCircle2, ArrowRight, Zap, AlertTriangle, FileCode, Cpu, Database, Fingerprint, Activity, Users, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-4">
      
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto pt-8 pb-12 text-center space-y-8">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 font-mono text-xs font-medium shadow-xl">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>BNB SMART CHAIN INFRASTRUCTURE PROTOCOL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Your digital legacy should not depend on a <br className="hidden sm:inline" />
            <span className="gradient-text-accent">single person</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Protect sensitive digital assets with client-side encryption, threshold authorization, owner liveness and time-bound recovery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/create"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
            >
              <span>CREATE HEIRLOOM</span>
              <ArrowRight className="w-4 h-4 text-cyan-300" />
            </Link>

            <Link
              href="/recovery"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2.5 transition border border-white/10"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>EXPLORE PROTOCOL</span>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3-of-5 Threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Plaintext On-Chain</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>BNB Smart Chain</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Hero Visual Protocol Diagram */}
      <section className="max-w-4xl mx-auto">
        <div className="vault-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">CRYPTOGRAPHIC WORKFLOW</span>
            <h3 className="text-lg font-bold text-white">Trust-Minimized Key Splitting & Recovery Pipeline</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-center font-mono text-xs">
            
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
              <Fingerprint className="w-6 h-6 text-indigo-400 mx-auto" />
              <p className="font-bold text-white text-xs">OWNER</p>
              <p className="text-[10px] text-slate-400">Client Payload</p>
            </div>

            <div className="hidden sm:flex justify-center text-indigo-400 font-bold">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
              <Lock className="w-6 h-6 text-cyan-400 mx-auto" />
              <p className="font-bold text-white text-xs">DIGITAL VAULT</p>
              <p className="text-[10px] text-slate-400">AES-256-GCM</p>
            </div>

            <div className="hidden sm:flex justify-center text-indigo-400 font-bold">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
              <Key className="w-6 h-6 text-amber-400 mx-auto" />
              <p className="font-bold text-white text-xs">3 OF 5 SHARES</p>
              <div className="flex justify-center gap-1 text-amber-400 text-xs">
                <span>●</span><span>●</span><span>●</span><span className="text-slate-600">○</span><span className="text-slate-600">○</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Protocol Pipeline Grid ("How Heirloom Protects Your Secrets") */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">PROTOCOL MECHANICS</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Heirloom Protects Your Secrets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="vault-card vault-card-hover p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-indigo-400">01</span>
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-base">CLIENT-SIDE ENCRYPTION</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              AES-256-GCM encrypts the asset before it leaves the user's device. Plaintext never touches the network.
            </p>
          </div>

          <div className="vault-card vault-card-hover p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-indigo-400">02</span>
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-base">THRESHOLD KEY SPLITTING</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              The encryption key is divided into 5 shares over $GF(256)$ with a 3-of-5 recovery threshold requirement.
            </p>
          </div>

          <div className="vault-card vault-card-hover p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-indigo-400">03</span>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-base">OWNER LIVENESS</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Periodic blockchain heartbeats prevent accidental recovery from inactivity alone.
            </p>
          </div>

          <div className="vault-card vault-card-hover p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-indigo-400">04</span>
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-base">CHALLENGE + RELEASE</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Independent attestations and a mandatory challenge period protect against premature release.
            </p>
          </div>

        </div>
      </section>

      {/* Security Architecture ("SECURITY BY DESIGN") */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">THREAT MODEL VERIFICATION</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">SECURITY BY DESIGN</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="vault-card p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-3 text-white font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>NO PLAINTEXT ON-CHAIN</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              Only metadata and cryptographic commitments touch the blockchain. Encrypted payloads remain in client-controlled off-chain storage.
            </p>
          </div>

          <div className="vault-card p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-3 text-white font-bold text-sm">
              <Users className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>THRESHOLD AUTHORIZATION</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              No single attestor can release an asset. Requires $k=3$ independent attestor approvals to reach authorization.
            </p>
          </div>

          <div className="vault-card p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-3 text-white font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>OWNER INTERVENTION</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              The owner can cancel an active recovery during the challenge period with a single transaction or liveness heartbeat.
            </p>
          </div>

          <div className="vault-card p-6 rounded-2xl space-y-2">
            <div className="flex items-center gap-3 text-white font-bold text-sm">
              <Database className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>AUDITABLE RECOVERY</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              Every critical state transition produces an immutable smart contract event on BNB Smart Chain.
            </p>
          </div>

        </div>
      </section>

      {/* Live Protocol Status Console ("PROTOCOL TELEMETRY") */}
      <section className="vault-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">PROTOCOL STATUS</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
            ● OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 font-mono text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block mb-1">NETWORK</span>
            <span className="text-white font-bold">BNB TESTNET</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-1">CHAIN ID</span>
            <span className="text-cyan-400 font-bold">97</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-1">ENCRYPTION</span>
            <span className="text-indigo-400 font-bold">AES-256-GCM</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-1">RECOVERY MODEL</span>
            <span className="text-amber-400 font-bold">3 OF 5 THRESHOLD</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-1">STORAGE</span>
            <span className="text-slate-200">OFF-CHAIN</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-1">PLAINTEXT ON-CHAIN</span>
            <span className="text-emerald-400 font-bold">NEVER</span>
          </div>
        </div>
      </section>

    </div>
  );
}
