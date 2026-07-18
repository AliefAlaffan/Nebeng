import React, { useEffect, useState } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { MapPin, MessageCircle, ChevronLeft, Navigation, CheckCircle2, Clock3, ChevronUp, ChevronDown, Milestone, Maximize2, Crosshair } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import QRCode from "react-qr-code";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ================= CUSTOM MAP ICONS =================
const mitraIcon = L.divIcon({
	className: "",
	html: `
        <div style="
            width: 18px;
            height: 18px;
            background: #ef4444;
            border: 4px solid white;
            border-radius: 9999px;
            box-shadow: 0 0 0 6px rgba(239,68,68,0.25);
        "></div>
    `,
	iconSize: [18, 18],
	iconAnchor: [9, 9],
});

const destinationIcon = new L.Icon({
	iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
	iconSize: [36, 36],
	iconAnchor: [18, 36],
});

// ================= HELPER =================
const getClosestRouteIndex = (position, route) => {
	if (!position || route.length === 0) return 0;

	let closestIndex = 0;
	let closestDistance = Infinity;

	route.forEach((point, index) => {
		const latDiff = point[0] - position[0];
		const lngDiff = point[1] - position[1];

		const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestIndex = index;
		}
	});

	return closestIndex;
};

// ================= RECENTER BUTTON =================
function RecenterButton({ position }) {
	const map = useMap();

	const handleRecenter = () => {
		if (!position) return;

		map.flyTo(position, 16, {
			duration: 1.5,
		});
	};

	return (
		<button
			onClick={handleRecenter}
			className="
				absolute bottom-32 right-5 z-[1000]
				w-14 h-14 rounded-2xl
				bg-white backdrop-blur-md
				border border-cyan-400/30
				shadow-2xl shadow-cyan-500/20
				flex items-center justify-center
				text-cyan-400
				hover:scale-105
				active:scale-95
				transition-all
			"
		>
			<Crosshair size={24} />
		</button>
	);
}

const STATUS_CONFIG = {
	active: {
		badge: "Trip Aktif",
		button: "Siap Berangkat",
		next: "waiting_departure",
	},

	waiting_departure: {
		badge: "Menunggu Keberangkatan",
		button: "Mulai Perjalanan",
		next: "on_the_way",
	},

	on_the_way: {
		badge: "Dalam Perjalanan",
		button: "Sampai di Pos Tujuan",
		next: "arrived_destination",
	},

	arrived_destination: {
		badge: "Sudah Sampai",
		button: "Lihat Detail Tebengan",
		next: null,
	},

	completed: {
		badge: "Trip Selesai",
		button: "Perjalanan Selesai",
		next: null,
	},
};

