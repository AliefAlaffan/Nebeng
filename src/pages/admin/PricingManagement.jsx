import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/dashboard/AdminLayout";
import { Save, Settings, Truck, Package, Layers, Loader2, CheckCircle, Coins } from "lucide-react";
import toast from "react-hot-toast";
const API_URL = "http://localhost:8000/api";

function PriceInput({ label, name, value, onChange, suffix = "Rp" }) {
	return (
		<div className="space-y-2 group">
			<label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-hover:text-indigo-600 transition-colors">{label}</label>

			<div className="relative rounded-2xl shadow-xs">
				{suffix === "Rp" && (
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<span className="text-gray-400 font-black text-sm">Rp</span>
					</div>
				)}

				<input
					type="number"
					name={name}
					value={value || ""}
					onChange={onChange}
					placeholder="0"
					className={`w-full py-3.5 border-2 border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-bold text-gray-700 outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 ${
						suffix === "Rp" ? "pl-10 pr-4" : "pl-5 pr-12"
					}`}
				/>

				{suffix !== "Rp" && (
					<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
						<span className="text-indigo-600 font-black text-xs uppercase tracking-wider">{suffix}</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default function PricingManagement() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [form, setForm] = useState({
		motor_price_per_km: "",
		motor_min_price: "",
		mobil_price_per_km: "",
		mobil_min_price: "",
		barang_motor_base_price: "",
		barang_motor_price_per_km: "",
		barang_mobil_base_price: "",
		barang_mobil_price_per_km: "",
		barang_bus_base_price: "",
		barang_bus_price_per_km: "",
		barang_kereta_base_price: "",
		barang_kereta_price_per_km: "",
		barang_kapal_base_price: "",
		barang_kapal_price_per_km: "",
		barang_pesawat_base_price: "",
		barang_pesawat_price_per_km: "",
		xxs_multiplier: "",
		xs_multiplier: "",
		kecil_multiplier: "",
		sedang_multiplier: "",
		besar_multiplier: "",
	});

	useEffect(() => {
		fetchPricing();
	}, []);

	const fetchPricing = async () => {
		try {
			const res = await fetch(`${API_URL}/admin/pricing`, {
				headers: {
					Accept: "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await res.json();

			console.log(data);

			setForm((prev) => ({
				...prev,
				...data,
			}));
		} catch (err) {
			console.error(err);
			toast.error("Gagal memuat konfigurasi");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setForm({
			...form,
			[e.target.name]: e.target.value,
		});
	};

	const savePricing = async () => {
		try {
			setSaving(true);

			const res = await fetch(`${API_URL}/admin/pricing`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify(form),
			});

			console.log(localStorage.getItem("token"));

			const data = await res.json();

			console.log(data);

			if (!res.ok) {
				throw new Error("Request gagal");
			}

			toast.success("Konfigurasi tarif berhasil diperbarui");
		} catch (err) {
			console.error(err);
			toast.error("Gagal menyimpan konfigurasi");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<AdminLayout>
				<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-indigo-900">
					<Loader2 className="animate-spin" size={40} />
					<p className="text-xs font-black uppercase tracking-widest text-gray-400">Memuat Konfigurasi Tarif...</p>
				</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			{/* Wrapper Utama dengan Padding Bottom Aman */}
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-8 pb-32 font-sans">
				{/* HEADER PAGE */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-indigo-900">
							<Settings size={24} />
						</div>
						<div>
							<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Konfigurasi Tarif</h1>
							<p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kelola Seluruh Parameter Harga Aplikasi</p>
						</div>
					</div>

					<button
						onClick={savePricing}
						disabled={saving}
						className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
					>
						{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
						{saving ? "Menyimpan..." : "Simpan Perubahan"}
					</button>
				</div>

				{/* GRID LAYOUT UTAMA */}
				<div className="grid grid-cols-1 gap-8">
					{/* CARD 1: TARIF PENUMPANG */}
					<div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-indigo-950/5 border border-indigo-50/50 space-y-6">
						<div className="flex items-center gap-3 border-b border-gray-50 pb-4">
							<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
								<Truck size={20} />
							</div>
							<h2 className="text-lg font-black text-gray-800 tracking-tight">Tarif Nebeng Penumpang</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<PriceInput label="Motor (Per KM)" name="motor_price_per_km" value={form.motor_price_per_km} onChange={handleChange} />
							<PriceInput label="Motor (Minimum)" name="motor_min_price" value={form.motor_min_price} onChange={handleChange} />
							<PriceInput label="Mobil (Per KM)" name="mobil_price_per_km" value={form.mobil_price_per_km} onChange={handleChange} />
							<PriceInput label="Mobil (Minimum)" name="mobil_min_price" value={form.mobil_min_price} onChange={handleChange} />
						</div>
					</div>

					{/* CARD 2: TARIF BARANG */}
					<div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-indigo-950/5 border border-indigo-50/50 space-y-6">
						<div className="flex items-center gap-3 border-b border-gray-50 pb-4">
							<div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
								<Package size={20} />
							</div>
							<h2 className="text-lg font-black text-gray-800 tracking-tight">Tarif Dasar Nebeng Barang</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<PriceInput label="Motor (Tarif Awal)" name="barang_motor_base_price" value={form.barang_motor_base_price} onChange={handleChange} />
							<PriceInput label="Motor (Per KM)" name="barang_motor_price_per_km" value={form.barang_motor_price_per_km} onChange={handleChange} />

							<PriceInput label="Mobil (Tarif Awal)" name="barang_mobil_base_price" value={form.barang_mobil_base_price} onChange={handleChange} />
							<PriceInput label="Mobil (Per KM)" name="barang_mobil_price_per_km" value={form.barang_mobil_price_per_km} onChange={handleChange} />

							<PriceInput label="Bus (Tarif Awal)" name="barang_bus_base_price" value={form.barang_bus_base_price} onChange={handleChange} />
							<PriceInput label="Bus (Per KM)" name="barang_bus_price_per_km" value={form.barang_bus_price_per_km} onChange={handleChange} />

							<PriceInput label="Kereta (Tarif Awal)" name="barang_kereta_base_price" value={form.barang_kereta_base_price} onChange={handleChange} />
							<PriceInput label="Kereta (Per KM)" name="barang_kereta_price_per_km" value={form.barang_kereta_price_per_km} onChange={handleChange} />

							<PriceInput label="Kapal (Tarif Awal)" name="barang_kapal_base_price" value={form.barang_kapal_base_price} onChange={handleChange} />
							<PriceInput label="Kapal (Per KM)" name="barang_kapal_price_per_km" value={form.barang_kapal_price_per_km} onChange={handleChange} />

							<PriceInput label="Pesawat (Tarif Awal)" name="barang_pesawat_base_price" value={form.barang_pesawat_base_price} onChange={handleChange} />
							<PriceInput label="Pesawat (Per KM)" name="barang_pesawat_price_per_km" value={form.barang_pesawat_price_per_km} onChange={handleChange} />
						</div>
					</div>

					{/* CARD 3: MULTIPLIER KAPASITAS */}
					<div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-indigo-950/5 border border-indigo-50/50 space-y-6">
						<div className="flex items-center gap-3 border-b border-gray-50 pb-4">
							<div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
								<Layers size={20} />
							</div>
							<h2 className="text-lg font-black text-gray-800 tracking-tight">Multiplier Kapasitas Logistik</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
							<PriceInput label="XXS (0.5 Kg)" name="xxs_multiplier" suffix="X" value={form.xxs_multiplier} onChange={handleChange} />

							<PriceInput label="XS (1 Kg)" name="xs_multiplier" suffix="X" value={form.xs_multiplier} onChange={handleChange} />

							<PriceInput label="Kecil (5 Kg)" name="kecil_multiplier" suffix="X" value={form.kecil_multiplier} onChange={handleChange} />

							<PriceInput label="Sedang (10 Kg)" name="sedang_multiplier" suffix="X" value={form.sedang_multiplier} onChange={handleChange} />

							<PriceInput label="Besar (15 Kg)" name="besar_multiplier" suffix="X" value={form.besar_multiplier} onChange={handleChange} />
						</div>
					</div>

					{/* BOTTOM QUICK BUTTON */}
					<div className="flex justify-end pt-4">
						<button
							onClick={savePricing}
							disabled={saving}
							className="w-full sm:w-auto px-12 py-4 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
						>
							{saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
							{saving ? "Menyimpan Perubahan..." : "Simpan Seluruh Konfigurasi"}
						</button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
