"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { DEFAULT_DEMO_ATTESTORS } from "@/lib/web3/config";
import { combineShares } from "@/lib/crypto/shamir";
import { decryptAsset } from "@/lib/crypto/aes";
import { getEncryptedAssetLocally, getDemoFragmentsLocally } from "@/lib/storage/mockStorage";
import {
  recordHeartbeatOnChain,
  initiateRecoveryOnChain,
  submitEvidenceOnChain,
  approveRecoveryOnChain,
  cancelRecoveryOnChain,
  finalizeRecoveryOnChain,
  getRecoveryStatusFromChain,
} from "@/lib/web3/contractService";
import { Shield, Key, AlertTriangle, CheckCircle2, Clock, Zap, Lock, RefreshCw, XCircle, FileText, Download, ArrowRight, ExternalLink } from "lucide-react";

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

  const totalAttestors = 5;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Interactive Protocol Recovery Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              ASSET ID: #1
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulate end-to-end inheritance recovery lifecycle: Inactivity → Request → Evidence → Threshold Attestation → Challenge Timer → Decryption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOwnerHeartbeat}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset / Owner Heartbeat</span>
          </button>
        </div>
      </div>

      {/* Transaction & Status Toast Banner */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-indigo-950 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          {lastTxHash && (
            <a
              href={`https://testnet.bscscan.com/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline font-bold flex items-center gap-1 shrink-0"
            >
              <span>View Tx</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Lifecycle Progress Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-surface-border space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
          Protocol Lifecycle State Transition
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "ACTIVE" ? "bg-indigo-600 text-white border-indigo-400 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400"}`}>
            1. ACTIVE
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "RECOVERY_ELIGIBLE" || protocolState === "RECOVERY_REQUESTED" ? "bg-amber-500 text-slate-950 border-amber-400 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400"}`}>
            2. RECOVERY REQUEST
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "EVIDENCE_COLLECTION" ? "bg-cyan-600 text-white border-cyan-400 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400"}`}>
            3. ATTESTATION ({currentApprovalCount}/3)
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "CHALLENGE_PERIOD" ? "bg-rose-600 text-white border-rose-400 font-bold animate-pulse" : "bg-slate-900/60 border-white/5 text-slate-400"}`}>
            4. CHALLENGE ({challengeTimer}s)
          </div>

          <div className={`p-3 rounded-xl border text-center transition ${protocolState === "RELEASED" || protocolState === "DECRYPTED" ? "bg-emerald-600 text-white border-emerald-400 font-bold" : "bg-slate-900/60 border-white/5 text-slate-400"}`}>
            5. RELEASED
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Asset Info & Controls */}
        <div className="glass-panel p-6 rounded-3xl border border-surface-border space-y-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Protected Vault Metadata
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Asset Name:</span>
              <span className="text-white font-medium">Family Emergency Documents</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Owner Wallet:</span>
              <span className="font-mono text-cyan-300">0xf39F...2266</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Beneficiary Wallet:</span>
              <span className="font-mono text-indigo-300">0x7099...79C8</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Required Threshold:</span>
              <span className="font-mono text-amber-300 font-bold">3 of 5 Approvals</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Encryption Scheme:</span>
              <span className="font-mono text-emerald-400">AES-256-GCM + SSS</span>
            </div>
          </div>

          {/* Controls to simulate state transitions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-400">Demo Simulation Controls</h4>

            {protocolState === "ACTIVE" && (
              <button
                onClick={handleSimulateInactivity}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Fast-Forward Inactivity (60s Expiry)</span>
              </button>
            )}

            {(protocolState === "RECOVERY_ELIGIBLE" || protocolState === "ACTIVE") && (
              <button
                onClick={handleInitiateRecovery}
                disabled={protocolState === "ACTIVE"}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  protocolState === "RECOVERY_ELIGIBLE"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Initiate Protocol Recovery</span>
              </button>
            )}

            {(protocolState === "RECOVERY_REQUESTED" || protocolState === "EVIDENCE_COLLECTION" || protocolState === "CHALLENGE_PERIOD") && (
              <button
                onClick={handleCancelRecovery}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 animate-pulse"
              >
                <XCircle className="w-4 h-4" />
                <span>CANCEL RECOVERY (EMERGENCY INTERVENTION)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Attestor Approvals & Challenge / Decryption Card */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Attestor Approval Board */}
          <div className="glass-panel p-6 rounded-3xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  Independent Threshold Attestation (3 of 5 Required)
                </h3>
                <p className="text-slate-400 text-xs">
                  No single attestor can release assets unilaterally. Each attestor verifies off-chain evidence.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                currentApprovalCount >= threshold
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              }`}>
                {currentApprovalCount} / 5 APPROVALS
              </span>
            </div>

            {/* Evidence Submission Step */}
            {!evidenceSubmitted ? (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Submit off-chain evidence (e.g. Legal Record / Medical Certificate hash) to unlock attestor approval.</span>
                </div>
                <button
                  onClick={handleSubmitEvidence}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition"
                >
                  Submit Evidence
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Evidence Record Submitted (IPFS CID: QmEvidenceCert88921)</span>
              </div>
            )}

            {/* Attestor List Cards */}
            <div className="space-y-2">
              {DEFAULT_DEMO_ATTESTORS.map((att, idx) => {
                const isApproved = !!approvals[att.address];
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      isApproved
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900/60 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
                        isApproved ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-white">{att.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{att.address}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveAttestor(att.address)}
                      disabled={isApproved || !evidenceSubmitted}
                      className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                        isApproved
                          ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                          : evidenceSubmitted
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                          : "bg-slate-800 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      {isApproved ? "✓ APPROVED" : "Approve Recovery"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Challenge Timer / Decryption Stage */}
          {protocolState === "CHALLENGE_PERIOD" && (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/50 space-y-4 bg-rose-950/20 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-rose-400 animate-spin" />
                  <div>
                    <h3 className="font-bold text-white text-base">CHALLENGE PERIOD ACTIVE</h3>
                    <p className="text-slate-400 text-xs">Owner can halt recovery at any point before timer expires.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-extrabold text-rose-400">
                    00:{challengeTimer < 10 ? `0${challengeTimer}` : challengeTimer}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">REMAINING COUNTDOWN</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCancelRecovery}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
                >
                  CANCEL RECOVERY (EMERGENCY)
                </button>
              </div>
            </div>
          )}

          {/* Final Release & Decryption Stage */}
          {(protocolState === "RELEASED" || protocolState === "DECRYPTED") && (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 space-y-6 bg-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    RECOVERY AUTHORIZED & RELEASED
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">Beneficiary Key Reconstruction & Decryption</h3>
                </div>
              </div>

              {protocolState === "RELEASED" ? (
                <button
                  onClick={handleDecryptAsset}
                  disabled={isDecrypting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition"
                >
                  <Key className="w-5 h-5 text-cyan-200" />
                  <span>{isDecrypting ? "Reconstructing Shamir Keys & Decrypting..." : "RECONSTRUCT KEY & DECRYPT ASSET"}</span>
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-emerald-400 font-bold border-b border-white/10 pb-2">
                      <span>✓ Cryptographic Verification Passed</span>
                      <span>KeyEscrow Verified</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Reconstructed Master AES Key:</span>
                      <span className="text-cyan-300 break-all">{reconstructedKeyHex}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Decrypted Asset Payload:</span>
                      <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 text-cyan-200 font-mono text-xs whitespace-pre-wrap">
                        {decryptedContent}
                      </pre>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Link
                      href="/audit"
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span>View Immutable Audit Trail</span>
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
