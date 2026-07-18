import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, MapPin, Calendar, ArrowRight, History, Navigation } from "lucide-react";

export default function NebengMobil() {
	const navigate = useNavigate();

	// ================= STATE =================

	const [origin, setOrigin] = useState("");
	const [destination, setDestination] = useState("");
	const [date, setDate] = useState("");
	const [pickupPoints, setPickupPoints] = useState([]);
	const [showOriginDropdown, setShowOriginDropdown] = useState(false);
	const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
	const [filteredOrigin, setFilteredOrigin] = useState([]);
	const [filteredDestination, setFilteredDestination] = useState([]);
	const originRef = useRef(null);
	const destinationRef = useRef(null);
	const [selectedOrigin, setSelectedOrigin] = useState(null);
	const [selectedDestination, setSelectedDestination] = useState(null);

	// Data dummy untuk histori alamat sesuai gambar
	const historyAddresses = [
		{ id: 1, title: "Yogyakarta - Pos 1", detail: "Patehan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55133" },
		{ id: 2, title: "Yogyakarta - Pos 1", detail: "Patehan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55133" },
		{ id: 3, title: "Yogyakarta - Pos 1", detail: "Patehan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55133" },
	];

	// ================= HANDLE SEARCH =================

	const handleNext = () => {
		if (!origin || !destination || !date) {
			alert("Mohon isi lokasi dan tanggal keberangkatan");
			return;
		}

		navigate(`/customer/order-mobil?origin_id=${selectedOrigin.id}&destination_id=${selectedDestination.id}&date=${date}`);
	};

	// fungsi untuk menangani perubahan input lokasi awal
	const handleOriginChange = (e) => {
		const value = e.target.value;
		setOrigin(value);
		setSelectedOrigin(null);

		if (value.length > 0) {
			const filtered = pickupPoints.filter((p) => {
				const city = p.city?.toLowerCase() || "";
				const pos = p.pos_name?.toLowerCase() || "";
				const address = p.address?.toLowerCase() || "";

				return city.includes(value.toLowerCase()) || pos.includes(value.toLowerCase()) || address.includes(value.toLowerCase());
			});

			setFilteredOrigin(filtered);
			setShowOriginDropdown(true);
			setShowDestinationDropdown(false);
		} else {
			setShowOriginDropdown(false);
		}
	};

	// fungsi untuk menangani perubahan input lokasi tujuan
	const handleDestinationChange = (e) => {
		const value = e.target.value;
		setDestination(value);
		setSelectedDestination(null);

		if (value.length > 0) {
			const filtered = pickupPoints.filter((p) => {
				const city = p.city?.toLowerCase() || "";
				const pos = p.pos_name?.toLowerCase() || "";
				const address = p.address?.toLowerCase() || "";

				return city.includes(value.toLowerCase()) || pos.includes(value.toLowerCase()) || address.includes(value.toLowerCase());
			});

			setFilteredDestination(filtered);
			setShowDestinationDropdown(true);
			setShowOriginDropdown(false);
		} else {
			setShowDestinationDropdown(false);
		}
	};

	// ================= SELECT HISTORY =================

	const selectHistory = (address) => {
		setOrigin(address);
	};

	useEffect(() => {
		const fetchPickupPoints = async () => {
			try {
				const response = await fetch("http://127.0.0.1:8000/api/pickup-points");
				const data = await response.json();
				setPickupPoints(data);
			} catch (error) {
				console.error("Error fetching pickup points:", error);
			}
		};

		const handleClickOutside = (event) => {
			if (originRef.current && !originRef.current.contains(event.target)) {
				setShowOriginDropdown(false);
			}

			if (destinationRef.current && !destinationRef.current.contains(event.target)) {
				setShowDestinationDropdown(false);
			}
		};

		fetchPickupPoints();
		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<CustomerLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6 pb-32">
				{/* HEADER & BACK BUTTON */}
				<div className="flex items-center gap-4 mb-8">
					<Link to="/customer/dashboard">
						<button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
							<ChevronLeft className="w-6 h-6 text-indigo-900" />
						</button>
					</Link>
					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Nebeng Mobil</h1>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* SISI KIRI: Form Input Lokasi & Tanggal (7 Kolom) */}
					<div className="lg:col-span-7 space-y-6">
						<div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
							<div className="relative space-y-8">
								{/* Garis Penghubung antar Lokasi */}
								<div className="absolute left-[19px] top-[40px] bottom-[40px] w-[2px] bg-dashed bg-gray-100"></div>

								{/* Input Lokasi Awal */}
								<div className="flex items-start gap-4 relative z-10">
									<div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
										<Navigation size={20} className="text-white transform rotate-45" />
									</div>
									<div ref={originRef} className="flex-1 relative">
										<label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Lokasi Awal</label>
										<input
											type="text"
											placeholder="Kabupaten asal"
											value={origin}
											onChange={handleOriginChange}
											className="w-full text-lg font-bold text-gray-800 border-b-2 border-gray-50 py-2 focus:outline-none focus:border-indigo-600 transition-colors placeholder:text-gray-300 placeholder:font-medium"
										/>
										{selectedOrigin && <p className="text-xs text-gray-400 mt-1">{selectedOrigin.address}</p>}
										{showOriginDropdown && filteredOrigin.length > 0 && (
											<div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
												{filteredOrigin.slice(0, 5).map((point) => (
													<div
														key={point.id}
														onClick={() => {
															setSelectedOrigin(point);
															setOrigin(`${point.city} - ${point.pos_name}`);
															setShowOriginDropdown(false);
														}}
														className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-100"
													>
														<p className="text-sm font-bold text-gray-800">
															{point.city} - {point.pos_name}
														</p>

														<p className="text-xs text-gray-400">{point.address}</p>
													</div>
												))}
											</div>
										)}
									</div>
								</div>

								{/* Input Lokasi Tujuan */}
								<div className="flex items-start gap-4 relative z-9">
									<div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
										<MapPin size={20} className="text-white" />
									</div>
									<div className="flex-1">
										<label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Lokasi Tujuan</label>
										<div ref={destinationRef} className="relative">
											<input
												type="text"
												placeholder="Kabupaten tujuan"
												value={destination}
												onChange={handleDestinationChange}
												className="w-full text-lg font-bold text-gray-800 border-b-2 border-gray-50 py-2 focus:outline-none focus:border-indigo-600 transition-colors placeholder:text-gray-300 placeholder:font-medium"
											/>
											{selectedDestination && <p className="text-xs text-gray-400 mt-1">{selectedDestination.address}</p>}
											{showDestinationDropdown && filteredDestination.length > 0 && (
												<div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
													{filteredDestination.slice(0, 5).map((point) => (
														<div
															key={point.id}
															onClick={() => {
																setSelectedDestination(point);
																setDestination(`${point.city} - ${point.pos_name}`);
																setShowDestinationDropdown(false);
															}}
															className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-100"
														>
															<p className="text-sm font-bold text-gray-800">
																{point.city} - {point.pos_name}
															</p>

															<p className="text-xs text-gray-400">{point.address}</p>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Input Tanggal Keberangkatan */}
							<div className="mt-12 pt-8 border-t border-gray-50">
								<div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
									<div className="w-12 h-12 rounded-xl bg-indigo-900 flex items-center justify-center text-white shadow-lg">
										<Calendar size={24} />
									</div>

									<div className="flex-1">
										<p className="text-xs font-bold text-gray-400">TANGGAL KEBERANGKATAN</p>

										<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-lg font-black text-indigo-900 outline-none" />
									</div>

									<ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
								</div>
							</div>
						</div>

						{/* Button Selanjutnya */}
						<div className="pt-4">
							<button
								onClick={handleNext}
								className="w-full bg-indigo-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
							>
								Selanjutnya
								<ArrowRight size={24} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</CustomerLayout>
	);
}

// Sub-komponen Ikon pendukung
function ChevronRight({ className }) {
	return (
		<svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
		</svg>
	);
}
