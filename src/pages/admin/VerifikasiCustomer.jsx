import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, Lock, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifikasiCustomer() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [customerData, setCustomerData] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");

	// ================= FETCH =================
	const fetchCustomer = async () => {
		try {
			const res = await fetch("http://127.0.0.1:8000/api/admin/customer/pending", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await res.json();
			setCustomerData(data);
		} catch (err) {
			console.error("Error fetch customer:", err);
		}
	};

	useEffect(() => {
		fetchCustomer();
	}, []);

	// ================= SEARCH =================
	const filteredCustomer = useMemo(() => {
		return customerData.filter((c) => {
			const keyword = searchTerm.toLowerCase();

			return c.name?.toLowerCase().includes(keyword) || c.email?.toLowerCase().includes(keyword) || c.phone?.toLowerCase().includes(keyword);
		});
	}, [customerData, searchTerm]);

	// ================= ACTION =================
	const handleReject = async (id) => {
		const confirmBlock = window.confirm("Yakin ingin memblokir customer ini?");
		if (!confirmBlock) return;

		try {
			await fetch(`http://127.0.0.1:8000/api/admin/customer/${id}/reject`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			fetchCustomer();
		} catch (err) {
			console.error("Gagal blokir:", err);
		}
	};

	const handleDetail = (id) => {
		navigate(`/admin/detail-customer/${id}`);
	};

	// ================= STATUS BADGE =================
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
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Verifikasi Customer</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Toolbar */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg" />
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto ml-auto">
						<button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">
							<Calendar className="mr-2 w-4 h-4 text-gray-400" /> Kalender
						</button>
						<button className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">
							Download <Download className="ml-2 w-4 h-4" />
						</button>
					</div>
				</div>

				{/* TABLE */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[11px] font-bold uppercase">
								<th className="px-4 py-4 text-center w-16">NO. ID</th>
								<th className="px-4 py-4">NAMA CUSTOMER</th>
								<th className="px-4 py-4">EMAIL</th>
								<th className="px-4 py-4">NO. TLP</th>
								<th className="px-4 py-4">ROLE</th>
								<th className="px-4 py-4 text-center">STATUS</th>
								<th className="px-4 py-4 text-center">AKSI</th>
							</tr>
						</thead>

						<tbody className="divide-y">
							{filteredCustomer.map((c, i) => (
								<tr key={c.id}>
									<td className="px-4 py-5 text-center">{i + 1}</td>
									<td className="px-4 py-5">{c.name}</td>
									<td className="px-4 py-5">{c.email}</td>
									<td className="px-4 py-5">{c.phone}</td>
									<td className="px-4 py-5">{c.role}</td>
									<td className="px-4 py-5 text-center">
										<span className={`${getStatusBadge(c.status)} text-white text-xs px-3 py-1 rounded-full`}>{c.status}</span>
									</td>
									<td className="px-4 py-5 text-center">
										<div className="flex justify-center gap-2">
											<button onClick={() => handleDetail(c.id)} className="p-2 bg-indigo-900 text-white rounded">
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

				{/* Footer */}
				<div className="mt-6 text-xs text-gray-400">{filteredCustomer.length} data</div>
			</div>
		</AdminLayout>
	);
}
