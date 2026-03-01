import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  History,
  LayoutDashboard,
  Search,
  ReceiptText,
  ChevronLeft,
} from "lucide-react";

/**
 * =========================================================================
 * APLIKASI KASIR PRO - V3.0 (FIX LAYOUT & PRINT)
 * Jika tampilan masih berantakan, pastikan file index.css sudah berisi:
 * @tailwind base; @tailwind components; @tailwind utilities;
 * =========================================================================
 */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [view, setView] = useState("list");
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Muat data lokal
  useEffect(() => {
    const savedData = localStorage.getItem("kasir_pro_v3_final");
    if (savedData) {
      try {
        setInvoices(JSON.parse(savedData));
      } catch (e) {
        console.error("Gagal memuat data");
      }
    }
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Simpan data otomatis
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("kasir_pro_v3_final", JSON.stringify(invoices));
    }
  }, [invoices, loading]);

  const showMsg = (text, type = "success") => {
    setMessage({ text: String(text), type });
    setTimeout(() => setMessage(null), 3000);
  };

  const createNewInvoice = () => {
    const newInv = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      clientName: "",
      companyName: "USAHA ANDA",
      companyAddress: "Alamat Bisnis Anda",
      items: [{ id: Date.now(), description: "", qty: 1, price: 0 }],
      notes: "Terima kasih atas kunjungan Anda!",
      updatedAt: new Date().toISOString(),
    };
    setCurrentInvoice(newInv);
    setView("editor");
  };

  const saveInvoice = () => {
    if (!currentInvoice) return;
    const existingIndex = invoices.findIndex(
      (inv) => inv.id === currentInvoice.id,
    );
    let updated = [...invoices];
    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...currentInvoice,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [
        { ...currentInvoice, updatedAt: new Date().toISOString() },
        ...updated,
      ];
    }
    setInvoices(updated);
    showMsg("Tersimpan!");
    setView("list");
  };

  const deleteInvoice = (id) => {
    if (window.confirm("Hapus struk ini?")) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
      showMsg("Dihapus", "error");
    }
  };

  const totals = useMemo(() => {
    if (!currentInvoice || !currentInvoice.items) return { subtotal: 0 };
    return {
      subtotal: currentInvoice.items.reduce(
        (acc, item) => acc + item.qty * item.price,
        0,
      ),
    };
  }, [currentInvoice]);

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest">
            Memulai Sistem...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 print:bg-white font-sans selection:bg-blue-600 selection:text-white"
      style={{ textAlign: "left" }}
    >
      {message && (
        <div className="fixed top-6 right-6 z-[999] p-4 bg-slate-900 text-white text-[10px] font-black rounded-lg shadow-2xl animate-in fade-in">
          {String(message.text)}
        </div>
      )}

      {/* Navigasi Utama */}
      <nav className="bg-white border-b px-8 py-5 flex justify-between items-center no-print sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-black p-1.5 rounded text-white">
            <LayoutDashboard size={18} />
          </div>
          <h1 className="text-sm font-black uppercase tracking-tighter leading-none">
            KASIR<span className="text-blue-600">PRO</span>
          </h1>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          Offline Terminal v3.0
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        {view === "list" ? (
          /* --- DASHBOARD --- */
          <div className="animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="w-full md:w-auto">
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 italic">
                  Dashboard
                </h2>
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-3 top-3 text-slate-300"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Cari struk atau nama..."
                    className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={createNewInvoice}
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} /> Buat Transaksi Baru
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.length === 0 ? (
                <div className="col-span-full bg-white p-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                  <ReceiptText
                    size={48}
                    className="mx-auto text-slate-200 mb-4"
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Belum ada riwayat struk.
                  </p>
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-52 group relative"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black text-white bg-black px-2 py-1 rounded-md uppercase leading-none">
                          {inv.id}
                        </span>
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          className="text-slate-300 hover:text-red-500 transition-all p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="font-black text-xl uppercase tracking-tighter truncate leading-tight">
                        {inv.clientName || "PELANGGAN UMUM"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                        {inv.date}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                      <div className="text-xl font-black tracking-tighter italic">
                        Rp{" "}
                        {inv.items
                          .reduce((a, b) => a + b.qty * b.price, 0)
                          .toLocaleString("id-ID")}
                      </div>
                      <button
                        onClick={() => {
                          setCurrentInvoice(inv);
                          setView("editor");
                        }}
                        className="bg-slate-100 text-black p-2.5 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* --- EDITOR STRUK --- */
          <div className="animate-in fade-in max-w-xl mx-auto">
            <div className="mb-8 flex flex-wrap gap-3 no-print items-center">
              <button
                onClick={() => setView("list")}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-black transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1"></div>
              <button
                onClick={saveInvoice}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                SIMPAN
              </button>
              <button
                onClick={() => window.print()}
                className="bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Printer size={16} /> CETAK
              </button>
            </div>

            {/* Receipt Container */}
            <div className="receipt-paper bg-white p-8 md:p-12 shadow-2xl border-t-8 border-black mx-auto print:p-0 print:shadow-none print:border-none relative">
              <div className="text-center mb-8">
                <input
                  className="text-3xl font-black text-center w-full outline-none uppercase tracking-tighter mb-2 bg-transparent border-none"
                  value={currentInvoice?.companyName}
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      companyName: e.target.value.toUpperCase(),
                    })
                  }
                />
                <textarea
                  className="text-[11px] font-bold text-center w-full outline-none h-12 resize-none leading-tight text-slate-500 italic border-none bg-transparent"
                  value={currentInvoice?.companyAddress}
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      companyAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="border-t border-dashed border-slate-300 my-6 print:border-black"></div>

              <div className="text-[11px] font-bold space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-black uppercase">
                    NO STRUK :
                  </span>
                  <span className="font-black">{currentInvoice?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 print:text-black uppercase">
                    TANGGAL :
                  </span>
                  <input
                    type="date"
                    className="text-right bg-transparent outline-none p-0 font-bold border-none"
                    value={currentInvoice?.date}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-between border-t border-dotted border-slate-100 pt-3 mt-2 print:border-black">
                  <span className="text-slate-300 print:text-black uppercase">
                    PELANGGAN :
                  </span>
                  <input
                    className="flex-1 text-right font-black outline-none bg-transparent uppercase border-none focus:text-blue-600 placeholder:text-slate-200"
                    placeholder="ISI NAMA"
                    value={currentInvoice?.clientName}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        clientName: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>

              {/* Items Table - Perbaikan Kolom QTY (Ramping) */}
              <div className="border-y-2 border-dashed border-black py-4 mb-8">
                <table
                  className="w-full text-[11px] leading-relaxed border-collapse"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead>
                    <tr className="text-left font-black uppercase border-b border-dotted border-slate-200 mb-4 print:border-black">
                      <th className="pb-4">ITEM</th>
                      <th className="pb-4 text-center w-12">QTY</th>
                      <th className="pb-4 text-right w-24">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold">
                    {currentInvoice?.items.map((item) => (
                      <tr
                        key={item.id}
                        className="align-top border-b border-dotted border-slate-50 last:border-none print:border-black"
                      >
                        <td className="py-4 pr-2">
                          <input
                            className="w-full outline-none bg-transparent placeholder:text-slate-200 font-bold uppercase truncate"
                            value={item.description}
                            placeholder="NAMA BARANG"
                            onChange={(e) => {
                              const items = currentInvoice.items.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      description: e.target.value.toUpperCase(),
                                    }
                                  : i,
                              );
                              setCurrentInvoice({ ...currentInvoice, items });
                            }}
                          />
                          <div className="text-[10px] text-slate-400 font-normal mt-1 italic">
                            @ {item.price.toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="py-4 px-0 text-center w-12">
                          <input
                            type="number"
                            className="w-full text-center bg-slate-50 p-1 rounded-md no-print outline-none font-bold"
                            value={item.qty}
                            onChange={(e) => {
                              const items = currentInvoice.items.map((i) =>
                                i.id === item.id
                                  ? { ...i, qty: parseInt(e.target.value) || 0 }
                                  : i,
                              );
                              setCurrentInvoice({ ...currentInvoice, items });
                            }}
                          />
                          <span className="hidden print:inline">
                            {item.qty}
                          </span>
                        </td>
                        <td className="py-4 pl-2 text-right relative group w-24">
                          <div className="flex items-center justify-end gap-1">
                            <span className="tracking-tighter font-black text-slate-800 print:text-black">
                              {(item.qty * item.price).toLocaleString("id-ID")}
                            </span>
                            <button
                              onClick={() => {
                                if (currentInvoice.items.length > 1)
                                  setCurrentInvoice({
                                    ...currentInvoice,
                                    items: currentInvoice.items.filter(
                                      (i) => i.id !== item.id,
                                    ),
                                  });
                              }}
                              className="no-print text-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="no-print mt-2">
                            <input
                              type="number"
                              className="w-full text-right text-[9px] outline-none bg-slate-100 rounded p-1"
                              value={item.price}
                              onChange={(e) => {
                                const items = currentInvoice.items.map((i) =>
                                  i.id === item.id
                                    ? {
                                        ...i,
                                        price: parseInt(e.target.value) || 0,
                                      }
                                    : i,
                                );
                                setCurrentInvoice({ ...currentInvoice, items });
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      items: [
                        ...currentInvoice.items,
                        { id: Date.now(), description: "", qty: 1, price: 0 },
                      ],
                    })
                  }
                  className="no-print mt-6 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-300 hover:text-black hover:border-black transition-all"
                >
                  + TAMBAH BARIS
                </button>
              </div>

              <div className="space-y-2 mb-8 font-black text-[12px] italic">
                <div className="flex justify-between uppercase text-slate-400 print:text-black">
                  <span>SUBTOTAL:</span>
                  <span>{totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-4xl pt-6 border-t-4 border-double border-black not-italic tracking-tighter">
                  <span className="text-[10px] font-black uppercase tracking-widest self-center">
                    TOTAL
                  </span>
                  <span>{totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="text-center text-[10px] space-y-6 mt-12">
                <div className="border-t border-dashed border-slate-300 pt-6 print:border-black"></div>
                <textarea
                  className="w-full text-center outline-none bg-slate-50 p-4 rounded-xl italic font-bold resize-none leading-tight border-none h-20 no-print"
                  value={currentInvoice?.notes}
                  placeholder="Isi catatan..."
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      notes: e.target.value,
                    })
                  }
                />
                <div className="hidden print:block text-center italic font-bold text-[10px] mb-8 leading-tight">
                  {currentInvoice?.notes}
                </div>
                <div className="uppercase font-black tracking-[0.5em] text-slate-300 print:text-black py-4">
                  *** TERIMA KASIH ***
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* GLOBAL CSS FORCING ALIGNMENT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Reset gaya default Vite agar tidak ke tengah */
        #root {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important;
        }
        body { margin: 0; padding: 0; }
        
        .app-global-reset * {
          box-sizing: border-box;
        }

        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; padding: 0 !important; }
          .receipt-paper { 
            width: 100% !important; 
            max-width: 320px !important; 
            margin: 0 auto !important; 
            box-shadow: none !important;
            border: none !important;
            font-family: 'Courier New', monospace !important;
          }
          * { color: black !important; border-color: black !important; }
          @page { margin: 0; size: auto; }
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      `,
        }}
      />
    </div>
  );
}