export default function PerjalananMitra() {
	const navigate = useNavigate();
	const { tripId } = useParams();
	const [tripStatus, setTripStatus] = useState("waiting_departure");
	const [isPanelExpanded, setIsPanelExpanded] = useState(true);

	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);

	const [showDepartureQR, setShowDepartureQR] = useState(false);
	const [departureQR, setDepartureQR] = useState(null);
	const [loadingQR, setLoadingQR] = useState(false);

	const [originPoint, setOriginPoint] = useState(null);
	const [destinationPoint, setDestinationPoint] = useState(null);

	const [routePath, setRoutePath] = useState([]);

	const [customers, setCustomers] = useState([]);

	const [currentPosition, setCurrentPosition] = useState(null);
	const [activeRoute, setActiveRoute] = useState([]);

	useEffect(() => {
		const fetchJourney = async () => {
			try {
				const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}`);

				const data = await response.json();

				console.log("JOURNEY:", data);

				setTrip(data);

				setTripStatus(data.status);

				setOriginPoint({
					name: data.origin_point.pos_name,
					address: data.origin_point.address,
					coords: [Number(data.origin_point.latitude), Number(data.origin_point.longitude)],
				});

				setDestinationPoint({
					name: data.destination_point.pos_name,
					address: data.destination_point.address,
					coords: [Number(data.destination_point.latitude), Number(data.destination_point.longitude)],
				});

				// CUSTOMER PERTAMA
				if (data.orders?.length > 0) {
					const formattedCustomers = data.orders.map((order) => ({
						id: order.user?.id,
						name: order.user?.name || `Customer #${order.customer_id}`,

						photo: order.user?.avatar ? `http://127.0.0.1:8000/storage/${order.user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.user?.name || "Customer"}`,

						phone: order.user?.phone || "",

						type: data.vehicle_type === "barang" ? "Pengirim Barang" : "Penumpang Perjalanan",
					}));

					setCustomers(formattedCustomers);
				}

				// GEOJSON ROUTE
				if (data.route_geojson) {
					const geo = typeof data.route_geojson === "string" ? JSON.parse(data.route_geojson) : data.route_geojson;

					if (geo.coordinates) {
						const formatted = geo.coordinates.map((coord) => [coord[1], coord[0]]);

						setRoutePath(formatted);
					}
				}

				// TRACKING TERBARU
				if (data.latest_tracking) {
					setCurrentPosition([Number(data.latest_tracking.latitude), Number(data.latest_tracking.longitude)]);
				} else {
					setCurrentPosition([Number(data.origin_point.latitude), Number(data.origin_point.longitude)]);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};

		fetchJourney();
	}, [tripId]);

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/journey`);

				const data = await response.json();

				if (data.trip?.status) {
					setTripStatus(data.trip.status);
				}
			} catch (err) {
				console.error(err);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [tripId]);

	useEffect(() => {
		if (tripStatus !== "on_the_way") return;

		let watchId;

		if (navigator.geolocation) {
			watchId = navigator.geolocation.watchPosition(
				async (position) => {
					const latitude = position.coords.latitude;
					const longitude = position.coords.longitude;

					setCurrentPosition([latitude, longitude]);

					try {
						await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/tracking`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
							},
							body: JSON.stringify({
								latitude,
								longitude,
							}),
						});
					} catch (err) {
						console.error("Tracking error:", err);
					}
				},
				(error) => {
					console.error(error);
				},
				{
					enableHighAccuracy: true,
					maximumAge: 0,
					timeout: 5000,
				},
			);
		}

		return () => {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId);
			}
		};
	}, [tripStatus, tripId]);

	// ================= DYNAMIC ROUTE =================
	useEffect(() => {
		if (!currentPosition || routePath.length === 0) return;

		const closestIndex = getClosestRouteIndex(currentPosition, routePath);

		const slicedRoute = routePath.slice(closestIndex);

		setActiveRoute(slicedRoute);
	}, [currentPosition, routePath]);

	const handleStatusAction = async () => {
		// ===============================
		// KHUSUS SUDAH SAMPAI TUJUAN
		// ===============================
		if (tripStatus === "waiting_departure") {
			try {
				setLoadingQR(true);

				const token = localStorage.getItem("token");

				const response = await fetch(`http://127.0.0.1:8000/api/mitra/trips/${tripId}/generate-departure-qr`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});

				const data = await response.json();

				console.log("DEPARTURE QR:", data);

				if (!response.ok) {
					console.error(data);
					return;
				}

				setDepartureQR(data);
				setShowDepartureQR(true);
			} catch (err) {
				console.error(err);
			} finally {
				setLoadingQR(false);
			}

			return;
		}

		if (tripStatus === "arrived_destination") {
			navigate(`/mitra/detail-tebengan/${tripId}`);
			return;
		}

		const nextStatus = STATUS_CONFIG[tripStatus]?.next;

		if (!nextStatus) return;

		try {
			const token = localStorage.getItem("token");

			const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/status`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					status: nextStatus,
				}),
			});

			const data = await response.json();

			console.log("STATUS UPDATED:", data);

			if (!response.ok) {
				console.error(data);
				return;
			}

			setTripStatus(nextStatus);

			setTrip((prev) => ({
				...prev,
				status: nextStatus,
			}));

			if (nextStatus === "arrived_destination") {
				setCurrentPosition(destinationPoint.coords);
			}
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (!showDepartureQR) return;

		const interval = setInterval(async () => {
			try {
				const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}`);

				const data = await response.json();

				if (data.status === "on_the_way") {
					setTripStatus("on_the_way");
					setShowDepartureQR(false);
				}
			} catch (err) {
				console.error(err);
			}
		}, 3000);

		return () => clearInterval(interval);
	}, [showDepartureQR, tripId]);

	if (loading || !originPoint || !destinationPoint) {
		return (
			<MitraLayout>
				<div className="h-screen flex items-center justify-center">
					<div className="text-indigo-900 font-black text-xl">Loading perjalanan...</div>
				</div>
			</MitraLayout>
		);
	}

	return (
		<MitraLayout>
			{/* Main Wrapper: Menggunakan Grid sistem split-screen pada desktop */}
			<div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-gray-50 font-sans grid grid-cols-1 lg:grid-cols-12">
				{/* ================= SISI MAPS (12 Kolom di mobile, 7 Kolom di Desktop) ================= */}
				<div className="relative w-full h-full lg:col-span-7 z-0">
					<MapContainer center={originPoint.coords} zoom={11} scrollWheelZoom={true} className="h-full w-full">
						<TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
						<Marker position={currentPosition || originPoint.coords} icon={mitraIcon}>
							<Popup>Posisi Anda Saat Ini</Popup>
						</Marker>
						<Marker position={destinationPoint.coords} icon={destinationIcon}>
							<Popup>{destinationPoint.name}</Popup>
						</Marker>
						<RecenterButton position={currentPosition || originPoint.coords} />
						<Polyline
							positions={tripStatus === "completed" ? routePath : activeRoute.length > 0 ? activeRoute : routePath}
							pathOptions={{
								color: "#1e1b4b",
								weight: 6,
								opacity: 0.8,
							}}
						/>
					</MapContainer>

					{/* FLOATING FLOATING TOP OVERLAY (Mobile & Desktop) */}
					<div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
						<button onClick={() => navigate(-1)} className="mx-8 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center border border-gray-100 active:scale-95 transition-all pointer-events-auto">
							<ChevronLeft size={24} className="text-indigo-900" />
						</button>

						{/* STATUS FLOATING BADGE */}
						<div className="bg-indigo-900 text-white rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top-2">
							<Clock3 size={14} className="text-sky-400 animate-pulse" />
							<span className="text-xs font-black uppercase tracking-widest">{STATUS_CONFIG[tripStatus]?.badge || "Perjalanan"}</span>
						</div>
					</div>
				</div>

				{/* ================= SISI DETAIL PANEL / BOTTOM CARD (5 Kolom di Desktop) ================= */}
				<div
					className={`
                    absolute bottom-0 left-0 right-0 lg:relative lg:col-span-5 bg-white 
                    shadow-[0_-10px_30px_rgba(30,27,75,0.08)] lg:shadow-none z-[1000] lg:z-10
                    transition-all duration-500 ease-in-out border-t lg:border-t-0 lg:border-l border-gray-100
                    ${isPanelExpanded ? "h-[60vh] md:h-[50vh] lg:h-full" : "h-24 lg:h-full"}
                `}
				>
					{/* TOGGLE PANEL HANDLE (Hanya muncul di Mobile) */}
					<div className="flex flex-col items-center justify-center py-2 bg-gray-50/50 border-b border-gray-50 cursor-pointer lg:hidden" onClick={() => setIsPanelExpanded(!isPanelExpanded)}>
						<div className="w-12 h-1 bg-gray-300 rounded-full mb-1"></div>
						<button className="text-indigo-900 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
							{isPanelExpanded ? (
								<>
									<ChevronDown size={14} /> Sembunyikan
								</>
							) : (
								<>
									<ChevronUp size={14} /> Lihat Detail
								</>
							)}
						</button>
					</div>

					{/* CONTENT SCROLLABLE PANELS */}
					<div className="h-[calc(100%-40px)] lg:h-full overflow-y-auto p-6 space-y-6 no-scrollbar">
						{/* CUSTOMER INFO BLOCK */}
						<div className="space-y-3">
							<h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Customer Perjalanan</h3>

							{customers.length > 0 ? (
								customers.map((customer) => (
									<div key={customer.id} className="bg-indigo-50/50 border border-indigo-50 rounded-3xl p-4 flex items-center justify-between">
										<div className="flex items-center gap-4 min-w-0">
											<img src={customer.photo} alt={customer.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-white" />

											<div className="min-w-0">
												<h2 className="font-black text-gray-800 text-base truncate">{customer.name}</h2>

												<span className="inline-block mt-0.5 bg-indigo-900 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">{customer.type}</span>
											</div>
										</div>

										<div className="shrink-0">
											<button
												onClick={() => navigate("/mitra/pesan-mitra")}
												className="
			w-11 h-11 rounded-xl
			bg-indigo-900 text-white
			flex items-center justify-center
			shadow-md
			hover:bg-indigo-800
			transition-all
			active:scale-95
		"
											>
												<MessageCircle size={18} />
											</button>
										</div>
									</div>
								))
							) : (
								<div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-6 text-center">
									<p className="text-sm font-bold text-gray-400">Belum ada customer</p>
								</div>
							)}
						</div>

						{/* TRIP STATS */}
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jarak Tempuh</p>
								<p className="text-xl font-black text-indigo-900 mt-1">{trip?.estimated_distance_km || 0} KM</p>
							</div>
							<div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimasi Waktu</p>
								<p className="text-xl font-black text-indigo-900 mt-1">{trip?.estimated_duration_min || 0} Menit</p>
							</div>
						</div>

						{/* TIMELINE ROUTE DESCRIPTIONS */}
						<div className="space-y-4 pt-2">
							<h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Rute Perjalanan</h3>

							<div className="relative pl-8 space-y-6">
								<div className="absolute left-3 top-2 bottom-2 w-0.5 bg-indigo-100 border-l border-dashed border-indigo-300"></div>

								{/* Titik Asal */}
								<div className="relative">
									<div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-md"></div>
									<h4 className="text-sm font-black text-gray-800">{originPoint.name}</h4>
									<p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed line-clamp-2">{originPoint.address}</p>
								</div>

								{/* Titik Tujuan */}
								<div className="relative">
									<div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-orange-500 shadow-md"></div>
									<h4 className="text-sm font-black text-gray-800">{destinationPoint.name}</h4>
									<p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed line-clamp-2">{destinationPoint.address}</p>
								</div>
							</div>
						</div>

						{/* MAIN ACTION BUTTON */}
						<div className="pt-4 sticky bottom-0 bg-white space-y-3">
							<button
								onClick={handleStatusAction}
								disabled={tripStatus === "completed"}
								className={`w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl
            ${tripStatus === "completed" ? "bg-emerald-500 shadow-emerald-100" : "bg-indigo-900 shadow-indigo-100 hover:bg-indigo-800"}
        `}
							>
								{tripStatus === "completed" ? (
									<>
										<CheckCircle2 size={18} />
										Perjalanan Selesai
									</>
								) : (
									<>
										{STATUS_CONFIG[tripStatus]?.button}
										<Navigation size={16} className="transform rotate-45" />
									</>
								)}
							</button>

							{/* BUTTON RATING CUSTOMER */}
							{tripStatus === "completed" && customers.length > 0 && (
								<div className="space-y-3">
									{customers.map((customer) => (
										<button
											key={customer.id}
											onClick={() => navigate(`/mitra/beri-rating/${tripId}/${customer.id}`)}
											className="
					w-full py-4.5 rounded-2xl
					font-black text-sm uppercase tracking-widest
					bg-indigo-900 text-white
					shadow-xl shadow-indigo-100
					hover:bg-indigo-800
					transition-all duration-300
					active:scale-[0.98]
					flex items-center justify-center gap-3
				"
										>
											<Milestone size={18} />
											Beri Rating {customer.name}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Utility Styles */}
			<style>{`
				.no-scrollbar::-webkit-scrollbar {
					display: none;
				}
				.no-scrollbar {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
			`}</style>

			{showDepartureQR && (
				<div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-5">
						<h2 className="text-xl font-black text-indigo-900">QR Keberangkatan</h2>

						<p className="text-sm text-gray-500">Tunjukkan QR ini kepada Pos Mitra untuk memulai perjalanan.</p>

						<div className="bg-white p-4 rounded-2xl flex justify-center">
							{departureQR && (
								<QRCode
									value={JSON.stringify({
										type: "departure",
										token: departureQR.token,
									})}
									size={220}
								/>
							)}
						</div>

						<button onClick={() => setShowDepartureQR(false)} className="w-full py-3 rounded-2xl bg-gray-100 font-black">
							Tutup
						</button>
					</div>
				</div>
			)}
		</MitraLayout>
	);
}
