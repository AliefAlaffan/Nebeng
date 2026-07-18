import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { ChevronLeft, ChevronRight, QrCode, Banknote, Wallet, CheckCircle2, Package, ShieldCheck, ArrowRight } from "lucide-react";

export default function Pembayaran() {
	const [selectedMethod, setSelectedMethod] = useState(null);
	const navigate = useNavigate();

	const [orderData] = useState(() => {
		const savedOrder = localStorage.getItem("pending_order");
		return savedOrder ? JSON.parse(savedOrder) : null;
	});

	useEffect(() => {
		if (!orderData) {
			navigate("/customer/dashboard");
		}
	}, [orderData, navigate]);

	if (!orderData) return null;

	const paymentMethods = [
		{ id: "qris", name: "QRIS", desc: "Pindai QR pengemudi untuk membayar", icon: QrCode, type: "nontunai" },
		{ id: "tunai", name: "Tunai", desc: "Bayar langsung ke pengemudi", icon: Banknote, type: "tunai" },
		// { id: "bri", name: "BRI Virtual Account", desc: "Transfer melalui bank BRI", icon: Wallet, type: "nontunai" },
		// { id: "bca", name: "BCA Virtual Account", desc: "Transfer melalui bank BCA", icon: Wallet, type: "nontunai" },
		// { id: "dana", name: "Dana", desc: "Bayar menggunakan saldo Dana", icon: Wallet, type: "nontunai" },
	];

	const handleOrder = () => {
		if (!selectedMethod) {
			alert("Pilih metode pembayaran terlebih dahulu");
			return;
		}

		// Simpan metode pembayaran yang dipilih
		localStorage.setItem("selected_payment_method", JSON.stringify(selectedMethod));

		// Arahkan ke halaman konfirmasi PIN
		navigate("/customer/konfirmasi-pin");
	};

	return (
		<CustomerLayout>
			<div className="w-full max-w-7xl mx-auto px-4 py-6">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>

					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Pilih Pembayaran</h1>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* SISI KIRI: Daftar Metode Pembayaran (5 Kolom) */}
					<div className="lg:col-span-5 space-y-4">
						<h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-2">Metode Tersedia</h3>
						{paymentMethods.map((method) => (
							<button
								key={method.id}
								onClick={() => setSelectedMethod(method)}
								className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 group ${
									selectedMethod?.id === method.id ? "bg-indigo-900 border-indigo-900 shadow-xl shadow-indigo-100 translate-x-2" : "bg-white border-gray-100 hover:border-indigo-200"
								}`}
							>
								<div className="flex items-center gap-4">
									<div className={`p-3 rounded-2xl ${selectedMethod?.id === method.id ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-600"}`}>
										<method.icon size={24} />
									</div>
									<div className="text-left">
										<p className={`font-black text-sm ${selectedMethod?.id === method.id ? "text-white" : "text-gray-800"}`}>{method.name}</p>
										<p className={`text-[10px] font-medium ${selectedMethod?.id === method.id ? "text-indigo-200" : "text-gray-400"}`}>{method.desc}</p>
									</div>
								</div>
								<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod?.id === method.id ? "border-sky-400 bg-sky-400" : "border-gray-200"}`}>
									{selectedMethod?.id === method.id && <CheckCircle2 size={14} className="text-indigo-900" />}
								</div>
							</button>
						))}
					</div>

					{/* SISI KANAN: Detail Pembayaran (Muncul saat metode dipilih) (7 Kolom) */}
					<div className="lg:col-span-7 h-full">
						{selectedMethod ? (
							<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
								{/* Info Pesanan Card */}
								<div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100">
									<div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
										<div className="flex items-center gap-2">
											<span className="text-xs font-black text-gray-300 uppercase tracking-widest">Metode:</span>
											<span className="text-xs font-black bg-indigo-50 text-indigo-900 px-3 py-1 rounded-full uppercase">{selectedMethod.name}</span>
										</div>
										<span className="text-[10px] font-bold text-gray-400">{orderData?.noPemesanan}</span>
									</div>

									<div className="relative pl-8 space-y-10 mb-8">
										<div className="absolute left-3.25 top-2.5 bottom-2.5 w-0.5 bg-gray-100"></div>
										<div className="relative">
											<div className="absolute -left-5.75 top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
											<h3 className="font-black text-gray-800 text-base">{orderData?.origin}</h3>
											<p className="text-[11px] text-gray-400 leading-relaxed">{orderData?.fromDetail}</p>
										</div>
										<div className="relative">
											<div className="absolute -left-5.75 top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
											<h3 className="font-black text-gray-800 text-base">{orderData?.destination}</h3>
											<p className="text-[11px] text-gray-400 leading-relaxed">{orderData?.toDetail}</p>
										</div>
									</div>
								</div>

								{/* Info Barang Card */}
								{/* <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
									<div className="flex justify-between items-center mb-6">
										<div className="flex items-center gap-2 text-indigo-900">
											<Package size={20} />
											<h3 className="font-black uppercase tracking-wider text-sm">Berat Barang</h3>
										</div>
										<span className="text-lg font-black text-indigo-900">{orderData.barang.berat}</span>
									</div>

									<div className="space-y-4">
										<p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Foto Barang:</p>
										<div className="w-full h-48 rounded-3xl overflow-hidden border border-gray-50 shadow-inner">
											<img src={orderData.barang.foto} className="w-full h-full object-cover" alt="Barang" />
										</div>
										<div className="p-4 bg-gray-50 rounded-2xl">
											<p className="text-[10px] font-black text-gray-400 uppercase mb-1">Deskripsi:</p>
											<p className="text-xs text-gray-600 italic font-medium">"{orderData.barang.deskripsi}"</p>
										</div>
									</div>
								</div> */}

								{/* Total & Submit */}
								<div className="bg-white rounded-4xl p-8 shadow-xl border border-indigo-50">
									<div className="flex justify-between items-center mb-8">
										<span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Pembayaran</span>
										<span className="text-2xl font-black text-indigo-900 tracking-tighter">Rp {orderData?.price?.toLocaleString("id-ID")},00</span>
									</div>

									<button
										className="w-full py-5 bg-indigo-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
										onClick={handleOrder}
									>
										Lanjutkan {selectedMethod.type === "nontunai" ? "ke Pembayaran" : "Pesanan"}
										<ArrowRight size={20} />
									</button>

									<div className="mt-6 flex items-center justify-center gap-2 text-emerald-500">
										<ShieldCheck size={16} />
										<span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Checkout</span>
									</div>
								</div>
							</div>
						) : (
							<div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 p-12 text-center group">
								<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
									<Wallet size={48} className="text-gray-200" />
								</div>
								<h3 className="text-xl font-black text-indigo-900 mb-2">Pilih Metode Pembayaran</h3>
								<p className="text-sm text-gray-400 max-w-xs leading-relaxed">Silakan pilih salah satu metode di sebelah kiri untuk melihat detail pesanan dan menyelesaikan pembayaran.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</CustomerLayout>
	);
}
