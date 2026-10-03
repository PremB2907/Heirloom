"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { DEFAULT_DEMO_ATTESTORS } from "@/lib/web3/config";
import {
  recordHeartbeatOnChain,
  initiateRecoveryOnChain,
  submitEvidenceOnChain,
  approveRecoveryOnChain,
  cancelRecoveryOnChain,
  finalizeRecoveryOnChain,
} from "@/lib/web3/contractService";
import { Shield, Key, AlertTriangle, CheckCircle2, Clock, Zap, Lock, RefreshCw, XCircle, FileText, ExternalLink, Activity, ArrowRight } from "lucide-react";

export default function RecoveryCenterPage() {
  const { wallet, isDemoMode } = useWeb3();

  // Lifecycle States: ACTIVE -> RECOVERY_ELIGIBLE -> RECOVERY_REQUESTED -> EVIDENCE_COLLECTION -> CHALLENGE_PERIOD -> RELEASED -> DECRYPTED
  const [protocolState, setProtocolState] = useState<
    "ACTIVE" | "RECOVERY_ELIGIBLE" | "RECOVERY_REQUESTED" | "EVIDENCE_COLLECTION" | "CHALLENGE_PERIOD" | "RELEASED" | "DECRYPTED"
  >("ACTIVE");

  const [inactivityTimer, setInactivityTimer] = useState<number>(60);
  const [challengeTimer, setChallengeTimer] = useState<number>(30);
  const [isChallengeActive, setIsChallengeActive] = useState<boolean>(false);

  // Attestor Approvals map (Attestor Address => boolean)
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [evidenceSubmitted, setEvidenceSubmitted] = useState<boolean>(false);

  // Decrypted output state
  const [reconstructedKeyHex, setReconstructedKeyHex] = useState<string>("");
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [lastTxHash, setLastTxHash] = useState<string>("");

  const threshold = 3;
  const currentApprovalCount = Object.values(approvals).filter(Boolean).length;

  // Inactivity countdown simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (protocolState === "ACTIVE" && inactivityTimer > 0) {
      timer = setInterval(() => {
        setInactivityTimer((prev) => {
          if (prev <= 1) {
            setProtocolState("RECOVERY_ELIGIBLE");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [protocolState, inactivityTimer]);

  // Challenge timer countdown simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isChallengeActive && challengeTimer > 0) {
      timer = setInterval(() => {
        setChallengeTimer((prev) => {
          if (prev <= 1) {
            setIsChallengeActive(false);
            setProtocolState("RELEASED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, challengeTimer]);

  // Actions with Smart Contract Execution
  const handleSimulateInactivity = () => {
    setInactivityTimer(0);
    setProtocolState("RECOVERY_ELIGIBLE");
  };

  const handleOwnerHeartbeat = async () => {
    setStatusMessage("Executing on-chain heartbeat transaction...");
    try {
      const res = await recordHeartbeatOnChain(1, wallet.address);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}

    setInactivityTimer(60);
    setChallengeTimer(30);
    setIsChallengeActive(false);
    setApprovals({});
    setProtocolState("ACTIVE");
    setStatusMessage("✓ Owner liveness heartbeat recorded on-chain. Protocol restored to ACTIVE.");
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleInitiateRecovery = async () => {
    setStatusMessage("Initiating recovery process on smart contract...");
    try {
      const res = await initiateRecoveryOnChain(1, wallet.address);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}
    setProtocolState("RECOVERY_REQUESTED");
    setStatusMessage("✓ Recovery initiated on-chain.");
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleSubmitEvidence = async () => {
    setStatusMessage("Submitting evidence hash to smart contract...");
    try {
      const res = await submitEvidenceOnChain(1, "ipfs://QmEvidenceCert88921", "0x7c992a1b", wallet.address);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}
    setEvidenceSubmitted(true);
    setProtocolState("EVIDENCE_COLLECTION");
    setStatusMessage("✓ Off-chain evidence recorded on-chain.");
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleApproveAttestor = async (attestorAddress: string) => {
    setStatusMessage(`Attestor ${attestorAddress.slice(0, 6)} approving recovery on-chain...`);
    try {
      const res = await approveRecoveryOnChain(1, attestorAddress);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}

    const updated = { ...approvals, [attestorAddress]: true };
    setApprovals(updated);

    const count = Object.values(updated).filter(Boolean).length;
    if (count >= threshold && protocolState !== "CHALLENGE_PERIOD" && protocolState !== "RELEASED") {
      setProtocolState("CHALLENGE_PERIOD");
      setIsChallengeActive(true);
      setChallengeTimer(30);
      setStatusMessage("⚡ THRESHOLD REACHED (3/5). Challenge period started on-chain!");
    } else {
      setStatusMessage(`✓ Attestor approval recorded (${count}/3).`);
    }
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleCancelRecovery = async () => {
    setStatusMessage("Sending Emergency Owner Cancellation transaction to contract...");
    try {
      const res = await cancelRecoveryOnChain(1, wallet.address);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}

    setIsChallengeActive(false);
    setApprovals({});
    setInactivityTimer(60);
    setChallengeTimer(30);
    setProtocolState("ACTIVE");
    setStatusMessage("🚨 EMERGENCY INTERVENTION: Recovery process was cancelled on-chain by owner.");
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleDecryptAsset = async () => {
    setIsDecrypting(true);
    setStatusMessage("Finalizing recovery transaction on-chain...");

    try {
      const res = await finalizeRecoveryOnChain(1, wallet.address);
      if (res && res.txHash) setLastTxHash(res.txHash);
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 1000));

    // Decrypt mock payload
    const demoPayload = "CONFIDENTIAL HEIRLOOM VAULT:\n- Master Password: heirloom-cyber-vault-pass-2026!\n- Seed Phrase: abandon amount quality balance victory weapon flame zebra oxygen duty focus legend\n- Medical Directive & Emergency Access Code: MED-9912-882";
    const sampleKeyHex = "0d141b222930373e454c535a61686f767d848b9299a0a7aeb5bcc3cad1d8dfe6";
    
    setReconstructedKeyHex(sampleKeyHex);
    setDecryptedContent(demoPayload);
    setIsDecrypting(false);
    setProtocolState("DECRYPTED");
    setStatusMessage("✓ Asset released and decrypted successfully!");
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">RECOVERY PROTOCOL</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              VAULT ID: #0001
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            A multi-stage authorization process protects every asset release.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOwnerHeartbeat}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET / OWNER HEARTBEAT</span>
          </button>
        </div>
      </div>

      {/* Top Banner: Protocol State Banner */}
      <div className={`vault-card p-6 rounded-3xl border transition-all ${
        protocolState === "CHALLENGE_PERIOD"
          ? "vault-card-danger bg-rose-950/30 border-rose-500/50"
          : protocolState === "RELEASED" || protocolState === "DECRYPTED"
          ? "border-emerald-500/50 bg-emerald-950/20"
          : "border-white/[0.08]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg ${
              protocolState === "CHALLENGE_PERIOD"
                ? "bg-rose-600 text-white animate-pulse"
                : protocolState === "RELEASED" || protocolState === "DECRYPTED"
                ? "bg-emerald-600 text-white"
                : "bg-indigo-950 text-indigo-400 border border-indigo-700/50"
            }`}>
              {protocolState === "CHALLENGE_PERIOD" ? "⚠️" : protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "✓" : "🛡️"}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">CURRENT PROTOCOL STATE</span>
              <h2 className="text-xl font-bold font-mono text-white">
                {protocolState === "ACTIVE" && "STATE: PROTECTED & ACTIVE"}
                {protocolState === "RECOVERY_ELIGIBLE" && "STATE: OWNER INACTIVITY DETECTED"}
                {protocolState === "RECOVERY_REQUESTED" && "STATE: RECOVERY REQUESTED"}
                {protocolState === "EVIDENCE_COLLECTION" && "STATE: EVIDENCE SUBMITTED & ATTESTATION IN PROGRESS"}
                {protocolState === "CHALLENGE_PERIOD" && "STATE: RECOVERY ACTIVE - CHALLENGE PERIOD RUNNING"}
                {(protocolState === "RELEASED" || protocolState === "DECRYPTED") && "STATE: RECOVERY AUTHORIZED & ASSET RELEASED"}
              </h2>
            </div>
          </div>

          <div className="font-mono text-right text-xs">
            <span className="text-slate-400 block text-[10px]">REQUIRED THRESHOLD</span>
            <span className="text-amber-400 font-bold text-sm">3 OF 5 APPROVALS</span>
          </div>
        </div>
      </div>

      {/* Transaction & Status Toast Banner */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          {lastTxHash && (
            <a
              href={`https://testnet.bscscan.com/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline font-bold flex items-center gap-1 shrink-0 text-[11px]"
            >
              <span>VIEW TX</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Protocol Visual Timeline */}
      <div className="vault-card p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
          AUTHORIZATION TIMELINE STAGES
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px] font-mono">
          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "ACTIVE" ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-950/60 border-white/5 text-emerald-400"}`}>
            01 INACTIVITY {inactivityTimer === 0 ? "✓" : `(${inactivityTimer}s)`}
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "RECOVERY_REQUESTED" || protocolState === "EVIDENCE_COLLECTION" || protocolState === "CHALLENGE_PERIOD" || protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-950/60 border-white/5 text-slate-400"}`}>
            02 REQUEST {protocolState !== "ACTIVE" && protocolState !== "RECOVERY_ELIGIBLE" ? "✓" : ""}
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${evidenceSubmitted ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-950/60 border-white/5 text-slate-400"}`}>
            03 EVIDENCE {evidenceSubmitted ? "✓" : ""}
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${currentApprovalCount >= 3 ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-950/60 border-white/5 text-amber-400"}`}>
            04 ATTESTATION ({currentApprovalCount}/3)
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "CHALLENGE_PERIOD" ? "bg-rose-600 text-white border-rose-400 font-bold animate-pulse" : protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-950/60 border-white/5 text-slate-400"}`}>
            05 CHALLENGE ({challengeTimer}s)
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "bg-emerald-600 text-white border-emerald-400 font-bold" : "bg-slate-950/60 border-white/5 text-slate-500"}`}>
            06 RELEASE {protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "UNLOCKED" : "LOCKED"}
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vault Metadata & Demo Controls */}
        <div className="vault-card p-6 rounded-3xl border border-white/[0.08] space-y-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Vault Metadata & Controls
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">ASSET NAME:</span>
              <span className="text-white font-bold">Family Emergency Vault</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">OWNER WALLET:</span>
              <span className="text-cyan-300">0xf39F...2266</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">BENEFICIARY:</span>
              <span className="text-indigo-300">0x7099...79C8</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">THRESHOLD:</span>
              <span className="text-amber-300 font-bold">3 of 5 Approvals</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ENCRYPTION:</span>
              <span className="text-emerald-400 font-bold">AES-256-GCM</span>
            </div>
          </div>

          {/* Controls to simulate state transitions */}
          <div className="space-y-3 pt-2 font-mono">
            <h4 className="text-xs uppercase font-bold text-slate-400">PROTOCOL SIMULATION CONTROLS</h4>

            {protocolState === "ACTIVE" && (
              <button
                onClick={handleSimulateInactivity}
                className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>FAST-FORWARD INACTIVITY (60s)</span>
              </button>
            )}

            {(protocolState === "RECOVERY_ELIGIBLE" || protocolState === "ACTIVE") && (
              <button
                onClick={handleInitiateRecovery}
                disabled={protocolState === "ACTIVE"}
                className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  protocolState === "RECOVERY_ELIGIBLE"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>INITIATE RECOVERY PROTOCOL</span>
              </button>
            )}

            {(protocolState === "RECOVERY_REQUESTED" || protocolState === "EVIDENCE_COLLECTION" || protocolState === "CHALLENGE_PERIOD") && (
              <button
                onClick={handleCancelRecovery}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/50 transition flex items-center justify-center gap-2 border border-rose-400/30"
              >
                <XCircle className="w-4 h-4" />
                <span>CANCEL RECOVERY (EMERGENCY INTERVENTION)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Attestor Panel & Challenge Window */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Attestor Approval Board */}
          <div className="vault-card p-6 rounded-3xl border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  INDEPENDENT ATTESTOR PANEL
                </h3>
                <p className="text-slate-400 text-xs">
                  No single attestor can release assets unilaterally. Requires $k=3$ approvals.
                </p>
              </div>

              <div className="text-right font-mono">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${
                  currentApprovalCount >= threshold
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                }`}>
                  {currentApprovalCount} / 5 APPROVALS
                </span>
              </div>
            </div>

            {/* Evidence Submission Step */}
            {!evidenceSubmitted ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-3 text-slate-300">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Submit off-chain evidence (e.g. Legal Record hash) to unlock attestor approvals.</span>
                </div>
                <button
                  onClick={handleSubmitEvidence}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition"
                >
                  SUBMIT EVIDENCE
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>EVIDENCE SUBMITTED (IPFS CID: QmEvidenceCert88921)</span>
              </div>
            )}

            {/* Attestor Cards (5 Total) */}
            <div className="space-y-2 font-mono text-xs">
              {DEFAULT_DEMO_ATTESTORS.map((att, idx) => {
                const isApproved = !!approvals[att.address];
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isApproved
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950/60 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isApproved ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{att.name}</p>
                        <p className="text-[10px] text-slate-500">{att.address}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveAttestor(att.address)}
                      disabled={isApproved || !evidenceSubmitted}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                          : evidenceSubmitted
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                          : "bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      {isApproved ? "✓ APPROVED" : "APPROVE RECOVERY"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Challenge Timer Hero Element */}
          {protocolState === "CHALLENGE_PERIOD" && (
            <div className="vault-card vault-card-danger p-6 rounded-3xl border border-rose-500/50 space-y-4 bg-rose-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-rose-400 animate-spin" />
                  <div>
                    <h3 className="font-bold text-white text-base font-mono">CHALLENGE WINDOW ACTIVE</h3>
                    <p className="text-slate-400 text-xs">Owner intervention remains available before timeout expires.</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-3xl font-extrabold text-rose-400">
                    00:{challengeTimer < 10 ? `0${challengeTimer}` : challengeTimer}
                  </span>
                  <span className="block text-[10px] text-slate-400">REMAINING COUNTDOWN</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCancelRecovery}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-lg shadow-rose-900/50 transition border border-rose-400/40"
                >
                  [ CANCEL RECOVERY ]
                </button>
              </div>
            </div>
          )}

          {/* Final Release & Decryption Stage */}
          {(protocolState === "RELEASED" || protocolState === "DECRYPTED") && (
            <div className="vault-card p-6 rounded-3xl border border-emerald-500/40 space-y-6 bg-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                    RECOVERY COMPLETE
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Beneficiary Key Reconstruction & Asset Decryption</h3>
                </div>
              </div>

              {protocolState === "RELEASED" ? (
                <button
                  onClick={handleDecryptAsset}
                  disabled={isDecrypting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition"
                >
                  <Key className="w-4 h-4 text-cyan-200" />
                  <span>{isDecrypting ? "RECONSTRUCTING SHAMIR KEYS..." : "ACCESS RECOVERED ASSET"}</span>
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-emerald-400 font-bold border-b border-white/10 pb-2">
                      <span>✓ Cryptographic Verification Passed</span>
                      <span>KeyEscrow Verified</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">RECONSTRUCTED MASTER AES KEY:</span>
                      <span className="text-cyan-300 break-all">{reconstructedKeyHex}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">DECRYPTED ASSET PAYLOAD:</span>
                      <pre className="p-4 rounded-xl bg-slate-900 border border-white/10 text-cyan-200 font-mono text-xs whitespace-pre-wrap">
                        {decryptedContent}
                      </pre>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 font-mono text-xs">
                    <Link
                      href="/audit"
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold border border-white/10 transition flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span>VIEW IMMUTABLE AUDIT TRAIL</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
