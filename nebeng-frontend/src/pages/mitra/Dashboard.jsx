import React, { useState, useEffect } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { Wallet, UserCheck, PlusCircle, Star, ChevronRight, Bike, Car, Package, Eye, EyeOff, XCircle, TrendingUp, ArrowUpRight, Clock, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
	{ id: "motor", label: "Nebeng Motor", Icon: Bike, path: "/mitra/nebeng-motor" },
	{ id: "mobil", label: "Nebeng Mobil", Icon: Car, path: "/mitra/nebeng-mobil" },
	{ id: "barang", label: "Nebeng Barang", Icon: Package, path: "/mitra/nebeng-barang" },
];

export default function Dashboard() {
	const [verificationLoading, setVerificationLoading] = useState(true);
	const [showBalance, setShowBalance] = useState(true);
	const [activePromo, setActivePromo] = useState(0);
	const [balance, setBalance] = useState(0);
	const [loadingBalance, setLoadingBalance] = useState(true);
	const [upcomingTrips, setUpcomingTrips] = useState([]);
	const [loadingTrips, setLoadingTrips] = useState(true);

	const [verificationStatus, setVerificationStatus] = useState("unverified");
	const [showVerificationOverlay, setShowVerificationOverlay] = useState(true);
	const isVerified = verificationStatus === "verified";
	const isPending = verificationStatus === "pending";
	const isUnverified = verificationStatus === "unverified";

	// Check verifikasi status untuk fitur terbatas
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/profile", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				setVerificationStatus(data.status || "unverified");
			} catch (err) {
				console.error("Gagal ambil profile:", err);
			} finally {
				setVerificationLoading(false);
			}
		};

		fetchProfile();
	}, []);

	const handleProtectedClick = (e) => {
		if (!isVerified) {
			e.preventDefault();

			if (isPending) {
				alert("Verifikasi akun kamu masih diproses.");
			} else {
				alert("Silakan verifikasi akun terlebih dahulu.");
			}
		}
	};

	// Animasi Banner Promo Otomatis
	useEffect(() => {
		const timer = setInterval(() => {
			setActivePromo((prev) => (prev === 2 ? 0 : prev + 1));
		}, 5000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const fetchBalance = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/balance", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				setBalance(data.balance || 0);
			} catch (err) {
				console.error("Gagal ambil saldo:", err);
			} finally {
				setLoadingBalance(false);
			}
		};

		fetchBalance();
	}, []);

	useEffect(() => {
		const fetchTrips = async () => {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/mitra/trips", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				const data = await res.json();

				const now = new Date();

				const filtered = data
					.filter((trip) => {
						const tripDate = new Date(`${trip.departure_date}T${trip.departure_time}`);

						return tripDate >= now && trip.status.toLowerCase() !== "selesai";
					})
					.sort((a, b) => {
						const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
						const dateB = new Date(`${b.departure_date}T${b.departure_time}`);

						return dateA - dateB;
					})
					.slice(0, 2);

				setUpcomingTrips(filtered);
			} catch (error) {
				console.error("Gagal ambil trip:", error);
			} finally {
				setLoadingTrips(false);
			}
		};

		fetchTrips();
	}, []);

	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
		}).format(angka);
	};

	const formatTanggal = (date) => {
		return new Date(date).toLocaleDateString("id-ID", {
			weekday: "short",
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const formatJam = (time) => {
		return time.slice(0, 5);
	};

	const getServiceName = (type) => {
		if (type === "motor") return "Nebeng Motor";
		if (type === "mobil") return "Nebeng Mobil";
		if (type === "barang") return "Nebeng Barang";
		return "-";
	};

	return (
		<MitraLayout>
			{/* Tambahkan pb-24 agar tidak tertutup Bottom Nav di Mobile */}
			<div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 pb-112">
				{/* GRID UTAMA */}
				<div className="grid grid-cols-1 lg:grid-cols-12">
					{/* SISI KIRI: Income, Services, Banner (8 Kolom) */}
					<div className="lg:col-span-8 space-y-6">
						{/* CARD PENDAPATAN */}
						<div className="bg-indigo-900 rounded-[2rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
							<div className="relative z-10">
								{/* Header: Label & Button */}
								<div className="flex justify-between items-center mb-6 gap-2">
									<div className="flex items-center gap-2">
										<div className="p-2 bg-white/10 rounded-lg shrink-0">
											<TrendingUp size={16} className="text-emerald-400 md:w-5 md:h-5" />
										</div>
										<p className="text-indigo-200 text-[10px] md:text-sm font-bold uppercase tracking-wider">Saldo</p>
									</div>
									<Link
										to="/mitra/tarik-saldo"
										onClick={handleProtectedClick}
										className={`bg-white text-indigo-900 px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-sm font-black shadow-lg transition-all ${!isVerified ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-50 active:scale-95"}`}
									>
										Tarik Saldo
									</Link>
								</div>

								{/* Amount Section */}
								<div className="flex items-center gap-3 mb-8">
									<h2 className="text-3xl md:text-5xl font-black tracking-tighter truncate">{loadingBalance ? "..." : showBalance ? formatRupiah(balance) : "Rp ••••••••"}</h2>
									<button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
										{showBalance ? <Eye size={20} className="text-indigo-300 md:w-6 md:h-6" /> : <EyeOff size={20} className="text-indigo-300 md:w-6 md:h-6" />}
									</button>
								</div>

								{/* Footer Info */}
								<div className="flex items-center justify-between border-t border-white/10 pt-5">
									<Link to="/mitra/riwayat-saldo" className="flex items-center text-[10px] md:text-xs font-bold text-indigo-300 hover:text-white transition-all group">
										Riwayat Saldo
										<ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
									</Link>
									{/* <div className="text-right">
										<p className="text-[9px] md:text-[10px] text-indigo-400 uppercase font-black leading-none mb-1">Total Orderan</p>
										<p className="text-sm md:text-lg font-bold">12 Trip</p>
									</div> */}
								</div>
							</div>

							{/* Dekorasi Background - Ukuran disesuaikan untuk mobile agar tidak menutupi teks */}
							<Wallet size={140} className="absolute -right-4 -bottom-4 md:size-[200px] md:-right-10 md:-bottom-10 text-white opacity-5 transform -rotate-12 group-hover:scale-110 transition-transform duration-700" />
						</div>

						{/* LAYANAN MITRA (Horizontal Scroll di Mobile) */}
						<div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
							<div className="flex justify-between items-center mb-8 px-2 md:px-0">
								<div>
									<h3 className="font-black text-gray-800 text-lg md:text-xl tracking-tight leading-none">Layanan Mitra</h3>
									<p className="text-[10px] md:text-sm text-gray-400 mt-1 uppercase font-bold tracking-widest">Kelola Kendaraan Anda</p>
								</div>
								{/* Tombol Tambah Kendaraan */}
								{/* <button
									onClick={(e) => handleProtectedClick(e)}
									className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-900 text-white rounded-xl text-[10px] md:text-sm font-black transition-all shadow-lg ${
										!isVerified ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-800 active:scale-95"
									}`}
								>	
									Tambah Kendaraan
								</button> */}
							</div>

							{/* Container Scroll Menyamping di Mobile */}
							<div className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 md:mx-0 md:px-0">
								{services.map((s) => (
									<Link key={s.id} to={s.path} onClick={handleProtectedClick} className={`group flex flex-col items-center min-w-[90px] md:min-w-0 transition-all relative ${!isVerified ? "opacity-50 cursor-not-allowed" : ""}`}>
										{/* Ikon Lingkaran Sempurna */}
										<div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-indigo-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
											<s.Icon size={32} strokeWidth={1.5} className="md:size-10" />
										</div>

										{/* Label Teks Sesuai Gambar */}
										<div className="text-[11px] md:text-sm font-bold text-center mt-4 text-gray-700 leading-tight h-10 flex items-center justify-center max-w-[80px] md:max-w-full group-hover:text-indigo-900 transition-colors">
											{s.label}
										</div>

										{/* Arrow Indikator (Desktop Only) */}
										<div className="hidden md:flex mt-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 bg-indigo-50 p-1 rounded-full text-indigo-900">
											<ArrowUpRight size={14} />
										</div>
									</Link>
								))}
							</div>
						</div>

						{/* CSS untuk menyembunyikan scrollbar */}
						<style>{`
							.no-scrollbar::-webkit-scrollbar {
								display: none;
							}
							.no-scrollbar {
								-ms-overflow-style: none;
								scrollbar-width: none;
							}
						`}</style>
					</div>

					{/* SISI KANAN: Upcoming & Rating (4 Kolom) */}
					<div className="lg:col-span-4 space-y-6 ">
						{/* TEBENGAN AKAN DATANG */}
						<div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full max-h-[600px]">
							<div className="flex items-center justify-between mb-6 shrink-0">
								<div>
									<h3 className="font-black text-gray-800 text-sm md:text-base uppercase tracking-wider">Jadwal Terdekat</h3>
									<p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Maks. 2 Jadwal Terbaru</p>
								</div>
								<Link to="/mitra/riwayat" className="text-indigo-600 text-[10px] font-black hover:underline uppercase tracking-tighter bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
									Semua
								</Link>
							</div>

							{/* Container List dengan pembatasan jumlah item */}
							<div className="space-y-4 overflow-y-auto no-scrollbar pr-1">
								{loadingTrips ? (
									<div className="py-10 text-center text-xs font-bold text-gray-400">Memuat Jadwal...</div>
								) : upcomingTrips.length > 0 ? (
									upcomingTrips.map((u) => (
										<Link
											to={`/mitra/detail-tebengan/${u.id}`}
											onClick={handleProtectedClick}
											className={`block bg-gray-50 rounded-[2rem] p-5 border border-gray-100 transition-all cursor-pointer group ${
												!isVerified ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50"
											}`}
										>
											<div className="flex items-center justify-between mb-4">
												<span className="bg-amber-100 text-amber-700 text-[8px] md:text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{u.status}</span>
												<div className="flex items-center gap-1 text-gray-400">
													<Clock size={12} className="md:w-3.5 md:h-3.5" />
													<span className="text-[9px] md:text-[10px] font-bold">{getServiceName(u.vehicle_type)}</span>
												</div>
												<ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
											</div>

											<div className="flex items-center gap-2 text-[11px] md:text-xs font-black text-gray-800 mb-5 pb-4 border-b border-gray-100/50">
												<Calendar size={14} className="text-indigo-600" />
												{formatTanggal(u.departure_date)}
												<span className="text-gray-300">•</span>
												{formatJam(u.departure_time)}
											</div>

											<div className="relative pl-6 space-y-6">
												{/* Garis Vertikal Lebih Pendek & Elegan */}
												<div className="absolute left-[7px] top-[10px] bottom-[10px] w-[1.5px] border-l-2 border-dashed border-gray-200"></div>

												{/* Asal */}
												<div className="relative">
													<div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-indigo-600 bg-white z-10"></div>
													<p className="text-[11px] md:text-xs font-black text-gray-800 leading-none mb-1">{u.origin_point.city.name}</p>
													<p className="text-[9px] text-gray-400 truncate max-w-[150px]">
														{u.origin_point.pos_name} - {u.origin_point.address}
													</p>
												</div>

												{/* Tujuan */}
												<div className="relative">
													<div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-white z-10"></div>
													<p className="text-[11px] md:text-xs font-black text-gray-800 leading-none mb-1">{u.destination_point.city.name}</p>
													<p className="text-[9px] text-gray-400 truncate max-w-[150px]">
														{u.destination_point.pos_name} - {u.destination_point.address}
													</p>
												</div>
											</div>
										</Link>
									))
								) : (
									<div className="flex flex-col items-center justify-center py-10 opacity-40">
										<Calendar size={40} className="text-gray-300 mb-2" />
										<p className="text-[10px] font-bold uppercase">Belum ada jadwal</p>
									</div>
								)}
							</div>
						</div>

						{/* RATING CUSTOMER */}
						<div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center group hover:border-indigo-100 transition-all">
							<h3 className="font-black text-gray-800 mb-8 w-full text-left uppercase tracking-wider text-[11px]">Rating Mitra</h3>
							<div className="relative w-32 h-32 mx-auto mb-6">
								<div className="absolute inset-0 bg-indigo-50 rounded-full animate-ping opacity-20"></div>
								<div className="relative bg-gray-50 p-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
									<Star size={48} className="text-gray-200 group-hover:text-amber-400 transition-colors duration-500" />
								</div>
							</div>
							<p className="text-gray-800 font-black text-lg">Belum Ada Rating</p>
							<p className="text-xs text-gray-400 mt-2 px-4 leading-relaxed font-medium">Feedback dari customer akan muncul di sini setelah perjalanan selesai.</p>
						</div>
						{/* Tambahkan Footer di dalam sini jika ingin persis gambar */}
						<p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] border-t border-gray-50 text-center">© 2026 NEBENG YUK. ALL RIGHTS RESERVED.</p>
					</div>
				</div>
				{!verificationLoading && !isVerified && showVerificationOverlay && (
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
						<div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
							{/* CLOSE BUTTON */}
							<button onClick={() => setShowVerificationOverlay(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all z-10">
								<XCircle size={20} />
							</button>

							<div className="p-8 text-center">
								{/* ICON */}
								<div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 ${isPending ? "bg-amber-100" : "bg-indigo-100"}`}>
									<div className={`w-14 h-14 rounded-full flex items-center justify-center ${isPending ? "bg-amber-500 text-white" : "bg-white text-indigo-600"}`}>{isPending ? <Clock size={28} /> : <UserCheck size={28} />}</div>
								</div>

								{/* UNVERIFIED */}
								{isUnverified && (
									<>
										<h2 className="text-3xl font-black text-indigo-900 leading-tight mb-4">
											Verifikasi Mitra
											<br />
											Diperlukan
										</h2>

										<p className="text-gray-500 text-sm leading-relaxed mb-6 px-2">Untuk mulai menerima penumpang atau pengiriman barang, kamu perlu melengkapi data identitas dan dokumen verifikasi mitra.</p>

										{/* BOX INFO */}
										<div className="bg-indigo-50 rounded-2xl p-5 text-left mb-8">
											<p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest mb-3">Data yang Dibutuhkan:</p>

											<ul className="space-y-2 text-[12px] text-indigo-700 font-semibold">
												<li>• Nama lengkap sesuai KTP</li>
												<li>• NIK & alamat lengkap</li>
												<li>• Foto wajah & selfie KTP</li>
												<li>• Foto SIM aktif</li>
												<li>• Dokumen SKCK</li>
												<li>• Informasi rekening bank</li>
											</ul>
										</div>

										<Link to="/mitra/verification" className="w-full block py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
											Mulai Verifikasi
										</Link>
									</>
								)}

								{/* PENDING */}
								{isPending && (
									<>
										<h2 className="text-3xl font-black text-indigo-900 leading-tight mb-4">
											Verifikasi Sedang
											<br />
											Diproses
										</h2>

										<p className="text-gray-500 text-sm leading-relaxed mb-6 px-2">Data dan dokumen mitra kamu sudah berhasil dikirim dan saat ini sedang diperiksa oleh tim admin Nebeng.</p>

										{/* BOX INFO */}
										<div className="bg-amber-50 rounded-2xl p-5 text-left mb-8 border border-amber-100">
											<p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-3">Informasi:</p>

											<ul className="space-y-2 text-[12px] text-amber-700 font-semibold">
												<li>• Estimasi proses maksimal 1x24 jam</li>
												<li>• Pastikan dokumen yang dikirim valid</li>
												<li>• Admin dapat meminta revisi data</li>
												<li>• Notifikasi akan dikirim setelah review selesai</li>
											</ul>
										</div>

										<div className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black shadow-lg">Menunggu Persetujuan Admin</div>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</MitraLayout>
	);
}
