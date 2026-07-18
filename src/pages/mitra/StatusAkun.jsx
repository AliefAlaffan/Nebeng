import React, { useState } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, Mail, Phone, MapPin, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StatusAkun() {
	const navigate = useNavigate();
	const [openDropdown, setOpenDropdown] = useState(null);

	// Data Profile berdasarkan image_8d3b0a.png
	const profileData = {
		name: "Kamado Tanjiro",
		id: "213461",
		joinDate: "19 Januari 2024",
		phone: "(+62) 81349182987",
		email: "kamado.tanjiro@gmail.com",
		location: "Yogyakarta",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tanjiro",
	};

	// Data Status berdasarkan image_8d3b0a.png & image_8d8d79.png
	const accountStatuses = [
		{
			id: "pendaftaran",
			label: "Status pendaftaran",
			title: "Status Dokumen Pendaftaran Mitra Nebeng",
			desc: "Dokumen Anda sudah terkirim dan sedang dalam proses verifikasi",
			statusLabel: "Sedang diproses",
			item: "Dokumen driver",
		},
		{
			id: "tambah_kendaraan",
			label: "Status tambah kendaraan",
			title: "Verifikasi Kendaraan Baru",
			desc: "Admin sedang meninjau kelengkapan STNK dan foto kendaraan Anda",
			statusLabel: "Menunggu",
			item: "Data Kendaraan",
		},
		{
			id: "hapus_kendaraan",
			label: "Status hapus kendaraan",
			title: "Pengajuan Hapus Kendaraan",
			desc: "Permintaan penghapusan unit kendaraan telah disetujui",
			statusLabel: "Disetujui",
			item: "Unit Avanza R 2424 MJ",
		},
		{
			id: "perubahan_dokumen",
			label: "Status perubahan dokumen",
			title: "Pembaruan Dokumen Identitas",
			desc: "Perubahan KTP/SIM Anda telah berhasil diverifikasi oleh sistem",
			statusLabel: "Selesai",
			item: "Dokumen SIM A",
		},
	];

	const toggleDropdown = (id) => {
		setOpenDropdown(openDropdown === id ? null : id);
	};

	return (
		<MitraLayout>
			<div className="w-full max-w-screen-md mx-auto px-4 py-6 pb-26">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Status Akun</h1>
				</div>

				<div className="space-y-6">
					{/* PROFILE CARD */}
					<div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
						<div className="flex flex-col items-center md:items-start md:flex-row gap-6 mb-6">
							<div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-gray-50 shadow-sm shrink-0">
								<img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover bg-indigo-50" />
							</div>
							<div className="text-center md:text-left space-y-1">
								<h2 className="text-xl font-black text-gray-800">{profileData.name}</h2>
								<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
									{profileData.id} | Bergabung sejak {profileData.joinDate}
								</p>
								<div className="pt-3 space-y-2">
									<div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 font-medium italic">
										<Phone size={14} className="text-indigo-400" /> {profileData.phone}
									</div>
									<div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 font-medium italic border-t border-gray-50 pt-2">
										<Mail size={14} className="text-indigo-400" /> {profileData.email}
									</div>
									<div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 font-medium italic border-t border-gray-50 pt-2">
										<MapPin size={14} className="text-indigo-400" /> {profileData.location}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* STATUS LIST WITH DROPDOWN */}
					<div className="space-y-3">
						<h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 pl-2">Detail Aktivitas Akun</h3>

						{accountStatuses.map((status) => (
							<div key={status.id} className="group">
								<button
									onClick={() => toggleDropdown(status.id)}
									className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
										openDropdown === status.id ? "bg-indigo-900 border-indigo-900 shadow-lg text-white" : "bg-white border-gray-100 text-gray-700 hover:border-indigo-200"
									}`}
								>
									<span className="font-bold text-sm">{status.label}</span>
									{openDropdown === status.id ? <ChevronDown size={18} /> : <ChevronRight size={18} className="text-gray-300" />}
								</button>

								{/* DROPDOWN CONTENT */}
								{openDropdown === status.id && (
									<div className="mt-2 p-6 bg-white rounded-2xl border-2 border-indigo-50 shadow-inner animate-in slide-in-from-top-2 duration-300">
										<h4 className="text-lg font-black text-indigo-900 mb-2 leading-tight">{status.title}</h4>
										<p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">{status.desc}</p>

										<div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
											<div className="flex items-center gap-3">
												<div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
													<FileText size={16} />
												</div>
												<span className="text-sm font-black text-gray-700">{status.item}</span>
											</div>
											<span
												className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${status.statusLabel === "Disetujui" || status.statusLabel === "Selesai" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
											>
												{status.statusLabel}
											</span>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</MitraLayout>
	);
}
