import React, { useState, useEffect } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar as CalendarIcon, Wallet, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RiwayatSaldo() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("Semua");

	const [riwayatData, setRiwayatData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	const [saldo, setSaldo] = useState(0);

	// Data dummy berdasarkan referensi gambar image_f6fd0f.png

	const tabs = ["Semua", "Proses", "Berhasil"];

	const filteredData = riwayatData.filter((item) => (activeTab === "Semua" ? true : item.status === activeTab)).filter((item) => item.deskripsi.toLowerCase().includes(search.toLowerCase()));

	useEffect(() => {
		const fetchHistory = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/balance/history", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				// mapping ke format UI kamu
				const mapped = data.map((item) => ({
					id: item.id,
					tanggal: new Date(item.created_at).toLocaleDateString("id-ID", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					}),
					jam: new Date(item.created_at).toLocaleTimeString("id-ID", {
						hour: "2-digit",
						minute: "2-digit",
					}),
					deskripsi: item.description || "Transaksi",
					jumlah: item.amount,
					status: "Berhasil", // sementara semua berhasil
					type: item.type === "credit" ? "in" : "out",
				}));

				setRiwayatData(mapped);
			} catch (err) {
				console.error("Gagal ambil riwayat saldo:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchHistory();
	}, []);

	useEffect(() => {
		const fetchBalance = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/balance", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				setSaldo(data.balance || 0);
			} catch (err) {
				console.error("Gagal ambil saldo:", err);
			}
		};

		fetchBalance();
	}, []);

	return (
		<MitraLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-6">
				{/* HEADER NAVIGATION */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
					<div className="flex items-center gap-4">
						<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95">
							<ChevronLeft size={24} className="text-indigo-900" />
						</button>
						<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Riwayat Saldo</h1>
					</div>

					<button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-95">
						<Download size={18} />
						Laporan PDF
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:h-[82vh]">
					{/* SISI KIRI: Filter & Statistik (Desktop: 4 Kolom) */}
					<div className="lg:col-span-4 space-y-6 sticky top-6">
						{/* Summary Card */}
						<div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
							<div className="relative z-10">
								<p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Saldo Tersisa</p>
								<h2 className="text-3xl font-black tracking-tighter mb-6">Rp {saldo.toLocaleString("id-ID")}</h2>
								<div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10">
									<CalendarIcon size={12} className="text-indigo-300" />
									Oktober 2024
								</div>
							</div>
							<Wallet size={140} className="absolute -right-8 -bottom-8 text-white opacity-5 transform -rotate-12 group-hover:scale-110 transition-transform duration-700" />
						</div>

						{/* Search & Tabs Filter */}
						<div className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm space-y-6">
							<div className="relative group">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
								<input
									type="text"
									placeholder="Cari transaksi..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Status Transaksi</p>
								<div className="flex flex-wrap gap-2">
									{tabs.map((tab) => (
										<button
											key={tab}
											onClick={() => setActiveTab(tab)}
											className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-indigo-900 text-white shadow-md" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
										>
											{tab}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* SISI KANAN: List Transaksi */}
					<div className="lg:col-span-8 min-h-0">
						<div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
							{loading ? (
								<div className="py-20 text-center">
									<p className="text-gray-400">Loading...</p>
								</div>
							) : filteredData.length > 0 ? (
								filteredData.map((item) => (
									<div key={item.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50 flex items-center justify-between group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
										<div className="flex items-center gap-4 flex-1 min-w-0">
											<div className={`p-3 rounded-2xl shrink-0 ${item.type === "in" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>{item.type === "in" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="text-sm font-black text-gray-800 truncate">{item.deskripsi}</h4>
													<span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.status === "Berhasil" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>{item.status}</span>
												</div>
												<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
													{item.tanggal} • {item.jam}
												</p>
											</div>
										</div>

										<div className="text-right ml-4">
											<p className={`text-lg font-black tracking-tighter ${item.type === "in" ? "text-emerald-500" : "text-gray-800"}`}>
												{item.type === "in" ? "+" : "-"}Rp {item.jumlah.toLocaleString("id-ID")}
											</p>
											<p className="text-[9px] font-black text-gray-300 uppercase">ID: TXN-00{item.id}</p>
										</div>
									</div>
								))
							) : (
								<div className="py-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
									<p className="text-gray-400 font-medium italic">Tidak ada catatan penarikan...</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</MitraLayout>
	);
}
