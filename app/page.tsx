"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Configuración Global
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
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isBuying, setIsBuying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const capitalSemilla = 0.4532;
  const totalEth = capitalSemilla + pozoReal;
  const pozoUsd = (totalEth * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const ticketUsd = (0.0008 * ethPrice).toFixed(2);

  // 1. Obtener precio de ETH
  const fetchPrice = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const data = await res.json();
      setEthPrice(data.ethereum.usd);
    } catch (e) { console.error("Error precio:", e); }
  };

  // 2. Cargar datos de la Blockchain (Canal Público)
  const cargarDatos = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const pozoWei = await contract.pozoTotal();
      const tiempoFin = await contract.tiempoFinalizacion();
      
      setPozoReal(parseFloat(ethers.formatEther(pozoWei)));
      
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = Number(tiempoFin) - now;
        if (diff <= 0) {
          setTimeLeft("BÓVEDA SELLADA");
          setIsFinished(true);
          setLoading(false);
          clearInterval(interval);
        } else {
          const d = Math.floor(diff / (3600 * 24));
          const h = Math.floor((diff % (3600 * 24)) / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = Math.floor(diff % 60);
          setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
          setLoading(false);
        }
      }, 1000);
    } catch (e) { 
      console.error("Error blockchain:", e);
      setLoading(false);
    }
  };

  // 3. Conexión de Billetera
  const conectarBilletera = async () => {
    const eth = (window as any).ethereum;
    if (typeof eth !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(eth);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWallet(accounts[0]);
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      } catch (e) { console.error("Error conexión:", e); }
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  // 4. Ejecutar Compra
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
      window.location.reload();
    } catch (e) { setIsBuying(false); }
  };

  useEffect(() => {
    fetchPrice();
    cargarDatos();
    const eth = (window as any).ethereum;
    if (typeof eth !== "undefined") {
      const provider = new ethers.BrowserProvider(eth);
      provider.listAccounts().then(acc => { if (acc.length > 0) setWallet(acc[0].address); });
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden pb-20">
      
      {/* NAVBAR */}
      <nav className="w-full border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-[100] px-8 h-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button 
          onClick={conectarBilletera} 
          className="text-[10px] font-black border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest"
        >
          {wallet ? `CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-6 text-center mt-24">
        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-5xl md:text-[90px] font-bold tracking-tighter mb-6 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="text-gray-500 italic font-light text-3xl md:text-7xl tracking-tight">se lleva el pozo entero.</span>
        </h1>
        <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-[0.4em] mb-16 opacity-60">
          Protocolo de Liquidez Auditable ● Red Base
        </p>
        
        {/* PANEL CENTRAL */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[60px] p-8 md:p-20 shadow-2xl relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
            {/* Pozo */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col justify-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-4">Pozo Acumulado</p>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-6xl md:text-7xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-xl font-black italic">ETH</span>
              </div>
              <p className="text-2xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
            </div>

            {/* Tiempo */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col justify-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-4">Tiempo Restante</p>
              <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter uppercase">
                {loading ? (
                  <div className="flex justify-center items-center gap-1 opacity-40 italic">
                    SINCRONIZANDO
                    <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                  </div>
                ) : timeLeft}
              </div>
            </div>
          </div>

          <button 
            onClick={ejecutarCompra} 
            disabled={isBuying || isFinished} 
            className="w-full py-8 bg-white text-black rounded-[30px] font-black text-[13px] uppercase tracking-[0.5em] hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 mb-14"
          >
            {isFinished ? "BÓVEDA SELLADA" : isBuying ? "CONFIRMANDO..." : `INGRESAR AL POZO (~$${ticketUsd})`}
          </button>
          
          {/* INSTRUCCIONES INTUITIVAS */}
          <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[40px]">
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black mb-10 italic">Instrucciones de participación</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-[10px] font-black text-gray-400 uppercase tracking-tighter text-center">
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-10 h-10 rounded-full flex items-center justify-center text-amber-500 border border-white/10">1</span>
                 INSTALAR METAMASK
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-10 h-10 rounded-full flex items-center justify-center text-amber-500 border border-white/10">2</span>
                 SELECCIONAR RED BASE
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-10 h-10 rounded-full flex items-center justify-center text-amber-500 border border-white/10">3</span>
                 MÍNIMO 0.0008 ETH
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-32 border-t border-white/5 py-20 text-center opacity-30">
        <p className="text-[10px] tracking-[1em] font-black uppercase">VAULTUM PROTOCOL ● BASE MAINNET</p>
      </footer>

      <style jsx>{`
        .dot { animation: blink 1.2s infinite; opacity: 0; display: inline-block; margin-left: 2px; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0% { opacity: 0; transform: translateY(0px); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0; transform: translateY(0px); }
        }
      `}</style>

    </main>
  );
}