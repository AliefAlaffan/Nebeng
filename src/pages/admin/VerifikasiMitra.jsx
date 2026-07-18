import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, Lock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifikasiMitra() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [mitraData, setMitraData] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");

	// ================= FETCH DATA =================
	const fetchMitra = async () => {
		try {
			const res = await fetch("http://127.0.0.1:8000/api/admin/mitra/pending", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await res.json();
			setMitraData(data);
		} catch (err) {
			console.error("Error fetch mitra:", err);
		}
	};

	useEffect(() => {
		fetchMitra();
	}, []);

	// ================= SEARCH FILTER =================
	const filteredMitra = useMemo(() => {
		return mitraData.filter((m) => {
			const keyword = searchTerm.toLowerCase();

			return m.name?.toLowerCase().includes(keyword) || m.email?.toLowerCase().includes(keyword) || m.phone?.toLowerCase().includes(keyword);
		});
	}, [mitraData, searchTerm]);

	// ================= ACTION =================

	const handleReject = async (id) => {
		const confirmBlock = window.confirm("Yakin ingin memblokir mitra ini?");
		if (!confirmBlock) return;

		try {
			await fetch(`http://127.0.0.1:8000/api/admin/mitra/${id}/reject`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			fetchMitra();
		} catch (err) {
			console.error("Gagal blokir:", err);
		}
	};

	const handleDetail = (id) => {
		navigate(`/admin/detail-mitra/${id}`);
	};

	// ================= STATUS UI =================
	const getStatusBadge = (status) => {
		switch (status) {
			case "pending":
				return "bg-orange-400";
			case "verified":
				return "bg-green-500";
			case "rejected":
				return "bg-red-500";
			default:
				return "bg-gray-400";
		}
	};

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Data Mitra</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Toolbar */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
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

				{/* TABLE */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
								<th className="px-4 py-4 text-center w-24">NO. ID</th>
								<th className="px-4 py-4">NAMA</th>
								<th className="px-4 py-4">EMAIL</th>
								<th className="px-4 py-4 text-center">NO. TLP</th>
								<th className="px-4 py-4 text-center">ROLE</th>
								<th className="px-4 py-4 text-center">STATUS</th>
								<th className="px-4 py-4 text-center">AKSI</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-100">
							{filteredMitra.map((mitra, i) => (
								<tr key={mitra.id} className="hover:bg-gray-50">
									<td className="px-4 py-5 text-center">{mitra.id}</td>
									<td className="px-4 py-5">{mitra.name}</td>
									<td className="px-4 py-5">{mitra.email}</td>
									<td className="px-4 py-5 text-center">{mitra.phone}</td>
									<td className="px-4 py-5 text-center">{mitra.role}</td>
									<td className="px-4 py-5 text-center">
										<span className={`${getStatusBadge(mitra.status)} text-white text-[10px] px-4 py-1 rounded-full`}>{mitra.status}</span>
									</td>
									<td className="px-4 py-5 text-center">
										<div className="flex justify-center gap-2">
											<button onClick={() => handleDetail(mitra.id)} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800">
												<Eye className="w-4 h-4" />
											</button>

											<button onClick={() => handleReject(mitra.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600">
												<Lock className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* PAGINATION (dummy, nanti backend) */}
				<div className="flex justify-between mt-6 text-xs text-gray-400">
					<span>{filteredMitra.length} data</span>
				</div>
			</div>
		</AdminLayout>
	);
}
