import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { Search, Star, ChevronRight, PlusCircle, History, X, Bike, Car, Package } from "lucide-react";

export default function RewardPoints() {
	const [points, setPoints] = useState(1000);
	const [searchQuery, setSearchQuery] = useState("");
	const [, setHistory] = useState([]);
	const [showAddPointModal, setShowAddPointModal] = useState(false); // State untuk Pop-up

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const rewards = [
		{ id: 1, title: "Hangatkan Harimu dengan Mug Nebeng", img: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=400", points: 120 },
		{ id: 2, title: "Tampil Keren dengan T-shirt Nebeng", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400", points: 200 },
		{ id: 3, title: "Bawa Kesegaran dengan Tumbler Nebeng", img: "https://images.unsplash.com/photo-1602143399827-bd939e938ad0?q=80&w=400", points: 150 },
	];

	useEffect(() => {
		const fetchRewardData = async () => {
			try {
				const token = localStorage.getItem("token");
				const pointsRes = await fetch("http://127.0.0.1:8000/api/reward-points", {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});
				const pointsData = await pointsRes.json();
				setPoints(pointsData.reward_points);

				const historyRes = await fetch("http://127.0.0.1:8000/api/reward-history", {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});
				const historyData = await historyRes.json();
				setHistory(historyData);
			} catch (err) {
				console.error("Reward fetch error:", err);
			}
		};
		fetchRewardData();
	}, []);

	const filteredRewards = useMemo(() => {
		return rewards.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [rewards, searchQuery]);

	const handleRedeem = async () => {
		// ... logika redeem tetap sama ...
	};

	return (
		<CustomerLayout>
			<div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-8 relative">
				{/* POINT CARD SECTION */}
				<div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100 overflow-hidden relative group">
					<div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
						<div className="flex items-center gap-6">
							<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-inner group-hover:rotate-12 transition-transform duration-500">
								<Star size={32} fill="currentColor" />
							</div>
							<div>
								<h1 className="text-3xl md:text-4xl font-black text-indigo-900 tracking-tight">{points.toLocaleString()} Point</h1>
								<p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Status Keanggotaan: Gold</p>
							</div>
						</div>

						<div className="flex gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
							<button
								onClick={() => setShowAddPointModal(true)} // Trigger Pop-up
								className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-indigo-900 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm"
							>
								<PlusCircle size={18} /> Tambah Point
							</button>
							<Link to="/customer/reward-history" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-indigo-900 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm">
								<History size={18} /> Riwayat
							</Link>
						</div>
					</div>
					<div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
				</div>

				{/* MODAL POP-UP TAMBAH POINT */}
				{showAddPointModal && (
					<div className="fixed inset-0 z-100 flex items-center justify-center p-4">
						{/* Overlay */}
						<div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddPointModal(false)}></div>

						{/* Modal Content */}
						<div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 md:p-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
							<button onClick={() => setShowAddPointModal(false)} className="absolute right-6 top-6 p-2 text-gray-300 hover:text-indigo-900 transition-colors">
								<X size={24} />
							</button>

							<div className="mb-10">
								<h2 className="text-3xl font-black text-indigo-900 tracking-tight">Tambah Point</h2>
								<p className="text-gray-400 font-medium text-sm mt-2">Point akan bertambah setiap transaksi</p>
							</div>

							<div className="space-y-8">
								{/* Item Motor */}
								<div className="flex gap-6 group">
									<div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-900 shrink-0 group-hover:scale-110 transition-transform">
										<Bike size={32} />
									</div>
									<div>
										<h4 className="text-lg font-black text-indigo-900">Nebeng Motor</h4>
										<p className="text-xs text-gray-400 leading-relaxed font-medium">
											Setiap penggunaan fitur nebeng motor, point akan bertambah sebanyak <span className="text-indigo-600 font-bold">15 point</span>
										</p>
									</div>
								</div>

								{/* Item Mobil */}
								<div className="flex gap-6 group">
									<div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-900 shrink-0 group-hover:scale-110 transition-transform">
										<Car size={32} />
									</div>
									<div>
										<h4 className="text-lg font-black text-indigo-900">Nebeng Mobil</h4>
										<p className="text-xs text-gray-400 leading-relaxed font-medium">
											Setiap penggunaan fitur nebeng mobil, point akan bertambah sebanyak <span className="text-indigo-600 font-bold">25 point</span>
										</p>
									</div>
								</div>

								{/* Item Barang */}
								<div className="flex gap-6 group border-b border-gray-50 pb-2">
									<div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-900 shrink-0 group-hover:scale-110 transition-transform">
										<Package size={32} />
									</div>
									<div>
										<h4 className="text-lg font-black text-indigo-900">Nebeng Barang</h4>
										<p className="text-xs text-gray-400 leading-relaxed font-medium">
											Setiap penggunaan fitur nebeng barang, point akan bertambah sebanyak <span className="text-indigo-600 font-bold">20 point</span>
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* SEARCH, CATEGORY & REWARD LIST (Sama seperti sebelumnya) */}
				{/* ... */}
				<div className="space-y-6">
					<div className="relative group">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
						<input
							type="text"
							placeholder="Ketik untuk mencari reward kamu..."
							className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-medium"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-4">
						<button className="px-8 py-3 bg-indigo-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Merchandise</button>
					</div>
				</div>

				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-black text-indigo-900 tracking-tight">Spesial Diskon Buat Kamu</h3>
						<button className="flex items-center gap-1 text-xs font-black text-pink-500 hover:text-pink-600 transition-colors uppercase tracking-widest">
							Lihat semua <ChevronRight size={14} />
						</button>
					</div>

					{filteredRewards.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredRewards.map((reward) => (
								<div key={reward.id} className="bg-white rounded-4xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
									<div className="relative h-48 rounded-2xl overflow-hidden mb-6">
										<img src={reward.img} alt={reward.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
										<div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-indigo-900 uppercase">-20% OFF</div>
									</div>
									<h4 className="text-sm font-black text-gray-800 leading-relaxed text-center px-2">{reward.title}</h4>
									<p className="text-center text-indigo-600 text-xs font-bold mt-2">{reward.points} Points</p>
									<div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
										<button
											onClick={() => handleRedeem(reward)}
											disabled={points < reward.points}
											className={`text-[10px] font-black uppercase tracking-[0.2em] ${points < reward.points ? "text-gray-300 cursor-not-allowed" : "text-indigo-600 hover:underline"}`}
										>
											Tukar Sekarang
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
							<p className="text-gray-400 font-medium italic">Reward tidak ditemukan...</p>
						</div>
					)}
				</div>
			</div>
		</CustomerLayout>
	);
}
