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
  const [timeLeft, setTimeLeft] = useState<string>("");
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
      } catch (e) { alert("Error al conectar: Asegúrate de estar en la red Base."); }
    } else { window.open("https://metamask.io/download/", "_blank"); }
  };

  const ejecutarCompra = async () => {
    if (!wallet) return conectarBilletera();
    setIsBuying(true);
    try {
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // FORZAMOS EL ENVÍO DE ETH AQUÍ:
      const tx = await contract.comprarAcceso({ 
        value: ethers.parseEther("0.0008") 
      });
      
      await tx.wait();
      window.location.reload();
    } catch (e: any) {
      setIsBuying(false);
      if (e.code === "INSUFFICIENT_FUNDS") {
        alert("No tienes suficiente saldo (ETH en red Base) para cubrir el ticket + gas.");
      } else {
        alert("La transacción fue cancelada o falló.");
      }
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
    <main className="min-h-screen bg-black text-white font-sans overflow-x-hidden pb-20">
      
      <nav className="w-full border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-[100] px-8 h-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <span className="text-xl font-black tracking-tighter uppercase italic">VAULTUM<span className="text-amber-500">.</span></span>
        </div>
        <button onClick={conectarBilletera} className="text-[10px] font-black border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-black">
          {wallet ? `CUENTA: ${wallet.substring(0,6)}...` : "CONECTAR MI BILLETERA"}
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-6 text-center mt-20">
        <h1 className="text-5xl md:text-[90px] font-bold tracking-tighter mb-4 leading-none uppercase">
          EL ÚLTIMO <br/> 
          <span className="text-gray-500 italic font-light text-3xl md:text-7xl">se lleva el pozo entero.</span>
        </h1>
        
        <div className="bg-[#0D0D0D] border border-white/10 rounded-[60px] p-8 md:p-20 shadow-2xl relative overflow-hidden max-w-5xl mx-auto mt-12">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white/[0.02] border border-white/5 rounded-[45px] p-12 text-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-6">Capital Acumulado</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-6xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-2xl font-black italic">ETH</span>
              </div>
              <p className="text-3xl text-gray-500 font-light italic">≈ {pozoUsd}</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[45px] p-12 text-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-6">Tiempo Restante</p>
              <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter uppercase">
                {loading ? "SINCRONIZANDO..." : timeLeft}
              </div>
            </div>
          </div>

          <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-8 bg-white text-black rounded-[35px] font-black text-[14px] uppercase tracking-[0.5em] hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 mb-14">
            {isFinished ? "BÓVEDA FINALIZADA" : isBuying ? "CONFIRMANDO..." : `INGRESAR AL POZO (~$${ticketUsd})`}
          </button>
          
          {/* SECCIÓN DE INSTRUCCIONES DETALLADAS */}
          <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[40px] mb-16">
            <p className="text-[11px] text-amber-500 uppercase tracking-[0.3em] font-black mb-10 italic">Guía de Inicio Rápido</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-[11px] font-black text-gray-400 uppercase tracking-tighter text-center">
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">1</span>
                 <p>Instala MetaMask <br/><span className="text-[9px] font-normal lowercase text-gray-600">En navegador o móvil</span></p>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">2</span>
                 <p>Red Base Mainnet <br/><span className="text-[9px] font-normal lowercase text-gray-600">La App te ayuda a cambiar</span></p>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">3</span>
                 <p>0.0008 ETH Mínimo <br/><span className="text-[9px] font-normal lowercase text-gray-600">Aprox. ${ticketUsd} USD</span></p>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE CONFIANZA Y MECÁNICA */}
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="p-10 bg-[#121212] border border-white/5 rounded-[40px]">
              <h3 className="text-white font-black text-[12px] uppercase mb-6 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> LA MECÁNICA DEL JUEGO
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed uppercase tracking-tighter italic">
                Cada vez que alguien ingresa a la bóveda, el cronómetro <span className="text-white font-bold">se reinicia a 60 minutos</span>. La competencia termina cuando el reloj llega a cero; en ese instante, el último usuario en aportar se adjudica el pozo acumulado de forma automática.
              </p>
            </div>
            <div className="p-10 bg-[#121212] border border-white/5 rounded-[40px]">
              <h3 className="text-white font-black text-[12px] uppercase mb-6 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> TRANSPARENCIA TOTAL
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed uppercase tracking-tighter italic">
                Este es un protocolo auditado en la red Base. El <span className="text-white font-bold">90% de cada ticket</span> ingresa directamente al premio mayor visible. El 10% restante se utiliza para el mantenimiento del servidor y seguridad del contrato inteligente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-32 py-12 text-center opacity-30">
        <p className="text-[10px] tracking-[1em] font-black uppercase">VAULTUM PROTOCOL ● BASE NETWORK ● 2026</p>
      </footer>

    </main>
  );
}