import React from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, MessageSquare, User, Phone, MapPin, Package, ReceiptText, Info, ArrowRight, Navigation } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import SuccessPopup from "../../components/ui/SuccessPopup";

// Helper: return tailwind classes for status badge color
function getStatusColor(status) {
	if (!status) return "bg-gray-50 text-gray-400";
	const s = String(status).toLowerCase();
	if (s.includes("selesai") || s.includes("completed") || s.includes("done")) return "bg-emerald-50 text-emerald-500";
	if (s.includes("menunggu") || s.includes("pending") || s.includes("waiting")) return "bg-amber-50 text-amber-500";
	if (s.includes("batal") || s.includes("cancel") || s.includes("rejected")) return "bg-rose-50 text-rose-500";
	if (s.includes("konfirmasi") || s.includes("confirmed") || s.includes("accepted")) return "bg-indigo-50 text-indigo-600";
	return "bg-gray-50 text-gray-500";
}

export default function DetailTebenganMitra() {
	const navigate = useNavigate();
	const { tripId } = useParams();

	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);

	const [qrData, setQrData] = useState(null);
	const [showQR, setShowQR] = useState(false);
	const [justCompleted, setJustCompleted] = useState(false);

	useEffect(() => {
		const fetchTrip = async () => {
			try {
				const res = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}`);
				const data = await res.json();

				console.log("DATA TRIP:", data);
				setTrip(data);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchTrip();

		// Auto-refresh berkala supaya status trip (mis. setelah QR di-scan Pos Mitra)
		// selalu terkini tanpa perlu reload manual.
		const interval = setInterval(fetchTrip, 4000);

		return () => clearInterval(interval);
	}, [tripId]);

	// Saat QR kedatangan sedang ditampilkan, begitu status trip berubah jadi
	// "completed" (artinya sudah berhasil di-scan Pos Mitra), tutup modal QR
	// otomatis dan tampilkan notifikasi berhasil.
	useEffect(() => {
		if (showQR && trip?.status === "completed") {
			setShowQR(false);
			setJustCompleted(true);
		}
	}, [trip?.status, showQR]);

	if (loading) {
		return (
			<MitraLayout>
				<div className="p-10 text-center">Loading...</div>
			</MitraLayout>
		);
	}

	if (!trip) {
		return (
			<MitraLayout>
				<div className="p-10 text-center">Trip tidak ditemukan</div>
			</MitraLayout>
		);
	}

	const handleGenerateQR = async () => {
		try {
			const token = localStorage.getItem("token");

			const response = await fetch(`http://127.0.0.1:8000/api/mitra/trips/${tripId}/generate-qr`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			const data = await response.json();
			console.log(data);

			setQrData(data);
			setShowQR(true);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<MitraLayout>
			<div className="w-full max-w-screen-md mx-auto px-4 py-6 space-y-6 pb-24">
				{/* HEADER NAVIGATION */}
				<div className="flex items-center gap-4 mb-4">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Detail Tebengan</h1>
				</div>

				{/* CARD 1: RINGKASAN & STATUS */}
				<div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 overflow-hidden relative group">
					<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
						<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">
							{trip.departure_date} | {trip.departure_time} | TRIP-{trip.id}
						</span>
						<span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase bg-emerald-50 text-emerald-500">{trip.status}</span>
					</div>

					<div className="relative pl-8 space-y-8">
						<div className="absolute left-[13px] top-[10px] bottom-[10px] w-[1.5px] bg-gray-100"></div>
						<div className="relative">
							<div className="absolute left-[-23px] top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
							<h3 className="font-black text-gray-800 text-lg leading-none">{trip.origin_point.city.name}</h3>
							<p className="text-xs text-gray-400 mt-1 font-medium">{trip.origin_point.address}</p>
						</div>

						<div className="relative">
							<div className="absolute left-[-23px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
							<h3 className="font-black text-gray-800 text-lg leading-none">{trip.destination_point.city.name}</h3>
							<p className="text-xs text-gray-400 mt-1 font-medium">{trip.destination_point.address}</p>
						</div>
					</div>

					<div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
						<span className="text-xs font-bold text-gray-400">Estimasi Pendapatan / Kursi</span>
						<span className="text-xl font-black text-indigo-900 tracking-tighter">Rp {Number(trip.price).toLocaleString("id-ID")},00</span>
					</div>
				</div>

				{/* CARD 2: INFORMASI MITRA */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8 flex items-center gap-2">
						<User size={20} className="text-indigo-400" /> Informasi Mitra
					</h3>
					<div className="space-y-4">
						<InfoRow label="Nama Mitra" value={trip.mitra.name} />
						<InfoRow label="Transportasi" value={trip.vehicle_type} />
						<InfoRow label="Jumlah Kursi" value={trip.seat_total} />
					</div>
				</div>

				{/* CARD 3: INFORMASI TRIP */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8">Informasi Trip</h3>

					<div className="space-y-4">
						<InfoRow label="Kendaraan" value={trip.vehicle_type || "-"} />
						<InfoRow label="Total Kursi" value={trip.seat_total ?? "-"} />
						<InfoRow label="Kursi Tersedia" value={trip.seat_available ?? "-"} />
						<InfoRow label="Kapasitas Barang" value={trip.baggage_capacity ?? "-"} />
					</div>

					{/* =========================
    FOTO BARANG CUSTOMER
========================= */}
					{trip.vehicle_type?.includes("Barang") && trip.orders?.some((o) => o.item_order?.image) && (
						<div className="mt-8">
							<h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
								<Package size={16} className="text-indigo-500" />
								Foto Barang Customer
							</h4>

							<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
								{trip.orders.map((order) => {
									const image = order.item_order?.image;

									if (!image) return null;

									return (
										<div key={order.id} className="relative group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
											<img src={`http://127.0.0.1:8000/storage/${image}`} alt="Barang Customer" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />

											<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
												<p className="text-xs font-black text-white truncate">{order.user?.name || "Customer"}</p>

												<p className="text-[10px] text-white/80 truncate">{order.item_order?.size || "-"}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Optional UI biar tetap ada feel interaktif */}
					{/* LIST PENUMPANG */}
					<div className="mt-8 space-y-4">
						{trip.orders && trip.orders.length > 0 ? (
							trip.orders.map((order) => (
								<div key={order.id} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-all group">
									<div className="flex items-center gap-4">
										{/* AVATAR */}
										{order.user?.avatar ? (
											<img src={`http://127.0.0.1:8000/storage/${order.user.avatar}`} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
										) : (
											<div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center font-black text-amber-700 text-lg">{order.user?.name?.charAt(0) || "U"}</div>
										)}

										{/* INFO USER */}
										<div className="text-left">
											<h4 className="font-black text-gray-800 leading-none mb-1">{order.user?.name || "User"}</h4>

											<p className="text-xs text-gray-400">{order.user?.email || "-"}</p>

											<p className="text-xs text-gray-400">{order.user?.phone || "-"}</p>

											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
												<MessageSquare size={12} /> Chat customer
											</p>
										</div>
									</div>

									{/* 🔥 STATUS BADGE */}
									<div className="flex flex-col items-end gap-2">
										<span
											className={`text-[10px] font-black px-3 py-1 rounded-full uppercase
						${getStatusColor(order.status)}`}
										>
											{order.status}
										</span>

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

				{/* CARD 4: INFORMASI TUJUAN */}
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

				{/* CARD 5: ESTIMASI PENDAPATAN */}
				<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
					<h3 className="text-lg font-black text-indigo-900 mb-8 flex items-center gap-2">
						<ReceiptText size={20} className="text-indigo-400" /> Estimasi Pendapatan
					</h3>

					{(() => {
						const isBarang = trip.vehicle_type?.includes("Barang");

						// hitung order valid
						const totalOrder = trip.orders?.length || 0;

						if (isBarang) {
							return (
								<div className="space-y-5">
									<div className="flex justify-between text-sm">
										<span className="font-medium text-gray-400">Harga per Muatan</span>

										<span className="font-black text-gray-800">Rp {Number(trip.price || 0).toLocaleString("id-ID")}</span>
									</div>

									<div className="flex justify-between text-sm">
										<span className="font-medium text-gray-400">Kapasitas Maksimal</span>

										<span className="font-black text-gray-800">{trip.baggage_capacity ?? 0}</span>
									</div>

									<div className="flex justify-between text-sm">
										<span className="font-medium text-gray-400">Slot Total</span>

										<span className="font-black text-gray-800">{trip.seat_total ?? 0} Slot</span>
									</div>

									<div className="flex justify-between text-sm">
										<span className="font-medium text-gray-400">Slot Terisi</span>

										<span className="font-black text-gray-800">{(trip.seat_total ?? 0) - (trip.seat_available ?? 0)} Slot</span>
									</div>

									<div className="flex justify-between text-sm">
										<span className="font-medium text-gray-400">Slot Tersisa</span>

										<span className="font-black text-gray-800">{trip.seat_available ?? 0} Slot</span>
									</div>

									<div className="pt-5 border-t-2 border-gray-100 flex justify-between items-center">
										<span className="text-lg font-black text-indigo-900 uppercase tracking-widest">Potensi Maksimal</span>

										<span className="text-2xl font-black text-emerald-500 tracking-tighter">Rp {(trip.seat_total * (trip.price || 0)).toLocaleString("id-ID")}</span>
									</div>
								</div>
							);
						}

						// ==========================
						// PENUMPANG
						// ==========================
						return (
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

									<span className="text-2xl font-black text-emerald-500 tracking-tighter">Rp {(trip.price * trip.seat_total).toLocaleString("id-ID")}</span>
								</div>
							</div>
						);
					})()}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* BUTTON PERJALANAN */}
					<button
						onClick={() => navigate(`/mitra/perjalanan/${trip.id}`)}
						className="bg-indigo-900 hover:bg-indigo-800 transition-all text-white px-5 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-[0.98]"
					>
						<Navigation size={18} className="rotate-45" />
						Lihat Perjalanan
					</button>

					{/* BUTTON QR */}
					{trip.status === "arrived_destination" && (
						<button
							onClick={handleGenerateQR}
							className="bg-white border border-indigo-100 text-indigo-900 hover:bg-indigo-50 transition-all px-5 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
						>
							Tampilkan QR
						</button>
					)}
				</div>
			</div>
			{/* QR MODAL */}
			{showQR && qrData?.token && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
					<div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
						{/* CLOSE BUTTON */}
						<button onClick={() => setShowQR(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-all font-black text-gray-500">
							✕
						</button>

						<h2 className="text-2xl font-black text-indigo-900 text-center mb-2">QR Perjalanan</h2>

						<p className="text-sm text-gray-400 text-center mb-8">Tunjukkan QR ini kepada Pos Mitra</p>

						<div className="flex justify-center">
							<div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
								<QRCode
									value={JSON.stringify({
										type: "trip",
										token: qrData.token,
									})}
									size={240}
								/>
							</div>
						</div>

						<div className="mt-8 text-center">
							<p className="text-xs text-gray-400 font-medium">Berlaku hingga</p>

							<p className="font-black text-indigo-900 mt-1">{new Date(qrData.expired_at).toLocaleString()}</p>
						</div>
					</div>
				</div>
			)}

			<SuccessPopup show={justCompleted} onClose={() => setJustCompleted(false)} title="Perjalanan Selesai" message="QR berhasil diverifikasi Pos Mitra. Perjalanan ini telah selesai." />
		</MitraLayout>
	);
}

// Sub-component agar kode lebih bersih
function InfoRow({ label, value }) {
	return (
		<div className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
			<span className="text-sm font-medium text-gray-400">{label}</span>
			<span className="text-sm font-black text-gray-800 uppercase tracking-tight">{value}</span>
		</div>
	);
}