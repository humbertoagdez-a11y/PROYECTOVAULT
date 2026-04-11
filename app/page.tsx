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
      
      // LA TRANSACCIÓN REAL: Descuenta 0.0008 ETH de la billetera
      const tx = await contract.comprarAcceso({ 
        value: ethers.parseEther("0.0008") 
      });
      
      await tx.wait();
      window.location.reload();
    } catch (e) { 
      setIsBuying(false); 
      alert("Error: Asegúrate de tener suficiente saldo en Red Base (aprox. $3 USD) para cubrir el ticket y el gas.");
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
          {wallet ? `CONECTADO: ${wallet.substring(0,6)}...` : "VINCULAR BILLETERA"}
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
            <div className="bg-white/[0.02] border border-white/5 rounded-[45px] p-12">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-6">Pozo Acumulado</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-6xl md:text-8xl font-medium tracking-tighter">{totalEth.toFixed(4)}</span>
                <span className="text-amber-500 text-2xl font-black italic">ETH</span>
              </div>
              <p className="text-3xl text-gray-500 font-light italic">≈ {pozoUsd}</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[45px] p-12">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-6">Tiempo Restante</p>
              <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter uppercase">
                {loading ? "CARGANDO..." : timeLeft}
              </div>
            </div>
          </div>

          <button onClick={ejecutarCompra} disabled={isBuying || isFinished} className="w-full py-8 bg-white text-black rounded-[35px] font-black text-[14px] uppercase tracking-[0.5em] hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 mb-14">
            {isFinished ? "BÓVEDA FINALIZADA" : isBuying ? "PROCESANDO PAGO..." : `INGRESAR AL POZO (~$${ticketUsd})`}
          </button>
          
          {/* INSTRUCCIONES MEJORADAS */}
          <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[40px] mb-16">
            <p className="text-[11px] text-amber-500 uppercase tracking-[0.3em] font-black mb-10 italic">¿Cómo participar?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-[11px] font-black text-gray-400 uppercase tracking-tighter text-center">
              <a href="https://metamask.io/download/" target="_blank" className="flex flex-col items-center gap-4 hover:text-white transition-colors">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">1</span>
                 <p>Obtén MetaMask <br/><span className="text-[9px] font-normal lowercase text-gray-600">(Extensión o App Móvil)</span></p>
              </a>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">2</span>
                 <p>Conecta a Red Base <br/><span className="text-[9px] font-normal lowercase text-gray-600">Víncula tu wallet arriba</span></p>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <span className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 border border-white/10 text-lg">3</span>
                 <p>Aporta 0.0008 ETH <br/><span className="text-[9px] font-normal lowercase text-gray-600">Suma 60 min. al reloj</span></p>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE CONFIANZA */}
          <div className="text-left border-t border-white/5 pt-16">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tighter uppercase mb-8">
              Confianza Descentralizada <br/>
              <span className="text-amber-500 italic font-light text-xl md:text-2xl">Transparencia Inmutable en la Blockchain.</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-[#121212] rounded-[30px] border border-white/5">
                <p className="text-[13px] text-gray-400 leading-relaxed uppercase tracking-tighter italic">
                  Vaultum no tiene dueños ni administradores. Cada transacción es visible en la red Base y el pozo se entrega automáticamente al ganador por medio de un <span className="text-white font-bold">Contrato Inteligente</span> verificado. El 90% de cada ticket ingresa directamente al pozo.
                </p>
              </div>
              <div className="p-8 bg-[#121212] rounded-[30px] border border-white/5">
                <p className="text-[13px] text-gray-400 leading-relaxed uppercase tracking-tighter italic">
                  A diferencia de otros juegos, aquí el tiempo es acumulativo. Cada nuevo ingreso <span className="text-white font-bold">suma 60 minutos exactos</span> al tiempo restante actual, extendiendo la oportunidad de competencia y aumentando el premio final para el último en entrar.
                </p>
              </div>
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