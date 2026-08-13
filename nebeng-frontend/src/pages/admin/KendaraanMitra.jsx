import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, ChevronLeft, ChevronRight, Check, X, Clock3, CheckCircle2, XCircle } from "lucide-react";

const statusTabs = [
	{ id: "", label: "Semua" },
	{ id: "pending", label: "Menunggu" },
	{ id: "approved", label: "Disetujui" },
	{ id: "rejected", label: "Ditolak" },
];

const statusBadge = {
	pending: { label: "Menunggu", className: "bg-amber-50 text-amber-600", icon: Clock3 },
	approved: { label: "Disetujui", className: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
	rejected: { label: "Ditolak", className: "bg-red-50 text-red-600", icon: XCircle },
};

export default function KendaraanMitra() {
	const [vehicles, setVehicles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

	const [detailVehicle, setDetailVehicle] = useState(null);
	const [rejectingVehicle, setRejectingVehicle] = useState(null);
	const [rejectNotes, setRejectNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [processingId, setProcessingId] = useState(null);

	const fetchVehicles = async (page = 1, q = "", status = statusFilter) => {
		setLoading(true);

		try {
			const token = localStorage.getItem("token");

			const params = new URLSearchParams({ page });
			if (q) params.set("search", q);
			if (status) params.set("status", status);

			const res = await fetch(`http://127.0.0.1:8000/api/admin/kendaraan-mitra?${params.toString()}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			if (res.ok) {
				const data = await res.json();

				setVehicles(data.data || []);
				setPagination({
					current_page: data.current_page || 1,
					last_page: data.last_page || 1,
					total: data.total || 0,
				});
			}
		} catch (err) {
			console.error("Gagal ambil data kendaraan mitra:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchVehicles(1, search, statusFilter);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [statusFilter]);

	// debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			fetchVehicles(1, search, statusFilter);
		}, 400);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	const handleApprove = async (id) => {
		setProcessingId(id);

		try {
			const token = localStorage.getItem("token");

			const res = await fetch(`http://127.0.0.1:8000/api/admin/kendaraan-mitra/${id}/approve`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			if (res.ok) {
				fetchVehicles(pagination.current_page, search, statusFilter);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setProcessingId(null);
		}
	};

	const handleReject = async () => {
		if (!rejectingVehicle) return;

		setSaving(true);

		try {
			const token = localStorage.getItem("token");

			const res = await fetch(`http://127.0.0.1:8000/api/admin/kendaraan-mitra/${rejectingVehicle.id}/reject`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({ notes: rejectNotes }),
			});

			if (res.ok) {
				setRejectingVehicle(null);
				setRejectNotes("");
				fetchVehicles(pagination.current_page, search, statusFilter);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Kendaraan Mitra</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Search & Actions */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
						/>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto ml-auto">
						<button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium bg-white hover:bg-gray-50 transition-colors">
							<Calendar className="mr-2 w-4 h-4 text-gray-400" /> Kalender
						</button>
						<button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
							Download <Download className="ml-2 w-4 h-4" />
						</button>
					</div>
				</div>

				{/* FILTER STATUS */}
				<div className="flex flex-wrap gap-2 mb-6">
					{statusTabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setStatusFilter(tab.id)}
							className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${statusFilter === tab.id ? "bg-indigo-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
								<th className="px-4 py-4 rounded-l-lg">Image</th>
								<th className="px-4 py-4">Nama</th>
								<th className="px-4 py-4 text-center">Kendaraan</th>
								<th className="px-4 py-4">Merk Kendaraan</th>
								<th className="px-4 py-4">Plat Nomor</th>
								<th className="px-4 py-4">Warna</th>
								<th className="px-4 py-4 text-center">Kapasitas</th>
								<th className="px-4 py-4 text-center">Status</th>
								<th className="px-4 py-4 rounded-r-lg text-center">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr>
									<td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">
										Memuat data...
									</td>
								</tr>
							) : vehicles.length > 0 ? (
								vehicles.map((v) => {
									const badge = statusBadge[v.status] || statusBadge.pending;
									const BadgeIcon = badge.icon;

									return (
										<tr key={v.id} className="hover:bg-gray-50 transition-colors">
											<td className="px-4 py-4">
												<div className="w-16 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-100">
													{v.user?.avatar ? (
														<img src={`http://127.0.0.1:8000/storage/${v.user.avatar}`} alt={v.user?.name} className="w-full h-full object-cover" />
													) : (
														<span className="text-[9px] text-gray-400 font-bold uppercase">{v.type}</span>
													)}
												</div>
											</td>
											<td className="px-4 py-4 text-sm font-medium text-gray-700">{v.user?.name || "-"}</td>
											<td className="px-4 py-4 text-sm text-gray-500 text-center capitalize">{v.type}</td>
											<td className="px-4 py-4 text-sm text-gray-500">
												{v.brand} {v.model}
											</td>
											<td className="px-4 py-4 text-sm text-gray-500 font-mono">{v.plate_number}</td>
											<td className="px-4 py-4 text-sm text-gray-500">{v.color || "-"}</td>
											<td className="px-4 py-4 text-sm text-gray-500 text-center">{v.seat_capacity ? `${v.seat_capacity} orang` : "-"}</td>
											<td className="px-4 py-4 text-center">
												<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${badge.className}`}>
													<BadgeIcon className="w-3 h-3" /> {badge.label}
												</span>
											</td>
											<td className="px-4 py-4 text-center">
												<div className="flex items-center justify-center gap-2 flex-wrap">
													{v.status === "pending" && (
														<>
															<button
																onClick={() => handleApprove(v.id)}
																disabled={processingId === v.id}
																className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
																title="Setujui"
															>
																<Check className="w-4 h-4" />
															</button>
															<button
																onClick={() => setRejectingVehicle(v)}
																disabled={processingId === v.id}
																className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
																title="Tolak"
															>
																<X className="w-4 h-4" />
															</button>
														</>
													)}
													<button onClick={() => setDetailVehicle(v)} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors shadow-sm">
														<Eye className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">
										Belum ada data kendaraan mitra
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
						<button
							onClick={() => pagination.current_page > 1 && fetchVehicles(pagination.current_page - 1, search, statusFilter)}
							disabled={pagination.current_page <= 1}
							className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<span className="w-8 h-8 flex items-center justify-center rounded bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{pagination.current_page}</span>
						<span className="text-gray-400 text-xs px-1">/ {pagination.last_page}</span>
						<button
							onClick={() => pagination.current_page < pagination.last_page && fetchVehicles(pagination.current_page + 1, search, statusFilter)}
							disabled={pagination.current_page >= pagination.last_page}
							className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			{/* MODAL DETAIL */}
			{detailVehicle && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
						<h3 className="text-lg font-bold text-gray-800 mb-4">Detail Kendaraan</h3>
						<div className="space-y-2 text-sm">
							<p>
								<span className="text-gray-400">Nama Mitra:</span> <span className="font-semibold text-gray-700">{detailVehicle.user?.name}</span>
							</p>
							<p>
								<span className="text-gray-400">Jenis:</span> <span className="font-semibold text-gray-700 capitalize">{detailVehicle.type}</span>
							</p>
							<p>
								<span className="text-gray-400">Merk / Model:</span>{" "}
								<span className="font-semibold text-gray-700">
									{detailVehicle.brand} {detailVehicle.model}
								</span>
							</p>
							<p>
								<span className="text-gray-400">Plat Nomor:</span> <span className="font-semibold text-gray-700 font-mono">{detailVehicle.plate_number}</span>
							</p>
							<p>
								<span className="text-gray-400">Warna:</span> <span className="font-semibold text-gray-700">{detailVehicle.color || "-"}</span>
							</p>
							{detailVehicle.type === "mobil" && (
								<p>
									<span className="text-gray-400">Kapasitas Maks:</span> <span className="font-semibold text-gray-700">{detailVehicle.seat_capacity || "-"} orang</span>
								</p>
							)}
							<p>
								<span className="text-gray-400">Status:</span> <span className="font-semibold text-gray-700 capitalize">{statusBadge[detailVehicle.status]?.label || detailVehicle.status}</span>
							</p>
							{detailVehicle.status === "rejected" && detailVehicle.notes && (
								<p>
									<span className="text-gray-400">Alasan Ditolak:</span> <span className="font-semibold text-gray-700">{detailVehicle.notes}</span>
								</p>
							)}
						</div>
						<button onClick={() => setDetailVehicle(null)} className="mt-6 w-full py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 transition-colors">
							Tutup
						</button>
					</div>
				</div>
			)}

			{/* MODAL TOLAK */}
			{rejectingVehicle && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
						<h3 className="text-lg font-bold text-gray-800 mb-2">Tolak Kendaraan</h3>
						<p className="text-sm text-gray-500 mb-4">
							{rejectingVehicle.brand} {rejectingVehicle.model} - {rejectingVehicle.plate_number} milik {rejectingVehicle.user?.name}
						</p>

						<label className="text-xs font-bold text-gray-400 uppercase">Alasan Penolakan (opsional)</label>
						<textarea
							value={rejectNotes}
							onChange={(e) => setRejectNotes(e.target.value)}
							rows={3}
							placeholder="Mis. foto STNK buram, plat nomor tidak sesuai, dll."
							className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
						/>

						<div className="flex gap-3 mt-6">
							<button
								onClick={() => {
									setRejectingVehicle(null);
									setRejectNotes("");
								}}
								className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 transition-colors"
							>
								Batal
							</button>
							<button onClick={handleReject} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 font-semibold text-white transition-colors disabled:opacity-50">
								{saving ? "Memproses..." : "Tolak Kendaraan"}
							</button>
						</div>
					</div>
				</div>
			)}
		</AdminLayout>
	);
}