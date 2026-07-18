import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { LayoutDashboard, Users, User, ClipboardList, RefreshCcw, FileText, LogOut, ChevronRight, X, Bike, ShieldCheck, Settings, DollarSign } from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
	const location = useLocation();
	const navigate = useNavigate();
	const pathname = location.pathname;

	const [openPengaturan, setOpenPengaturan] = useState(pathname.startsWith("/admin/pengaturan"));

	/* ================= USER STATE ================= */
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);

	const avatarUrl = user?.avatar ? `http://127.0.0.1:8000/storage/${user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "Admin"}`;

	/* ================= DROPDOWN STATE ================= */
	const [openVerifikasi, setOpenVerifikasi] = useState(pathname.startsWith("/admin/verifikasi"));

	const [openMitra, setOpenMitra] = useState(pathname.startsWith("/admin/mitra") || pathname.startsWith("/admin/kendaraan-mitra") || pathname.startsWith("/admin/blokir-mitra"));

	const [openCustomer, setOpenCustomer] = useState(pathname.startsWith("/admin/customer") || pathname.startsWith("/admin/blokir-customer"));

	/* ================= FETCH USER ================= */
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const token = localStorage.getItem("token");

				const res = await fetch("http://127.0.0.1:8000/api/profile", {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});

				const json = await res.json();
				setUser(json);
			} catch (error) {
				console.error("Sidebar user fetch error:", error);
			} finally {
				setLoadingUser(false);
			}
		};

		fetchUser();
	}, []);

	/* ================= LOGOUT ================= */
	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	/* ================= STYLE MENU ================= */
	const menuStyle = ({ isActive }) =>
		`group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive ? "bg-white text-indigo-900 shadow-xl shadow-black/20 translate-x-2" : "hover:bg-white/5 text-white/60 hover:text-white"}`;

	const subMenuStyle = ({ isActive }) => `py-2 transition-all ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`;

	return (
		<>
			{/* MOBILE OVERLAY */}
			{sidebarOpen && <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

			{/* SIDEBAR */}
			<div
				className={`fixed z-50 top-0 left-0 h-screen w-72 bg-indigo-900 text-white flex flex-col shadow-2xl transform transition-all duration-500 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				} md:translate-x-0 border-r border-white/5`}
			>
				{/* LOGO */}
				<div className="p-8 relative">
					<button className="absolute right-4 top-8 p-1 bg-white/10 rounded-lg md:hidden" onClick={() => setSidebarOpen(false)}>
						<X size={20} />
					</button>

					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl">
							<Bike size={28} />
						</div>

						<div>
							<h1 className="text-2xl font-black tracking-tighter">NEBENG.</h1>
							<p className="text-[10px] font-bold text-sky-300 uppercase tracking-[0.2em] mt-1">Premium Travel</p>
						</div>
					</div>
				</div>

				{/* MENU */}
				<div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
					<p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 pl-4">Menu Utama</p>

					<nav className="flex flex-col gap-2">
						<NavLink to="/admin/dashboard" onClick={() => setSidebarOpen(false)} className={menuStyle}>
							<div className="flex items-center gap-4">
								<LayoutDashboard size={20} />
								<span className="text-sm font-bold">Dashboard</span>
							</div>
							<ChevronRight size={16} />
						</NavLink>

						{/* VERIFIKASI */}
						<button onClick={() => setOpenVerifikasi(!openVerifikasi)} className="group flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white">
							<div className="flex items-center gap-4">
								<Users size={20} />
								<span className="text-sm font-bold">Verifikasi Data</span>
							</div>
							<ChevronRight size={16} className={openVerifikasi ? "rotate-90" : ""} />
						</button>

						{openVerifikasi && (
							<div className="ml-8 flex flex-col border-l border-white/5 pl-4 text-sm">
								<NavLink to="/admin/verifikasi-mitra" className={subMenuStyle}>
									Verifikasi Mitra
								</NavLink>

								<NavLink to="/admin/verifikasi-customer" className={subMenuStyle}>
									Verifikasi Customer
								</NavLink>
							</div>
						)}

						{/* Mitra */}
						<button onClick={() => setOpenMitra(!openMitra)} className="group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 hover:bg-white/5 text-white/60 hover:text-white">
							<div className="flex items-center gap-4">
								<User size={20} className="shrink-0" />
								<span className="text-sm font-bold tracking-tight">Mitra</span>
							</div>
							<ChevronRight size={16} className={`transition-transform duration-300 ${openMitra ? "rotate-90" : ""}`} />
						</button>

						{openMitra && (
							<div className="ml-8 flex flex-col border-l border-white/5 pl-4 text-sm">
								<NavLink to="/admin/mitra" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Daftar Mitra
								</NavLink>

								<NavLink to="/admin/kendaraan-mitra" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Kendaraan Mitra
								</NavLink>

								<NavLink to="/admin/blokir-mitra" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Blokir
								</NavLink>
							</div>
						)}

						{/* Customer */}
						<button onClick={() => setOpenCustomer(!openCustomer)} className="group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 hover:bg-white/5 text-white/60 hover:text-white">
							<div className="flex items-center gap-4">
								<Users size={20} className="shrink-0" />
								<span className="text-sm font-bold tracking-tight">Customer</span>
							</div>
							<ChevronRight size={16} className={`transition-transform duration-300 ${openCustomer ? "rotate-90" : ""}`} />
						</button>

						{openCustomer && (
							<div className="ml-8 flex flex-col border-l border-white/5 pl-4 text-sm">
								<NavLink to="/admin/customer" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Daftar Customer
								</NavLink>

								<NavLink to="/admin/blokir-customer" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Blokir
								</NavLink>
							</div>
						)}

						{/* PESANAN */}
						<NavLink to="/admin/pesanan" onClick={() => setSidebarOpen(false)} className={menuStyle}>
							<div className="flex items-center gap-4">
								<ClipboardList size={20} />
								<span className="text-sm font-bold">Pesanan</span>
							</div>
							<ChevronRight size={16} />
						</NavLink>

						{/* PENGATURAN SISTEM */}
						<button onClick={() => setOpenPengaturan(!openPengaturan)} className="group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 hover:bg-white/5 text-white/60 hover:text-white">
							<div className="flex items-center gap-4">
								<Settings size={20} className="shrink-0" />
								<span className="text-sm font-bold tracking-tight">Pengaturan Sistem</span>
							</div>

							<ChevronRight size={16} className={`transition-transform duration-300 ${openPengaturan ? "rotate-90" : ""}`} />
						</button>

						{openPengaturan && (
							<div className="ml-8 flex flex-col border-l border-white/5 pl-4 text-sm">
								<NavLink to="/admin/pengaturan/tarif" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Tarif Nebeng
								</NavLink>

								{/* <NavLink to="/admin/pengaturan/komisi" className={({ isActive }) => `py-2 ${isActive ? "text-sky-300 font-bold" : "text-white/60 hover:text-white"}`}>
									Komisi Platform
								</NavLink> */}
							</div>
						)}

						{/* REFUND */}
						{/* <NavLink to="/admin/refund" onClick={() => setSidebarOpen(false)} className={menuStyle}>
							<div className="flex items-center gap-4">
								<RefreshCcw size={20} />
								<span className="text-sm font-bold">Refund</span>
							</div>
							<ChevronRight size={16} />
						</NavLink> */}

						{/* LAPORAN */}
						{/* <NavLink to="/admin/laporan" onClick={() => setSidebarOpen(false)} className={menuStyle}>
							<div className="flex items-center gap-4">
								<FileText size={20} />
								<span className="text-sm font-bold">Laporan</span>
							</div>
							<ChevronRight size={16} />
						</NavLink> */}
					</nav>

					{/* INFO CARD */}
					<div className="mt-6 mx-2 p-5 bg-gradient-to-br from-indigo-800 to-indigo-950 rounded-[24px] border border-white/5">
						<ShieldCheck className="text-sky-400 mb-3" size={20} />
						<p className="text-xs font-black text-white mb-1">Keamanan Prioritas</p>
						<p className="text-[10px] text-white/50 leading-relaxed">Perjalananmu selalu dipantau sistem GPS 24/7.</p>
					</div>
				</div>

				{/* USER PROFILE */}
				<div className="p-6 space-y-4">
					<Link to="/admin/profil">
						<div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5 hover:bg-black/30 transition-all">
							<img src={avatarUrl} className="w-10 h-10 rounded-xl bg-indigo-800" alt="Admin" />

							<div className="min-w-0">
								<p className="text-xs font-black truncate">{loadingUser ? "Loading..." : user?.name}</p>

								<p className="text-[10px] text-emerald-400 font-bold uppercase">{user?.role || "admin"}</p>
							</div>
						</div>
					</Link>

					<button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-sm">
						<LogOut size={18} />
						Keluar
					</button>
				</div>

				<style jsx>{`
					.no-scrollbar::-webkit-scrollbar {
						display: none;
					}
				`}</style>
			</div>
		</>
	);
}
