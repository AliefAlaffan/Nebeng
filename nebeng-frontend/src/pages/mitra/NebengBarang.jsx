import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, MapPin, Calendar, Clock, ArrowRight, Navigation, X, CheckCircle2, Briefcase, ChevronDown } from "lucide-react";

export default function NebengBarang() {
	const navigate = useNavigate();

	// ================= STATE =================
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [baggageCapacity, setBaggageCapacity] = useState("");
	const [showBaggageModal, setShowBaggageModal] = useState(false);
	const [vehicleType, setVehicleType] = useState("");

	const [pickupPoints, setPickupPoints] = useState([]);
	const [loadingPoints, setLoadingPoints] = useState(true);

	const [selectedOrigin, setSelectedOrigin] = useState(null);
	const [selectedDestination, setSelectedDestination] = useState(null);

	// ================= DATA OPTIONS =================
	const baggageOptions = [
		{ id: "xxs", label: "XXS - Maksimal 0.5 Kg" },
		{ id: "xs", label: "XS - Maksimal 1 Kg" },
		{ id: "kecil", label: "Kecil - Maksimal 5 Kg" },
		{ id: "sedang", label: "Sedang - Maksimal 10 Kg" },
		{ id: "besar", label: "Besar - Maksimal 15 Kg" },
	];

	const vehicleOptions = [
		{ id: "Barang-Motor", label: "Motor" },
		{ id: "Barang-Mobil", label: "Mobil" },
		{ id: "Barang-Bus", label: "Bus" },
		{ id: "Barang-Kapal", label: "Kapal" },
		{ id: "Barang-Pesawat", label: "Pesawat" },
		{ id: "Barang-Kereta", label: "Kereta" },
	];

	const filteredBaggageOptions = baggageOptions.filter((option) => {
		if (vehicleType === "Barang-Motor") {
			return ["xxs", "xs", "kecil"].includes(option.id);
		}

		if (vehicleType === "Barang-Mobil") {
			return ["xxs", "xs", "kecil", "sedang", "besar"].includes(option.id);
		}

		if (vehicleType === "Barang-Pesawat") {
			return ["xxs", "xs", "kecil"].includes(option.id);
		}

		if (vehicleType === "Barang-Kereta") {
			return ["xxs", "xs", "kecil", "sedang"].includes(option.id);
		}

		if (vehicleType === "Barang-Kapal") {
			return true;
		}

		if (vehicleType === "Barang-Bus") {
			return ["xxs", "xs", "kecil", "sedang", "besar"].includes(option.id);
		}

		return true;
	});

	useEffect(() => {
		const fetchPickupPoints = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/pickup-points");
				const data = await res.json();
				setPickupPoints(data);
			} catch (err) {
				console.error(err);
			} finally {
				setLoadingPoints(false);
			}
		};

		fetchPickupPoints();
	}, []);

	const handleOriginSelect = (e) => {
		const point = pickupPoints.find((p) => String(p.id) === e.target.value);
		setSelectedOrigin(point || null);
	};

	const handleDestinationSelect = (e) => {
		const point = pickupPoints.find((p) => String(p.id) === e.target.value);
		setSelectedDestination(point || null);
	};

	// ================= LOGIKA =================
	const handleNext = () => {
		if (!selectedOrigin || !selectedDestination || !date || !time || !baggageCapacity || !vehicleType) {
			alert("Mohon lengkapi semua data pengiriman barang");
			return;
		}

		console.log({
			baggageCapacity,
			vehicleType,
		});

		const tripData = {
			origin_point_id: selectedOrigin.id,
			destination_point_id: selectedDestination.id,

			origin_city: selectedOrigin.city,
			origin_address: selectedOrigin.address,

			destination_city: selectedDestination.city,
			destination_address: selectedDestination.address,

			departure_date: date,
			departure_time: time,

			seat_total: 1,
			seat_available: 1,

			tebengan_type: "Barang",
			baggage_capacity: baggageCapacity,

			vehicle_type: vehicleType,
			// price: 20000, // sementara
		};

		navigate("/mitra/konfirmasi-tebengan", {
			state: { tripData },
		});
	};

	const selectedBaggageLabel = filteredBaggageOptions.find((opt) => opt.id === baggageCapacity)?.label || "Pilih Kapasitas Maksimal";

	return (
		<MitraLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6 pb-32">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Tambah Nebeng Barang</h1>
				</div>

				<div className="max-w-2xl mx-auto space-y-6">
					{/* CARD RUTE (Asal & Tujuan) */}
					<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative">
						<div className="relative space-y-10">
							<div className="absolute left-[19px] top-[40px] bottom-[40px] w-[2px] bg-dashed bg-gray-100"></div>

							<div className="flex items-center gap-4 relative z-11">
								<div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
									<Navigation size={20} className="transform rotate-45" />
								</div>
								<div className="flex-1 border-b border-gray-100">
									<label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Lokasi Jemput Barang</label>
									<select value={selectedOrigin?.id || ""} onChange={handleOriginSelect} disabled={loadingPoints} className="w-full text-lg font-bold text-gray-800 bg-transparent py-2 outline-none disabled:opacity-50">
										<option value="">{loadingPoints ? "Memuat titik jemput..." : "Pilih titik jemput"}</option>
										{pickupPoints.map((point) => (
											<option key={point.id} value={point.id}>
												{point.city} - {point.pos_name}
											</option>
										))}
									</select>
									{selectedOrigin && <p className="text-xs text-gray-400 mt-1">{selectedOrigin.address}</p>}
								</div>
							</div>

							<div className="flex items-center gap-4 relative z-10">
								<div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-100">
									<MapPin size={20} />
								</div>
								<div className="flex-1 border-b border-gray-100">
									<label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Lokasi Antar Barang</label>
									<select value={selectedDestination?.id || ""} onChange={handleDestinationSelect} disabled={loadingPoints} className="w-full text-lg font-bold text-gray-800 bg-transparent py-2 outline-none disabled:opacity-50">
										<option value="">{loadingPoints ? "Memuat titik antar..." : "Pilih titik antar"}</option>
										{pickupPoints.map((point) => (
											<option key={point.id} value={point.id}>
												{point.city} - {point.pos_name}
											</option>
										))}
									</select>
									{selectedDestination && <p className="text-xs text-gray-400 mt-1">{selectedDestination.address}</p>}
								</div>
							</div>
						</div>
					</div>

					{/* TANGGAL & JAM */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:bg-gray-50 transition-all">
							<div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
								<Calendar size={24} />
							</div>
							<div className="flex-1">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Pengiriman</p>
								<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent font-black text-indigo-900 outline-none w-full" />
							</div>
						</div>
						<div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:bg-gray-50 transition-all">
							<div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
								<Clock size={24} />
							</div>
							<div className="flex-1">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimasi Jam</p>
								<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent font-black text-indigo-900 outline-none w-full" />
							</div>
						</div>
					</div>

					{/* PILIH JENIS KENDARAAN */}
					<div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-3">
						<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">JENIS KENDARAAN</label>

						<select
							value={vehicleType}
							onChange={(e) => {
								setVehicleType(e.target.value);
								setBaggageCapacity("");
							}}
							className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-indigo-900 focus:outline-none"
						>
							<option value="">Pilih kendaraan</option>

							{vehicleOptions.map((vehicle) => (
								<option key={vehicle.id} value={vehicle.id}>
									{vehicle.label}
								</option>
							))}
						</select>

						<p className="text-xs text-gray-400">Pilih kendaraan yang akan digunakan saat perjalanan nebeng barang.</p>
					</div>

					{/* INPUT KAPASITAS BAGASI (Langsung Tampil) */}
					<div className="space-y-4 animate-in fade-in duration-500">
						<button onClick={() => setShowBaggageModal(true)} className="w-full bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-gray-50 transition-all text-left shadow-sm">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
									<Briefcase size={24} />
								</div>
								<div>
									<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KAPASITAS BAGASI TERSEDIA</p>
									<p className="font-black text-indigo-900 text-lg leading-none mt-1">{selectedBaggageLabel}</p>
								</div>
							</div>
							<ChevronDown className="text-gray-300 group-hover:translate-y-0.5 transition-transform" />
						</button>
					</div>

					{/* SUBMIT BUTTON */}
					<button
						onClick={handleNext}
						className="w-full bg-indigo-900 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
					>
						Selanjutnya <ArrowRight size={24} />
					</button>
				</div>
			</div>

			{/* MODAL KAPASITAS BAGASI */}
			{showBaggageModal && (
				<div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
					<div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowBaggageModal(false)}></div>

					<div className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom-full duration-500 shadow-2xl">
						<div className="w-16 h-1 bg-gray-200 rounded-full mx-auto mb-8"></div>

						<div className="flex justify-between items-center mb-8">
							<h3 className="text-2xl font-black text-indigo-900">Pilih Kapasitas Bagasi</h3>

							<button onClick={() => setShowBaggageModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-900 transition-colors">
								<X size={20} />
							</button>
						</div>

						<div className="space-y-4">
							{filteredBaggageOptions.map((opt) => (
								<button
									key={opt.id}
									onClick={() => {
										setBaggageCapacity(opt.id);
										setShowBaggageModal(false);
									}}
									className={`w-full flex items-center gap-5 p-6 rounded-[24px] transition-all border ${
										baggageCapacity === opt.id ? "bg-indigo-900 text-white border-indigo-900 shadow-lg" : "bg-gray-50 border-gray-100 text-indigo-900 hover:bg-indigo-50"
									}`}
								>
									<div className={`p-3 rounded-xl ${baggageCapacity === opt.id ? "bg-white/10 text-white" : "bg-indigo-900 text-white"}`}>
										<Briefcase size={24} />
									</div>

									<span className="font-black text-lg flex-1 text-left leading-none">{opt.label}</span>

									{baggageCapacity === opt.id && <CheckCircle2 size={24} className="text-sky-300" />}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</MitraLayout>
	);
}