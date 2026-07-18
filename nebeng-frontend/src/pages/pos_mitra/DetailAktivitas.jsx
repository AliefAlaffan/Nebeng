import React from "react";
import PosMitraLayout from "../../components/dashboard/PosMitraLayout";
import { ChevronLeft, MessageSquare, User, ReceiptText, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

// Helper status badge
function getStatusColor(status) {
	if (!status) return "bg-gray-50 text-gray-400";

	const s = String(status).toLowerCase();

	if (s.includes("selesai") || s.includes("completed") || s.includes("done")) {
		return "bg-emerald-50 text-emerald-500";
	}

	if (s.includes("menunggu") || s.includes("pending") || s.includes("waiting")) {
		return "bg-amber-50 text-amber-500";
	}

	if (s.includes("batal") || s.includes("cancel")) {
		return "bg-rose-50 text-rose-500";
	}

	if (s.includes("konfirmasi") || s.includes("confirmed") || s.includes("accepted")) {
		return "bg-indigo-50 text-indigo-600";
	}

	return "bg-gray-50 text-gray-500";
}

export default function DetailAktivitas() {
	const navigate = useNavigate();
	const { tripId } = useParams();

	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTrip = async () => {
			try {
				const token = localStorage.getItem("token");

				const res = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				console.log("DETAIL AKTIVITAS:", data);

				setTrip(data);
			} catch (err) {
				console.error("Gagal mengambil detail aktivitas:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchTrip();
	}, [tripId]);

	if (loading) {
		return (
			<PosMitraLayout>
				<div className="p-10 text-center">Loading...</div>
			</PosMitraLayout>
		);
	}

	if (!trip) {
		return (
			<PosMitraLayout>
				<div className="p-10 text-center">Trip tidak ditemukan</div>
			</PosMitraLayout>
		);
	}

	return (
		<PosMitraLayout>
			<div className="w-full max-w-screen-md mx-auto px-4 py-6 space-y-6 pb-24">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-4">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>

					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Detail Aktivitas</h1>
				</div>

				{/* CARD RINGKASAN */}
				<div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 overflow-hidden relative group">
					<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
						<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">
							{trip.departure_date} | {trip.departure_time} | TRIP-{trip.id}
						</span>

						<span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase ${getStatusColor(trip.status)}`}>{trip.status}</span>
					</div>

					<div className="relative pl-8 space-y-8">
						<div className="absolute left-[13px] top-[10px] bottom-[10px] w-[1.5px] bg-gray-100"></div>

						<div className="relative">
							<div className="absolute left-[-23px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>

							<h3 className="font-black text-gray-800 text-lg leading-none">{trip.origin_point?.city?.name || "-"}</h3>

							<p className="text-xs text-gray-400 mt-1 font-medium">{trip.origin_point?.address || "-"}</p>
						</div>

						<div className="relative">
							<div className="absolute left-[-23px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>

							<h3 className="font-black text-gray-800 text-lg leading-none">{trip.destination_point?.city?.name || "-"}</h3>

							<p className="text-xs text-gray-400 mt-1 font-medium">{trip.destination_point?.address || "-"}</p>
						</div>
					</div>

					<div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
						<span className="text-xs font-bold text-gray-400">Estimasi Pendapatan / Kursi</span>

						<span className="text-xl font-black text-indigo-900 tracking-tighter">Rp {Number(trip.price || 0).toLocaleString("id-ID")},00</span>
					</div>
				</div>

				{/* INFORMASI MITRA */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8 flex items-center gap-2">
						<User size={20} className="text-indigo-400" />
						Informasi Mitra
					</h3>

					<div className="space-y-4">
						<InfoRow label="Nama Mitra" value={trip.mitra?.name || "-"} />
						<InfoRow label="Transportasi" value={trip.vehicle_type || "-"} />
						<InfoRow label="Jumlah Kursi" value={trip.seat_total ?? 0} />
					</div>
				</div>

				{/* INFORMASI TRIP */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8">Informasi Trip</h3>

					<div className="space-y-4">
						<InfoRow label="Kendaraan" value={trip.vehicle_type || "-"} />
						<InfoRow label="Total Kursi" value={trip.seat_total ?? "-"} />
						<InfoRow label="Kursi Tersedia" value={trip.seat_available ?? "-"} />
						<InfoRow label="Kapasitas Barang" value={trip.baggage_capacity ?? "-"} />
					</div>

					{/* LIST CUSTOMER */}
					<div className="mt-8 space-y-4">
						{trip.orders && trip.orders.length > 0 ? (
							trip.orders.map((order) => (
								<div key={order.id} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-all group">
									<div className="flex items-center gap-4">
										{order.user?.avatar ? (
											<img src={`http://127.0.0.1:8000/storage/${order.user.avatar}`} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
										) : (
											<div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center font-black text-amber-700 text-lg">{order.user?.name?.charAt(0) || "U"}</div>
										)}

										<div className="text-left">
											<h4 className="font-black text-gray-800 leading-none mb-1">{order.user?.name || "User"}</h4>

											<p className="text-xs text-gray-400">{order.user?.email || "-"}</p>

											{/* <p className="text-xs text-gray-400">{order.user?.phone || "-"}</p> */}

											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
												<MessageSquare size={12} />
												Customer
											</p>
										</div>
									</div>

									<div className="flex flex-col items-end gap-2">
										<span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${getStatusColor(order.status)}`}>{order.status}</span>

										<ArrowRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
									</div>
								</div>
							))
						) : (
							<div className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-black text-gray-500 text-lg">-</div>

									<div className="text-left">
										<h4 className="font-black text-gray-500 leading-none mb-1">Belum ada customer</h4>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* INFORMASI TUJUAN */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8">Informasi Tujuan</h3>

					<div className="space-y-4">
						<div className="flex gap-4">
							<span className="text-sm font-medium text-gray-400 w-32 shrink-0">Kota Tujuan :</span>

							<span className="text-sm font-black text-gray-800">{trip.destination_point?.city?.name || "-"}</span>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium text-gray-400">Alamat Tujuan :</span>

							<p className="text-sm font-black text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">"{trip.destination_point?.address || "-"}"</p>
						</div>
					</div>
				</div>

				{/* ESTIMASI PENDAPATAN */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8 flex items-center gap-2">
						<ReceiptText size={20} className="text-indigo-400" />
						Estimasi Pendapatan
					</h3>

					<div className="space-y-5">
						<div className="flex justify-between text-sm">
							<span className="font-medium text-gray-400">Harga per Kursi</span>

							<span className="font-black text-gray-800">Rp {Number(trip.price || 0).toLocaleString("id-ID")}</span>
						</div>

						<div className="flex justify-between text-sm">
							<span className="font-medium text-gray-400">Total Kursi</span>

							<span className="font-black text-gray-800">{trip.seat_total ?? 0} Kursi</span>
						</div>

						<div className="flex justify-between text-sm">
							<span className="font-medium text-gray-400">Kursi Terisi</span>

							<span className="font-black text-gray-800">{(trip.seat_total ?? 0) - (trip.seat_available ?? 0)} Kursi</span>
						</div>

						<div className="flex justify-between text-sm">
							<span className="font-medium text-gray-400">Kursi Tersisa</span>

							<span className="font-black text-gray-800">{trip.seat_available ?? 0} Kursi</span>
						</div>

						<div className="pt-5 border-t-2 border-gray-100 flex justify-between items-center">
							<span className="text-lg font-black text-indigo-900 uppercase tracking-widest">Potensi Maksimal</span>

							<span className="text-2xl font-black text-emerald-500 tracking-tighter">Rp {((trip.price || 0) * (trip.seat_total || 0)).toLocaleString("id-ID")}</span>
						</div>
					</div>
				</div>
			</div>
		</PosMitraLayout>
	);
}

function InfoRow({ label, value }) {
	return (
		<div className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
			<span className="text-sm font-medium text-gray-400">{label}</span>

			<span className="text-sm font-black text-gray-800 uppercase tracking-tight">{value}</span>
		</div>
	);
}
