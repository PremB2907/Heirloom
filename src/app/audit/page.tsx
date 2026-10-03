"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Key, Clock, CheckCircle2, ExternalLink, Filter, Search, FileCode, AlertTriangle } from "lucide-react";

interface AuditEvent {
  id: string;
  eventName: "AssetRegistered" | "HeartbeatRecorded" | "RecoveryInitiated" | "EvidenceSubmitted" | "RecoveryApproved" | "ChallengePeriodStarted" | "RecoveryCancelled" | "AssetReleased";
  assetId: number;
  actor: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  details: string;
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvent, setFilterEvent] = useState("ALL");

  const auditEvents: AuditEvent[] = [
    {
      id: "ev-9",
      eventName: "AssetReleased",
      assetId: 1,
      actor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      txHash: "0xa81f98c7e92314502d91b4892c90123849102384920193849102384910238400",
      blockNumber: 42819022,
      timestamp: "03 OCT 2026, 15:40:12 UTC",
      details: "Challenge period expired cleanly. Heirloom asset released to beneficiary.",
    },
    {
      id: "ev-8",
      eventName: "ChallengePeriodStarted",
      assetId: 1,
      actor: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      txHash: "0x7b2f98c7e92314502d91b4892c90123849102384920193849102384910238411",
      blockNumber: 42819001,
      timestamp: "03 OCT 2026, 15:39:42 UTC",
      details: "Threshold reached (3 of 5). 30-second emergency challenge period initialized.",
    },
    {
      id: "ev-7",
      eventName: "RecoveryApproved",
      assetId: 1,
      actor: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      txHash: "0x4c2f98c7e92314502d91b4892c90123849102384920193849102384910238422",
      blockNumber: 42819000,
      timestamp: "03 OCT 2026, 15:39:40 UTC",
      details: "Attestor C (Institutional Escrow) submitted valid signature approval (3/5).",
    },
    {
      id: "ev-6",
      eventName: "RecoveryApproved",
      assetId: 1,
      actor: "0x3C44CdD38a9007593815693d5aA010Eb282841E",
      txHash: "0x3a2f98c7e92314502d91b4892c90123849102384920193849102384910238433",
      blockNumber: 42818995,
      timestamp: "03 OCT 2026, 15:39:35 UTC",
      details: "Attestor B (Trusted Executor) submitted valid signature approval (2/5).",
    },
    {
      id: "ev-5",
      eventName: "RecoveryApproved",
      assetId: 1,
      actor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      txHash: "0x2a2f98c7e92314502d91b4892c90123849102384920193849102384910238444",
      blockNumber: 42818990,
      timestamp: "03 OCT 2026, 15:39:30 UTC",
      details: "Attestor A (Legal Guardian) submitted valid signature approval (1/5).",
    },
    {
      id: "ev-4",
      eventName: "EvidenceSubmitted",
      assetId: 1,
      actor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      txHash: "0x1a2f98c7e92314502d91b4892c90123849102384920193849102384910238455",
      blockNumber: 42818980,
      timestamp: "03 OCT 2026, 15:39:20 UTC",
      details: "Evidence hash 0x7c99...2a1b recorded on-chain (IPFS CID QmEvidenceCert88921).",
    },
    {
      id: "ev-3",
      eventName: "RecoveryInitiated",
      assetId: 1,
      actor: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      txHash: "0x0a2f98c7e92314502d91b4892c90123849102384920193849102384910238466",
      blockNumber: 42818970,
      timestamp: "03 OCT 2026, 15:39:10 UTC",
      details: "Owner inactivity period elapsed. Beneficiary initiated recovery request.",
    },
    {
      id: "ev-2",
      eventName: "HeartbeatRecorded",
      assetId: 1,
      actor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      txHash: "0x9f2f98c7e92314502d91b4892c90123849102384920193849102384910238477",
      blockNumber: 42818800,
      timestamp: "03 OCT 2026, 15:38:10 UTC",
      details: "Owner proof-of-liveness heartbeat recorded on-chain.",
    },
    {
      id: "ev-1",
      eventName: "AssetRegistered",
      assetId: 1,
      actor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      txHash: "0x8f2f98c7e92314502d91b4892c90123849102384920193849102384910238488",
      blockNumber: 42818000,
      timestamp: "03 OCT 2026, 15:30:00 UTC",
      details: "Asset #1 registered. Inactivity 60s, Challenge 30s, Threshold 3 of 5.",
    },
  ];

  const getEventBadge = (name: string) => {
    switch (name) {
      case "AssetRegistered":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "HeartbeatRecorded":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "RecoveryInitiated":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "EvidenceSubmitted":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "RecoveryApproved":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "ChallengePeriodStarted":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "RecoveryCancelled":
        return "bg-rose-600/30 text-rose-200 border-rose-500/50";
      case "AssetReleased":
        return "bg-emerald-600/30 text-emerald-200 border-emerald-500/50";
      default:
        return "bg-slate-800 text-slate-300 border-white/10";
    }
  };

  const filteredEvents = auditEvents.filter((ev) => {
    const matchesFilter = filterEvent === "ALL" || ev.eventName === filterEvent;
    const matchesSearch =
      ev.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Verifiable Blockchain Audit Log</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              IMMUTABLE EVENTS
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Every protocol action emits an immutable smart contract event on BNB Smart Chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://testnet.bscscan.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono border border-white/10 transition flex items-center gap-2"
          >
            <span>Open BscScan Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-surface-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Tx Hash, address, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="ALL">All Event Types</option>
            <option value="AssetRegistered">AssetRegistered</option>
            <option value="HeartbeatRecorded">HeartbeatRecorded</option>
            <option value="RecoveryInitiated">RecoveryInitiated</option>
            <option value="EvidenceSubmitted">EvidenceSubmitted</option>
            <option value="RecoveryApproved">RecoveryApproved</option>
            <option value="ChallengePeriodStarted">ChallengePeriodStarted</option>
            <option value="RecoveryCancelled">RecoveryCancelled</option>
            <option value="AssetReleased">AssetReleased</option>
          </select>
        </div>
      </div>

      {/* Chronological Audit Timeline */}
      <div className="space-y-4">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-surface-border space-y-3 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${getEventBadge(ev.eventName)}`}>
                  {ev.eventName}
                </span>
                <span className="text-slate-300 text-xs font-semibold">Asset #{ev.assetId}</span>
              </div>

              <span className="text-[11px] font-mono text-slate-400">{ev.timestamp}</span>
            </div>

            <p className="text-slate-300 text-xs">{ev.details}</p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono pt-1 text-slate-400">
              <div>
                <span>Actor: </span>
                <span className="text-cyan-300">{ev.actor}</span>
                <span className="mx-2">•</span>
                <span>Block: #{ev.blockNumber}</span>
              </div>

              <a
                href={`https://testnet.bscscan.com/tx/${ev.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
              >
                <span>Tx: {ev.txHash.slice(0, 14)}...{ev.txHash.slice(-6)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
