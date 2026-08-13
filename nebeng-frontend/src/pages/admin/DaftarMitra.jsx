import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, Lock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function DaftarMitra() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [mitraData, setMitraData] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// ================= FETCH =================
	const fetchMitra = async () => {
		try {
			const res = await fetch("http://127.0.0.1:8000/api/admin/mitra", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await res.json();
			setMitraData(data);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchMitra();
	}, []);

	// ================= SEARCH =================
	const filteredMitra = useMemo(() => {
		return mitraData.filter((m) => {
			const keyword = searchTerm.toLowerCase();

			return m.name?.toLowerCase().includes(keyword) || m.email?.toLowerCase().includes(keyword) || m.phone?.toLowerCase().includes(keyword);
		});
	}, [mitraData, searchTerm]);

	// ================= PAGINATION =================
	const totalPages = Math.ceil(filteredMitra.length / rowsPerPage);

	const paginatedMitra = useMemo(() => {
		const start = (currentPage - 1) * rowsPerPage;
		return filteredMitra.slice(start, start + rowsPerPage);
	}, [filteredMitra, currentPage, rowsPerPage]);

	const goToPage = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	// ================= STATUS STYLE =================
	const getStatusStyle = (status) => {
		switch (status) {
			case "rejected":
				return "bg-red-600";
			case "pending":
				return "bg-orange-400";
			case "verified":
				return "bg-emerald-500";
			default:
				return "bg-gray-500";
		}
	};

	// ================= STATUS LABEL =================
	const getStatusLabel = (status) => {
		switch (status) {
			case "rejected":
				return "rejected";
			case "pending":
				return "pending";
			case "verified":
				return "verified";
			default:
				return status;
		}
	};

	// ================= BLOCK MITRA =================
	const handleReject = async (id) => {
		const confirmBlock = window.confirm("Yakin ingin memblokir mitra ini?");
		if (!confirmBlock) return;

		try {
			const res = await fetch(`http://127.0.0.1:8000/api/admin/user/${id}/block`, {
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

			alert("Mitra berhasil diblokir");

			// refresh data tabel
			fetchMitra();
		} catch (err) {
			console.error(err);
			alert(err.message);
		}
	};

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Daftar Mitra</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Search & Actions */}
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
								<th className="px-4 py-4 rounded-l-lg text-center">No. ID</th>
								<th className="px-4 py-4">Nama</th>
								<th className="px-4 py-4">Email</th>
								<th className="px-4 py-4 text-center">No. Tlp</th>
								<th className="px-4 py-4 text-center">Layanan</th>
								<th className="px-4 py-4 text-center">Status</th>
								<th className="px-4 py-4 rounded-r-lg text-center">Aksi</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-100">
							{paginatedMitra.map((mitra) => (
								<tr key={mitra.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-5 text-sm text-gray-600 text-center font-medium">{mitra.id}</td>

									<td className="px-4 py-5 text-sm text-gray-700 font-medium">{mitra.name}</td>

									<td className="px-4 py-5 text-sm text-gray-500">{mitra.email}</td>

									<td className="px-4 py-5 text-sm text-gray-500 text-center">{mitra.phone}</td>

									<td className="px-4 py-5 text-sm text-gray-500 text-center">-</td>

									<td className="px-4 py-5 text-center">
										<span className={`${getStatusStyle(mitra.status)} text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block min-w-[100px]`}>{getStatusLabel(mitra.status)}</span>
									</td>

									<td className="px-4 py-5 text-center">
										<div className="flex justify-center gap-2">
											<button onClick={() => navigate(`/admin/detail-mitra/${mitra.id}`)} className="p-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 transition-colors inline-flex items-center justify-center">
												<Eye className="w-4 h-4" />
											</button>
											<button onClick={() => handleReject(mitra.id)} className="p-2 bg-red-500 text-white rounded">
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
							{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredMitra.length)} of {filteredMitra.length} entries
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
