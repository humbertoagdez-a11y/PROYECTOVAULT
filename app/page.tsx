"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const BASE_RPC = "https://mainnet.base.org";
const contractAddress = "0x8402141f87553000579a4b27DF7EFe6880F3E14a";
const contractABI = [
  "function comprarAcceso() external payable",
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
  const [loading, setLoading] = useState(true);

  // Datos de transparencia solicitados
  const capitalSemilla = 0.4532; 
  const totalEth = capitalSemilla + pozoReal;
  const pozoUsd = (totalEth * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const ticketUsd = (0.0008 * ethPrice).toFixed(2);

  const cargarDatos = async (currentWallet?: string | null) => {
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const [pozoWei, tiempoFin] = await Promise.all([
        contract.pozoTotal(),
        contract.tiempoFinalizacion()
      ]);

      setPozoReal(parseFloat(ethers.formatEther(pozoWei)));
      
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = Number(tiempoFin) - now;
        
        if (diff <= 0) {
          setIsFinished(true);
          setTimeObj({ d: 0, h: 0, m: 0, s: 0 });
          setLoading(false);
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

      return () => clearInterval(interval);
    } catch (e) { setLoading(false); }
  };

  const ejecutarCompra = async () => {
    const eth = (window as any).ethereum;
    if (!wallet) {
      if (typeof eth !== "undefined") {
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
        return;
      }
    }
    
    setIsBuying(true);
    try {
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.comprarAcceso({ value: ethers.parseEther("0.0008") });
      await tx.wait();
      cargarDatos(wallet);
      setIsBuying(false);
    } catch (e) { 
      setIsBuying(false); 
      alert("Transacción cancelada o saldo insuficiente.");
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/price/ethereum?vs_currencies=usd");
        const data = await res.json();
        if (data.ethereum) setEthPrice(data.ethereum.usd);
      } catch (e) {}
    };
    fetchPrice();
    cargarDatos();
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden pb-20 selection:bg-amber-500/30">
      
      <nav className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-[100] px-6 md:px-12 h-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button className="text-[10px] md:text-xs font-black border border-white/20 px-5 md:px-8 py-2 md:py-3 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-black">
          {wallet ? `CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-4 md:px-6 text-center mt-12 md:mt-24">
        <h1 className="text-5xl md:text-[100px] font-bold tracking-tighter mb-4 md:mb-6 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 italic font-light text-3xl md:text-7xl">
            se lleva el pozo entero.
          </span>
        </h1>
        
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-16 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden max-w-5xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-[30px] p-10 md:p-14">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-6">Capital de Bóveda</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-6xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-2xl font-black italic tracking-tighter">ETH</span>
              </div>
              <p className="text-2xl md:text-3xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
              
              {/* NOTA DE CAPITAL SEMILLA SOLICITADA */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] text-gray-600 uppercase leading-relaxed font-bold tracking-widest italic">
                  * Incluye reserva estratégica de 0.4532 ETH aportada por el protocolo.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-[30px] p-10 md:p-14 flex flex-col justify-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-10">Tiempo Restante</p>
              
              {loading || !timeObj ? (
                <div className="text-2xl font-mono text-gray-700 animate-pulse tracking-widest">SINCRONIZANDO...</div>
              ) : (
                <div className="flex justify-center gap-3 md:gap-5">
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-inner">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.d}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-3 font-black tracking-widest">Días</span>
                  </div>
                  <span className="text-2xl font-black text-white/10 mt-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-inner">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.h.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-3 font-black tracking-widest">Hrs</span>
                  </div>
                  <span className="text-2xl font-black text-white/10 mt-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-inner">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.m.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-3 font-black tracking-widest">Min</span>
                  </div>
                  <span className="text-2xl font-black text-white/10 mt-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-inner">
                      <span className="text-3xl md:text-5xl font-black font-mono text-amber-500">{timeObj.s.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-gray-500 uppercase mt-3 font-black tracking-widest">Seg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-7 md:py-9 bg-white text-black rounded-[30px] md:rounded-[40px] font-black text-sm md:text-lg uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-2xl active:scale-95 mb-12">
            {isFinished ? "BÓVEDA SELLADA" : isBuying ? "CONFIRMANDO..." : `INGRESAR AL POZO (~$${ticketUsd})`}
          </button>
          
          <div className="p-8 md:p-12 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 rounded-[35px] md:rounded-[45px]">
            <h3 className="text-[12px] md:text-[14px] text-amber-500 uppercase tracking-[0.4em] font-black mb-10 italic">Instrucciones de Participación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="flex flex-row md:flex-col items-center gap-5 text-left md:text-center">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xl font-black shadow-[0_0_20px_rgba(245,158,11,0.1)]">1</div>
                 <div>
                    <p className="text-[12px] font-black text-white uppercase mb-1">Cargar MetaMask</p>
                    <p className="text-[10px] text-gray-500 uppercase leading-tight font-bold">Compatible con PC y dispositivos móviles.</p>
                 </div>
              </div>
              <div className="flex flex-row md:flex-col items-center gap-5 text-left md:text-center">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xl font-black shadow-[0_0_20px_rgba(245,158,11,0.1)]">2</div>
                 <div>
                    <p className="text-[12px] font-black text-white uppercase mb-1">Elegir Red Base</p>
                    <p className="text-[10px] text-gray-500 uppercase leading-tight font-bold">La red de segunda capa de Coinbase ultra eficiente.</p>
                 </div>
              </div>
              <div className="flex flex-row md:flex-col items-center gap-5 text-left md:text-center">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xl font-black shadow-[0_0_20px_rgba(245,158,11,0.1)]">3</div>
                 <div>
                    <p className="text-[12px] font-black text-white uppercase mb-1">Sumar 60 Minutos</p>
                    <p className="text-[10px] text-gray-500 uppercase leading-tight font-bold">Cada aporte de 0.0008 ETH acumula tiempo extra al reloj.</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-center gap-8 md:gap-16 items-center">
            <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" className="text-[10px] font-black text-gray-500 hover:text-amber-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Basescan: Transacciones en Vivo
            </a>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
              90% Acumulación ● 10% Protocolo
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-24 md:mt-32 pb-16 text-center opacity-30">
        <p className="text-[10px] tracking-[1em] font-black uppercase px-4 leading-relaxed">VAULTUM PROTOCOL ● BASE NETWORK ● MOONSHOT 2026</p>
      </footer>

    </main>
  );
}