import React, { useEffect, useState } from "react";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, Bike, Car, Package, ArrowUp, MapPin, Users, Calendar, Compass, XCircle, Home, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function Pesanan() {
	const navigate = useNavigate();
	const { orderId } = useParams();

	const [loading, setLoading] = useState(true);
	const [order, setOrder] = useState(null);

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await fetch(`http://127.0.0.1:8000/api/orders/history`, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();
				const found = data.find((item) => item.id === Number(orderId));
				setOrder(found);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchOrder();
	}, [orderId]);

	if (loading) {
		return (
			<CustomerLayout>
				<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-indigo-900">
					<Loader2 className="animate-spin" size={40} />
					<p className="text-xs font-black uppercase tracking-widest text-gray-400">Memuat Detail Pesanan...</p>
				</div>
			</CustomerLayout>
		);
	}

	if (!order) {
		return (
			<CustomerLayout>
				<div className="max-w-md mx-auto my-10 bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm">
					<XCircle className="text-red-500 mx-auto mb-4" size={48} />
					<h3 className="text-lg font-black text-gray-800">Pesanan Tidak Ditemukan</h3>
					<button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-indigo-900 text-white rounded-xl font-bold text-sm">
						Kembali
					</button>
				</div>
			</CustomerLayout>
		);
	}

	const vehicleType = order.trip?.vehicle_type;
	let Icon = Bike;
	let title = "Nebeng Motor";

	if (vehicleType === "mobil") {
		Icon = Car;
		title = "Nebeng Mobil";
	} else if (vehicleType === "barang") {
		Icon = Package;
		title = "Nebeng Barang";
	}

	const departureDateTime = `${order.trip?.departure_date}T${order.trip?.departure_time}`;
	const isCompleted = order.status === "completed";
	const isCancelled = order.status === "cancelled";
	const canTrackJourney = !isCompleted && !isCancelled;

	return (
		<CustomerLayout>
			<div className="w-full max-w-xl mx-auto px-4 py-6 space-y-6 font-sans pb-32">
				{/* HEADER NAVIGATION */}
				<div className="flex items-center gap-4">
					<button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<div>
						<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Detail Jadwal</h1>
						<p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Ringkasan Info Tiket Anda</p>
					</div>
				</div>

				{/* BANNER KALENDER / JADWAL */}
				<div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-center gap-5">
					<div className="w-14 h-14 bg-indigo-900 rounded-2xl text-white flex flex-col items-center justify-center shadow-lg shrink-0">
						<span className="text-xs font-bold uppercase leading-none text-indigo-200">{new Date(departureDateTime).toLocaleDateString("id-ID", { month: "short" })}</span>
						<span className="text-2xl font-black leading-none mt-1">{new Date(departureDateTime).toLocaleDateString("id-ID", { day: "2-digit" })}</span>
					</div>
					<div>
						<p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Waktu Keberangkatan</p>
						<h2 className="text-lg font-black text-indigo-950 mt-0.5">{new Date(departureDateTime).toLocaleDateString("id-ID", { weekday: "long", year: "numeric" })}</h2>
					</div>
				</div>

				{/* MAIN DETAIL CARD */}
				<div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-indigo-950/5 border border-indigo-50/50 space-y-6">
					{/* INFO LAYANAN & BADGE */}
					<div className="flex items-center justify-between border-b border-gray-50 pb-5">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-md">
								<Icon size={24} />
							</div>
							<div>
								<h2 className="font-black text-base text-gray-800 leading-tight">{title}</h2>
								<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">ID TRIP: {order.trip_id}</p>
							</div>
						</div>
						<span
							className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest
		${isCompleted ? "bg-emerald-100 text-emerald-600" : isCancelled ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}
	`}
						>
							{isCompleted ? "Selesai" : isCancelled ? "Dibatalkan" : "Dalam Proses"}
						</span>
					</div>

					{/* TIMELINE RUTE */}
					<div className="relative pl-8 space-y-6 py-2">
						<div className="absolute left-3 top-2 bottom-2 w-0.5 bg-indigo-100 border-l border-dashed border-indigo-300"></div>

						{/* Asal */}
						<div className="relative">
							<div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-sm"></div>
							<div className="flex justify-between items-start">
								<h3 className="font-black text-sm text-gray-800">
									{order.trip?.origin_point?.city?.name} <span className="text-indigo-600 font-black">{order.trip?.origin_point?.pos_name}</span>
								</h3>
								<span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">{new Date(departureDateTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
							</div>
							<p className="text-xs font-medium text-gray-400 mt-1 line-clamp-1">{order.trip?.origin_point?.address}</p>
						</div>

						{/* Tujuan */}
						<div className="relative">
							<div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-orange-500 shadow-sm"></div>
							<h3 className="font-black text-sm text-gray-800">
								{order.trip?.destination_point?.city?.name} <span className="text-indigo-600 font-black">{order.trip?.destination_point?.pos_name}</span>
							</h3>
							<p className="text-xs font-medium text-gray-400 mt-1 line-clamp-1">{order.trip?.destination_point?.address}</p>
						</div>
					</div>

					{/* TOMBOL PANTAU PERJALANAN (Diletakkan di dalam card agar terfokus pada info rute) */}
					{canTrackJourney && (
						<div className="pt-2">
							<button
								onClick={() => navigate(`/customer/perjalanan/${order.trip_id}`)}
								className="w-full py-4 rounded-2xl bg-indigo-900 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
							>
								<Compass size={18} className="animate-pulse" /> Pantau Perjalanan Live
							</button>
						</div>
					)}

					{/* INFO MANIFEST / PENUMPANG */}
					<div className="border-t border-gray-50 pt-5 space-y-3">
						<h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Detail Pemesanan</h3>
						<div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
							<div className="flex items-center gap-3 text-gray-700">
								<Users size={18} className="text-indigo-900" />
								<p className="text-sm font-bold">Kuantitas Kursi</p>
							</div>
							<p className="text-sm font-black text-indigo-900">{order.seats} Penumpang</p>
						</div>
					</div>
				</div>

				{/* GROUP ACTION BUTTONS */}
				<div className="space-y-3 pt-2">
					{canTrackJourney && <button className="w-full py-4.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.99]">Batalkan Pesanan</button>}

					<button
						onClick={() => navigate("/customer/dashboard")}
						className="w-full py-4.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
					>
						<Home size={16} /> Kembali Ke Beranda
					</button>
				</div>
			</div>
		</CustomerLayout>
	);
}
