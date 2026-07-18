import React, { useState } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronLeft, CheckCircle2, Upload, FileText, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dokumen() {
	const navigate = useNavigate();
	const [previewImage, setPreviewImage] = useState(null);

	// Data dokumen berdasarkan image_8d98df.png
	const [documents, setDocuments] = useState([
		{
			id: "ktp",
			label: "KTP",
			status: "Sudah di-upload",
			image: "https://images.unsplash.com/photo-1554224155-169641357599?q=80&w=400",
		},
		{
			id: "sim",
			label: "SIM",
			status: "Sudah di-upload",
			image: "https://images.unsplash.com/photo-1633409302456-52bbbd09e19d?q=80&w=400",
		},
		{
			id: "skck",
			label: "SKCK",
			status: "Sudah di-upload",
			image: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?q=80&w=400",
		},
		{
			id: "rekening",
			label: "Rekening Bank",
			status: "Sudah di-upload",
			image: "https://images.unsplash.com/photo-1601597111158-2fcee29a4a39?q=80&w=400",
		},
	]);

	const handleUpdate = (id) => {
		alert(`Membuka galeri untuk mengubah dokumen: ${id.toUpperCase()}`);
		// Logika upload file Anda di sini
	};

	return (
		<MitraLayout>
			<div className="w-full max-w-3xl mx-auto px-4 py-6">
				{/* HEADER NAVIGATION */}
				<div className="flex items-center gap-4 mb-10">
					<button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Dokumen</h1>
				</div>

				{/* DOCUMENT LIST SECTION */}
				<div className="bg-white rounded-[40px] p-2 md:p-8 shadow-sm border border-gray-50">
					<div className="divide-y divide-gray-100">
						{documents.map((doc) => (
							<div key={doc.id} className="py-8 first:pt-4 last:pb-4 flex items-center justify-between gap-4 group">
								<div className="flex items-center gap-6 flex-1 min-w-0">
									{/* Thumbnail Image */}
									<div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0 bg-gray-50">
										<img src={doc.image} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
										<button onClick={() => setPreviewImage(doc.image)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
											<Eye size={20} />
										</button>
									</div>

									{/* Info Dokumen */}
									<div className="min-w-0">
										<h3 className="text-lg md:text-xl font-black text-gray-800 mb-1">{doc.label}</h3>
										<div className="flex items-center gap-1.5 text-emerald-500">
											<span className="text-xs md:text-sm font-bold">{doc.status}</span>
											<CheckCircle2 size={14} className="shrink-0" />
										</div>
									</div>
								</div>

								{/* Action Button */}
								<button
									onClick={() => handleUpdate(doc.id)}
									className="px-6 md:px-10 py-2.5 bg-white border-2 border-indigo-900 text-indigo-900 rounded-full font-black text-sm md:text-base hover:bg-indigo-900 hover:text-white transition-all shadow-sm active:scale-95"
								>
									Ubah
								</button>
							</div>
						))}
					</div>
				</div>

				{/* KEAMANAN DATA FOOTER */}
				<div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
					<div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
						<Upload size={20} />
					</div>
					<div>
						<p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Keamanan Data</p>
						<p className="text-[11px] text-indigo-400 font-medium leading-relaxed">Dokumen Anda akan disimpan secara terenkripsi untuk keperluan verifikasi identitas mitra dan tidak akan disebarluaskan tanpa izin.</p>
					</div>
				</div>
			</div>

			{/* LIGHTBOX PREVIEW MODAL */}
			{previewImage && (
				<div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-indigo-950/90 backdrop-blur-md animate-in fade-in duration-300">
					<button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
						<X size={24} />
					</button>
					<img src={previewImage} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" alt="Preview Dokumen" />
				</div>
			)}
		</MitraLayout>
	);
}
