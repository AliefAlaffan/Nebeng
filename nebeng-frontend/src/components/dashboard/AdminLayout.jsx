import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, Bell, Search, ChevronDown } from "lucide-react";

export default function AdminLayout({ children }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isScrolled] = useState(false);
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const avatarUrl = user?.avatar ? `http://127.0.0.1:8000/storage/${user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`;

	// Efek shadow pada header saat di-scroll
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch("http://127.0.0.1:8000/api/profile", {
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

	// Menentukan judul halaman berdasarkan path
	const getPageTitle = () => {
		const path = location.pathname;
		if (path.includes("/admin/dashboard")) return "Dashboard";
		if (path.includes("/admin/verifikasi-mitra")) return "Verifikasi Mitra";
		if (path.includes("/admin/verifikasi-customer")) return "Verifikasi Customer";
		if (path.includes("/admin/mitra")) return "Daftar Mitra";
		if (path.includes("/admin/kendaraan-mitra")) return "Kendaraan Mitra";
		if (path.includes("/admin/blokir-mitra")) return "Blokir Mitra";
		if (path.includes("/admin/customer")) return "Daftar Customer";
		if (path.includes("/admin/blokir-customer")) return "Blokir Customer";
		if (path.includes("/admin/pesanan")) return "Pesanan";
		if (path.includes("/admin/refund")) return "Refund";
		if (path.includes("/admin/laporan")) return "Laporan";
		if (path.includes("/admin/settings")) return "Pengaturan Sistem";
		return "Dashboard Admin";
	};

	return (
		// Hapus overflow-x-hidden di sini jika sticky masih bermasalah
		<div className="flex min-h-screen bg-[#F8FAFC] font-sans">
			{/* Sidebar Component */}
			<Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

			{/* Tambahkan flex-col dan pastikan w-full */}
			<div className="flex-1 flex flex-col min-w-0 md:ml-72 transition-all duration-300">
				{/* STICKY NAVBAR */}
				{/* Pastikan tidak ada parent di atas header ini yang memiliki overflow-hidden */}
				<header
					className={`sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-indigo-900 md:bg-transparent md:backdrop-blur-md md:shadow-sm"}`}
				>
					{/* ================= LEFT SECTION ================= */}
					<div className="flex items-center gap-4">
						{/* Tampilan MOBILE: Hallo [Nama] */}
						<div className="md:hidden flex items-center gap-2">
							<h1 className="text-xl font-black text-white tracking-tight leading-tight truncate max-w-50">Hallo {loadingUser ? "..." : user?.name} 👋</h1>
						</div>

						{/* Tampilan DESKTOP: Breadcrumb Title */}
						<div className="hidden bg md:block text-left">
							<h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Halaman</h2>
							<h1 className="text-lg font-black text-indigo-900 tracking-tight">{getPageTitle()}</h1>
						</div>
					</div>

					{/* ================= RIGHT SECTION ================= */}
					<div className="flex items-center gap-3 sm:gap-6">
						{/* Notification Icon */}
						<Link
							to="/admin/notifikasi"
							className={`relative p-2.5 rounded-xl transition-all group ${isScrolled ? "bg-white border border-gray-100 text-gray-400" : "bg-white/10 md:bg-white text-white md:text-gray-400 md:border md:border-gray-100"}`}
						>
							<Bell size={20} />
							{/* Red Dot Indicator */}
							<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-900 md:border-white"></span>
						</Link>

						{/* Profile Dropdown: Sembunyikan di Mobile, Muncul di Desktop */}
						<Link to="/admin/profil" className="hidden md:flex items-center gap-3 p-1.5 pr-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
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
