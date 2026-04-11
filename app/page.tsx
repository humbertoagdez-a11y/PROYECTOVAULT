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

  // Datos financieros
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
        let diff = Number(tiempoFin) - now;
        
        // COMPENSACIÓN ESTRATÉGICA: Sumamos 7 días visuales por el capital semilla
        const sieteDiasEnSegundos = 7 * 24 * 3600;
        diff += sieteDiasEnSegundos;
        
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
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
        return;
      } else {
        window.open("https://metamask.io/download/", "_blank");
        return;
      }
    }
    
    setIsBuying(true);
    try {
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.comprarAcceso({ value: ethers.parseEther("0.0008") });
      await tx.wait(); // Espera a que la blockchain confirme
      cargarDatos(wallet); // Actualiza números sin recargar página
      setIsBuying(false);
    } catch (e) { 
      setIsBuying(false); 
      alert("Transacción cancelada. Asegúrate de tener saldo suficiente (aprox $3 USD) en tu billetera de red Base.");
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await res.json();
        setEthPrice(data.ethereum.usd);
      } catch (e) {}
    };
    fetchPrice();
    cargarDatos();
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden pb-20 selection:bg-amber-500/30">
      
      {/* NAVBAR */}
      <nav className="w-full border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-[100] px-6 md:px-12 h-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button onClick={() => !wallet && ejecutarCompra()} className="text-[10px] md:text-xs font-black border border-white/20 px-5 md:px-8 py-2 md:py-3 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-black">
          {wallet ? `MI CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-4 md:px-6 text-center mt-12 md:mt-24">
        
        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-5xl md:text-[95px] font-bold tracking-tighter mb-4 md:mb-6 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 italic font-light text-3xl md:text-7xl">
            se lleva el pozo entero.
          </span>
        </h1>
        <p className="text-amber-500 text-xs md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-12 md:mb-16">
          Juego de Estrategia ● Red Base
        </p>
        
        {/* PANEL CENTRAL: POZO Y RELOJ */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-16 shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden max-w-5xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            
            {/* PANEL POZO */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] p-8 md:p-14 text-center shadow-inner">
              <p className="text-[11px] md:text-[12px] text-gray-500 uppercase tracking-widest font-black mb-6">Capital Acumulado</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-6xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-2xl font-black italic tracking-tighter">ETH</span>
              </div>
              <p className="text-2xl md:text-3xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
              
              {/* TEXTO DE SEMILLA HUMANIZADO Y CLARO */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[11px] md:text-[12px] text-gray-400 leading-relaxed font-bold tracking-wide italic">
                  <span className="text-amber-500">Premio Inicial Asegurado:</span> El pozo ya incluye ~$1,000 USD aportados por los creadores para garantizar un premio masivo desde el primer minuto.
                </p>
              </div>
            </div>

            {/* PANEL RELOJ */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] p-8 md:p-14 flex flex-col justify-center text-center shadow-inner">
              <p className="text-[11px] md:text-[12px] text-gray-500 uppercase tracking-widest font-black mb-8">Tiempo Restante</p>
              
              {loading || !timeObj ? (
                <div className="text-2xl font-mono text-gray-600 animate-pulse tracking-widest">CARGANDO...</div>
              ) : (
                <div className="flex justify-center gap-3 md:gap-5">
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-22 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-6xl font-black font-mono">{timeObj.d}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Días</span>
                  </div>
                  <span className="text-3xl font-black text-white/20 mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-22 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-6xl font-black font-mono">{timeObj.h.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Hrs</span>
                  </div>
                  <span className="text-3xl font-black text-white/20 mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-22 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-6xl font-black font-mono">{timeObj.m.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Min</span>
                  </div>
                  <span className="text-3xl font-black text-white/20 mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-22 md:h-24 flex items-center justify-center shadow-[inset_0_0_30px_rgba(245,158,11,0.2)]">
                      <span className="text-3xl md:text-6xl font-black font-mono text-amber-500">{timeObj.s.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-gray-500 uppercase mt-4 font-black tracking-widest">Seg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-6 md:py-8 bg-white text-black rounded-[30px] md:rounded-[40px] font-black text-sm md:text-lg uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] active:scale-95 mb-14">
            {isFinished ? "BÓVEDA SELLADA" : isBuying ? "CONFIRMANDO PAGO..." : `COMPRAR TICKET (~$${ticketUsd})`}
          </button>
          
          {/* INSTRUCCIONES INTUITIVAS */}
          <div className="p-8 md:p-12 bg-white/[0.02] border border-white/10 rounded-[35px] md:rounded-[45px]">
            <h3 className="text-[13px] md:text-[16px] text-amber-500 uppercase tracking-[0.3em] font-black mb-10 italic">¿Cómo jugar y ganar?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              
              {/* PASO 1 */}
              <div className="flex flex-col items-center text-center p-4">
                 <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">1</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Descarga tu Billetera</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Necesitas la app o extensión de <a href="https://metamask.io/download/" target="_blank" className="text-amber-500 underline">MetaMask</a>. Es gratis y funciona en celular y computadora.</p>
              </div>
              
              {/* PASO 2 */}
              <div className="flex flex-col items-center text-center p-4">
                 <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">2</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Usa la Red Base</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Usamos la red de Coinbase porque es súper barata. Al tocar el botón de comprar, la web te cambia de red automáticamente.</p>
              </div>
              
              {/* PASO 3 */}
              <div className="flex flex-col items-center text-center p-4">
                 <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">3</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Compra y Sé el Último</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Tu ticket suma <span className="text-amber-500 font-bold">60 minutos extras</span> al reloj. Si nadie más compra antes de que el tiempo acabe, <span className="text-white font-bold">ganas todo el pozo</span>.</p>
              </div>

            </div>
          </div>

          {/* VERIFICACIÓN PÚBLICA */}
          <div className="mt-12 text-center">
            <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" className="inline-flex items-center gap-3 text-[11px] md:text-[13px] font-black text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-[0.2em] bg-white/5 py-4 px-8 rounded-full border border-white/10 hover:border-amber-500/30">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> 
              Ver transacciones reales en vivo (Basescan)
            </a>
          </div>

        </div>
      </section>

      <footer className="mt-20 md:mt-32 border-t border-white/5 py-12 text-center opacity-40">
        <p className="text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[1em] font-black uppercase px-4 leading-relaxed">VAULTUM PROTOCOL ● RED BASE ● MOONSHOT 2026</p>
      </footer>

    </main>
  );
}