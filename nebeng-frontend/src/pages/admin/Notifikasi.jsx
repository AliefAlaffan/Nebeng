import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/dashboard/AdminLayout";
import { ChevronLeft, Bell, UserCheck, ShieldCheck, ShoppingBag, Loader2 } from "lucide-react";

export default function Notifikasi() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [notifications, setNotifications] = useState([]);

	// Notifikasi admin dirangkai dari data yang butuh perhatian admin:
	// pengajuan verifikasi mitra & customer yang masih pending.
	useEffect(() => {
		const fetchNotifications = async () => {
			try {
				const token = localStorage.getItem("token");
				const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

				const [mitraRes, customerRes] = await Promise.all([
					fetch("http://127.0.0.1:8000/api/admin/mitra?status=pending", { headers }).catch(() => null),
					fetch("http://127.0.0.1:8000/api/admin/customers?status=pending", { headers }).catch(() => null),
				]);

				const items = [];

				if (mitraRes?.ok) {
					const data = await mitraRes.json();
					const list = Array.isArray(data) ? data : data.data || [];
					list.forEach((m) => {
						items.push({
							id: `mitra-${m.id}`,
							icon: UserCheck,
							color: "text-indigo-600",
							bg: "bg-indigo-50",
							title: "Verifikasi Mitra Baru",
							description: `${m.name || "Mitra"} mengajukan verifikasi akun.`,
							path: `/admin/detail-mitra/${m.id}`,
						});
					});
				}

				if (customerRes?.ok) {
					const data = await customerRes.json();
					const list = Array.isArray(data) ? data : data.data || [];
					list.forEach((c) => {
						items.push({
							id: `customer-${c.id}`,
							icon: ShieldCheck,
							color: "text-sky-600",
							bg: "bg-sky-50",
							title: "Verifikasi Customer Baru",
							description: `${c.name || "Customer"} mengajukan verifikasi akun.`,
							path: `/admin/detail-customer/${c.id}`,
						});
					});
				}

				setNotifications(items);
			} catch (err) {
				console.error("Fetch notifikasi admin error:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchNotifications();
	}, []);

	return (
		<AdminLayout>
			<div className="w-full max-w-3xl mx-auto px-4 py-6">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
						<ChevronLeft className="w-6 h-6 text-indigo-900" />
					</button>
					<div>
						<h1 className="text-2xl font-black text-indigo-900">Notifikasi</h1>
						<p className="text-sm text-gray-400">Hal-hal yang perlu perhatian kamu</p>
					</div>
				</div>

				<div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
					{loading ? (
						<div className="flex items-center justify-center py-16 text-gray-400 gap-2">
							<Loader2 className="animate-spin" size={20} /> Memuat notifikasi...
						</div>
					) : notifications.length > 0 ? (
						<div className="space-y-3">
							{notifications.map((item) => (
								<button key={item.id} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-100">
									<div className={`p-3 ${item.bg} ${item.color} rounded-2xl shadow-sm shrink-0`}>
										<item.icon size={20} />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-bold text-gray-800">{item.title}</p>
										<p className="text-xs text-gray-400 truncate">{item.description}</p>
									</div>
								</button>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-16 text-gray-300">
							<Bell size={40} className="mb-2" />
							<p className="text-sm font-bold">Belum ada notifikasi</p>
						</div>
					)}
				</div>
			</div>
		</AdminLayout>
	);
}