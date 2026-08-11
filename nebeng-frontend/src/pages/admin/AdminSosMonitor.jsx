import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/dashboard/AdminLayout"; // Sesuaikan path layout admin kamu
import { ShieldAlert, MapPin, Clock, CheckCircle2, AlertTriangle, PhoneCall, Loader2 } from "lucide-react";
import axios from "../../api/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";
import AlertModal from "../../components/ui/AlertModal";

export default function AdminSosMonitor() {
    const [sosList, setSosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSos, setSelectedSos] = useState(null);

    // --- Popup kustom (pengganti window.confirm & window.alert bawaan browser) ---
    const [confirmTargetId, setConfirmTargetId] = useState(null); // id SOS yang mau ditandai selesai
    const [resolving, setResolving] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, type: "success", title: "", message: "" });

    const fetchSosData = async () => {
        try {
            const response = await axios.get("/admin/sos-alerts"); // Sesuaikan endpoint API backend Laravel kamu
            setSosList(response.data.data || response.data);
        } catch (err) {
            console.error("Gagal mengambil data SOS:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSosData();
        const interval = setInterval(fetchSosData, 5000); // Auto-refresh setiap 5 detik
        return () => clearInterval(interval);
    }, []);

    const handleResolveSos = async () => {
        if (!confirmTargetId) return;
        try {
            setResolving(true);
            await axios.post(`/admin/sos-alerts/${confirmTargetId}/resolve`);
            setConfirmTargetId(null);
            setAlertInfo({
                show: true,
                type: "success",
                title: "Status Diperbarui",
                message: "Status SOS berhasil diperbarui.",
            });
            fetchSosData();
        } catch (err) {
            console.error("Gagal memperbarui status:", err);
            setConfirmTargetId(null);
            setAlertInfo({
                show: true,
                type: "error",
                title: "Gagal Memperbarui",
                message: err.response?.data?.message || "Terjadi kesalahan saat memperbarui status.",
            });
        } finally {
            setResolving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-8 space-y-6 font-sans max-w-7xl mx-auto">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-red-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md">
                            <ShieldAlert size={32} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Pusat Pemantauan Darurat (SOS)</h1>
                            <p className="text-red-100 text-xs md:text-sm mt-1 font-medium">
                                Daftar sinyal darurat secara real-time yang dikirimkan oleh customer selama perjalanan aktif.
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold tracking-wider uppercase">
                        Live Monitor Active
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <Loader2 className="animate-spin text-indigo-900 mb-3" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat sinyal darurat...</p>
                    </div>
                ) : sosList.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-800">Tidak ada sinyal darurat aktif</h3>
                        <p className="text-xs text-gray-400 max-w-sm">Semua perjalanan terpantau aman. Belum ada customer atau mitra yang memicu tombol SOS saat ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sosList.map((sos) => (
                            <div key={sos.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-100 border border-red-100 flex flex-col justify-between space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                                    {sos.status || "Darurat"}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-800 text-sm">{sos.customer_name || sos.user?.name || "Customer"}</h4>
                                            <p className="text-[10px] text-gray-400 font-medium">Trip ID: #{sos.trip_id}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin size={14} className="text-red-500 shrink-0" />
                                            <span className="truncate">Lat/Lng: {sos.latitude}, {sos.longitude}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock size={14} className="text-indigo-500 shrink-0" />
                                            <span>{new Date(sos.created_at).toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                    
                                        <a href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                        Buka Peta
                                    </a>
                                    <button
                                        onClick={() => setConfirmTargetId(sos.id)}
                                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-100"
                                    >
                                        Selesai
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* POPUP KONFIRMASI (pengganti window.confirm) */}
            <ConfirmModal
                show={!!confirmTargetId}
                title="Selesaikan Darurat"
                message="Tandai darurat ini sebagai sudah diselesaikan/ditangani?"
                confirmText="Ya, Tandai Selesai"
                loading={resolving}
                onConfirm={handleResolveSos}
                onCancel={() => setConfirmTargetId(null)}
            />

            {/* POPUP ALERT KUSTOM (pengganti window.alert) */}
            <AlertModal
                show={alertInfo.show}
                type={alertInfo.type}
                title={alertInfo.title}
                message={alertInfo.message}
                onClose={() => setAlertInfo((prev) => ({ ...prev, show: false }))}
            />
        </AdminLayout>
    );
}