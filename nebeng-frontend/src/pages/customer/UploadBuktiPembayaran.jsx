import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, UploadCloud, Loader2, CheckCircle2, Clock, Trash2 } from "lucide-react";
import SuccessPopup from "../../components/ui/SuccessPopup";

export default function UploadBuktiPembayaran() {
	const navigate = useNavigate();
	const { orderId } = useParams();

	const [order, setOrder] = useState(null);
	const [isFetching, setIsFetching] = useState(true);

	const [file, setFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [justConfirmed, setJustConfirmed] = useState(false);
	const prevStatusRef = useRef(null);

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const token = localStorage.getItem("token");

				const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				const data = await res.json();
				setOrder(data);

				if (data.payment_status && data.payment_status !== "unpaid") {
					setSubmitted(true);
				}

				// Tampilkan popup sekali saat status transisi menjadi "paid"
				if (prevStatusRef.current && prevStatusRef.current !== "paid" && data.payment_status === "paid") {
					setJustConfirmed(true);
				}

				prevStatusRef.current = data.payment_status ?? prevStatusRef.current;
			} catch (err) {
				console.error(err);
			} finally {
				setIsFetching(false);
			}
		};

		fetchOrder();

		// Auto-refresh berkala supaya begitu mitra konfirmasi pembayaran,
		// halaman ini langsung update tanpa perlu reload manual.
		const interval = setInterval(fetchOrder, 4000);

		return () => clearInterval(interval);
	}, [orderId]);

	const handleFileChange = (e) => {
		const selected = e.target.files[0];
		if (!selected) return;

		setFile(selected);
		setPreview(URL.createObjectURL(selected));
	};

	const handleUpload = async () => {
		if (!file) {
			alert("Pilih screenshot bukti pembayaran terlebih dahulu.");
			return;
		}

		setIsUploading(true);

		try {
			const token = localStorage.getItem("token");

			const formData = new FormData();
			formData.append("payment_proof", file);

			const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/upload-payment-proof`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Gagal mengirim bukti pembayaran");
			}

			setSubmitted(true);
		} catch (err) {
			alert(err.message || "Terjadi kesalahan saat mengirim bukti pembayaran");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<CustomerLayout>
			<div className="w-full max-w-lg mx-auto px-4 py-6">
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
						<ChevronLeft className="w-6 h-6 text-indigo-900" />
					</button>
					<div>
						<h1 className="text-2xl font-black text-indigo-900">Pembayaran QRIS</h1>
						<p className="text-sm text-gray-400">Scan lalu upload bukti pembayaran</p>
					</div>
				</div>

				{isFetching ? (
					<div className="flex items-center justify-center py-16 text-gray-400 gap-2 bg-white rounded-[40px] border border-gray-100">
						<Loader2 className="animate-spin" size={20} /> Memuat pesanan...
					</div>
				) : submitted ? (
					order?.payment_status === "paid" ? (
						// ================= SUDAH DIKONFIRMASI MITRA =================
						<div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 text-center">
							<div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
								<CheckCircle2 size={36} />
							</div>
							<h2 className="text-xl font-black text-gray-800 mb-2">Pembayaran Dikonfirmasi</h2>
							<p className="text-sm text-gray-500 leading-relaxed mb-8">Mitra telah mengonfirmasi pembayaran kamu. Lanjutkan ke halaman perjalanan untuk scan QR kedatangan di Pos Mitra sebelum berangkat.</p>
							<button onClick={() => navigate(`/customer/perjalanan/${order.trip_id}`)} className="w-full py-4 rounded-2xl bg-indigo-900 text-white font-black">
								Lanjut ke Halaman Perjalanan
							</button>
						</div>
					) : (
						// ================= SUDAH TERKIRIM: MENUNGGU KONFIRMASI MITRA =================
						<div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 text-center">
							<div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
								<Clock size={36} />
							</div>
							<h2 className="text-xl font-black text-gray-800 mb-2">Menunggu Konfirmasi Mitra</h2>
							<p className="text-sm text-gray-500 leading-relaxed mb-8">Bukti pembayaran kamu sudah terkirim. Mitra akan memeriksa dan mengonfirmasi pembayaran ini sebelum perjalanan dimulai.</p>
							<button onClick={() => navigate("/customer/riwayat")} className="w-full py-4 rounded-2xl bg-indigo-900 text-white font-black">
								Lihat Riwayat Pesanan
							</button>
						</div>
					)
				) : (
					// ================= FORM UPLOAD BUKTI =================
					<div className="space-y-6">
						{/* QRIS STATIS */}
						<div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-center">
							<p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
							<p className="text-3xl font-black text-indigo-900 mb-6">Rp {Number(order?.price || 0).toLocaleString("id-ID")}</p>

							{/* QRIS milik mitra untuk perjalanan ini */}
							{order?.trip?.mitra?.profile?.qris_image ? (
								<img
									src={`http://127.0.0.1:8000/storage/${order.trip.mitra.profile.qris_image}`}
									alt="QRIS Mitra"
									className="w-56 h-56 mx-auto object-contain rounded-3xl border border-gray-100 bg-gray-50"
								/>
							) : (
								<div className="w-56 h-56 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2">
									<p className="text-xs font-bold text-gray-400 px-4 text-center">Mitra belum mengunggah QRIS. Hubungi mitra untuk metode pembayaran lain.</p>
								</div>
							)}

							<p className="text-xs text-gray-400 mt-4">Scan QR di atas menggunakan aplikasi e-wallet/m-banking, lalu upload screenshot bukti pembayarannya di bawah.</p>
						</div>

						{/* UPLOAD BUKTI */}
						<div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
							<p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Upload Bukti Pembayaran</p>

							{preview ? (
								<div className="relative rounded-3xl overflow-hidden border border-gray-100">
									<img src={preview} alt="Bukti pembayaran" className="w-full h-64 object-cover" />
									<button
										onClick={() => {
											setFile(null);
											setPreview(null);
										}}
										className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"
									>
										<Trash2 size={16} />
									</button>
								</div>
							) : (
								<label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-indigo-300 transition-all bg-gray-50">
									<UploadCloud size={32} className="text-indigo-600 mb-2" />
									<p className="text-sm font-bold text-gray-500">Ketuk untuk pilih screenshot</p>
									<p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG</p>
									<input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
								</label>
							)}

							<button
								onClick={handleUpload}
								disabled={!file || isUploading}
								className="mt-6 w-full py-4 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
							>
								{isUploading ? (
									<>
										<Loader2 className="animate-spin" size={18} /> Mengirim...
									</>
								) : (
									<>
										<CheckCircle2 size={18} /> Kirim Bukti Pembayaran
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>

			<SuccessPopup
				show={justConfirmed}
				onClose={() => setJustConfirmed(false)}
				title="Pembayaran Dikonfirmasi"
				message="Mitra telah mengonfirmasi pembayaran kamu. Lanjutkan ke halaman perjalanan untuk scan QR kedatangan di Pos Mitra."
			/>
		</CustomerLayout>
	);
}