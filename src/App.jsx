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
  Settings,
  Package,
  X,
  Edit,
  BarChart3,
  UserPlus,
  Users,
  LogOut,
  Key,
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
  const [items, setItems] = useState([]); // Database barang
  const [view, setView] = useState("list"); // 'list' | 'editor' | 'settings' | 'items'
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [showItemSelector, setShowItemSelector] = useState(null);
  const [reportTab, setReportTab] = useState("stock"); // 'stock' | 'sold' | 'profit'
  const [autocomplete, setAutocomplete] = useState({ id: null, query: "" });
  const [printMode, setPrintMode] = useState("thermal");

  // State untuk Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // State untuk Info Toko
  const [storeInfo, setStoreInfo] = useState({
    name: "USAHA ANDA",
    address: "Alamat Bisnis Anda",
    defaultNotes: "Terima kasih atas kunjungan Anda!",
  });

  // Muat data lokal
  useEffect(() => {
    const savedData = localStorage.getItem("kasir_pro_v3_final");
    const savedStore = localStorage.getItem("kasir_pro_store_info");
    const savedItems = localStorage.getItem("kasir_pro_items");
    const savedUsers = localStorage.getItem("kasir_pro_users");

    if (savedData) {
      try {
        setInvoices(JSON.parse(savedData));
      } catch (e) {
        console.error("Gagal memuat data struk");
      }
    }

    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Gagal memuat data barang");
      }
    }

    if (savedStore) {
      try {
        setStoreInfo(JSON.parse(savedStore));
      } catch (e) {
        console.error("Gagal memuat profil toko");
      }
    }

    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Gagal memuat data user");
      }
    } else {
      // Default Admin
      const defaultAdmin = [{ id: Date.now(), username: "admin", password: "123", role: "admin", name: "Admin Utama" }];
      setUsers(defaultAdmin);
      localStorage.setItem("kasir_pro_users", JSON.stringify(defaultAdmin));
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

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("kasir_pro_store_info", JSON.stringify(storeInfo));
    }
  }, [storeInfo, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("kasir_pro_items", JSON.stringify(items));
    }
  }, [items, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("kasir_pro_users", JSON.stringify(users));
    }
  }, [users, loading]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      showMsg(`Selamat Datang, ${user.name}!`);
    } else {
      showMsg("Username atau Password salah!", "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari aplikasi?")) {
      setCurrentUser(null);
      setShowLogin(true);
      setLoginForm({ username: "", password: "" });
      setView("list");
      showMsg("Berhasil keluar.");
    }
  };

  const saveUser = (user) => {
    if (!user.username || !user.password || !user.name || !user.role) {
      showMsg("Semua kolom harus diisi!", "error");
      return;
    }
    const newUserList = [...users];
    const index = newUserList.findIndex(u => u.id === user.id);
    if (index >= 0) {
      newUserList[index] = user;
      showMsg("User diperbarui!");
    } else {
      if (users.some(u => u.username === user.username)) {
        showMsg("Username sudah digunakan!", "error");
        return;
      }
      newUserList.unshift({ ...user, id: Date.now() });
      showMsg("User ditambah!");
    }
    setUsers(newUserList);
    setEditingItem(null);
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text: String(text), type });
    setTimeout(() => setMessage(null), 3000);
  };

  const createNewInvoice = () => {
    const newInv = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      clientName: "",
      companyName: storeInfo.name,
      companyAddress: storeInfo.address,
      items: [{ id: Date.now(), description: "", qty: 1, price: 0 }],
      notes: storeInfo.defaultNotes,
      updatedAt: new Date().toISOString(),
    };
    setCurrentInvoice(newInv);
    setView("editor");
  };

  const saveInvoice = () => {
    if (!currentInvoice) return;

    // Check if it's a new invoice
    const isNew = !invoices.some(inv => inv.id === currentInvoice.id);

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

    // Update Stock if it's a new transaction
    if (isNew) {
      const updatedItems = items.map(dbItem => {
        const invItem = currentInvoice.items.find(it => it.description === dbItem.name);
        if (invItem) {
          return { ...dbItem, stock: (dbItem.stock || 0) - invItem.qty };
        }
        return dbItem;
      });
      setItems(updatedItems);
    }

    showMsg(isNew ? "Transaksi Baru & Stok Diperbarui!" : "Tersimpan!");
    setView("list");
  };

  const deleteInvoice = (id) => {
    if (window.confirm("Hapus struk ini?")) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
      showMsg("Dihapus", "error");
    }
  };

  const saveItem = (item) => {
    if (!item.name || !item.price || item.buyingPrice === undefined || item.stock === undefined) {
      showMsg("Semua kolom harus diisi!", "error");
      return;
    }
    const newItemList = [...items];
    const index = newItemList.findIndex(i => i.id === item.id);
    if (index >= 0) {
      newItemList[index] = item;
      showMsg("Barang diperbarui!");
    } else {
      newItemList.unshift({ ...item, id: Date.now() });
      showMsg("Barang ditambah!");
    }
    setItems(newItemList);
    setEditingItem(null);
  };

  const deleteItem = (id) => {
    if (window.confirm("Hapus barang ini dari database?")) {
      setItems(items.filter(i => i.id !== id));
      showMsg("Barang dihapus", "error");
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

  const filteredItems = items.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(itemSearchTerm.toLowerCase()),
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

  if (showLogin || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="bg-black w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
              <Key size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              KASIR<span className="text-blue-600">PRO</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
              Sistem Manajemen Inventori
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">
                Username
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Masukkan username"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              MASUK KE SISTEM
            </button>
          </form>
          <p className="text-center text-[9px] text-slate-300 mt-8 font-bold uppercase tracking-widest">
            V3.0 &bull; SECURITY PROTECTED
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
          <h1 className="text-sm font-black uppercase tracking-tighter leading-none hidden sm:block">
            KASIR<span className="text-blue-600">PRO</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'list' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <History size={14} /> <span className="hidden sm:inline">Riwayat</span>
          </button>
          <button
            onClick={() => setView("items")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'items' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Package size={14} /> <span className="hidden sm:inline">Barang</span>
          </button>
          <button
            onClick={() => setView("reports")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'reports' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BarChart3 size={14} /> <span className="hidden sm:inline">Laporan</span>
          </button>
          <button
            onClick={() => setView("settings")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'settings' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Settings size={14} /> <span className="hidden sm:inline">Toko</span>
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setView("users")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'users' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Users size={14} /> <span className="hidden sm:inline">Admin/User</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        {view === "list" && (
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
        )}

        {view === "reports" && (
          /* --- MENU LAPORAN --- */
          <div className="animate-in fade-in">
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-8 italic">
              Laporan Bisnis
            </h2>

            <div className="flex flex-wrap gap-2 mb-8 no-print">
              {[
                { id: 'stock', label: 'Stok Tersedia' },
                { id: 'sold', label: 'Barang Terjual' },
                { id: 'profit', label: 'Laba Rugi' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setReportTab(tab.id)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {reportTab === 'stock' && (
              /* --- LAPORAN STOK TERSEDIA --- */
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Barang</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Harga Beli</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Harga Jual</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-black uppercase text-sm tracking-tight">{item.name}</td>
                        <td className="p-6 text-right font-bold text-slate-500">Rp {item.buyingPrice?.toLocaleString("id-ID") || 0}</td>
                        <td className="p-6 text-right font-bold text-blue-600">Rp {item.price.toLocaleString("id-ID")}</td>
                        <td className={`p-6 text-right font-black ${item.stock <= 5 ? 'text-red-500' : 'text-slate-900'}`}>{item.stock || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportTab === 'sold' && (
              /* --- LAPORAN BARANG TERJUAL --- */
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Barang</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Terjual</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Array.from(
                      invoices.reduce((acc, inv) => {
                        inv.items.forEach(item => {
                          const existing = acc.get(item.description) || { qty: 0, total: 0 };
                          acc.set(item.description, {
                            qty: existing.qty + item.qty,
                            total: existing.total + (item.qty * item.price)
                          });
                        });
                        return acc;
                      }, new Map()).entries()
                    ).map(([name, data]) => (
                      <tr key={name} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-black uppercase text-sm tracking-tight">{name}</td>
                        <td className="p-6 text-right font-black text-slate-900">{data.qty}</td>
                        <td className="p-6 text-right font-bold text-blue-600">Rp {data.total.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportTab === 'profit' && (
              /* --- LAPORAN LABA RUGI --- */
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    let totalRevenue = 0;
                    let totalCost = 0;
                    invoices.forEach(inv => {
                      inv.items.forEach(item => {
                        totalRevenue += item.qty * item.price;
                        // Find item in DB to get buying price
                        const dbItem = items.find(i => i.name === item.description);
                        if (dbItem) {
                          totalCost += item.qty * (dbItem.buyingPrice || 0);
                        }
                      });
                    });
                    const profit = totalRevenue - totalCost;

                    return (
                      <>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Total Pendapatan</p>
                          <div className="text-3xl font-black tracking-tighter italic">Rp {totalRevenue.toLocaleString("id-ID")}</div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Total Modal (HPP)</p>
                          <div className="text-3xl font-black tracking-tighter italic text-slate-400">Rp {totalCost.toLocaleString("id-ID")}</div>
                        </div>
                        <div className={`p-8 rounded-[2rem] border shadow-lg ${profit >= 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white'}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4">Laba Bersih</p>
                          <div className="text-4xl font-black tracking-tighter italic">Rp {profit.toLocaleString("id-ID")}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-6">Detail Margin per Invoice</h4>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-[9px] font-black uppercase text-slate-400">ID Transaksi</th>
                        <th className="pb-4 text-[9px] font-black uppercase text-slate-400">Pelanggan</th>
                        <th className="pb-4 text-right text-[9px] font-black uppercase text-slate-400">Revenue</th>
                        <th className="pb-4 text-right text-[9px] font-black uppercase text-slate-400">Modal</th>
                        <th className="pb-4 text-right text-[9px] font-black uppercase text-slate-400">Laba</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 italic">
                      {invoices.map(inv => {
                        let rev = 0;
                        let cost = 0;
                        inv.items.forEach(it => {
                          rev += it.qty * it.price;
                          const dbIt = items.find(i => i.name === it.description);
                          if (dbIt) { cost += it.qty * (dbIt.buyingPrice || 0); }
                        });
                        return (
                          <tr key={inv.id}>
                            <td className="py-4 text-xs font-black">{inv.id}</td>
                            <td className="py-4 text-xs font-bold text-slate-400">{inv.clientName || 'PELANGGAN UMUM'}</td>
                            <td className="py-4 text-right text-xs font-bold">Rp {rev.toLocaleString("id-ID")}</td>
                            <td className="py-4 text-right text-xs font-bold text-slate-400">Rp {cost.toLocaleString("id-ID")}</td>
                            <td className={`py-4 text-right text-xs font-black ${rev - cost >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Rp {(rev - cost).toLocaleString("id-ID")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "settings" && (
          /* --- PENGATURAN TOKO --- */
          <div className="animate-in fade-in max-w-2xl mx-auto">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">
              Profil Toko
            </h2>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Nama Toko
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold uppercase"
                  value={storeInfo.name}
                  onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value.toUpperCase() })}
                  placeholder="Masukkan nama toko"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Alamat Toko
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold resize-none h-24"
                  value={storeInfo.address}
                  onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Catatan Kaki Default (Terima kasih, dsb)
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold resize-none italic h-24"
                  value={storeInfo.defaultNotes}
                  onChange={(e) => setStoreInfo({ ...storeInfo, defaultNotes: e.target.value })}
                  placeholder="Catatan di bawah struk"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => {
                    showMsg("Profil toko berhasil disimpan!");
                    setView("list");
                  }}
                  className="bg-black text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  <Save size={16} /> SIMPAN PERUBAHAN
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "users" && currentUser?.role === 'admin' && (
          /* --- MANAJEMEN USER --- */
          <div className="animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="w-full md:w-auto">
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 italic">
                  Manajemen User
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total {users.length} Pengguna Terdaftar
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ username: "", password: "", role: "user", name: "" })}
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <UserPlus size={18} /> Tambah User Baru
              </button>
            </div>

            {editingItem && editingItem.role && (
              /* Modal Form User */
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 italic">
                    {editingItem.id ? 'Edit User' : 'Tambah User'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Nama Lengkap</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        placeholder="Contoh: Ahmad Kasir"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Username</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                        value={editingItem.username}
                        onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value.toLowerCase() })}
                        placeholder="username_baru"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Password</label>
                      <input
                        type="password"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                        value={editingItem.password}
                        onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Role/Akses</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                        value={editingItem.role}
                        onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                      >
                        <option value="user">USER (Biasa)</option>
                        <option value="admin">ADMIN (Penuh)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        saveUser(editingItem);
                        setEditingItem(null);
                      }}
                      className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40 group relative"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingItem(u)}
                          className="text-slate-300 hover:text-blue-600 transition-all p-1"
                        >
                          <Edit size={16} />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus user ${u.name}?`)) {
                                setUsers(users.filter(usr => usr.id !== u.id));
                                showMsg("User dihapus", "error");
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 transition-all p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-black text-lg uppercase tracking-tighter truncate leading-tight">
                      {u.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 italic lowercase">
                      @{u.username}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="text-[9px] font-black text-slate-300 uppercase">
                      ID: {u.id.toString().slice(-6)}
                    </div>
                    <div className="text-[9px] font-black text-slate-300 uppercase">
                      Pass: ••••
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "items" && (
          /* --- DATABASE BARANG --- */
          <div className="animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="w-full md:w-auto">
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 italic">
                  Database Barang
                </h2>
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-3 top-3 text-slate-300"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Cari barang..."
                    className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => setEditingItem({ name: "", price: 0, buyingPrice: 0, stock: 0 })}
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} /> Tambah Barang Baru
              </button>
            </div>

            {editingItem && (
              /* Modal Form Barang */
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 italic">
                    {editingItem.id ? 'Edit Barang' : 'Tambah Barang'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Nama Barang</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold uppercase"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value.toUpperCase() })}
                        placeholder="Contoh: BERAS PREMIUM 5KG"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Harga Beli (Rp)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                          value={editingItem.buyingPrice}
                          onChange={(e) => setEditingItem({ ...editingItem, buyingPrice: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Harga Jual (Rp)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Jumlah Stok</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                        value={editingItem.stock}
                        onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => saveItem(editingItem)}
                      className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.length === 0 ? (
                <div className="col-span-full bg-white p-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                  <Package
                    size={48}
                    className="mx-auto text-slate-200 mb-4"
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Belum ada data barang.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40 group relative"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Item ID: {item.id.toString().slice(-6)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-slate-300 hover:text-blue-600 transition-all p-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-all p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-black text-lg uppercase tracking-tighter truncate leading-tight">
                        {item.name}
                      </h4>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">Jual @ Rp {item.price.toLocaleString("id-ID")}</p>
                        <div className="text-xl font-black tracking-tighter italic text-blue-600 leading-none">
                          Rp {item.price.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1 text-right">Beli: {item.buyingPrice?.toLocaleString("id-ID") || 0}</p>
                        <div className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">
                          Stok: {item.stock || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === "editor" && (
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
              <select
                className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold p-3 rounded-xl outline-none no-print shadow-sm"
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value)}
              >
                <option value="thermal">Thermal (58mm)</option>
                <option value="a5">PDF A5</option>
              </select>
              <button
                onClick={saveInvoice}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                SIMPAN
              </button>
              <button
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = (currentInvoice?.id || "STRUK").replace(
                    /\//g,
                    "-",
                  );
                  // Allow React to re-render any class changes if needed (not strictly necessary for CSS @page if injected via style block, but good practice).
                  setTimeout(() => {
                    window.print();
                    document.title = originalTitle;
                  }, 100);
                }}
                className="bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Printer size={16} /> CETAK
              </button>
            </div>

            {/* Receipt Container */}
            <div className="receipt-paper bg-white p-8 md:p-12 shadow-2xl border-t-8 border-black mx-auto print:p-0 print:shadow-none print:border-none relative print:mt-0">

              {showItemSelector && (
                /* Modal Pilih Barang dari DB */
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 no-print">
                  <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pilih Barang</h3>
                      <button onClick={() => setShowItemSelector(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
                    </div>

                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-3 text-slate-300" size={18} />
                      <input
                        type="text"
                        placeholder="Cari di database..."
                        className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold"
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {items.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).length === 0 ? (
                        <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Barang tidak ditemukan.</p>
                      ) : (
                        items.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(dbItem => (
                          <button
                            key={dbItem.id}
                            onClick={() => {
                              const updatedItems = currentInvoice.items.map(it =>
                                it.id === showItemSelector
                                  ? { ...it, description: dbItem.name, price: dbItem.price }
                                  : it
                              );
                              setCurrentInvoice({ ...currentInvoice, items: updatedItems });
                              setShowItemSelector(null);
                            }}
                            className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all group flex justify-between items-center"
                          >
                            <div>
                              <div className="font-black text-sm uppercase tracking-tight group-hover:text-blue-600">{dbItem.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 flex gap-2">
                                <span>Rp {dbItem.price.toLocaleString("id-ID")}</span>
                                <span className="text-blue-600">Stok: {dbItem.stock || 0}</span>
                              </div>
                            </div>
                            <Plus size={16} className="text-slate-200 group-hover:text-blue-600" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-4 print:mb-0 print:pb-0">
                <input
                  className="text-3xl print:text-base font-black text-center w-full outline-none uppercase tracking-tighter mb-1 print:mb-0 print:mt-0 bg-transparent border-none"
                  value={currentInvoice?.companyName}
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      companyName: e.target.value.toUpperCase(),
                    })
                  }
                />
                <textarea
                  className="text-[11px] print:text-[9px] font-bold text-center w-full outline-none h-10 print:h-8 resize-none leading-none text-slate-500 print:text-black italic border-none bg-transparent overflow-hidden print:mb-0"
                  value={currentInvoice?.companyAddress}
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      companyAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="border-t border-dashed border-slate-300 my-3 print:my-0 print:border-black"></div>

              <div className="text-[11px] font-bold space-y-1 print:space-y-0 mb-3 print:mb-0.5 mt-2 print:mt-0">
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
                <div className="flex justify-between border-t border-dotted border-slate-100 pt-3 mt-2 print:pt-1 print:mt-1 print:border-black">
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
              <div className="border-y-2 border-dashed border-black py-4 print:py-1 mb-8 print:mb-2">
                <table
                  className="w-full text-[11px] print:text-[9px] leading-tight print:leading-none border-collapse"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead>
                    <tr className="text-left font-black uppercase border-b border-dotted border-slate-200 mb-2 print:mb-1 print:border-black">
                      <th className="pb-2 print:pb-1">ITEM</th>
                      <th className="pb-2 print:pb-1 text-center w-10">QTY</th>
                      <th className="pb-2 print:pb-1 text-right w-20">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold">
                    {currentInvoice?.items.map((item) => (
                      <tr
                        key={item.id}
                        className="align-top border-b border-dotted border-slate-50 last:border-none print:border-black"
                      >
                        <td className="py-2 print:py-1 pr-1 relative">
                          <div className="flex items-center gap-1 group/item">
                            <input
                              className="w-full outline-none bg-transparent placeholder:text-slate-200 font-bold uppercase truncate"
                              value={item.description}
                              placeholder="NAMA BARANG"
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                const updatedItems = currentInvoice.items.map((i) =>
                                  i.id === item.id
                                    ? {
                                      ...i,
                                      description: val,
                                    }
                                    : i,
                                );
                                setCurrentInvoice({ ...currentInvoice, items: updatedItems });
                                setAutocomplete({ id: item.id, query: val });
                              }}
                              onBlur={() => {
                                // Delay hide so click can be registered
                                setTimeout(() => setAutocomplete({ id: null, query: "" }), 200);
                              }}
                            />

                            {/* Autocomplete Dropdown */}
                            {autocomplete.id === item.id && autocomplete.query.length > 0 && (
                              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] no-print overflow-hidden max-h-48 overflow-y-auto">
                                {items.filter(i => i.name.toLowerCase().includes(autocomplete.query.toLowerCase())).length === 0 ? (
                                  <div className="p-3 text-[10px] font-bold text-slate-400 italic">Tidak ada hasil...</div>
                                ) : (
                                  items
                                    .filter(i => i.name.toLowerCase().includes(autocomplete.query.toLowerCase()))
                                    .map(dbItem => (
                                      <button
                                        key={dbItem.id}
                                        type="button"
                                        className="w-full text-left p-3 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-none flex justify-between items-center"
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevent blur
                                          const updatedItems = currentInvoice.items.map(it =>
                                            it.id === item.id
                                              ? { ...it, description: dbItem.name, price: dbItem.price }
                                              : it
                                          );
                                          setCurrentInvoice({ ...currentInvoice, items: updatedItems });
                                          setAutocomplete({ id: null, query: "" });
                                        }}
                                      >
                                        <div>
                                          <div className="text-[10px] font-black uppercase">{dbItem.name}</div>
                                          <div className="text-[9px] text-slate-400 font-bold">Stok: {dbItem.stock || 0} | Rp {dbItem.price.toLocaleString("id-ID")}</div>
                                        </div>
                                        <Plus size={12} className="text-blue-600" />
                                      </button>
                                    ))
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => setShowItemSelector(item.id)}
                              className="no-print opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-100 rounded transition-all text-blue-600 flex-shrink-0"
                              title="Pilih dari Database"
                            >
                              <Search size={14} />
                            </button>
                          </div>
                          <div className="text-[10px] print:text-[8px] text-slate-400 font-normal mt-0.5 print:mt-0 italic">
                            @ {item.price.toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="py-2 print:py-1 px-0 text-center w-10">
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
                        <td className="py-2 print:py-1 pl-1 text-right relative group w-20">
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
                          <div className="no-print mt-1">
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

              <div className="space-y-1 mb-4 print:mb-2 font-black text-[12px] print:text-[10px] italic">
                <div className="flex justify-between uppercase text-slate-400 print:text-black">
                  <span>SUBTOTAL:</span>
                  <span>{totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-4xl print:text-xl pt-4 print:pt-1 border-t-4 border-double border-black not-italic tracking-tighter">
                  <span className="text-[10px] print:text-[9px] font-black uppercase tracking-widest self-center">
                    TOTAL
                  </span>
                  <span>{totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="text-center text-[10px] print:text-[8px] space-y-4 print:space-y-2 mt-8 print:mt-4">
                <div className="border-t border-dashed border-slate-300 pt-4 print:pt-2 print:border-black"></div>
                <textarea
                  className="w-full text-left outline-none bg-slate-50 p-4 rounded-xl italic font-bold resize-none leading-tight border-none h-20 no-print"
                  value={currentInvoice?.notes}
                  placeholder="Isi catatan..."
                  onChange={(e) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      notes: e.target.value,
                    })
                  }
                />
                <div className="hidden print:block text-left italic font-bold text-[8px] mb-4 print:mb-2 leading-tight">
                  {currentInvoice?.notes}
                </div>
                <div className="uppercase font-black tracking-[0.3em] print:tracking-widest text-slate-300 print:text-black py-2 print:py-1">
                  *** TERIMAKASIH ATAS KEPERCAYAAN ANDA ***
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
          body { background-color: white !important; padding: 0 !important; margin: 0 !important; }
          
          ${printMode === "thermal"
              ? `
          /* THERMAL 58mm (Balanced Margins) */
          .receipt-paper { 
            width: 58mm !important; 
            max-width: 58mm !important; 
            margin: 0 !important; 
            padding: 0 2.5mm 0 0.5mm !important; /* Geser ke kiri: kanan 2.5, kiri 0.5 */
            box-shadow: none !important;
            border: none !important;
            font-family: 'Courier New', monospace !important;
            box-sizing: border-box !important;
          }
          @page { margin: 0; size: 58mm auto; }
          `
              : `
          /* A5 PORTRAIT */
          .receipt-paper {
            width: 100% !important;
            max-width: 148mm !important; /* A5 Width */
            margin: 0 auto !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page { margin: 0; size: A5 portrait; }
          `
            }

          * { color: black !important; border-color: black !important; }
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      `,
        }}
      />
    </div>
  );
}
