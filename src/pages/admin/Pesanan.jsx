import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Pesanan() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [orders, setOrders] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// ================= FETCH DATA =================
	const fetchOrders = async () => {
		try {
			const res = await fetch("http://127.0.0.1:8000/api/admin/orders", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await res.json();
			setOrders(data);
		} catch (err) {
			console.error("Error fetch orders:", err);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	// ================= SEARCH =================
	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			const keyword = searchTerm.toLowerCase();

			return order.customer?.name?.toLowerCase().includes(keyword) || order.trip?.mitra?.name?.toLowerCase().includes(keyword);
		});
	}, [orders, searchTerm]);

	// ================= PAGINATION =================
	const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

	const paginatedOrders = useMemo(() => {
		const start = (currentPage - 1) * rowsPerPage;
		return filteredOrders.slice(start, start + rowsPerPage);
	}, [filteredOrders, currentPage, rowsPerPage]);

	const goToPage = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	// ================= FORMAT =================
	const formatHarga = (harga) => {
		return "Rp. " + Number(harga).toLocaleString("id-ID") + ",00";
	};

	const formatTanggal = (date) => {
		return new Date(date).toLocaleDateString("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	// ================= STATUS STYLE =================
	const getStatusStyle = (status) => {
		switch (status) {
			case "pending":
				return "bg-amber-400";
			case "completed":
				return "bg-emerald-500";
			case "cancelled":
				return "bg-red-600";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Daftar Pesanan</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Header Actions */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
						/>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto">
						<button className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 min-w-[120px]">
							Status <ChevronDown className="ml-2 w-4 h-4 text-gray-400" />
						</button>
						<button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
							<Calendar className="mr-2 w-4 h-4 text-gray-400" /> Kalender
						</button>
						<button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
							Download <Download className="ml-2 w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
								<th className="px-4 py-4 rounded-l-lg text-center">No. Order</th>
								<th className="px-4 py-4">Nama Costumer</th>
								<th className="px-4 py-4">Nama Driver</th>
								<th className="px-4 py-4">Tanggal</th>
								<th className="px-4 py-4">Layanan</th>
								<th className="px-4 py-4">Harga</th>
								<th className="px-4 py-4 text-center">Status</th>
								<th className="px-4 py-4 rounded-r-lg text-center">Aksi</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-100">
							{paginatedOrders.map((order) => (
								<tr key={order.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-5 text-sm text-gray-600 text-center font-medium">{order.id}</td>

									<td className="px-4 py-5 text-sm text-gray-700 font-medium">{order.customer?.name || "-"}</td>

									<td className="px-4 py-5 text-sm text-gray-500">{order.trip?.mitra?.name || "-"}</td>

									<td className="px-4 py-5 text-sm text-gray-500">{formatTanggal(order.created_at)}</td>

									<td className="px-4 py-5 text-sm text-gray-500">Nebeng {order.trip?.vehicle_type || "-"}</td>

									<td className="px-4 py-5 text-sm text-gray-500">{formatHarga(order.price)}</td>

									<td className="px-4 py-5 text-center">
										<span className={`${getStatusStyle(order.status)} text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block min-w-[85px]`}>{order.status}</span>
									</td>

									<td className="px-4 py-5 text-center">
										<button onClick={() => navigate(`/admin/detail-orders/${order.trip?.id}`)} className="p-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 transition-colors inline-flex items-center justify-center">
											<Eye className="w-4 h-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
					<div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
						<select
							value={rowsPerPage}
							onChange={(e) => {
								setRowsPerPage(Number(e.target.value));
								setCurrentPage(1);
							}}
							className="border border-gray-200 rounded-md px-2 py-1 bg-gray-50 text-xs"
						>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={20}>20</option>
						</select>

						<span>
							{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
						</span>
					</div>

					<div className="flex items-center gap-1">
						<button onClick={() => goToPage(currentPage - 1)} className="p-2 text-gray-400 hover:text-gray-600">
							<ChevronLeft className="w-5 h-5" />
						</button>

						{Array.from({ length: totalPages }, (_, i) => i + 1)
							.slice(0, 5)
							.map((page) => (
								<button
									key={page}
									onClick={() => goToPage(page)}
									className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium
									${currentPage === page ? "bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold" : "text-gray-400 hover:bg-gray-50"}`}
								>
									{page}
								</button>
							))}

						<button onClick={() => goToPage(currentPage + 1)} className="p-2 text-gray-400 hover:text-gray-600">
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
