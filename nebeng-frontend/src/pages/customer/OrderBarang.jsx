import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, ArrowRight, Navigation, Clock, Users, Filter, Search, CheckCircle2, Bike, Car, Plane, Ship, Train, Package, Bus } from "lucide-react";

export default function OrderBarang() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();

	const origin_id = searchParams.get("origin_id");
	const destination_id = searchParams.get("destination_id");
	const date = searchParams.get("date");
	const size = searchParams.get("size");
	const vehicle_type = searchParams.get("vehicle_type");
	const description = searchParams.get("description");

	const image = location.state?.image;
	const preview = location.state?.preview;

	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("default");
	const [rides, setRides] = useState([]);
	const [originInfo, setOriginInfo] = useState(null);
	const [destinationInfo, setDestinationInfo] = useState(null);

	// Ambil nama kota & pos asli sesuai origin_id/destination_id di URL
	useEffect(() => {
		const fetchPoints = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/pickup-points");
				const data = await res.json();

				setOriginInfo(data.find((p) => String(p.id) === String(origin_id)) || null);
				setDestinationInfo(data.find((p) => String(p.id) === String(destination_id)) || null);
			} catch (err) {
				console.error("Error fetch pickup points:", err);
			}
		};

		if (origin_id && destination_id) fetchPoints();
	}, [origin_id, destination_id]);

	const cleanLocation = (text) => {
		return text?.split("-")[0].trim().toLowerCase();
	};

	// =====================================
	// HANDLE ORDER
	// =====================================

	const handleOrder = async (tripId) => {
		try {
			const token = localStorage.getItem("token");

			const formData = new FormData();

			formData.append("trip_id", tripId);
			formData.append("origin_point_id", origin_id);
			formData.append("destination_point_id", destination_id);
			formData.append("delivery_date", date);
			formData.append("size", size);

			formData.append("item_description", description || "");

			// WAJIB
			formData.append("payment_method", "cash");

			if (image) {
				formData.append("image", image);
			}

			const res = await fetch("http://127.0.0.1:8000/api/item-orders", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
				body: formData,
			});

			const data = await res.json();

			console.log("ITEM ORDER RESPONSE:", data);

			if (!res.ok) {
				alert(data.message || "Gagal membuat order");
				return null;
			}

			return data;
		} catch (err) {
			console.error(err);
			alert("Terjadi kesalahan");
			return null;
		}
	};

	// =====================================
	// FETCH TRIPS
	// =====================================

	useEffect(() => {
		if (!origin_id || !destination_id || !date) return;

		const fetchTrips = async () => {
			try {
				const payload = {
					origin_point_id: origin_id,
					destination_point_id: destination_id,
					date: date,
				};

				// hanya kirim vehicle_type kalau bukan all
				if (vehicle_type && vehicle_type !== "all") {
					payload.vehicle_type = vehicle_type;
				}

				const response = await fetch("http://127.0.0.1:8000/api/trips/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(payload),
				});

				const data = await response.json();

				// =====================================
				// FILTER SIZE BARANG
				// dokumen -> bisa semua
				// kecil -> kecil sedang besar
				// sedang -> sedang besar
				// besar -> besar saja
				// =====================================

				// =====================================
				// FILTER SIZE BARANG
				// =====================================

				// ukuran request customer (kg minimum)
				const sizeMap = {
					xxs: 0.5,
					xs: 1,
					kecil: 5,
					sedang: 10,
					besar: 15,
				};

				const requestedWeight = sizeMap[size?.toLowerCase()] || 0.5;

				// kategori kapasitas trip
				const getTripSizeCategory = (seat) => {
					if (seat >= 15) return "besar";
					if (seat >= 10) return "sedang";
					if (seat >= 5) return "kecil";
					if (seat >= 1) return "xs";

					return "xxs";
				};

				const filteredTrips = data.filter((trip) => {
					const tripSize = getTripSizeCategory(trip.seat_available);

					// =====================================
					// FILTER KATEGORI SIZE
					// =====================================

					let allowed = false;

					switch (size?.toLowerCase()) {
						case "xxs":
							allowed = true;
							break;

						case "xs":
							allowed = ["xs", "kecil", "sedang", "besar"].includes(tripSize);
							break;

						case "kecil":
							allowed = ["kecil", "sedang", "besar"].includes(tripSize);
							break;

						case "sedang":
							allowed = ["sedang", "besar"].includes(tripSize);
							break;

						case "besar":
							allowed = ["besar"].includes(tripSize);
							break;

						default:
							allowed = true;
					}

					// =====================================
					// FILTER KAPASITAS REAL
					// =====================================

					const enoughCapacity = trip.seat_available >= requestedWeight;

					return allowed && enoughCapacity;
				});

				const formattedTrips = filteredTrips.map((trip) => ({
					id: trip.id,

					from: trip.origin_point.city.name,
					fromPos: trip.origin_point.pos_name,
					fromDetail: trip.origin_point.address,

					to: trip.destination_point.city.name,
					toPos: trip.destination_point.pos_name,
					toDetail: trip.destination_point.address,

					time: trip.departure_time,
					date: trip.departure_date,

					price: trip.price,

					vehicle_type: trip.vehicle_type,

					seat_available: trip.seat_available,
				}));

				setRides(formattedTrips);
			} catch (error) {
				console.error("Error fetch trips:", error);
			}
		};

		fetchTrips();
	}, [origin_id, destination_id, date, vehicle_type, size]);

	// =====================================
	// PROCESS RIDES
	// =====================================

	const processedRides = useMemo(() => {
		let result = [...rides];

		// FILTER DARI PAGE NEBENG BARANG
		if (searchParams.get("origin")) {
			const originCity = cleanLocation(searchParams.get("origin"));

			result = result.filter((ride) => ride.from.toLowerCase().includes(originCity));
		}

		if (searchParams.get("destination")) {
			const destinationCity = cleanLocation(searchParams.get("destination"));

			result = result.filter((ride) => ride.to.toLowerCase().includes(destinationCity));
		}

		// FILTER SEARCH
		if (searchTerm) {
			result = result.filter((ride) => ride.from.toLowerCase().includes(searchTerm.toLowerCase()) || ride.to.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		// SORTING
		if (sortBy === "termurah") {
			result.sort((a, b) => a.price - b.price);
		} else if (sortBy === "tercepat") {
			result.sort((a, b) => a.time.localeCompare(b.time));
		}

		return result;
	}, [rides, searchTerm, sortBy, searchParams]);

	// =====================================
	// ICON VEHICLE
	// =====================================

	const getVehicleIcon = (type) => {
		switch (type) {
			case "Barang-Motor":
				return <Bike size={16} />;

			case "Barang-Mobil":
				return <Car size={16} />;

			case "Barang-Pesawat":
				return <Plane size={16} />;

			case "Barang-Kapal":
				return <Ship size={16} />;

			case "Barang-Kereta":
				return <Train size={16} />;

			case "Barang-Bus":
				return <Bus size={16} />;

			default:
				return <Package size={16} />;
		}
	};

	return (
		<CustomerLayout>
			<div className="w-full max-w-7xlto px-4 py-6">
				{/* HEADER */}
				<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="flex items-center gap-4">
						<Link to="/customer/nebeng-barang">
							<button aria-label="Kembali" className="p-2 md:p-3 bg-gray-50 rounded-2xl hover:bg-indigo-900 hover:text-white transition-all duration-300 shadow-sm group">
								<ChevronLeft size={20} className="group-active:-translate-x-1 transition-transform" />
							</button>
						</Link>

						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
							<div className="flex items-center gap-2 text-lg sm:text-xl font-black text-indigo-900 tracking-tight">
								<span className="max-w-27.5 sm:max-w-none truncate">{originInfo?.city || "-"}</span>

								<ArrowRight size={18} className="text-gray-300 hidden sm:inline" />

								<span className="max-w-27.5 sm:max-w-none truncate">{destinationInfo?.city || "-"}</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto justify-end">
						<div className="relative flex-1 md:flex-none">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

							<input
								type="text"
								placeholder="Cari kota..."
								className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-full md:w-64"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<select
							className="bg-indigo-50 text-indigo-900 px-3 md:px-4 py-2.5 rounded-2xl text-sm font-bold outline-none border-none cursor-pointer hover:bg-indigo-100 transition-colors"
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
						>
							<option value="default">Urutkan</option>
							<option value="termurah">Termurah</option>
							<option value="tercepat">Lebih awal</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* SIDEBAR */}
					<div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
						<div className="bg-indigo-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
							<div className="relative z-10">
								<h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Informasi Perjalanan</h3>

								<div className="space-y-6">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
											<Clock size={20} className="text-sky-400" />
										</div>

										<div>
											<p className="text-[10px] font-bold text-indigo-200 uppercase">Tanggal</p>

											<p className="text-sm font-black">{date || "-"}</p>
										</div>
									</div>

									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
											<Users size={20} className="text-emerald-400" />
										</div>

										<div>
											<p className="text-[10px] font-bold text-indigo-200 uppercase">Kendaraan</p>

											<p className="text-sm font-black">{vehicle_type === "all" ? "Semua Kendaraan" : vehicle_type?.replace("Barang-", "") || "-"}</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
							<div className="flex items-center gap-2 mb-6">
								<Filter size={18} className="text-indigo-600" />

								<h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider">Tips Memilih</h4>
							</div>

							<p className="text-xs text-gray-500 leading-relaxed italic">"Pastikan kapasitas kendaraan sesuai dengan ukuran barang Anda."</p>
						</div>
					</div>

					{/* LIST ORDER */}
					<div className="lg:col-span-8 space-y-6">
						{processedRides.length > 0 ? (
							processedRides.map((ride) => (
								<div key={ride.id} className="group bg-white rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
									<div className="p-8">
										<div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
											<div>
												<p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{ride.date}</p>
												<p className="text-lg font-black text-indigo-900">{ride.time}</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2">
													<CheckCircle2 size={16} className="text-emerald-600" />

													<span className="text-xs font-black text-emerald-700 uppercase">Tersedia</span>
												</div>

												<div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
													{getVehicleIcon(ride.vehicle_type)}

													<span className="text-xs font-black text-indigo-700 uppercase">{ride.vehicle_type?.replace("Barang-", "")}</span>
												</div>
											</div>
										</div>

										<div className="relative pl-8 space-y-8 mb-8">
											<div className="absolute left-3.25 top-2.5 bottom-2.5 w-0.5 bg-dashed bg-gray-100"></div>

											<div className="relative">
												<div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-md"></div>
												<div className="flex items-center gap-2 mb-1">
													<h5 className="font-black text-gray-800 text-base">{ride.from}</h5>
													<span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase">{ride.fromPos}</span>
												</div>
												<p className="text-xs text-gray-400 leading-relaxed font-medium">{ride.fromDetail}</p>
											</div>

											<div className="relative">
												<div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-4 border-white bg-orange-500 shadow-md"></div>
												<div className="flex items-center gap-2 mb-1">
													<h5 className="font-black text-gray-800 text-base">{ride.to}</h5>
													<span className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg uppercase">{ride.toPos}</span>
												</div>
												<p className="text-xs text-gray-400 leading-relaxed font-medium">{ride.toDetail}</p>
											</div>
										</div>

										<div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
											<div className="flex flex-col">
												<span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Biaya</span>
												<span className="text-2xl font-black text-indigo-900 tracking-tighter">Rp. {ride.price.toLocaleString("id-ID")}</span>
											</div>
											<button
												onClick={async () => {
													const result = await handleOrder(ride.id);

													if (!result) return;

													navigate(`/customer/detail-order/${ride.id}?type=barang`, {
														state: {
															order: result.order,
															item_order: result.item_order,
															image,
															preview,
															size,
															description,
														},
													});
												}}
												className="w-full sm:w-auto inline-block px-10 py-4 bg-indigo-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-800 active:scale-95 transition-all text-center"
											>
												Pilih
											</button>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
								<div className="bg-gray-50 p-6 rounded-full mb-4">
									<Navigation size={48} className="text-gray-200" />
								</div>
								<h3 className="text-lg font-bold text-indigo-900">Driver Tidak Ditemukan</h3>
								<p className="text-sm text-gray-400">Coba gunakan kata kunci pencarian driver yang lain.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</CustomerLayout>
	);
}