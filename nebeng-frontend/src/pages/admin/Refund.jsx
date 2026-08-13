import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/dashboard/AdminLayout";
import { RefreshCcw, Clock, CheckCircle2, MessageSquareWarning, ShieldOff, BadgeCheck, Loader2 } from "lucide-react";
import axios from "../../api/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";
import AlertModal from "../../components/ui/AlertModal";

const STATUS_BADGE = {
	pending: { label: "Menunggu Ditinjau", className: "bg-amber-100 text-amber-700" },
	reviewed: { label: "Sudah Ditegur", className: "bg-indigo-100 text-indigo-700" },
	resolved: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
};

export default function Refund() {
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);

	// action yang mau dijalankan: { id, action } - dipakai untuk ConfirmModal
	const [pendingAction, setPendingAction] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [alertInfo, setAlertInfo] = useState({ show: false, type: "success", title: "", message: "" });

	const fetchComplaints = async () => {
		try {
			const res = await axios.get("/admin/complaints");
			setComplaints(res.data);
		} catch (err) {
			console.error("Gagal mengambil data laporan:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchComplaints();
	}, []);

	const actionLabels = {
		warn: { title: "Tegur Mitra", message: "Kirim teguran resmi kepada mitra terkait laporan ini?", confirmText: "Ya, Tegur Mitra" },
		block_mitra: { title: "Blokir Mitra", message: "Mitra akan langsung diblokir dan tidak bisa login. Lanjutkan?", confirmText: "Ya, Blokir Mitra" },
		mark_refund_done: { title: "Tandai Refund Selesai", message: "Tandai bahwa dana sudah dikembalikan ke customer?", confirmText: "Ya, Tandai Selesai" },
	};

	const handleConfirmAction = async () => {
		if (!pendingAction) return;
		try {
			setProcessing(true);
			const res = await axios.post(`/admin/complaints/${pendingAction.id}/action`, {
				action: pendingAction.action,
			});
			setPendingAction(null);
			setAlertInfo({ show: true, type: "success", title: "Berhasil", message: res.data.message });
			fetchComplaints();
		} catch (err) {
			setPendingAction(null);
			setAlertInfo({
				show: true,
				type: "error",
				title: "Gagal",
				message: err.response?.data?.message || "Terjadi kesalahan saat memproses tindakan.",
			});
		} finally {
			setProcessing(false);
		}
	};

	return (
		<AdminLayout>
			<div className="p-6 md:p-8 space-y-6 font-sans max-w-7xl mx-auto">
				<div className="flex items-center gap-4">
					<div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
						<RefreshCcw size={28} />
					</div>
					<div>
						<h1 className="text-2xl font-black text-gray-800 tracking-tight">Laporan Komplain Mitra</h1>
						<p className="text-xs text-gray-400 font-medium mt-1">Laporan customer terkait refund QRIS yang belum dikembalikan oleh mitra.</p>
					</div>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
						<Loader2 className="animate-spin text-indigo-900 mb-3" size={32} />
						<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat laporan...</p>
					</div>
				) : complaints.length === 0 ? (
					<div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3">
						<div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
							<CheckCircle2 size={32} />
						</div>
						<h3 className="text-lg font-black text-gray-800">Belum ada laporan masuk</h3>
						<p className="text-xs text-gray-400 max-w-sm">Semua refund QRIS berjalan lancar tanpa keluhan dari customer.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{complaints.map((c) => {
							const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending;
							const isResolved = c.status === "resolved";

							return (
								<div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h4 className="font-black text-gray-800 text-sm">Order #{c.order_id}</h4>
											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
												{c.customer?.name || "Customer"} vs {c.mitra?.name || "Mitra"}
											</p>
										</div>
										<span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ${badge.className}`}>{badge.label}</span>
									</div>

									<div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
										<p className="text-xs text-gray-600 leading-relaxed">{c.description}</p>
									</div>

									{c.admin_notes && (
										<div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
											<p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Catatan Admin</p>
											<p className="text-xs text-indigo-800">{c.admin_notes}</p>
										</div>
									)}

									<div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
										<Clock size={12} />
										{new Date(c.created_at).toLocaleString("id-ID")}
									</div>

									{!isResolved && (
										<div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
											<button
												onClick={() => setPendingAction({ id: c.id, action: "warn" })}
												className="flex-1 min-w-[100px] py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-center text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
											>
												<MessageSquareWarning size={14} /> Tegur
											</button>
											<button
												onClick={() => setPendingAction({ id: c.id, action: "block_mitra" })}
												className="flex-1 min-w-[100px] py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-center text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
											>
												<ShieldOff size={14} /> Blokir Mitra
											</button>
											<button
												onClick={() => setPendingAction({ id: c.id, action: "mark_refund_done" })}
												className="flex-1 min-w-[100px] py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-center text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
											>
												<BadgeCheck size={14} /> Refund Selesai
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<ConfirmModal
				show={!!pendingAction}
				title={pendingAction ? actionLabels[pendingAction.action].title : ""}
				message={pendingAction ? actionLabels[pendingAction.action].message : ""}
				confirmText={pendingAction ? actionLabels[pendingAction.action].confirmText : ""}
				loading={processing}
				onConfirm={handleConfirmAction}
				onCancel={() => setPendingAction(null)}
			/>

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
