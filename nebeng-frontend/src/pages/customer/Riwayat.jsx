import React, { useState, useMemo, useEffect } from "react";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, Bike, Car, Package, Inbox, User, Clock, ArrowRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Riwayat() {
	const [historyData, setHistoryData] = useState([]);
	// Default "Semua" supaya order yang baru dipesan (Dalam Proses) langsung
	// kelihatan, tidak ketutup di balik tab lain
	const [activeTab, setActiveTab] = useState("Semua");
	const [filter, setFilter] = useState("Semua");
	const [searchTerm, setSearchTerm] = useState("");

	const navigate = useNavigate();

	// Tab sekarang murni filter status, bukan pemisah kategori terpisah
	const tabs = ["Semua", "Dalam Proses", "Selesai"];
	const filters = ["Semua", "Motor", "Mobil", "Barang"];

	// =============================
	// FETCH DATA DARI LARAVEL API
	// =============================
	useEffect(() => {
		const fetchHistory = async () => {
			try {
				const token = localStorage.getItem("token");

				if (!token) {
					console.error("Token tidak ditemukan");
					return;
				}

				const res = await fetch("http://127.0.0.1:8000/api/orders/history", {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});

				if (!res.ok) {
					throw new Error("Gagal mengambil data");
				}

				const data = await res.json();

				const formatted = data.map((order) => {
					const vehicleType = order.trip?.vehicle_type;

					let type = "";
					let category = "";
					let icon = Package;

					if (vehicleType === "motor") {
						type = "Nebeng Motor";
						category = "Motor";
						icon = Bike;
					} else if (vehicleType === "mobil") {
						type = "Nebeng Mobil";
						category = "Mobil";
						icon = Car;
					} else if (vehicleType?.includes("Barang")) {
						type = vehicleType.replace("Barang-", "Nebeng ").replace("Motor", "Motor").replace("Mobil", "Mobil").replace("Kapal", "Kapal").replace("Pesawat", "Pesawat").replace("Kereta", "Kereta");

						category = "Barang";

						// =========================
						// ICON BERDASARKAN VEHICLE
						// =========================

						if (vehicleType.includes("Motor")) {
							icon = Bike;
						} else if (vehicleType.includes("Mobil")) {
							icon = Car;
						} else {
							icon = Package;
						}
					}

					const departureDateTime = `${order.trip?.departure_date}T${order.trip?.departure_time}`;

					// Status mentah dari backend: waiting_departure, on_the_way,
					// arrived_destination, completed, cancelled -> disederhanakan
					// jadi 3 kelompok tampilan: Selesai / Dibatalkan / Dalam Proses
					const statusGroup = order.status === "completed" ? "Selesai" : order.status === "cancelled" ? "Dibatalkan" : "Dalam Proses";

					return {
						id: order.id,

						type,
						category,
						icon,

						status: statusGroup,

						statusColor: statusGroup === "Selesai" ? "text-emerald-500" : statusGroup === "Dibatalkan" ? "text-red-500" : "text-amber-500",

						from: order.trip?.origin_point?.city?.name || "-",
						fromPos: order.trip?.origin_point?.pos_name || "-",

						to: order.trip?.destination_point?.city?.name || "-",
						toPos: order.trip?.destination_point?.pos_name || "-",

						date: new Date(departureDateTime).toLocaleDateString("id-ID"),

						time: new Date(departureDateTime).toLocaleTimeString("id-ID", {
							hour: "2-digit",
							minute: "2-digit",
						}),

						vehicle: order.trip?.vehicle_name || "-",
						plate: order.trip?.vehicle_plate || "-",

						passengers: order.seats + " Orang",

						price: "Rp" + Number(order.price).toLocaleString(),
					};
				});

				setHistoryData(formatted);
			} catch (err) {
				console.error("Error fetch history:", err);
			}
		};

		fetchHistory();
	}, []);

	// =============================
	// FILTER DATA
	// =============================
	const filteredData = useMemo(() => {
		return historyData.filter((item) => {
			// "Semua" -> tampilkan semua status. Selain itu, cocokkan
			// langsung ke teks status ("Dalam Proses" / "Selesai").
			// Order yang "Dibatalkan" tetap muncul di tab Semua, tapi
			// tidak masuk ke tab Dalam Proses maupun Selesai.
			const matchesTab = activeTab === "Semua" || item.status === activeTab;

			const matchesFilter = filter === "Semua" || item.category === filter;

			const matchesSearch = item.to.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase());

			return matchesTab && matchesFilter && matchesSearch;
		});
	}, [historyData, activeTab, filter, searchTerm]);

	return (
		<CustomerLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6">
				{/* HEADER */}
				<div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 mb-8">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
						<div className="flex items-center gap-4">
							<Link className="p-2 bg-gray-50 rounded-xl md:hidden" to="/customer/dashboard">
								<ChevronLeft className="w-5 h-5 text-indigo-900" />
							</Link>

							<h1 className="text-xl font-black text-indigo-900">Pesanan</h1>
						</div>

						<div className="flex bg-gray-50 p-1.5 rounded-2xl overflow-x-auto">
							{tabs.map((tab) => (
								<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === tab ? "bg-white text-indigo-900 shadow-md" : "text-gray-400"}`}>
									{tab}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* FILTER */}
					<div className="lg:col-span-3 space-y-4">
						<div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

								<input type="text" placeholder="Cari tujuan..." className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-2xl text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
							</div>
						</div>

						<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
							<h3 className="text-xs font-black text-gray-400 uppercase mb-6">Filter Layanan</h3>

							<div className="flex flex-row lg:flex-col gap-2 overflow-x-auto">
								{filters.map((f) => (
									<button key={f} onClick={() => setFilter(f)} className={`px-4 py-3 rounded-2xl text-sm font-bold border border-gray-300 flex items-center gap-3 ${filter === f ? "bg-indigo-900 text-white" : "bg-white text-gray-500"}`}>
										<div className="p-1.5 rounded-lg bg-gray-50 text-indigo-900">
											{f === "Semua" && <Clock size={16} />}
											{f === "Motor" && <Bike size={16} />}
											{f === "Mobil" && <Car size={16} />}
											{f === "Barang" && <Package size={16} />}
										</div>

										{f}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* LIST PESANAN */}
					<div className="lg:col-span-9 space-y-4">
						{filteredData.length > 0 ? (
							filteredData.map((item) => (
								<div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
									<div className="flex justify-between">
										<div>
											<div className="flex items-center gap-3 mb-3">
												<div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-xl">
													<item.icon size={20} />
												</div>

												<span className="text-sm font-bold text-gray-800">{item.type}</span>
											</div>

											<p className="text-sm text-gray-600">
												{item.from} → {item.to}
											</p>

											<p className="text-xs text-gray-400 mt-2">
												{item.date} • {item.time}
											</p>
										</div>

										<div className="text-right">
											<p className={`text-xs font-bold ${item.statusColor}`}>{item.status}</p>

											<p className="text-lg font-black text-indigo-900 mt-2">{item.price}</p>

											<button className="mt-3 px-4 py-2 bg-indigo-900 text-white rounded-lg text-xs font-bold" onClick={() => navigate(`/customer/pesanan/${item.id}`)}>
												Detail
											</button>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
								<div className="bg-gray-50 p-6 rounded-full mb-4 inline-block">
									<Clock size={48} className="text-gray-200" />
								</div>

								<h3 className="text-lg font-bold text-gray-800">Tidak ada riwayat</h3>

								<p className="text-sm text-gray-400">Pesanan yang Anda cari tidak ditemukan.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</CustomerLayout>
	);
}