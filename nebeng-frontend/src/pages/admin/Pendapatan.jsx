import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, TrendingUp, ChevronLeft, ChevronRight, Wallet } from "lucide-react";

export default function Pendapatan() {
	const [transactions, setTransactions] = useState([]);
	const [totalPendapatan, setTotalPendapatan] = useState(0);
	const [loading, setLoading] = useState(true);

	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [search, setSearch] = useState("");

	const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

	const fetchPendapatan = async (page = 1) => {
		setLoading(true);

		try {
			const token = localStorage.getItem("token");

			const params = new URLSearchParams({ page });
			if (from) params.set("from", from);
			if (to) params.set("to", to);

			const res = await fetch(`http://127.0.0.1:8000/api/admin/pendapatan?${params.toString()}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			if (res.ok) {
				const data = await res.json();

				setTransactions(data.transactions?.data || []);
				setTotalPendapatan(data.total_pendapatan || 0);
				setPagination({
					current_page: data.transactions?.current_page || 1,
					last_page: data.transactions?.last_page || 1,
					total: data.transactions?.total || 0,
				});
			}
		} catch (err) {
			console.error("Gagal ambil data pendapatan:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPendapatan(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [from, to]);

	const filteredTransactions = transactions.filter((t) => t.user?.name?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

	const formatRupiah = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Pendapatan</h1>

			{/* CARD TOTAL */}
			<div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-8 text-white shadow-xl mb-6 relative overflow-hidden">
				<div className="relative z-10">
					<p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Total Pendapatan {from || to ? "(Sesuai Filter)" : "Keseluruhan"}</p>
					<h2 className="text-4xl font-black tracking-tight">{formatRupiah(totalPendapatan)}</h2>
					<p className="text-indigo-300 text-xs mt-3">Dari {pagination.total} transaksi tercatat. Angka ini bersifat informasi/pencatatan - pembayaran QRIS masuk langsung ke rekening/e-wallet mitra masing-masing, bukan ditahan platform.</p>
				</div>
				<Wallet size={140} className="absolute -right-6 -bottom-6 text-white opacity-5 transform -rotate-12" />
			</div>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* FILTER */}
				<div className="flex flex-wrap items-end gap-4 mb-6">
					<div className="relative flex-1 min-w-[200px]">
						<label className="text-xs font-bold text-gray-400 uppercase block mb-1.5">Cari mitra / deskripsi</label>
						<Search className="absolute left-3 top-[42px] text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Cari..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
						/>
					</div>

					<div>
						<label className="text-xs font-bold text-gray-400 uppercase block mb-1.5">Dari Tanggal</label>
						<div className="relative">
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
						</div>
					</div>

					<div>
						<label className="text-xs font-bold text-gray-400 uppercase block mb-1.5">Sampai Tanggal</label>
						<div className="relative">
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
						</div>
					</div>

					{(from || to) && (
						<button
							onClick={() => {
								setFrom("");
								setTo("");
							}}
							className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
						>
							Reset Filter
						</button>
					)}
				</div>

				{/* TABLE */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
								<th className="px-4 py-4 rounded-l-lg">Tanggal</th>
								<th className="px-4 py-4">Mitra</th>
								<th className="px-4 py-4">Deskripsi</th>
								<th className="px-4 py-4 text-center">Order</th>
								<th className="px-4 py-4 rounded-r-lg text-right">Jumlah</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">
										Memuat data...
									</td>
								</tr>
							) : filteredTransactions.length > 0 ? (
								filteredTransactions.map((t) => (
									<tr key={t.id} className="hover:bg-gray-50 transition-colors">
										<td className="px-4 py-4 text-sm text-gray-500">
											{new Date(t.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
											<span className="block text-[10px] text-gray-400">{new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
										</td>
										<td className="px-4 py-4 text-sm font-medium text-gray-700">{t.user?.name || "-"}</td>
										<td className="px-4 py-4 text-sm text-gray-500">{t.description}</td>
										<td className="px-4 py-4 text-sm text-gray-500 text-center">{t.order_id ? `#${t.order_id}` : "-"}</td>
										<td className="px-4 py-4 text-sm font-black text-emerald-600 text-right">+{formatRupiah(t.amount)}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">
										Belum ada data pendapatan{from || to ? " pada rentang tanggal ini" : ""}.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
					<div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
						<span>of {pagination.total} entries</span>
					</div>

					<div className="flex items-center gap-1">
						<button onClick={() => pagination.current_page > 1 && fetchPendapatan(pagination.current_page - 1)} disabled={pagination.current_page <= 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
							<ChevronLeft className="w-5 h-5" />
						</button>
						<span className="w-8 h-8 flex items-center justify-center rounded bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{pagination.current_page}</span>
						<span className="text-gray-400 text-xs px-1">/ {pagination.last_page}</span>
						<button
							onClick={() => pagination.current_page < pagination.last_page && fetchPendapatan(pagination.current_page + 1)}
							disabled={pagination.current_page >= pagination.last_page}
							className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}