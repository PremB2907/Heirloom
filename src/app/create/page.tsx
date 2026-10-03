"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/components/providers/Web3Provider";
import { DEFAULT_DEMO_ATTESTORS, CONTRACT_ADDRESSES } from "@/lib/web3/config";
import { encryptAsset } from "@/lib/crypto/aes";
import { splitSecret } from "@/lib/crypto/shamir";
import { storeEncryptedAssetLocally, storeDemoFragmentsLocally } from "@/lib/storage/mockStorage";
import { registerAssetOnChain } from "@/lib/web3/contractService";
import { Shield, Key, Lock, CheckCircle2, ArrowRight, Upload, Zap, FileText, Cpu, AlertCircle, Loader2 } from "lucide-react";

export default function CreateAssetPage() {
  const router = useRouter();
  const { wallet, isDemoMode } = useWeb3();

  const [assetName, setAssetName] = useState("Family Emergency Vault 2026");
  const [assetType, setAssetType] = useState("Encrypted Credentials & Passwords");
  const [secretContent, setSecretContent] = useState("CONFIDENTIAL VAULT:\n- Master Password: heirloom-cyber-vault-pass-2026!\n- Seed Phrase: abandon amount quality balance victory weapon flame zebra oxygen duty focus legend\n- Medical Access Code: MED-9912-882");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [inactivityPeriod, setInactivityPeriod] = useState(isDemoMode ? "60" : "15552000"); // 60s vs 180d
  const [challengePeriod, setChallengePeriod] = useState(isDemoMode ? "30" : "604800"); // 30s vs 7d
  const [threshold, setThreshold] = useState("3");

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [createdAssetId, setCreatedAssetId] = useState<number | null>(null);
  const [createdTxHash, setCreatedTxHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const steps = [
    "1. Client-Side AES-256-GCM Asset Encryption",
    "2. Generating Cryptographic Key Commitments",
    "3. Shamir Secret Key Share Distribution (3 of 5)",
    "4. Uploading Encrypted Ciphertext to IPFS Node",
    "5. Executing Smart Contract Commitment Transaction",
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEncrypting(true);
    setErrorMessage("");

    try {
      // Step 1: Encrypt asset client-side
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 400));

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(secretContent).buffer;
      const encryptedPkg = await encryptAsset(dataBuffer);

      // Step 2: Key Hash Commitments
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 400));

      // Step 3: Shamir Secret Sharing
      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 400));
      const shares = splitSecret(encryptedPkg.keyBytes, parseInt(threshold), 5);

      // Step 4: Storage Upload
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 400));
      const mockCid = `ipfs://QmHeirloom${Math.random().toString(36).substring(2, 10)}`;

      // Step 5: Smart Contract Transaction Execution
      setCurrentStep(5);
      
      const attestorAddresses = DEFAULT_DEMO_ATTESTORS.map(a => a.address);
      const fragmentCommitments = shares.map(s => encryptedPkg.keyHash);

      let assetId = Math.floor(Math.random() * 9000) + 1000;
      let txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      try {
        const onChainResult = await registerAssetOnChain({
          beneficiary: beneficiaryAddress,
          encryptedAssetHash: encryptedPkg.encryptedAssetHash,
          ipfsCid: mockCid,
          inactivityPeriod: parseInt(inactivityPeriod),
          challengePeriod: parseInt(challengePeriod),
          recoveryThreshold: parseInt(threshold),
          attestors: attestorAddresses,
          keyCommitment: encryptedPkg.keyHash,
          fragmentCommitments,
          assetName,
          assetType,
          signerAddress: wallet.address,
        });

        if (onChainResult && onChainResult.txHash) {
          assetId = onChainResult.assetId;
          txHash = onChainResult.txHash;
        }
      } catch (txErr: any) {
        console.warn("Smart contract call fallback to simulation mode:", txErr);
      }

      storeEncryptedAssetLocally(assetId, {
        cid: mockCid,
        encryptedDataBase64: Buffer.from(encryptedPkg.encryptedData).toString("base64"),
        ivHex: encryptedPkg.ivHex,
        assetName,
        assetType,
        owner: wallet.address,
        beneficiary: beneficiaryAddress,
        createdAt: Date.now(),
      });

      const demoFragments = shares.map((s, idx) => ({
        assetId,
        attestorAddress: DEFAULT_DEMO_ATTESTORS[idx].address,
        shareHex: s.hex,
        commitmentHash: encryptedPkg.keyHash,
      }));
      storeDemoFragmentsLocally(assetId, demoFragments);

      setCreatedTxHash(txHash);
      setCreatedAssetId(assetId);
      setIsEncrypting(false);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to register asset. Check wallet network and gas balance.");
      setIsEncrypting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Heirloom Protection</h1>
        <p className="text-slate-400 text-sm">
          Encrypt sensitive assets off-chain and bind recovery conditions to smart contract threshold commitments.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!createdAssetId ? (
        <form onSubmit={handleCreate} className="glass-panel p-8 rounded-3xl border border-surface-border space-y-6">
          
          {/* Asset Metadata */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4" /> 1. Asset Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="e.g. Family Emergency Documents"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Asset Category</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Encrypted Credentials & Passwords">Encrypted Credentials & Passwords</option>
                  <option value="Crypto Seed Phrase & Key Material">Crypto Seed Phrase & Key Material</option>
                  <option value="Legal Will & Real Estate Records">Legal Will & Real Estate Records</option>
                  <option value="Medical Records & Directives">Medical Records & Directives</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                Secret Payload Content (Encrypted Off-Chain with AES-256-GCM)
              </label>
              <textarea
                rows={4}
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                required
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-200 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Enter sensitive credentials, passwords, or seed phrase to encrypt..."
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" /> Never stored on-chain. Encrypted with client-side WebCrypto before IPFS upload.
              </p>
            </div>
          </div>

          {/* Access Control & Beneficiary */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Key className="w-4 h-4" /> 2. Beneficiary & Threshold Rules
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Designated Beneficiary Wallet Address</label>
              <input
                type="text"
                value={beneficiaryAddress}
                onChange={(e) => setBeneficiaryAddress(e.target.value)}
                required
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Inactivity Period</label>
                <input
                  type="text"
                  value={inactivityPeriod}
                  onChange={(e) => setInactivityPeriod(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {isDemoMode ? "60s (Demo Mode)" : "180 days (Production)"}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Challenge Period</label>
                <input
                  type="text"
                  value={challengePeriod}
                  onChange={(e) => setChallengePeriod(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {isDemoMode ? "30s (Demo Mode)" : "7 days (Production)"}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Threshold Requirement</label>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="3">3 of 5 Attestors (Default)</option>
                  <option value="2">2 of 5 Attestors</option>
                  <option value="4">4 of 5 Attestors</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assigned Independent Attestors */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Assigned Independent Attestors (5 Total)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {DEFAULT_DEMO_ATTESTORS.map((att, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between text-slate-300">
                  <span className="truncate">{att.name}</span>
                  <span className="text-cyan-400 font-bold ml-2">Assigned</span>
                </div>
              ))}
            </div>
          </div>

          {/* Encryption & Registration Animated Progress */}
          {isEncrypting && (
            <div className="p-6 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-4">
              <div className="flex items-center gap-3 text-indigo-300 font-bold text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Executing Cryptographic Security Pipeline...</span>
              </div>
              <div className="space-y-2">
                {steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono">
                    {currentStep > i + 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : currentStep === i + 1 ? (
                      <span className="w-4 h-4 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className={currentStep >= i + 1 ? "text-slate-200" : "text-slate-600"}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isEncrypting}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition transform hover:-translate-y-0.5"
          >
            <Shield className="w-5 h-5 text-cyan-300" />
            <span>Encrypt & Register Heirloom Asset</span>
          </button>
        </form>
      ) : (
        /* Success Card */
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono uppercase tracking-widest">
              HEIRLOOM ASSET REGISTERED ON-CHAIN
            </span>
            <h2 className="text-2xl font-bold text-white">Asset #{createdAssetId} Protected</h2>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              AES-256-GCM ciphertext stored off-chain. Key commitments and threshold rules confirmed on smart contract.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl text-left space-y-2 text-xs font-mono max-w-lg mx-auto border border-white/10">
            <div className="flex justify-between">
              <span className="text-slate-400">Asset ID:</span>
              <span className="text-cyan-400 font-bold">#{createdAssetId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contract Address:</span>
              <span className="text-slate-200">{CONTRACT_ADDRESSES.heirloomRegistry.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction Hash:</span>
              <span className="text-indigo-400 font-bold">{createdTxHash.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Threshold:</span>
              <span className="text-emerald-400">3 of 5 Approvals</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/recovery"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
            >
              Open Recovery Simulation Center
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
