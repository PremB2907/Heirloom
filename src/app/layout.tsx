import "./globals.css";
import React from "react";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "HEIRLOOM | Trust-Minimized Digital Inheritance Protocol",
  description: "Securely transfer digital assets to beneficiaries using off-chain AES-256-GCM encryption, Shamir Secret Sharing, threshold attestation, and smart contracts on BNB Smart Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070c] text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white antialiased">
        <Web3Provider>
          <Navbar />
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
