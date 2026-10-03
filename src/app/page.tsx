"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Key, Lock, Cpu, Clock, CheckCircle2, ArrowRight, Zap, Eye, AlertTriangle, FileCode } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-10 pb-16">
        
        {/* Glow ambient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium shadow-xl">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>BNB SMART CHAIN TESTNET PROTOCOL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your digital legacy should not depend on a <span className="gradient-text">single person</span>.
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Heirloom is a trust-minimized digital inheritance protocol. Protect passkeys, credentials, wills, and private keys off-chain with AES-256-GCM and Shamir Secret Sharing, releasing assets only when inactivity and multi-attestor threshold conditions are proven.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/create"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
            >
              <span>Create a Heirloom</span>
              <ArrowRight className="w-5 h-5 text-cyan-300" />
            </Link>

            <Link
              href="/recovery"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-slate-800/80 text-white font-semibold flex items-center justify-center gap-3 transition-all border border-white/10"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <span>View Interactive Demo</span>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AES-256-GCM Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Shamir Secret Sharing (3 of 5)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Plaintext Secrets On-Chain</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Protocol Architecture Pipeline Section */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Heirloom Protects Your Secrets</h2>
          <p className="text-slate-400 text-sm">
            Strict cryptographic boundaries ensure no admin, platform, or single attestor can unilaterally access your assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold font-mono">
              01
            </div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Off-Chain AES Encryption
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your document or credential file is encrypted client-side using standard AES-256-GCM with a fresh random 256-bit key.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold font-mono">
              02
            </div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Shamir Key Splitting
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              The AES encryption key is split into 5 Shamir secret shares (3 of 5 threshold). Only keccak256 hashes are stored on-chain.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold font-mono">
              03
            </div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Owner Heartbeat & Inactivity
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              The owner sends periodic on-chain heartbeats. If no heartbeat occurs for configured duration (e.g. 180d or 60s demo), recovery opens.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold font-mono">
              04
            </div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              Challenge & Decryption
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Once 3 of 5 attestors approve, a mandatory challenge timer starts (7d or 30s demo). If uncancelled, beneficiary reconstructs key and decrypts.
            </p>
          </div>

        </div>
      </section>

      {/* Security Principles & Threat Model Section */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 border border-surface-border space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">VERIFIABLE THREAT MODEL</span>
            <h3 className="text-2xl font-bold text-white mt-1">Core Protocol Principles</h3>
          </div>
          <Link href="/audit" className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>View Smart Contract Audit State</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>No Plaintext Secrets On-Chain</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              The blockchain stores only metadata, keccak256 commitments, authorization state, timestamps, and addresses. Encrypted ciphertext resides on IPFS / storage nodes.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Inactivity != Cryptographic Death Proof</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              Inactivity alone NEVER triggers asset release. Release requires (1) owner inactivity timeout, (2) formal request, (3) independent evidence, (4) threshold attestation, and (5) challenge expiry.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Emergency Owner Intervention</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              If a owner returns or recovery is falsely triggered, calling `cancelRecovery()` or `heartbeat()` immediately halts the challenge process and restores asset status to ACTIVE.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Resilient Against Unresponsive Attestors</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pl-8">
              Threshold architecture (e.g. 3 of 5) ensures recovery proceeds cleanly even if up to 2 attestors lose keys, disappear, or become unresponsive.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-10 sm:p-16 rounded-3xl border border-indigo-500/30 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="w-64 h-64 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Ready to Protect Your Digital Inheritance?</h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Test the protocol end-to-end in Demo Mode with 60-second inactivity and 30-second challenge timers directly on local Hardhat network or BNB Testnet.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link href="/create" className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition">
            Create New Asset
          </Link>
          <Link href="/dashboard" className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition border border-white/10">
            Open Dashboard
          </Link>
        </div>
      </section>

    </div>
  );
}
