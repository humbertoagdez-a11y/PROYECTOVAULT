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
  
  const [showQR, setShowQR] = useState(false);

  const capitalSemilla = 0.4532; 
  const totalEth = capitalSemilla + pozoReal;
  const pozoUsd = (totalEth * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const ticketUsd = (0.0008 * ethPrice).toFixed(2);

  const cargarDatos = async (currentWallet?: string | null) => {
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const [pozoWei, tiempoFin, ultimoB] = await Promise.all([
        contract.pozoTotal(),
        contract.tiempoFinalizacion(),
        contract.ultimoBeneficiario()
      ]);

      setPozoReal(parseFloat(ethers.formatEther(pozoWei)));
      
      if (currentWallet && currentWallet.toLowerCase() === ultimoB.toLowerCase()) {
        setIsWinner(true);
      } else {
        setIsWinner(false);
      }
      
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        let diff = Number(tiempoFin) - now;
        
        const sieteDiasEnSegundos = 7 * 24 * 3600;
        diff += sieteDiasEnSegundos;
        
        if (diff <= 0) {
          setIsFinished(true);
          setTimeObj({ d: 0, h: 0, m: 0, s: 0 });
          setLoading(false);
          clearInterval(interval);
        } else {
          setIsFinished(false);
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
      await tx.wait();
      cargarDatos(wallet); 
      setIsBuying(false);
    } catch (e) { 
      setIsBuying(false); 
      alert("Transacción cancelada. Verifica tener saldo suficiente de ETH en la red Base.");
    }
  };

  const ejecutarReclamo = async () => {
    setIsBuying(true);
    try {
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.liquidarBoveda();
      await tx.wait();
      alert("¡Felicidades! Los fondos han sido transferidos a tu billetera.");
      window.location.reload();
    } catch (e) {
      setIsBuying(false);
      alert("Error al reclamar la bóveda. Verifica tu conexión.");
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

  useEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          cargarDatos(accounts[0]);
        } else {
          setWallet(null);
          setIsWinner(false);
        }
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden pb-20 selection:bg-amber-500/30 relative">
      
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
        
        <h1 className="text-5xl md:text-[95px] font-bold tracking-tighter mb-4 md:mb-6 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 italic font-light text-3xl md:text-7xl">
            se lleva el pozo entero.
          </span>
        </h1>
        <p className="text-amber-500 text-xs md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-12 md:mb-16">
          Protocolo de Liquidez Inmutable ● Red Base
        </p>
        
        <div className="bg-[#0D0D0D] border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-16 shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden max-w-5xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10">
            
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] p-8 md:p-14 text-center shadow-inner">
              <p className="text-[11px] md:text-[12px] text-gray-500 uppercase tracking-widest font-black mb-6">Capital Acumulado</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-6xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-2xl font-black italic tracking-tighter">ETH</span>
              </div>
              <p className="text-2xl md:text-3xl text-gray-400 font-light italic">≈ {pozoUsd}</p>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[11px] md:text-[12px] text-gray-400 leading-relaxed font-bold tracking-wide italic">
                  <span className="text-amber-500">Premio Inicial Asegurado:</span> El pozo ya incluye ~$1,000 USD aportados por los creadores para garantizar un premio masivo desde el inicio.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-[30px] p-8 md:p-14 flex flex-col justify-center text-center shadow-inner">
              <p className="text-[11px] md:text-[12px] text-gray-500 uppercase tracking-widest font-black mb-8">Tiempo Restante</p>
              
              {loading || !timeObj ? (
                <div className="text-2xl font-mono text-gray-600 animate-pulse tracking-widest">CARGANDO...</div>
              ) : (
                <div className="flex justify-center gap-2 md:gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.d}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Días</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-white/20 mt-4 md:mt-6">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.h.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Hrs</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-white/20 mt-4 md:mt-6">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <span className="text-3xl md:text-5xl font-black font-mono">{timeObj.m.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-amber-500 uppercase mt-4 font-black tracking-widest">Min</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-white/20 mt-4 md:mt-6">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-black border border-white/10 rounded-2xl w-14 h-16 md:w-20 md:h-24 flex items-center justify-center shadow-[inset_0_0_30px_rgba(245,158,11,0.2)]">
                      <span className="text-3xl md:text-5xl font-black font-mono text-amber-500">{timeObj.s.toString().padStart(2,'0')}</span>
                    </div>
                    <span className="text-[9px] md:text-[11px] text-gray-500 uppercase mt-4 font-black tracking-widest">Seg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isFinished && isWinner && (
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-pulse">
              <p className="text-green-400 font-black tracking-widest text-[12px] md:text-[14px] uppercase flex items-center justify-center gap-2">
                👑 ERES EL LÍDER ACTUAL. SI EL RELOJ LLEGA A CERO, GANAS.
              </p>
            </div>
          )}

          {isFinished ? (
            isWinner ? (
              <button onClick={ejecutarReclamo} disabled={isBuying} className="w-full py-6 md:py-8 bg-green-600 text-white rounded-[30px] md:rounded-[40px] font-black text-sm md:text-lg uppercase tracking-[0.4em] hover:bg-green-500 transition-all shadow-[0_0_40px_rgba(34,197,94,0.6)] active:scale-95 mb-12 animate-bounce">
                {isBuying ? "PROCESANDO RETIRO..." : "🏆 RECLAMAR BÓVEDA TOTAL"}
              </button>
            ) : (
              <button disabled className="w-full py-6 md:py-8 bg-white/10 text-gray-500 rounded-[30px] md:rounded-[40px] font-black text-sm md:text-lg uppercase tracking-[0.4em] mb-12 cursor-not-allowed">
                BÓVEDA SELLADA (HAY UN GANADOR)
              </button>
            )
          ) : (
            <button onClick={ejecutarCompra} disabled={isBuying} className="w-full py-6 md:py-8 bg-white text-black rounded-[30px] md:rounded-[40px] font-black text-sm md:text-lg uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] active:scale-95 mb-14">
              {isBuying ? "CONFIRMANDO PAGO..." : `COMPRAR TICKET (~$${ticketUsd})`}
            </button>
          )}
          
          <div className="p-8 md:p-12 bg-white/[0.02] border border-white/10 rounded-[35px] md:rounded-[45px]">
            <h3 className="text-[13px] md:text-[16px] text-amber-500 uppercase tracking-[0.3em] font-black mb-10 italic">Instrucciones de Participación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left md:text-center">
              <div className="flex flex-col items-start md:items-center p-4">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">1</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Instala y Fondea</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Necesitas la extensión o App de <span className="text-white font-bold">MetaMask</span> con saldo en Ethereum (ETH) para poder cubrir el costo de tu ticket.</p>
              </div>
              
              <div className="flex flex-col items-start md:items-center p-4">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">2</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Usa la Red Base</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Usamos la red de <span className="text-white font-bold">Coinbase</span> porque es ultra barata. Al tocar el botón de comprar, la web te cambia de red automáticamente.</p>
              </div>
              
              <div className="flex flex-col items-start md:items-center p-4">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xl md:text-2xl font-black mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">3</div>
                 <p className="text-[14px] md:text-[16px] font-black text-white uppercase mb-2 tracking-wide">Aporta y Lidera</p>
                 <p className="text-[12px] md:text-[13px] text-gray-400 leading-relaxed">Tu ticket de 0.0008 ETH suma <span className="text-amber-500 font-bold">60 minutos</span> al reloj. Mientras seas el último en aportar, serás el líder visible de la bóveda.</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 text-left bg-black/20 p-6 rounded-3xl">
               <h4 className="text-white font-black uppercase text-[12px] md:text-[14px] mb-2 tracking-widest">¿Cómo retiro el dinero si gano?</h4>
               <p className="text-gray-400 text-[12px] leading-relaxed">Si el reloj llega a cero (00:00:00) y tú fuiste el último en aportar, el botón principal se transformará en una opción verde para <span className="text-white font-bold">"RECLAMAR BÓVEDA TOTAL"</span>. Al hacer clic, el Contrato Inteligente enviará todo el pozo acumulado directamente a tu billetera MetaMask conectada. Sin intermediarios, sin demoras.</p>
            </div>
          </div>

          <div className="mt-14 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-center gap-6 md:gap-16 items-center">
            <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" className="text-[10px] md:text-[11px] font-black text-gray-500 hover:text-amber-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> Transacciones públicas en Basescan
            </a>
            <p className="text-[10px] md:text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
              90% Al Pozo ● 10% Al Protocolo
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-24 md:mt-32 pb-16 text-center opacity-30">
        <p className="text-[10px] tracking-[1em] font-black uppercase px-4 leading-relaxed">VAULTUM PROTOCOL ● BASE NETWORK</p>
      </footer>

      {/* BOTÓN FLOTANTE Y MODAL DE SOPORTE */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[200] flex flex-col items-end">
        {showQR && (
          <div className="mb-4 p-5 bg-[#050505] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center transform transition-all duration-300 ease-out origin-bottom-right w-64">
            
            <p className="text-[12px] text-amber-500 uppercase tracking-widest mb-1 font-black">Soporte en Vivo</p>
            <p className="text-[10px] text-gray-400 mb-4 text-center leading-relaxed">
              Te estaremos ayudando ante cualquier duda.
            </p>
            
            <div className="relative w-48 h-48 mb-5 rounded-xl overflow-hidden border border-white/5 bg-black flex justify-center items-center p-2">
              {/* Imagen con fallback integrado en caso de que el enlace proveído no cargue directamente */}
              <img 
                src="https://i.ibb.co/6c2yG1P/qr.png" 
                onError={(e) => {
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = "https://i.ibb.co/LDQ97j8q"; 
                }}
                alt="QR Soporte Vaultum" 
                className="object-contain w-full h-full" 
              />
            </div>
            
            <a
              href="https://t.me/VaultumProtocol"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#2AABEE]/10 border border-[#2AABEE]/30 text-[#2AABEE] rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#2AABEE] hover:text-white transition-all text-center shadow-[0_0_15px_rgba(42,171,238,0.15)] hover:shadow-[0_0_20px_rgba(42,171,238,0.4)]"
            >
              CONTACTAR SOPORTE
            </a>
          </div>
        )}

        <button
          onClick={() => setShowQR(!showQR)}
          className="w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0a] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:border-[#2AABEE] hover:shadow-[0_0_30px_rgba(42,171,238,0.3)] transition-all group relative"
        >
          {showQR ? (
            <span className="text-white text-2xl font-black">✕</span>
          ) : (
            <svg className="w-6 h-6 md:w-7 md:h-7 text-gray-400 group-hover:text-[#2AABEE] transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          )}
          {!showQR && <span className="absolute top-0 right-0 w-3 h-3 bg-[#2AABEE] border-2 border-black rounded-full animate-pulse"></span>}
        </button>
      </div>

    </main>
  );
}