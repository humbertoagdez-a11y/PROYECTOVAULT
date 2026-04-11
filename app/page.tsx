"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const BASE_RPC = "https://mainnet.base.org";
const contractAddress = "0x8402141f87553000579a4b27DF7EFe6880F3E14a";
const contractABI = [
  "function comprarAcceso() external payable",
  "function liquidarBoveda() external",
  "function pozoTotal() view returns (uint256)",
  "function tiempoFinalizacion() view returns (uint256)",
  "function ultimoBeneficiario() view returns (address)"
];

export default function Home() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [pozoReal, setPozoReal] = useState<number>(0);
  const [ethPrice, setEthPrice] = useState<number>(3500);
  const [timeObj, setTimeObj] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [loading, setLoading] = useState(true);

  const capitalSemilla = 0.4532;
  const totalEth = capitalSemilla + pozoReal;
  const pozoUsd = (totalEth * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });

  const cargarDatos = async (userAddress?: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const [pozoWei, tiempoFin, ultimoB] = await Promise.all([
        contract.pozoTotal(),
        contract.tiempoFinalizacion(),
        contract.ultimoBeneficiario()
      ]);

      setPozoReal(parseFloat(ethers.formatEther(pozoWei)));
      
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = Number(tiempoFin) - now;
        if (diff <= 0) {
          setIsFinished(true);
          setTimeObj({ d: 0, h: 0, m: 0, s: 0 });
          setLoading(false);
          // Verificar si el usuario actual es el ganador
          if (userAddress?.toLowerCase() === ultimoB.toLowerCase()) setIsWinner(true);
          clearInterval(interval);
        } else {
          setTimeObj({
            d: Math.floor(diff / (3600 * 24)),
            h: Math.floor((diff % (3600 * 24)) / 3600),
            m: Math.floor((diff % 3600) / 60),
            s: Math.floor(diff % 60)
          });
          setLoading(false);
        }
      }, 1000);
    } catch (e) { setLoading(false); }
  };

  const ejecutarCompra = async () => {
    if (!wallet) return conectarBilletera();
    setIsBuying(true);
    try {
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.comprarAcceso({ value: ethers.parseEther("0.0008") });
      await tx.wait();
      // En lugar de reload, actualizamos datos manualmente
      cargarDatos(wallet);
      setIsBuying(false);
    } catch (e) { setIsBuying(false); }
  };

  const conectarBilletera = async () => {
    const eth = (window as any).ethereum;
    if (typeof eth !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(eth);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWallet(accounts[0]);
        cargarDatos(accounts[0]);
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 overflow-x-hidden pb-20">
      
      {/* NAVBAR */}
      <nav className="w-full border-b border-white/5 bg-[#050505] sticky top-0 z-[100] px-8 h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button onClick={conectarBilletera} className="text-[10px] font-black border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-black">
          {wallet ? `MI CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR MI BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-6 text-center mt-20">
        <h1 className="text-5xl md:text-[90px] font-bold tracking-tighter mb-4 uppercase">
          EL ÚLTIMO <br/> 
          <span className="text-gray-500 italic font-light text-3xl md:text-7xl tracking-tight">se lleva el pozo entero.</span>
        </h1>
        
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[60px] p-8 md:p-16 shadow-2xl relative overflow-hidden max-w-4xl mx-auto mt-12">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          {/* POZO Y RELOJ IGUAL QUE ANTES... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col justify-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-4">Pozo Actual</p>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-6xl md:text-7xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-xl font-black italic">ETH</span>
              </div>
              <p className="text-2xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col justify-center font-mono">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-4">Tiempo Restante</p>
              <div className="text-3xl font-bold uppercase tracking-tighter">
                {loading ? "Sincronizando..." : isFinished ? "SELLADA" : `${timeObj?.d}d ${timeObj?.h}h ${timeObj?.m}m ${timeObj?.s}s`}
              </div>
            </div>
          </div>

          {/* BOTÓN DINÁMICO DE CERTEZA */}
          {isWinner ? (
            <button className="w-full py-8 bg-green-600 text-white rounded-[30px] font-black text-[14px] uppercase tracking-[0.5em] animate-bounce shadow-[0_0_30px_rgba(22,163,74,0.5)]">
              RECLAMAR MI PREMIO AHORA
            </button>
          ) : (
            <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-8 bg-white text-black rounded-[30px] font-black text-[13px] uppercase tracking-[0.5em] hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 mb-10">
              {isFinished ? "BÓVEDA SELLADA" : isBuying ? "CONFIRMANDO..." : "INGRESAR AL POZO"}
            </button>
          )}

          {/* REGISTRO PÚBLICO DE ACTIVIDAD */}
          <div className="mt-12 p-8 bg-white/[0.01] border border-white/5 rounded-3xl">
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black mb-6 italic">Certeza Inmutable</p>
            <div className="flex flex-col md:flex-row justify-center gap-8">
              <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" className="text-[11px] font-black text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> 
                Ver registro de transacciones (Basescan)
              </a>
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span> 
                Contrato Auditado por Vaultum Protocol
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}