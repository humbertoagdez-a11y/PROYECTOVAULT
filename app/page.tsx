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

  const capitalSemilla = 0.4532;
  const totalEth = capitalSemilla + pozoReal;
  const pozoUsd = (totalEth * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const ticketUsd = (0.0008 * ethPrice).toFixed(2);

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
    } catch (e) { setLoading(false); }
  };

  const conectarBilletera = async () => {
    const eth = (window as any).ethereum;
    if (typeof eth !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(eth);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWallet(accounts[0]);
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      } catch (e) { console.error(e); }
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
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
      window.location.reload();
    } catch (e: any) { 
      setIsBuying(false); 
      // Alerta limpia si MetaMask bloquea por saldo u otro error
      alert("Operación cancelada o saldo insuficiente en la billetera para cubrir ticket + gas.");
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await res.json();
        setEthPrice(data.ethereum.usd);
      } catch (e) { console.error(e); }
    };
    fetchPrice();
    cargarDatos();
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden pb-20 selection:bg-amber-500/30">
      
      {/* NAVBAR */}
      <nav className="w-full border-b border-white/5 bg-[#050505] sticky top-0 z-[100] px-6 md:px-8 h-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button onClick={conectarBilletera} className="text-[10px] md:text-xs font-black border border-white/20 px-5 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-black">
          {wallet ? `CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-4 md:px-6 text-center mt-16 md:mt-24">
        
        {/* TÍTULO IMPACTANTE */}
        <h1 className="text-5xl md:text-[90px] font-bold tracking-tighter mb-4 md:mb-6 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 italic font-light text-4xl md:text-7xl">
            se lleva el pozo entero.
          </span>
        </h1>
        <p className="text-amber-500/80 text-xs md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-12 md:mb-16">
          Protocolo de Liquidez Auditable ● Red Base
        </p>
        
        {/* PANEL CENTRAL: POZO Y RELOJ */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-16 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden max-w-5xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-16">
            
            {/* PANEL POZO */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] md:rounded-[45px] p-8 md:p-12 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4 md:mb-6">Capital Acumulado</p>
              <div className="flex items-baseline justify-center gap-2 md:gap-3 mb-1 md:mb-2">
                <span className="text-5xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-xl md:text-2xl font-black italic">ETH</span>
              </div>
              <p className="text-xl md:text-3xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
            </div>

            {/* PANEL RELOJ PROFESIONAL */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] md:rounded-[45px] p-8 md:p-12 text-center flex flex-col justify-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-6">Tiempo Restante</p>
              
              {loading || !timeObj ? (
                <div className="text-2xl md:text-3xl font-mono text-gray-600 animate-pulse uppercase tracking-widest">Sincronizando...</div>
              ) : isFinished ? (
                <div className="text-3xl md:text-5xl font-black text-red-500 uppercase tracking-tighter">SELLADA</div>
              ) : (
                <div className="flex justify-center gap-2 md:gap-4">
                  {/* DÍAS */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-xl md:rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono text-white">{timeObj.d}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-2 md:mt-3 tracking-widest font-bold">Días</span>
                  </div>
                  <span className="text-2xl md:text-4xl font-black text-white/20 self-start mt-3 md:mt-5">:</span>
                  {/* HORAS */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-xl md:rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono text-white">{timeObj.h.toString().padStart(2, '0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-2 md:mt-3 tracking-widest font-bold">Hrs</span>
                  </div>
                  <span className="text-2xl md:text-4xl font-black text-white/20 self-start mt-3 md:mt-5">:</span>
                  {/* MINUTOS */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-xl md:rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono text-white">{timeObj.m.toString().padStart(2, '0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-amber-500 uppercase mt-2 md:mt-3 tracking-widest font-bold">Min</span>
                  </div>
                  {/* SEGUNDOS (Oculto en móviles muy pequeños, opcional, pero acá lo dejamos para dar tensión) */}
                  <span className="text-2xl md:text-4xl font-black text-white/20 self-start mt-3 md:mt-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-xl md:rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]">
                      <span className="text-3xl md:text-5xl font-black font-mono text-amber-400">{timeObj.s.toString().padStart(2, '0')}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-gray-500 uppercase mt-2 md:mt-3 tracking-widest font-bold">Seg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-6 md:py-8 bg-white text-black rounded-[25px] md:rounded-[35px] font-black text-sm md:text-[16px] uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] active:scale-95 mb-10 md:mb-14">
            {isFinished ? "BÓVEDA FINALIZADA" : isBuying ? "PROCESANDO PAGO..." : `INGRESAR AL POZO (~$${ticketUsd})`}
          </button>
          
          {/* INSTRUCCIONES LLAMATIVAS Y RESPONSIVAS */}
          <div className="p-6 md:p-10 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-[30px] md:rounded-[40px]">
            <h3 className="text-xs md:text-[14px] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 uppercase tracking-[0.3em] font-black mb-8 md:mb-12 italic text-center">
              ¿Cómo Participar?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              
              <a href="https://metamask.io/download/" target="_blank" className="flex flex-row md:flex-col items-center gap-4 md:gap-6 text-left md:text-center p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">1</div>
                 <div>
                    <p className="text-sm md:text-[13px] font-black text-white uppercase tracking-wider mb-1">Obtén MetaMask</p>
                    <p className="text-[10px] md:text-[11px] font-normal text-gray-400">Instala la extensión en tu PC o la App en tu celular.</p>
                 </div>
              </a>

              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 text-left md:text-center p-4 rounded-2xl">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">2</div>
                 <div>
                    <p className="text-sm md:text-[13px] font-black text-white uppercase tracking-wider mb-1">Red Base Mainnet</p>
                    <p className="text-[10px] md:text-[11px] font-normal text-gray-400">Al vincular tu billetera, la web te cambiará de red automáticamente.</p>
                 </div>
              </div>

              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 text-left md:text-center p-4 rounded-2xl">
                 <div className="min-w-[50px] h-[50px] md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">3</div>
                 <div>
                    <p className="text-sm md:text-[13px] font-black text-white uppercase tracking-wider mb-1">Aporta 0.0008 ETH</p>
                    <p className="text-[10px] md:text-[11px] font-normal text-gray-400">Tu ingreso suma <span className="text-amber-500 font-bold">60 minutos</span> extras al reloj y te pone a la cabeza.</p>
                 </div>
              </div>

            </div>
          </div>
        </div>

        {/* SECCIÓN DE CONFIANZA */}
        <div className="mt-20 md:mt-32 text-left">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-10 text-center md:text-left">
            Confianza <br className="md:hidden"/> Descentralizada <br/>
            <span className="text-amber-500 italic font-light text-xl md:text-3xl">Transparencia Inmutable en la Blockchain.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="p-8 md:p-10 bg-gradient-to-br from-[#121212] to-black rounded-[30px] border border-white/5 shadow-xl hover:border-amber-500/20 transition-all">
              <h3 className="text-white font-black text-[12px] md:text-[14px] uppercase mb-4 tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Sin Administradores
              </h3>
              <p className="text-[12px] md:text-[14px] text-gray-400 leading-relaxed uppercase tracking-tighter italic">
                Vaultum es un protocolo autónomo. El 90% de cada ticket ingresa directamente al pozo. El pago al último participante se ejecuta automáticamente mediante un <span className="text-white font-bold">Contrato Inteligente verificado</span>.
              </p>
            </div>
            <div className="p-8 md:p-10 bg-gradient-to-br from-[#121212] to-black rounded-[30px] border border-white/5 shadow-xl hover:border-amber-500/20 transition-all">
              <h3 className="text-white font-black text-[12px] md:text-[14px] uppercase mb-4 tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Tiempo Acumulativo
              </h3>
              <p className="text-[12px] md:text-[14px] text-gray-400 leading-relaxed uppercase tracking-tighter italic">
                La tensión nunca termina. Cada nuevo ingreso <span className="text-amber-500 font-bold">suma 60 minutos exactos</span> al tiempo restante. Esto extiende la competencia y hace crecer el premio final de forma exponencial.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-20 md:mt-32 border-t border-white/5 py-12 text-center opacity-40">
        <p className="text-[9px] md:text-[10px] tracking-[0.5em] md:tracking-[1em] font-black uppercase px-4">VAULTUM PROTOCOL ● BASE NETWORK ● 2026</p>
      </footer>

    </main>
  );
}