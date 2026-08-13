import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, Lock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function DaftarCustomer() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [customers, setCustomers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");

	// pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage] = useState(10);

	// ================= FETCH =================
	const fetchCustomers = async () => {
		try {
			const res = await fetch("http://127.0.0.1:8000/api/admin/customers", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			const data = await res.json();
			setCustomers(data);
		} catch (err) {
			console.error("Error fetch customers:", err);
		}
	};

	useEffect(() => {
		fetchCustomers();
	}, []);

	// ================= SEARCH =================
	const filteredCustomers = useMemo(() => {
		return customers.filter((c) => {
			const keyword = searchTerm.toLowerCase();

			return c.name?.toLowerCase().includes(keyword) || c.email?.toLowerCase().includes(keyword) || c.phone?.toLowerCase().includes(keyword);
		});
	}, [customers, searchTerm]);

	// ================= PAGINATION =================
	const totalPages = Math.ceil(filteredCustomers.length / perPage);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * perPage;
		return filteredCustomers.slice(start, start + perPage);
	}, [filteredCustomers, currentPage]);

	// ================= STATUS COLOR =================
	const getStatusColor = (status) => {
		switch (status) {
			case "pending":
				return "bg-orange-500";

			case "verified":
				return "bg-emerald-500";

			case "rejected":
				return "bg-red-600";

			case "blocked":
				return "bg-gray-900";

			default:
				return "bg-gray-500";
		}
	};

	const handleReject = async (id) => {
		const confirmBlock = window.confirm("Yakin ingin memblokir customer ini?");

		if (!confirmBlock) return;

		try {
			const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}/block`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
					Accept: "application/json",
				},
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Gagal memblokir user");
			}

			alert("Customer berhasil diblokir");

			// refresh table
			fetchCustomers();
		} catch (err) {
			console.error(err);

			alert(err.message || "Terjadi kesalahan");
		}
	};

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Daftar Costumer</h1>

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
							<Calendar className="mr-2 w-4 h-4" /> Kalender
						</button>
						<button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
							Download <Download className="ml-2 w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
								<th className="px-4 py-4 rounded-l-lg text-center">No</th>
								<th className="px-4 py-4">Nama</th>
								<th className="px-4 py-4">Email</th>
								<th className="px-4 py-4">No. Tlp</th>
								<th className="px-4 py-4 text-center">Status</th>
								<th className="px-4 py-4 rounded-r-lg text-center">Aksi</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-100">
							{paginatedData.map((c, i) => (
								<tr key={c.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-4 text-sm text-gray-500 text-center">{(currentPage - 1) * perPage + i + 1}</td>

									<td className="px-4 py-4 text-sm font-medium text-gray-700">{c.name}</td>
									<td className="px-4 py-4 text-sm text-gray-500">{c.email}</td>
									<td className="px-4 py-4 text-sm text-gray-500">{c.phone}</td>

									<td className="px-4 py-4 text-center">
										<span className={`${getStatusColor(c.status)} text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block min-w-[100px]`}>{c.status}</span>
									</td>

									<td className="px-4 py-4 text-center">
										<div className="flex justify-center gap-2">
											<button onClick={() => navigate(`/admin/detail-customer/${c.id}`)} className="p-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 transition-colors inline-flex items-center justify-center">
												<Eye className="w-4 h-4" />
											</button>

											<button onClick={() => handleReject(c.id)} className="p-2 bg-red-500 text-white rounded">
												<Lock className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
					<div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
						<div className="relative border border-gray-200 rounded-md px-2 py-1 flex items-center gap-1 bg-gray-50 cursor-pointer">
							{perPage} <ChevronDown className="w-3 h-3 text-gray-400" />
						</div>
						<span>{filteredCustomers.length} entries</span>
					</div>

					<div className="flex items-center gap-1">
						<button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
							<ChevronLeft className="w-5 h-5" />
						</button>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								onClick={() => setCurrentPage(page)}
								className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${page === currentPage ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "text-gray-400 hover:bg-gray-50"}`}
							>
								{page}
							</button>
						))}

						<button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
