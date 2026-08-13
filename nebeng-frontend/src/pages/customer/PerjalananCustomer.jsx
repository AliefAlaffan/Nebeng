import React, { useEffect, useState, useRef } from "react";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, MessageCircle, Navigation, Clock3, ChevronUp, ChevronDown, ShieldAlert, Car, MapPin, Crosshair, AlertTriangle, Loader2, PhoneCall } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import QRCode from "react-qr-code";
import SuccessPopup from "../../components/ui/SuccessPopup";
import AlertModal from "../../components/ui/AlertModal";
import axios from "../../api/axios";

// ================= CUSTOM MAP ICONS =================
const driverIcon = L.divIcon({
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

export default function PerjalananCustomer() {
    const navigate = useNavigate();
    const { tripId } = useParams();

    const [tripStatus, setTripStatus] = useState("waiting_departure");
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    // --- State Pembatalan ---
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // --- State SOS Darurat ---
    const [showSosModal, setShowSosModal] = useState(false);
    const [loadingSos, setLoadingSos] = useState(false);

    // --- State Popup Alert Kustom (pengganti window.alert bawaan browser) ---
    const [alertInfo, setAlertInfo] = useState({ show: false, type: "success", title: "", message: "" });

    // --- Real-time driver position simulation ---
    const [driverPosition, setDriverPosition] = useState(null);
    const [activeRoute, setActiveRoute] = useState([]);
    const [qrData, setQrData] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [justVerified, setJustVerified] = useState(false);
    const prevReadinessRef = useRef(null);

    const order = trip?.orders?.[0];

    const showQrButton = tripStatus === "waiting_departure" && order?.readiness_status === "waiting";
    const showReadyInfo = tripStatus === "waiting_departure" && order?.readiness_status === "ready";

    // Begitu Pos Mitra berhasil verifikasi QR customer, tutup modal dan tampilkan popup
    useEffect(() => {
        const current = order?.readiness_status;

        if (prevReadinessRef.current === "waiting" && current && current !== "waiting") {
            if (showQR) setShowQR(false);
            setJustVerified(true);
        }

        prevReadinessRef.current = current ?? prevReadinessRef.current;
    }, [order?.readiness_status, showQR]);

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/journey`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                const data = await res.json();
                setTrip(data.trip);

                if (data.latest_tracking) {
                    setDriverPosition([Number(data.latest_tracking.latitude), Number(data.latest_tracking.longitude)]);
                }

                if (data.trip.status === "waiting_departure") setTripStatus("waiting_departure");
                if (data.trip.status === "on_the_way") setTripStatus("on_the_way");
                if (data.trip.status === "arrived_destination") setTripStatus("arrived_destination");
                if (data.trip.status === "completed") setTripStatus("completed");
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
        const interval = setInterval(fetchTrip, 4000);
        return () => clearInterval(interval);
    }, [tripId]);

    const handleGenerateQR = async () => {
        try {
            const token = localStorage.getItem("token");
            const orderId = trip?.orders?.[0]?.id;

            if (!orderId) {
                alert("Order tidak ditemukan");
                return;
            }

            const response = await fetch(`http://127.0.0.1:8000/api/customer/orders/${orderId}/generate-qr`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.message);
                return;
            }

            setQrData(data);
            setShowQR(true);
        } catch (error) {
            console.error(error);
        }
    };

    // --- Fungsi Eksekusi Pembatalan ---
    const confirmCancelOrder = async () => {
        if (!order?.id) {
            alert("ID Pesanan tidak ditemukan.");
            return;
        }

        try {
            setLoadingCancel(true);
            const response = await axios.post(`/orders/${order.id}/cancel`);

            setShowCancelModal(false);
            setAlertInfo({
                show: true,
                type: "success",
                title: "Pesanan Dibatalkan",
                message: response.data.message,
            });

        } catch (err) {
            console.error("Gagal membatalkan pesanan:", err);
            setAlertInfo({
                show: true,
                type: "error",
                title: "Gagal Membatalkan",
                message: err.response?.data?.message || "Terjadi kesalahan saat membatalkan pesanan.",
            });
        } finally {
            setLoadingCancel(false);
        }
    };

    const handleSendSos = async () => {
        try {
            setLoadingSos(true); // Opsional: jika ingin mengaktifkan state loading di modal SOS
            const response = await axios.post(`/trips/${tripId}/sos`, {
                latitude: driverPosition ? driverPosition[0] : null,
                longitude: driverPosition ? driverPosition[1] : null,
            });
            setShowSosModal(false); // Menutup modal setelah berhasil
            setAlertInfo({
                show: true,
                type: "success",
                title: "SOS Terkirim",
                message: response.data.message,
            });
        } catch (error) {
            console.error("Gagal kirim SOS:", error.response?.data || error.message);
            setAlertInfo({
                show: true,
                type: "error",
                title: "Gagal Mengirim SOS",
                message: error.response?.data?.message || "Gagal mengirim SOS.",
            });
        } finally {
            setLoadingSos(false);
        }
    };

    const getVehicleDisplay = (vType) => {
        if (vType === "motor") return "Sepeda Motor";
        if (vType === "mobil") return "Mobil Passenger";
        if (vType === "Barang-Mobil") return "Mobil (Nebeng Barang)";
        if (vType === "Barang-Motor") return "Motor (Nebeng Barang)";
        return vType || "-";
    };

    const driver = {
        name: trip?.mitra?.name || "Mitra",
        photo: trip?.mitra?.avatar 
            ? `http://127.0.0.1:8000/storage/${trip.mitra.avatar}` 
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${trip?.mitra?.name || "Mitra"}`,
        vehicle: getVehicleDisplay(trip?.vehicle_type),
        type: trip?.vehicle_type?.includes("Barang") ? "Mitra Barang" : "Mitra Nebeng",
    };

    const pickupPoint = {
        name: trip?.origin_point?.pos_name || "Pos Asal",
        address: trip?.origin_point?.address || "-",
        coords: [parseFloat(trip?.origin_point?.latitude || 0), parseFloat(trip?.origin_point?.longitude || 0)],
    };

    const destinationPoint = {
        name: trip?.destination_point?.pos_name || "Pos Tujuan",
        address: trip?.destination_point?.address || "-",
        coords: [parseFloat(trip?.destination_point?.latitude || 0), parseFloat(trip?.destination_point?.longitude || 0)],
    };

    let routePath = [pickupPoint.coords, destinationPoint.coords];
    try {
        if (trip?.route_geojson) {
            const parsed = JSON.parse(trip.route_geojson);
            if (parsed?.coordinates) {
                routePath = parsed.coordinates.map((coord) => [coord[1], coord[0]]);
            }
        }
    } catch (err) {
        console.error("Route parse error:", err);
    }

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

    useEffect(() => {
        if (!tripId) return;

        const fetchLatestLocation = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/latest-location`);
                const data = await res.json();

                if (!res.ok) {
                    if (data.trip_status === "waiting_departure") setTripStatus("waiting_departure");
                    if (data.trip_status === "on_the_way") setTripStatus("on_the_way");
                    if (data.trip_status === "arrived_destination") setTripStatus("arrived_destination");
                    if (data.trip_status === "completed") setTripStatus("completed");
                    return;
                }

                if (data.latitude && data.longitude) {
                    setDriverPosition([Number(data.latitude), Number(data.longitude)]);
                }

                if (data.trip_status) {
                    if (data.trip_status === "waiting_departure") setTripStatus("waiting_departure");
                    if (data.trip_status === "on_the_way") setTripStatus("on_the_way");
                    if (data.trip_status === "arrived_destination") setTripStatus("arrived_destination");
                    if (data.trip_status === "completed") setTripStatus("completed");
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchLatestLocation();
        const interval = setInterval(fetchLatestLocation, 3000);
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        if (!driverPosition || routePath.length === 0) return;
        const closestIndex = getClosestRouteIndex(driverPosition, routePath);
        const slicedRoute = routePath.slice(closestIndex);
        setActiveRoute(slicedRoute);
    }, [driverPosition, routePath]);

    const currentDriverPosition = driverPosition || pickupPoint.coords;

    const getStatusBadgeText = () => {
        switch (tripStatus) {
            case "waiting_departure": return "Menunggu Keberangkatan";
            case "on_the_way": return "Dalam Perjalanan";
            case "arrived_destination": return "Sudah Sampai Tujuan";
            case "completed": return "Perjalanan Selesai";
            default: return "Perjalanan Aktif";
        }
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div className="p-10 text-center">Loading perjalanan...</div>
            </CustomerLayout>
        );
    }

    if (!trip) {
        return (
            <CustomerLayout>
                <div className="p-10 text-center">Trip tidak ditemukan</div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            {/* ================= MAIN WRAPPER ================= */}
            <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-gray-50 font-sans grid grid-cols-1 lg:grid-cols-12">
                {/* ================= MAP SECTION ================= */}
                <div className="relative w-full h-full lg:col-span-7 z-0">
                    <MapContainer center={pickupPoint.coords} zoom={10} scrollWheelZoom={true} className="h-full w-full">
                        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        <Marker position={currentDriverPosition} icon={driverIcon}>
                            <Popup>Posisi Driver</Popup>
                        </Marker>

                        <Marker position={destinationPoint.coords} icon={destinationIcon}>
                            <Popup>{destinationPoint.name}</Popup>
                        </Marker>
                        <RecenterButton position={currentDriverPosition} />
                        
                        <Polyline
                            positions={activeRoute.length > 0 ? activeRoute : routePath}
                            pathOptions={{ color: "#1e1b4b", weight: 6, opacity: 0.8 }}
                        />
                    </MapContainer>

                    <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
                        <button onClick={() => navigate(-1)} className="mx-8 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center border border-gray-100 active:scale-95 transition-all pointer-events-auto">
                            <ChevronLeft size={24} className="text-indigo-900" />
                        </button>

                        <div className="bg-indigo-900 text-white rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-2 border border-white/10">
                            <Clock3 size={14} className="text-sky-400 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest">{getStatusBadgeText()}</span>
                        </div>
                    </div>

                    <div className="absolute top-24 right-6 z-[1000]">
                        <button 
                            onClick={() => setShowSosModal(true)}
                            className="bg-white border-2 border-red-500 text-red-500 rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-red-500 hover:text-white transition-all animate-pulse"
                        >
                            SOS
                        </button>
                    </div>
                </div>

                {/* ================= DETAIL PANEL ================= */}
                <div
                    className={`
                    absolute bottom-0 left-0 right-0 lg:relative lg:col-span-5 bg-white 
                    shadow-[0_-10px_30px_rgba(30,27,75,0.08)] lg:shadow-none z-[1000] lg:z-10
                    transition-all duration-500 ease-in-out border-t lg:border-t-0 lg:border-l border-gray-100
                    ${isPanelExpanded ? "h-[60vh] md:h-[50vh] lg:h-full" : "h-24 lg:h-full"}
                `}
                >
                    <div className="flex flex-col items-center justify-center py-2 bg-gray-50/50 border-b border-gray-50 cursor-pointer lg:hidden" onClick={() => setIsPanelExpanded(!isPanelExpanded)}>
                        <div className="w-12 h-1 bg-gray-300 rounded-full mb-1"></div>
                        <button className="text-indigo-900 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                            {isPanelExpanded ? <><ChevronDown size={14} /> Sembunyikan</> : <><ChevronUp size={14} /> Lihat Detail</>}
                        </button>
                    </div>

                    <div className="h-[calc(100%-40px)] lg:h-full overflow-y-auto p-6 space-y-6 no-scrollbar">
                        {/* DRIVER INFO */}
                        <div className="bg-indigo-50/50 border border-indigo-50 rounded-3xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <img src={driver.photo} alt="Driver" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="font-black text-gray-800 text-base truncate">{driver.name}</h2>
                                    <span className="inline-block mt-0.5 bg-indigo-900 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">{driver.type}</span>
                                    <p className="text-xs text-gray-400 mt-2">{driver.vehicle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => navigate("/customer/pesan")} className="w-11 h-11 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-md hover:bg-indigo-800 transition-all active:scale-95">
                                    <MessageCircle size={18} />
                                </button>
                            </div>
                        </div>

                        {/* STATUS CARD */}
                        <div className={`rounded-3xl p-5 shadow-xl ${tripStatus === "waiting_departure" ? "bg-white border border-gray-100" : "bg-indigo-900 text-white"}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${tripStatus === "waiting_departure" ? "text-gray-400" : "text-sky-300"}`}>Status Perjalanan</p>
                                    <h2 className="text-xl font-black mt-2 leading-tight">
                                        {tripStatus === "waiting_departure" ? "Menunggu Perjalanan Dimulai" : tripStatus === "on_the_way" ? "Perjalanan Sedang Berlangsung" : tripStatus === "arrived_destination" ? "Sudah Sampai di Tujuan" : "Perjalanan Selesai"}
                                    </h2>
                                    <p className={`text-sm mt-3 leading-relaxed ${tripStatus === "waiting_departure" ? "text-gray-400" : "text-indigo-100"}`}>
                                        {tripStatus === "waiting_departure" ? "Driver sedang bersiap untuk memulai perjalanan." : tripStatus === "on_the_way" ? "Anda sedang menuju lokasi tujuan bersama driver." : tripStatus === "arrived_destination" ? "Driver telah sampai di lokasi tujuan." : "Perjalanan telah selesai."}
                                    </p>
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${tripStatus === "waiting_departure" ? "bg-indigo-50" : "bg-white/10"}`}>
                                    <Car size={30} className={tripStatus === "waiting_departure" ? "text-indigo-900" : "text-white"} />
                                </div>
                            </div>
                        </div>

                        {/* TRIP STATS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimasi Waktu</p>
                                <p className="text-xl font-black text-indigo-900 mt-1">{trip?.estimated_duration_min ? `${trip.estimated_duration_min} Menit` : "-"}</p>
                                <p className="text-xs text-gray-400 mt-1">{trip?.estimated_distance_km || 0} KM</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Biaya</p>
                                <p className="text-xl font-black text-indigo-900 mt-1">Rp {Number(trip.price || 0).toLocaleString("id-ID")}</p>
                            </div>
                        </div>

                        {/* ROUTE */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Rute Perjalanan</h3>
                            <div className="relative pl-8 space-y-6">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-indigo-100 border-l border-dashed border-indigo-300"></div>

                                <div className="relative">
                                    <div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-md"></div>
                                    <h4 className="text-sm font-black text-gray-800">{pickupPoint.name}</h4>
                                    <p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed line-clamp-2">{pickupPoint.address}</p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-4 border-white bg-orange-500 shadow-md"></div>
                                    <h4 className="text-sm font-black text-gray-800">{destinationPoint.name}</h4>
                                    <p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed line-clamp-2">{destinationPoint.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* CUSTOMER BELUM DIVERIFIKASI */}
                        {showQrButton && (
                            <div className="pt-2">
                                <button
                                    onClick={handleGenerateQR}
                                    className="w-full py-4 rounded-2xl bg-indigo-900 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-[0.98]"
                                >
                                    Tampilkan QR Verifikasi
                                </button>
                            </div>
                        )}

                        {/* TOMBOL BATALKAN PESANAN (Hanya muncul jika perjalanan belum selesai) */}
                        {tripStatus !== "completed" && (
                            <div className="pt-0">
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full py-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase tracking-widest transition-all active:scale-[0.99] border border-red-100 shadow-sm"
                                >
                                    Batalkan Pesanan
                                </button>
                            </div>
                        )}

                        {/* CUSTOMER SUDAH DIVERIFIKASI */}
                        {showReadyInfo && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">✓</div>
                                    <div>
                                        <h3 className="font-black text-emerald-700 text-sm uppercase tracking-wide">Anda Sudah Siap</h3>
                                        <p className="text-sm text-emerald-600 mt-1 leading-relaxed">Anda telah diverifikasi oleh Pos Mitra. Menunggu mitra memulai perjalanan.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SAFETY & SOS TRIGGER CARD */}
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 mt-1">
                                    <ShieldAlert size={18} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-red-700 text-sm uppercase tracking-wide">Fitur Keamanan</h3>
                                    <p className="text-xs text-red-500 mt-1 leading-relaxed">Tekan tombol darurat untuk mengirim sinyal ke admin.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSosModal(true)}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shrink-0 transition-all"
                            >
                                SOS
                            </button>
                        </div>

                        {/* ACTION BUTTON */}
                        {tripStatus === "completed" && (
                            <div className="pt-4 sticky bottom-0 bg-white space-y-3">
                                <button
                                    onClick={() => navigate("/customer/dashboard")}
                                    className="w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl bg-indigo-900 shadow-indigo-100 hover:bg-indigo-800"
                                >
                                    Kembali ke Halaman Utama
                                </button>

                                <button
                                    onClick={() => navigate(`/customer/beri-rating/${tripId}`)}
                                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-indigo-900 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] border-2 border-indigo-100 hover:bg-indigo-50"
                                >
                                    <Navigation size={16} className="transform rotate-45" />
                                    Berikan Penilaian (Opsional)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CUSTOM MODAL KONFIRMASI SOS DARURAT */}
            {showSosModal && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-red-100 space-y-6 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
                            <ShieldAlert size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-red-600 tracking-tight">Kirim Sinyal Darurat (SOS)</h3>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                Sinyal darurat beserta lokasi Anda akan langsung dikirimkan ke Admin pusat agar Admin dapat segera menegur atau menghubungi mitra yang bertugas.
                            </p>
                        </div>

                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-left space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                                <PhoneCall size={14} />
                                <span>Darurat Mendesak / Polisi:</span>
                            </div>
                            <p className="text-sm font-black text-red-800">Hotline Darurat: 112</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowSosModal(false)}
                                disabled={loadingSos}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-wider transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSendSos}
                                disabled={loadingSos}
                                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingSos ? <Loader2 className="animate-spin" size={16} /> : "Kirim ke Admin"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM MODAL KONFIRMASI PEMBATALAN */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-gray-100 space-y-6">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle size={28} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-indigo-900">Konfirmasi Pembatalan</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Apakah Anda yakin ingin membatalkan pesanan ini? Perhatikan kebijakan pengembalian berikut:
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-left border border-gray-100">
                            <div className="flex items-start gap-2 text-xs font-bold text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0"></span>
                                <span><strong> 12 jam:</strong> Refund 100%</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs font-bold text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                                <span><strong>3 s.d 12 jam:</strong> Refund 50%</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs font-bold text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                                <span><strong>&lt; 3 jam:</strong> Dana Hangus (0%)</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <p className="text-[11px] text-gray-400 font-medium italic">
                                    *Pembayaran Tunai: Tidak ada dana yang perlu dikembalikan.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={loadingCancel}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-wider transition-all"
                            >
                                Urungkan
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={loadingCancel}
                                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingCancel ? <Loader2 className="animate-spin" size={16} /> : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP ALERT KUSTOM (pengganti window.alert) */}
            <AlertModal
                show={alertInfo.show}
                type={alertInfo.type}
                title={alertInfo.title}
                message={alertInfo.message}
                onClose={() => {
                    const wasCancelSuccess = alertInfo.type === "success" && alertInfo.title === "Pesanan Dibatalkan";
                    setAlertInfo((prev) => ({ ...prev, show: false }));
                    if (wasCancelSuccess) navigate("/customer/dashboard");
                }}
            />

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

            {/* QR MODAL */}
            {showQR && qrData?.token && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowQR(false)}
                            className="
                                absolute top-4 right-4
                                w-10 h-10 rounded-full
                                bg-gray-100 hover:bg-gray-200
                                font-black text-gray-500
                            "
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-black text-indigo-900 text-center mb-2">QR Verifikasi</h2>
                        <p className="text-sm text-gray-400 text-center mb-8">Tunjukkan QR ini kepada petugas Pos Mitra</p>

                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                                <QRCode
                                    value={JSON.stringify({
                                        type: "customer",
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

            <SuccessPopup
                show={justVerified}
                onClose={() => setJustVerified(false)}
                title="Anda Sudah Diverifikasi"
                message="Pos Mitra telah memverifikasi QR Anda. Menunggu mitra memulai perjalanan."
            />
        </CustomerLayout>
    );
}