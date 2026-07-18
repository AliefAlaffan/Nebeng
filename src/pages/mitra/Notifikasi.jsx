import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, Bell, Trash2, CheckCheck, Clock, Tag, Megaphone, Info } from "lucide-react";

export default function Notifikasi() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [activeFilter, setActiveFilter] = useState("Semua");

	const filters = ["Semua", "Promo", "Info Perjalanan", "Sistem"];

	const [notifications, setNotifications] = useState([]);

	// Fungsionalitas Filter & Search
	const filteredNotifications = useMemo(() => {
		return notifications.filter((n) => {
			const matchesFilter = activeFilter === "Semua" || n.category === activeFilter;
			const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesFilter && matchesSearch;
		});
	}, [notifications, activeFilter, searchTerm]);

	const markAllRead = () => {
		const updated = notifications.map((n) => ({
			...n,
			isRead: true,
		}));

		setNotifications(updated);

		localStorage.setItem("mitra_notifications", JSON.stringify(updated));

		localStorage.setItem("mitra_has_new_notif", "false");
	};

	const deleteNotification = (id) => {
		const updated = notifications.filter((n) => n.id !== id);

		setNotifications(updated);

		localStorage.setItem("mitra_notifications", JSON.stringify(updated));
	};

	useEffect(() => {
		const saved = localStorage.getItem("mitra_notifications");

		if (saved) {
			setNotifications(JSON.parse(saved));
		}
	}, []);

	const getNotificationStyle = (category) => {
		switch (category) {
			case "Promo":
				return {
					icon: Megaphone,
					color: "text-amber-500",
					bg: "bg-amber-50",
				};

			case "Info Perjalanan":
				return {
					icon: Clock,
					color: "text-indigo-500",
					bg: "bg-indigo-50",
				};

			default:
				return {
					icon: Info,
					color: "text-blue-500",
					bg: "bg-blue-50",
				};
		}
	};

	useEffect(() => {
		const saved = localStorage.getItem("mitra_notifications");

		if (saved) {
			const parsed = JSON.parse(saved);

			// semua notif jadi read
			const updated = parsed.map((n) => ({
				...n,
				isRead: true,
			}));

			// simpan ulang
			localStorage.setItem("mitra_notifications", JSON.stringify(updated));

			setNotifications(updated);

			// reset indikator unread
			localStorage.setItem("mitra_has_new_notif", "false");
		}
	}, []);

	return (
		<MitraLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6">
				{/* HEADER & ACTION BAR */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
					<div className="flex items-center gap-4">
						<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
							<ChevronLeft className="w-5 h-5 text-indigo-900" />
						</button>
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-indigo-900 text-white rounded-2xl shadow-lg shadow-indigo-100">
								<Bell size={24} />
							</div>
							<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Notifikasi</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-500 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all border border-gray-100 hover:border-indigo-200">
							<CheckCheck size={16} />
							Tandai Baca Semua
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* SISI KIRI: Sidebar Filter (3 Kolom) */}
					<div className="lg:col-span-3 space-y-4 sticky top-6 z-1">
						<div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
							<div className="mb-6">
								<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Cari Notifikasi</label>
								<input
									type="text"
									placeholder="Cari kata kunci..."
									className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>

							<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Kategori</label>
							<div className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
								{filters.map((f) => (
									<button
										key={f}
										onClick={() => setActiveFilter(f)}
										className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap lg:w-full ${
											activeFilter === f ? "bg-indigo-900 text-white shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-900"
										}`}
									>
										<Tag size={16} className={activeFilter === f ? "text-indigo-300" : "text-gray-400"} />
										{f}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* SISI KANAN: Daftar Notifikasi (9 Kolom) */}
					<div className="lg:col-span-9 space-y-4">
						{filteredNotifications.length > 0 ? (
							filteredNotifications.map((n) => (
								<div key={n.id} className={`group bg-white rounded-[32px] p-6 shadow-sm border transition-all hover:shadow-md ${!n.isRead ? "border-l-4 border-l-indigo-600 border-gray-100" : "border-gray-50 opacity-80"}`}>
									<div className="flex gap-4">
										<div className={`p-4 ${getNotificationStyle(n.category).bg} ${getNotificationStyle(n.category).color} rounded-[22px] shrink-0 h-fit group-hover:scale-110 transition-transform`}>
											{(() => {
												const style = getNotificationStyle(n.category);
												const Icon = style.icon;

												return <Icon size={24} />;
											})()}
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-start mb-1">
												<h3 className="text-base font-black text-indigo-900 truncate pr-4">{n.title}</h3>
												<button onClick={() => deleteNotification(n.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
													<Trash2 size={16} />
												</button>
											</div>
											<p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-500">{n.message}</p>
											<div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
												<Clock size={12} />
												{n.date}
												{!n.isRead && <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>}
											</div>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
								<div className="bg-indigo-50 p-6 rounded-full mb-4">
									<Bell size={48} className="text-indigo-200" />
								</div>
								<h3 className="text-lg font-bold text-indigo-900">Belum ada notifikasi</h3>
								<p className="text-sm text-gray-400 max-w-xs mx-auto">Notifikasi tentang perjalanan, promo, dan sistem akan muncul di sini.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</MitraLayout>
	);
}
