import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import MitraSidebar from "./MitraSidebar";
import { Menu, Bell, Search, ChevronDown, Bike, X } from "lucide-react";
import echo from "../../lib/echo";

export default function MitraLayout({ children }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isScrolled] = useState(false);
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

	// Efek shadow pada header saat di-scroll
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

	useEffect(() => {
		console.log("LISTENING WEBSOCKET...");

		const storedUser = localStorage.getItem("user");

		const parsedUser = storedUser ? JSON.parse(storedUser) : null;

		const userId = parsedUser?.id;

		console.log("USER ID:", userId);

		if (!userId) return;

		const channel = echo.private(`mitra.${userId}`);

		channel.subscribed(() => {
			console.log("BERHASIL SUBSCRIBE CHANNEL");
		});

		channel.error((err) => {
			console.error("CHANNEL ERROR:", err);
		});

		channel.listen(".new-order", (e) => {
			console.log("EVENT MASUK:", e);

			setNotifications((prev) => {
				const updated = [
					{
						id: Date.now(),
						category: "Info Perjalanan",
						title: "Order Baru Masuk 🚀",
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

			// auto hide popup
			setTimeout(() => {
				setPopupNotif(null);
			}, 4000);

			if (notificationSound.current) {
				try {
					notificationSound.current.currentTime = 0;

					notificationSound.current.play();
				} catch (err) {
					console.log("PLAY FAILED", err);
				}
			}

			// vibrate mobile
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

	// Menentukan judul halaman berdasarkan path
	const getPageTitle = () => {
		const path = location.pathname;
		if (path.includes("nebeng-motor")) return "Nebeng Motor";
		if (path.includes("nebeng-barang")) return "Nebeng Barang";
		if (path.includes("riwayat-saldo")) return "Riwayat Saldo";
		if (path.includes("riwayat")) return "Riwayat Tebengan";
		if (path.includes("pesan")) return "Pesan Percakapan";
		if (path.includes("profil")) return "Profil Pengguna";
		if (path.includes("notifikasi")) return "Pusat Notifikasi";
		return "Dashboard Utama";
	};

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

				console.log("AUDIO UNLOCKED ✅");
			} catch (err) {
				console.log("UNLOCK FAILED", err);
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
		// Hapus overflow-x-hidden di sini jika sticky masih bermasalah
		<div className="flex min-h-screen bg-[#F8FAFC] font-sans">
			<MitraSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

			{/* Pastikan min-h-screen agar layout memanjang mengikuti konten */}
			<div className="flex-1 flex flex-col min-h-full min-w-0 md:ml-72 transition-all duration-300">
				{/* STICKY NAVBAR */}
				{/* Pastikan tidak ada parent di atas header ini yang memiliki overflow-hidden */}
				<header className={`sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-indigo-900 md:bg-transparent"}`}>
					{/* ================= LEFT SECTION ================= */}
					<div className="flex items-center gap-4">
						{/* Tampilan MOBILE: Hallo [Nama] */}
						<div className="md:hidden flex items-center gap-2">
							<h1 className="text-xl font-black text-white tracking-tight leading-tight truncate max-w-[200px]">Hallo {loadingUser ? "..." : user?.name} 👋</h1>
						</div>

						{/* Tampilan DESKTOP: Breadcrumb Title */}
						<div className="hidden md:block text-left">
							<h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Halaman</h2>
							<h1 className="text-lg font-black text-indigo-900 tracking-tight">{getPageTitle()}</h1>
						</div>
					</div>

					{/* ================= RIGHT SECTION ================= */}
					<div className="flex items-center gap-3 sm:gap-6">
						{/* Notification Icon */}
						<Link
							to="/mitra/notifikasiMitra"
							className={`relative p-2.5 rounded-xl transition-all group ${isScrolled ? "bg-white border border-gray-100 text-gray-400" : "bg-white/10 md:bg-white text-white md:text-gray-400 md:border md:border-gray-100"}`}
						>
							<Bell size={20} />
							{/* Red Dot Indicator */}
							{hasNewNotif && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-900 md:border-white"></span>}
							{notifications.length > 0 && <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{notifications.length}</div>}
						</Link>

						{/* Profile Dropdown: Sembunyikan di Mobile, Muncul di Desktop */}
						<Link to="/mitra/profil" className="hidden md:flex items-center gap-3 p-1.5 pr-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
							<div className="relative">
								<img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-xl bg-indigo-800 border border-white/10" />
								<div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
							</div>
							<div className="text-left">
								<p className="text-xs font-black text-indigo-900 leading-none">{loadingUser ? "Loading..." : user?.name}</p>
								<p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{user?.role || "Mitra"}</p>
							</div>
							<ChevronDown size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
						</Link>
					</div>
				</header>

				{/* ================= MOBILE POPUP NOTIFICATION ================= */}
				{popupNotif && (
					<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300">
						<div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
							{/* Glow Background */}
							<div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-cyan-500/10"></div>

							<div className="relative p-4 flex items-start gap-3">
								{/* ICON */}
								<div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
									<Bike className="text-indigo-700" size={22} />
								</div>

								{/* CONTENT */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-sm font-black text-indigo-900">Order Baru</p>

										<div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide">Realtime</div>
									</div>

									<p className="text-xs text-gray-500 mt-1 leading-relaxed">{popupNotif.message}</p>

									<p className="text-[11px] text-indigo-500 font-bold mt-2">Order #{popupNotif.orderId}</p>
								</div>

								{/* CLOSE */}
								<button onClick={() => setPopupNotif(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
									<X size={16} className="text-gray-400" />
								</button>
							</div>

							{/* Bottom Progress */}
							<div className="h-1 bg-gray-100 overflow-hidden">
								<div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-[shrink_4s_linear_forwards]"></div>
							</div>
						</div>
					</div>
				)}

				{/* MAIN CONTENT: Tambahkan flex-grow agar mendorong footer ke bawah */}
				<main className="flex-grow w-full px-4 sm:px-6 md:px-8">
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>
				</main>

				{/* FOOTER: Tambahkan padding bawah (pb-24) khusus mobile agar tidak tertutup Bottom Nav */}
				{/* <footer className="w-full px-8 py-10 text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] pb-28 md:pb-10">&copy; 2026 Nebeng Yuk. All Rights Reserved.</footer> */}
			</div>
		</div>
	);
}
