import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import PosMitraSidebar from "./PosMitraSidebar";
import { Bell, ChevronDown, QrCode, X } from "lucide-react";
import echo from "../../lib/echo";

export default function PosMitraLayout({ children }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [notifications, setNotifications] = useState([]);
	const [hasNewNotif, setHasNewNotif] = useState(() => {
		return localStorage.getItem("mitra_has_new_notif") === "true";
	});
	const [popupNotif, setPopupNotif] = useState(null);
	const avatarUrl = user?.avatar ? `http://127.0.0.1:8000/storage/${user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`;
	const notificationSound = useRef(null);

	// Efek deteksi scroll untuk mengubah style header dinamis
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 20) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch("http://localhost:8000/api/profile", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						Accept: "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Gagal mengambil data user");
				}

				const data = await response.json();
				setUser(data);
			} catch (error) {
				console.error("Fetch user error:", error);
			} finally {
				setLoadingUser(false);
			}
		};

		fetchUser();
	}, []);

	// Sinkronisasi WebSocket Echo untuk Pesanan Masuk POS
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		const parsedUser = storedUser ? JSON.parse(storedUser) : null;
		const userId = parsedUser?.id;

		if (!userId) return;

		const channel = echo.private(`mitra.${userId}`);

		channel.listen(".new-order", (e) => {
			setNotifications((prev) => {
				const updated = [
					{
						id: Date.now(),
						category: "Info Layanan",
						title: "Pesanan Baru Masuk 🚀",
						message: e.message,
						date: new Date().toLocaleString("id-ID"),
						isRead: false,
						orderId: e.order_id,
					},
					...prev,
				];
				localStorage.setItem("mitra_notifications", JSON.stringify(updated));
				return updated;
			});

			setHasNewNotif(true);
			localStorage.setItem("mitra_has_new_notif", "true");

			setPopupNotif({
				message: e.message,
				orderId: e.order_id,
			});

			setTimeout(() => {
				setPopupNotif(null);
			}, 4000);

			if (notificationSound.current) {
				try {
					notificationSound.current.currentTime = 0;
					notificationSound.current.play();
				} catch (err) {
					console.log("Gagal memutar audio notifikasi", err);
				}
			}

			if (navigator.vibrate) {
				navigator.vibrate([200, 100, 200]);
			}
		});

		return () => {
			echo.leave(`private-mitra.${userId}`);
		};
	}, []);

	useEffect(() => {
		const saved = localStorage.getItem("mitra_notifications");
		if (saved) {
			setNotifications(JSON.parse(saved));
		}
	}, []);

	// Penyesuaian nama halaman berdasarkan path URL untuk Breadcrumb Desktop
	const getPageTitle = () => {
		const path = location.pathname;
		if (path.includes("nebeng-motor")) return "Statistik Nebeng Motor";
		if (path.includes("nebeng-mobil")) return "Statistik Nebeng Mobil";
		if (path.includes("nebeng-barang")) return "Statistik Nebeng Barang";
		if (path.includes("riwayat-saldo")) return "Riwayat Keuangan";
		if (path.includes("riwayat")) return "Riwayat Aktivitas";
		if (path.includes("pesan")) return "Pesan Percakapan";
		if (path.includes("profil")) return "Profil POS Mitra";
		if (path.includes("notifikasi")) return "Pusat Notifikasi";
		if (path.includes("scan")) return "Pemindaian QR Code";
		return "Beranda Utama";
	};

	// Unlock audio konteks untuk browsers modern
	useEffect(() => {
		const audio = new Audio("/notification.mp3");
		audio.preload = "auto";
		audio.volume = 1;
		notificationSound.current = audio;

		const unlockAudio = async () => {
			try {
				await audio.play();
				audio.pause();
				audio.currentTime = 0;
			} catch (err) {
				console.log("Audio unlock failed", err);
			}
		};

		const handleFirstInteraction = () => {
			unlockAudio();
			window.removeEventListener("pointerdown", handleFirstInteraction);
			window.removeEventListener("touchstart", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
		};

		window.addEventListener("pointerdown", handleFirstInteraction);
		window.addEventListener("touchstart", handleFirstInteraction);
		window.addEventListener("keydown", handleFirstInteraction);

		return () => {
			window.removeEventListener("pointerdown", handleFirstInteraction);
			window.removeEventListener("touchstart", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
		};
	}, []);

	return (
		<div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased selection:bg-blue-500 selection:text-white">
			{/* Memanggil Sidebar Baru khusus POS */}
			<PosMitraSidebar />

			<div className="flex-1 flex flex-col min-h-full min-w-0 md:ml-72 transition-all duration-300">
				{/* STICKY NAVBAR */}
				<header
					className={`sticky top-0 z-40 px-6 sm:px-8 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-[#0b2f83] md:bg-transparent"}`}
				>
					{/* LEFT HEADER SECTION */}
					<div className="flex items-center gap-4">
						{/* Mobile Header View: Halo Farras (Warna Putih mengikuti Mockup Gambar) */}
						<div className="md:hidden flex flex-col text-left">
							<span className="text-[11px] font-bold text-blue-200/80 uppercase tracking-wider">Halo,</span>
							<h1 className="text-xl font-bold text-white tracking-tight leading-none mt-0.5 truncate max-w-[180px]">{loadingUser ? "..." : user?.name || "User"}</h1>
						</div>

						{/* Desktop Header View: Breadcrumb Halaman */}
						<div className="hidden md:block text-left">
							<h2 className="text-[10px] font-black text-[#0b2f83] opacity-60 uppercase tracking-widest mb-0.5">Halaman</h2>
							<h1 className="text-lg font-black text-gray-800 tracking-tight">{getPageTitle()}</h1>
						</div>
					</div>

					{/* RIGHT HEADER SECTION */}
					<div className="flex items-center gap-3 sm:gap-4">
						{/* Lonceng Notifikasi */}
						<Link
							to="/pos-mitra/notifikasiMitra"
							className={`relative p-2.5 rounded-xl transition-all ${isScrolled ? "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50" : "bg-white/10 md:bg-white text-white md:text-gray-500 md:border md:border-gray-200 hover:scale-105"}`}
						>
							<Bell size={20} />
							{hasNewNotif && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b2f83] md:border-white"></span>}
							{notifications.length > 0 && <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{notifications.length}</div>}
						</Link>

						{/* Profile Dropdown (Hanya Tampil di Layar Desktop) */}
						<Link to="/pos-mitra/profil" className="hidden md:flex items-center gap-3 p-1.5 pr-3 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-all group">
							<div className="relative">
								<img src={avatarUrl} alt="Profile" className="w-9 h-9 rounded-lg bg-gray-100 object-cover" />
								<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
							</div>
							<div className="text-left">
								<p className="text-xs font-bold text-gray-800 leading-none">{loadingUser ? "Loading..." : user?.name || "User"}</p>
								<p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wider">Mitra POS</p>
							</div>
							<ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
						</Link>
					</div>
				</header>

				{/* ================= REAL-TIME POPUP NOTIFICATION ================= */}
				{popupNotif && (
					<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300">
						<div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
							<div className="p-4 flex items-start gap-3">
								<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0b2f83] flex items-center justify-center shrink-0">
									<QrCode size={20} />
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-xs font-bold text-gray-900">Pesanan POS Masuk</p>
										<div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wide">Baru</div>
									</div>
									<p className="text-xs text-gray-500 mt-1 leading-relaxed">{popupNotif.message}</p>
									<p className="text-[10px] text-[#0b2f83] font-semibold mt-1.5">ID Transaksi #{popupNotif.orderId}</p>
								</div>

								<button onClick={() => setPopupNotif(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
									<X size={14} className="text-gray-400" />
								</button>
							</div>

							<div className="h-1 bg-gray-50 overflow-hidden">
								<div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-[shrink_4s_linear_forwards]"></div>
							</div>
						</div>
					</div>
				)}

				{/* MAIN CONTENT REGION */}
				<main className="flex-grow w-full p-4 sm:p-6 md:p-8">
					<div className="animate-in fade-in slide-in-from-bottom-3 duration-500">{children}</div>
				</main>
			</div>
		</div>
	);
}
