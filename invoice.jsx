import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  query,
} from "firebase/firestore";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  LogOut,
  History,
  FilePlus,
  User,
  CheckCircle,
  X,
} from "lucide-react";

// --- Konfigurasi Firebase ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "invoice-maker-pro";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [view, setView] = useState("list"); // 'list' or 'editor'
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [message, setMessage] = useState(null);

  // Inisialisasi Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data Invoices dari Firestore
  useEffect(() => {
    if (!user) return;

    const invoicesRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "invoices",
    );
    const q = query(invoicesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvoices(data);
      },
      (error) => {
        console.error("Firestore error:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Local Storage untuk Draft
  useEffect(() => {
    if (view === "editor" && currentInvoice) {
      localStorage.setItem("invoice_draft", JSON.stringify(currentInvoice));
    }
  }, [currentInvoice, view]);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const createNewInvoice = () => {
    const newInv = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      clientName: "",
      clientAddress: "",
      companyName: "Perusahaan Saya",
      companyAddress: "Alamat Perusahaan",
      items: [{ id: Date.now(), description: "", qty: 1, price: 0 }],
      notes: "Terima kasih atas kerjasamanya.",
      status: "Draft",
    };
    setCurrentInvoice(newInv);
    setView("editor");
  };

  const editInvoice = (inv) => {
    setCurrentInvoice(inv);
    setView("editor");
  };

  const saveInvoice = async () => {
    if (!user || !currentInvoice) return;
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "invoices",
        currentInvoice.id,
      );
      await setDoc(docRef, {
        ...currentInvoice,
        updatedAt: new Date().toISOString(),
      });
      showMsg("Invoice berhasil disimpan ke Cloud!");
      setView("list");
    } catch (err) {
      showMsg("Gagal menyimpan data", "error");
    }
  };

  const deleteInvoice = async (id) => {
    if (!confirm("Hapus invoice ini?")) return;
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "invoices",
        id,
      );
      await deleteDoc(docRef);
      showMsg("Invoice dihapus");
    } catch (err) {
      showMsg("Gagal menghapus", "error");
    }
  };

  const updateItem = (itemId, field, value) => {
    const updatedItems = currentInvoice.items.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item,
    );
    setCurrentInvoice({ ...currentInvoice, items: updatedItems });
  };

  const addItem = () => {
    const newItem = { id: Date.now(), description: "", qty: 1, price: 0 };
    setCurrentInvoice({
      ...currentInvoice,
      items: [...currentInvoice.items, newItem],
    });
  };

  const removeItem = (id) => {
    if (currentInvoice.items.length === 1) return;
    setCurrentInvoice({
      ...currentInvoice,
      items: currentInvoice.items.filter((i) => i.id !== id),
    });
  };

  const totals = useMemo(() => {
    if (!currentInvoice) return { subtotal: 0 };
    const subtotal = currentInvoice.items.reduce(
      (acc, item) => acc + item.qty * item.price,
      0,
    );
    return { subtotal };
  }, [currentInvoice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white flex items-center gap-2 animate-bounce ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <X size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Printer size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Invoice<span className="text-blue-600">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right mr-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              User ID
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {user?.uid}
            </span>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {view === "list" ? (
          <section>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800">
                  Daftar Invoice
                </h1>
                <p className="text-slate-500 mt-1">
                  Kelola semua tagihan Anda di satu tempat.
                </p>
              </div>
              <button
                onClick={createNewInvoice}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                <Plus size={20} /> Buat Baru
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <History size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">
                  Belum ada invoice
                </h3>
                <p className="text-slate-500 mb-6">
                  Mulai buat tagihan pertama Anda sekarang.
                </p>
                <button
                  onClick={createNewInvoice}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Klik di sini untuk membuat
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">
                        {inv.id}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 truncate">
                      {inv.clientName || "Klien Tanpa Nama"}
                    </h4>
                    <p className="text-slate-500 text-sm mb-4">
                      {new Date(inv.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="font-bold text-slate-900">
                        Rp{" "}
                        {inv.items
                          .reduce((a, b) => a + b.qty * b.price, 0)
                          .toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => editInvoice(inv)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800"
                      >
                        Buka Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 no-print">
              <button
                onClick={() => setView("list")}
                className="text-slate-500 font-bold flex items-center gap-1 hover:text-slate-800"
              >
                Kembali ke Daftar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={saveInvoice}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition"
                >
                  <Save size={18} /> Simpan Draft
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition"
                >
                  <Printer size={18} /> Cetak PDF
                </button>
              </div>
            </div>

            {/* Invoice Editor Canvas */}
            <div className="bg-white p-8 md:p-12 shadow-2xl rounded-3xl border border-slate-200 print:shadow-none print:border-none print:p-0 overflow-hidden">
              {/* Header Editor */}
              <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
                <div className="flex-1">
                  <input
                    type="text"
                    value={currentInvoice.companyName}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        companyName: e.target.value,
                      })
                    }
                    className="text-3xl font-black text-blue-600 w-full outline-none focus:bg-slate-50 rounded p-1 mb-2"
                    placeholder="NAMA PERUSAHAAN"
                  />
                  <textarea
                    value={currentInvoice.companyAddress}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        companyAddress: e.target.value,
                      })
                    }
                    className="w-full text-slate-500 outline-none focus:bg-slate-50 rounded p-1 resize-none h-20"
                    placeholder="Alamat Lengkap Perusahaan"
                  />
                </div>
                <div className="text-left md:text-right">
                  <h1 className="text-5xl font-black text-slate-200 mb-4 select-none">
                    INVOICE
                  </h1>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <span className="text-slate-400 font-bold uppercase text-xs">
                      No. Invoice
                    </span>
                    <input
                      type="text"
                      value={currentInvoice.id}
                      readOnly
                      className="text-sm font-bold text-slate-700 bg-transparent outline-none text-right"
                    />
                    <span className="text-slate-400 font-bold uppercase text-xs">
                      Tanggal
                    </span>
                    <input
                      type="date"
                      value={currentInvoice.date}
                      onChange={(e) =>
                        setCurrentInvoice({
                          ...currentInvoice,
                          date: e.target.value,
                        })
                      }
                      className="text-sm font-bold text-slate-700 bg-transparent outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div className="p-6 bg-slate-50 rounded-2xl print:bg-transparent print:p-0">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                    Ditujukan Untuk:
                  </h3>
                  <input
                    type="text"
                    value={currentInvoice.clientName}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        clientName: e.target.value,
                      })
                    }
                    className="w-full font-bold text-slate-800 text-lg bg-transparent border-b border-transparent focus:border-blue-200 outline-none mb-2"
                    placeholder="Nama Klien / Instansi"
                  />
                  <textarea
                    value={currentInvoice.clientAddress}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        clientAddress: e.target.value,
                      })
                    }
                    className="w-full text-sm text-slate-500 bg-transparent outline-none resize-none h-16"
                    placeholder="Alamat Lengkap Klien"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-4 font-black uppercase text-xs tracking-wider text-slate-400">
                        Deskripsi Layanan / Produk
                      </th>
                      <th className="py-4 px-4 font-black uppercase text-xs tracking-wider text-slate-400 text-center w-24">
                        Qty
                      </th>
                      <th className="py-4 px-4 font-black uppercase text-xs tracking-wider text-slate-400 text-right w-40">
                        Harga
                      </th>
                      <th className="py-4 px-4 font-black uppercase text-xs tracking-wider text-slate-900 text-right w-40">
                        Total
                      </th>
                      <th className="py-4 no-print w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 group"
                      >
                        <td className="py-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="w-full font-medium text-slate-700 outline-none focus:text-blue-600"
                            placeholder="Contoh: Jasa Desain Web"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "qty",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full text-center font-bold text-slate-700 outline-none"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "price",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full text-right font-bold text-slate-700 outline-none"
                          />
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900">
                          Rp {(item.qty * item.price).toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 text-right no-print">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addItem}
                className="no-print mb-12 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <Plus size={16} /> Tambah Item Lainnya
              </button>

              {/* Summary */}
              <div className="flex flex-col md:flex-row justify-between gap-12">
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Catatan Tambahan:
                  </h4>
                  <textarea
                    value={currentInvoice.notes}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        notes: e.target.value,
                      })
                    }
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm text-slate-500 outline-none border border-transparent focus:border-blue-100 h-24 italic"
                    placeholder="Berikan info rekening bank atau tenggat waktu pembayaran..."
                  />
                </div>
                <div className="w-full md:w-80">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-xs">
                      Subtotal
                    </span>
                    <span className="font-bold text-slate-700">
                      Rp {totals.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-6">
                    <span className="text-slate-900 font-black uppercase text-sm tracking-tighter">
                      Grand Total
                    </span>
                    <span className="text-3xl font-black text-blue-600 italic">
                      Rp {totals.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 text-center md:text-right hidden print:block">
                    <div className="inline-block border-b-2 border-slate-900 px-8 pb-2 mb-2">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-12">
                        Hormat Kami,
                      </p>
                    </div>
                    <p className="font-black text-slate-900 uppercase text-sm">
                      {currentInvoice.companyName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl mx-auto p-12 text-center text-slate-400 text-xs no-print">
        <p>
          &copy; {new Date().getFullYear()} InvoicePro - Sistem Penagihan
          Digital Mandiri
        </p>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          .print-only { display: block !important; }
          @page { margin: 1.5cm; }
        }
      `,
        }}
      />
    </div>
  );
}
