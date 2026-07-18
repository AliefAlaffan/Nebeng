import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import { Menu, Bell, Search, ChevronDown } from "lucide-react";
import echo from "../../lib/echo";

export default function CustomerLayout({ children }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isScrolled] = useState(false);
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [notifications, setNotifications] = useState([]);
	const [hasNewNotif, setHasNewNotif] = useState(false);
	const avatarUrl = user?.avatar ? `http://127.0.0.1:8000/storage/${user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`;

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
		const userId = localStorage.getItem("user_id");

		if (!userId) return;

		const channel = echo.private(`customer.${userId}`);

		channel.listen(".order-updated", (e) => {
			console.log("NOTIFICATION:", e);

			setNotifications((prev) => [e, ...prev]);

			setHasNewNotif(true);

			// optional sound
			const audio = new Audio("/notification.mp3");
			audio.play().catch(() => {});
		});

		return () => {
			echo.leave(`private-customer.${userId}`);
		};
	}, []);

	// Menentukan judul halaman berdasarkan path
	const getPageTitle = () => {
		const path = location.pathname;
		if (path.includes("nebeng-motor")) return "Nebeng Motor";
		if (path.includes("nebeng-barang")) return "Nebeng Barang";
		if (path.includes("riwayat")) return "Riwayat Pesanan";
		if (path.includes("pesan")) return "Pesan Percakapan";
		if (path.includes("profil")) return "Profil Pengguna";
		if (path.includes("notifikasi")) return "Pusat Notifikasi";
		return "Dashboard Utama";
	};

	return (
		// Hapus overflow-x-hidden di sini jika sticky masih bermasalah
		<div className="flex min-h-screen bg-[#F8FAFC] font-sans">
			{/* Sidebar Component */}
			<CustomerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

			{/* Tambahkan flex-col dan pastikan w-full */}
			<div className="flex-1 flex flex-col min-w-0 md:ml-72 transition-all duration-300">
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
							to="/customer/notifikasi"
							className={`relative p-2.5 rounded-xl transition-all group ${isScrolled ? "bg-white border border-gray-100 text-gray-400" : "bg-white/10 md:bg-white text-white md:text-gray-400 md:border md:border-gray-100"}`}
						>
							<Bell size={20} />
							{/* Red Dot Indicator */}
							{hasNewNotif && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-900 md:border-white"></span>}
							{notifications.length > 0 && <div className="absolute -top-1 -right-1 min-w-4.5 h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{notifications.length}</div>}
						</Link>

						{/* Profile Dropdown: Sembunyikan di Mobile, Muncul di Desktop */}
						<Link to="/customer/profil" className="hidden md:flex items-center gap-3 p-1.5 pr-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
							<div className="relative">
								<img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-xl bg-indigo-800 border border-white/10" />
								<div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
							</div>
							<div className="text-left">
								<p className="text-xs font-black text-indigo-900 leading-none">{loadingUser ? "Loading..." : user?.name}</p>
								<p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{user?.role || "Customer"}</p>
							</div>
							<ChevronDown size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
						</Link>
					</div>
				</header>

				{/* MAIN CONTENT AREA */}
				<main className="flex-1 w-full px-4 sm:px-6 md:px-8 pb-10">
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>
				</main>

				{/* Footer */}
				<footer className="px-8 py-6 text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">&copy; 2026 Nebeng Yuk. All Rights Reserved.</footer>
			</div>
		</div>
	);
}
