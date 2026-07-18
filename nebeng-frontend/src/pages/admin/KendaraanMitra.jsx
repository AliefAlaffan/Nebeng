import AdminLayout from "../../components/dashboard/AdminLayout";
import { Search, Calendar, Download, Eye, Edit3, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export default function KendaraanMitra() {
	// Data fake untuk tabel kendaraan mitra sesuai gambar
	const vehicleData = Array(8)
		.fill({
			nama: "Muhammda Abdul",
			kendaraan: "Mobil",
			merk: "Toyota",
			plat: "B 1980 MWV",
			warna: "Hitam",
			image: "https://via.placeholder.com/50x35?text=Mobil", // Ganti dengan path image asli nanti
		})
		.map((item, index) => {
			// Variasi data untuk demo
			if (index === 1 || index === 5) {
				return {
					...item,
					kendaraan: "Motor",
					merk: index === 1 ? "Yamaha" : "Honda",
					plat: index === 1 ? "BG 3456 KL" : "BG 7439 CB",
					warna: "Putih",
					image: "https://via.placeholder.com/50x35?text=Motor",
				};
			}
			return item;
		});

	return (
		<AdminLayout>
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Daftar Mitra</h1>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				{/* Search & Actions */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto ml-auto">
						<button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium bg-white hover:bg-gray-50 transition-colors">
							<Calendar className="mr-2 w-4 h-4 text-gray-400" /> Kalender
						</button>
						<button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
							Download <Download className="ml-2 w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-sky-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
								<th className="px-4 py-4 rounded-l-lg">Image</th>
								<th className="px-4 py-4">Nama</th>
								<th className="px-4 py-4 text-center">Kendaraan</th>
								<th className="px-4 py-4">Merk Kendaraan</th>
								<th className="px-4 py-4">Plat Nomor</th>
								<th className="px-4 py-4">Warna</th>
								<th className="px-4 py-4 rounded-r-lg text-center">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{vehicleData.map((v, i) => (
								<tr key={i} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-4">
										<div className="w-16 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-100">
											<img src={v.image} alt={v.kendaraan} className="w-full h-full object-cover" />
										</div>
									</td>
									<td className="px-4 py-4 text-sm font-medium text-gray-700">{v.nama}</td>
									<td className="px-4 py-4 text-sm text-gray-500 text-center">{v.kendaraan}</td>
									<td className="px-4 py-4 text-sm text-gray-500">{v.merk}</td>
									<td className="px-4 py-4 text-sm text-gray-500 font-mono">{v.plat}</td>
									<td className="px-4 py-4 text-sm text-gray-500">{v.warna}</td>
									<td className="px-4 py-4 text-center">
										<div className="flex items-center justify-center gap-2">
											{/* Tombol Detail (Biru) */}
											<button className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors shadow-sm">
												<Eye className="w-4 h-4" />
											</button>
											{/* Tombol Edit (Kuning) */}
											<button className="p-2 bg-amber-400 text-white rounded hover:bg-amber-500 transition-colors shadow-sm">
												<Edit3 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
					<div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
						<div className="relative border border-gray-200 rounded-md px-2 py-1 flex items-center gap-1 bg-gray-50 cursor-pointer">
							10 <ChevronDown className="w-3 h-3 text-gray-400" />
						</div>
						<span>of 120 entries</span>
					</div>

					<div className="flex items-center gap-1">
						<button className="p-2 text-gray-300 hover:text-gray-500">
							<ChevronLeft className="w-5 h-5" />
						</button>
						<button className="w-8 h-8 flex items-center justify-center rounded bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">1</button>
						<button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 text-xs font-medium hover:bg-gray-50">2</button>
						<button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 text-xs font-medium hover:bg-gray-50">3</button>
						<span className="text-gray-300 mx-1">....</span>
						<button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 text-xs font-medium hover:bg-gray-50">6</button>
						<button className="p-2 text-gray-400 hover:text-gray-600">
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
