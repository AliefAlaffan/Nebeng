import React, { useState, useRef } from "react";
import MitraLayout from "../../components/dashboard/MitraLayout";
import { ChevronRight, ChevronLeft, UploadCloud, CheckCircle2, Camera, FileText, UserCheck, Trash2, Loader2, CreditCard, ShieldCheck, BadgeCheck } from "lucide-react";

export default function Verification() {
	const [step, setStep] = useState(1);

	const [files, setFiles] = useState({
		face: null,
		ktp: null,
		selfie: null,
		sim: null,
		skck: null,
		bank: null,
	});

	const [form, setForm] = useState({
		full_name: "",
		nik: "",
		birth_place: "",
		birth_date: "",
		gender: "",
		religion: "",
		address: "",
		province: "",
		city: "",
		district: "",
		village: "",
		bank_name: "",
		bank_account_name: "",
		bank_account_number: "",
	});

	const [loading, setLoading] = useState(false);

	// refs
	const faceInputRef = useRef(null);
	const ktpInputRef = useRef(null);
	const selfieInputRef = useRef(null);
	const simInputRef = useRef(null);
	const skckInputRef = useRef(null);
	const bankInputRef = useRef(null);

	const handleFileChange = (e, type) => {
		const file = e.target.files[0];

		if (file) {
			setFiles((prev) => ({
				...prev,
				[type]: file,
			}));
		}
	};

	const removeFile = (type) => {
		setFiles((prev) => ({
			...prev,
			[type]: null,
		}));
	};

	const handleInput = (e) => {
		setForm({
			...form,
			[e.target.name]: e.target.value,
		});
	};

	const preview = (file) => (file ? URL.createObjectURL(file) : null);

	const handleSubmit = async () => {
		setLoading(true);

		try {
			const token = localStorage.getItem("token");

			const formData = new FormData();

			// =========================
			// TYPE
			// =========================
			formData.append("type", "mitra");

			// =========================
			// DATA DIRI
			// =========================
			formData.append("full_name", form.full_name);
			formData.append("nik", form.nik);
			formData.append("birth_place", form.birth_place);
			formData.append("birth_date", form.birth_date);
			formData.append("gender", form.gender);
			formData.append("religion", form.religion);
			formData.append("address", form.address);

			// =========================
			// BANK
			// =========================
			formData.append("bank_name", form.bank_name);
			formData.append("bank_account_name", form.bank_account_name);
			formData.append("bank_account_number", form.bank_account_number);

			// =========================
			// FILES
			// =========================
			formData.append("face", files.face);
			formData.append("ktp", files.ktp);
			formData.append("selfie_ktp", files.selfie);

			formData.append("sim", files.sim);
			formData.append("skck", files.skck);
			formData.append("bank", files.bank);

			const res = await fetch("http://127.0.0.1:8000/api/verification", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Gagal verifikasi");
			}

			alert("Verifikasi mitra berhasil dikirim!");

			window.location.href = "/mitra/dashboard";
		} catch (err) {
			console.error(err);

			alert(err.message || "Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	};

	const steps = [
		{ id: 1, title: "Data Diri", icon: UserCheck },
		{ id: 2, title: "Foto Wajah", icon: Camera },
		{ id: 3, title: "Foto KTP", icon: FileText },
		{ id: 4, title: "Selfie KTP", icon: UserCheck },
		{ id: 5, title: "Foto SIM", icon: BadgeCheck },
		{ id: 6, title: "SKCK", icon: ShieldCheck },
		{ id: 7, title: "Rekening", icon: CreditCard },
		{ id: 8, title: "Konfirmasi", icon: CheckCircle2 },
	];

	return (
		<MitraLayout>
			<div className="max-w-3xl mx-auto py-12 px-4">
				{/* HEADER */}
				<div className="text-center mb-10">
					<h2 className="text-3xl font-black text-indigo-900 mb-2">Verifikasi Mitra</h2>

					<p className="text-gray-500">Lengkapi data dan dokumen berikut untuk menjadi mitra terverifikasi Nebeng.</p>
				</div>

				{/* STEPS */}
				<div className="flex items-center justify-between mb-12 relative overflow-x-auto gap-3">
					<div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

					{steps.map((s) => (
						<div key={s.id} className="relative z-10 flex flex-col items-center min-w-fit">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${step >= s.id ? "bg-indigo-600 border-indigo-100 text-white scale-110" : "bg-white border-gray-100 text-gray-300"}`}
							>
								<s.icon size={18} />
							</div>

							<span className={`text-[10px] font-bold uppercase mt-2 tracking-wider ${step >= s.id ? "text-indigo-600" : "text-gray-300"}`}>{s.title}</span>
						</div>
					))}
				</div>

				{/* CARD */}
				<div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-indigo-900/5 border border-indigo-50 relative overflow-hidden">
					{/* STEP 1 */}
					{step === 1 && (
						<div className="animate-in fade-in duration-300">
							<h3 className="text-2xl font-black text-gray-800 mb-2 text-center">Data Sesuai KTP</h3>

							<p className="text-sm text-gray-400 text-center mb-8">Pastikan seluruh data sesuai identitas resmi.</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<InputField label="Nama Lengkap" name="full_name" value={form.full_name} onChange={handleInput} />

								<InputField label="NIK" name="nik" value={form.nik} onChange={handleInput} />

								<InputField label="Tempat Lahir" name="birth_place" value={form.birth_place} onChange={handleInput} />

								<InputField label="Tanggal Lahir" type="date" name="birth_date" value={form.birth_date} onChange={handleInput} />

								<SelectField label="Jenis Kelamin" name="gender" value={form.gender} onChange={handleInput} options={["Laki-laki", "Perempuan"]} />

								<InputField label="Agama" name="religion" value={form.religion} onChange={handleInput} />

								<div className="md:col-span-2">
									<InputField label="Alamat Lengkap" name="address" value={form.address} onChange={handleInput} />
								</div>

								<InputField label="Provinsi" name="province" value={form.province} onChange={handleInput} />

								<InputField label="Kota / Kabupaten" name="city" value={form.city} onChange={handleInput} />

								<InputField label="Kecamatan" name="district" value={form.district} onChange={handleInput} />

								<InputField label="Kelurahan / Desa" name="village" value={form.village} onChange={handleInput} />
							</div>

							<button onClick={() => setStep(2)} className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg">
								Lanjut Upload Dokumen
							</button>
						</div>
					)}

					{/* FOTO WAJAH */}
					{step === 2 && (
						<UploadStep
							title="Foto Wajah"
							desc="Pastikan wajah terlihat jelas tanpa masker atau kacamata hitam."
							file={files.face}
							onUpload={() => faceInputRef.current.click()}
							onRemove={() => removeFile("face")}
							inputRef={faceInputRef}
							onChange={(e) => handleFileChange(e, "face")}
							onNext={() => setStep(3)}
							onBack={() => setStep(1)}
						/>
					)}

					{/* FOTO KTP */}
					{step === 3 && (
						<UploadStep
							title="Foto KTP"
							desc="Pastikan seluruh bagian KTP terlihat jelas."
							file={files.ktp}
							onUpload={() => ktpInputRef.current.click()}
							onRemove={() => removeFile("ktp")}
							inputRef={ktpInputRef}
							onChange={(e) => handleFileChange(e, "ktp")}
							onNext={() => setStep(4)}
							onBack={() => setStep(2)}
						/>
					)}

					{/* SELFIE */}
					{step === 4 && (
						<UploadStep
							title="Selfie dengan KTP"
							desc="Pegang KTP di bawah dagu dan pastikan tidak blur."
							file={files.selfie}
							onUpload={() => selfieInputRef.current.click()}
							onRemove={() => removeFile("selfie")}
							inputRef={selfieInputRef}
							onChange={(e) => handleFileChange(e, "selfie")}
							onNext={() => setStep(5)}
							onBack={() => setStep(3)}
						/>
					)}

					{/* SIM */}
					{step === 5 && (
						<UploadStep
							title="Upload Foto SIM"
							desc="Upload SIM aktif sesuai kendaraan yang digunakan."
							file={files.sim}
							onUpload={() => simInputRef.current.click()}
							onRemove={() => removeFile("sim")}
							inputRef={simInputRef}
							onChange={(e) => handleFileChange(e, "sim")}
							onNext={() => setStep(6)}
							onBack={() => setStep(4)}
						/>
					)}

					{/* SKCK */}
					{step === 6 && (
						<UploadStep
							title="Upload SKCK"
							desc="Pastikan SKCK masih berlaku dan data terlihat jelas."
							file={files.skck}
							onUpload={() => skckInputRef.current.click()}
							onRemove={() => removeFile("skck")}
							inputRef={skckInputRef}
							onChange={(e) => handleFileChange(e, "skck")}
							onNext={() => setStep(7)}
							onBack={() => setStep(5)}
						/>
					)}

					{/* REKENING */}
					{step === 7 && (
						<div className="animate-in fade-in duration-300">
							<h3 className="text-2xl font-black text-gray-800 mb-2 text-center">Informasi Rekening</h3>

							<p className="text-sm text-gray-400 text-center mb-8">Rekening digunakan untuk pencairan saldo mitra.</p>

							<div className="space-y-5">
								<InputField label="Nama Bank" name="bank_name" value={form.bank_name} onChange={handleInput} />

								<InputField label="Nama Pemilik Rekening" name="bank_account_name" value={form.bank_account_name} onChange={handleInput} />

								<InputField label="Nomor Rekening" name="bank_account_number" value={form.bank_account_number} onChange={handleInput} />

								<div>
									<p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Bukti Buku Tabungan / Rekening</p>

									<div
										onClick={!files.bank ? () => bankInputRef.current.click() : undefined}
										className={`relative border-2 border-dashed rounded-[2rem] transition-all cursor-pointer overflow-hidden group ${
											files.bank ? "border-indigo-600 h-64" : "border-gray-200 hover:border-indigo-400 h-64 flex flex-col items-center justify-center bg-gray-50"
										}`}
									>
										{files.bank ? (
											<>
												<img src={URL.createObjectURL(files.bank)} className="w-full h-full object-cover" alt="Preview" />

												<button
													onClick={(e) => {
														e.stopPropagation();
														removeFile("bank");
													}}
													className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
												>
													<Trash2 size={16} />
												</button>
											</>
										) : (
											<>
												<div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
													<UploadCloud size={32} />
												</div>

												<p className="text-sm font-bold text-gray-500">Upload foto rekening</p>

												<p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG (Maks 5MB)</p>
											</>
										)}
									</div>

									<input type="file" ref={bankInputRef} onChange={(e) => handleFileChange(e, "bank")} className="hidden" accept="image/*" />
								</div>
							</div>

							<div className="flex items-center gap-4 mt-10">
								<button onClick={() => setStep(6)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-all">
									Kembali
								</button>

								<button
									onClick={() => setStep(8)}
									disabled={!files.bank || !form.bank_name || !form.bank_account_name || !form.bank_account_number}
									className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
								>
									Lanjut <ChevronRight size={20} />
								</button>
							</div>
						</div>
					)}

					{/* KONFIRMASI */}
					{step === 8 && (
						<div className="animate-in fade-in zoom-in duration-300">
							<h3 className="text-xl font-bold text-gray-800 text-center mb-6">Periksa Kembali Dokumen Anda</h3>

							<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
								<ReviewCard label="Foto Wajah" img={preview(files.face)} />

								<ReviewCard label="Foto KTP" img={preview(files.ktp)} />

								<ReviewCard label="Selfie KTP" img={preview(files.selfie)} />

								<ReviewCard label="SIM" img={preview(files.sim)} />

								<ReviewCard label="SKCK" img={preview(files.skck)} />

								<ReviewCard label="Rekening" img={preview(files.bank)} />
							</div>

							<div className="flex items-center gap-4">
								<button onClick={() => setStep(7)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
									<ChevronLeft size={20} /> Kembali
								</button>

								<button
									onClick={handleSubmit}
									disabled={loading}
									className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
								>
									{loading ? <Loader2 className="animate-spin" /> : "Kirim Sekarang"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</MitraLayout>
	);
}

// ================= SUB COMPONENTS =================

function UploadStep({ title, desc, file, onUpload, onRemove, inputRef, onChange, onNext, onBack }) {
	return (
		<div className="animate-in slide-in-from-right-8 duration-300 text-center">
			<h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>

			<p className="text-sm text-gray-400 mb-8">{desc}</p>

			<div
				onClick={!file ? onUpload : undefined}
				className={`relative border-2 border-dashed rounded-[2rem] transition-all cursor-pointer overflow-hidden group ${
					file ? "border-indigo-600 h-64" : "border-gray-200 hover:border-indigo-400 h-64 flex flex-col items-center justify-center bg-gray-50"
				}`}
			>
				{file ? (
					<>
						<img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />

						<button
							onClick={(e) => {
								e.stopPropagation();
								onRemove();
							}}
							className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
						>
							<Trash2 size={16} />
						</button>
					</>
				) : (
					<>
						<div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
							<UploadCloud size={32} />
						</div>

						<p className="text-sm font-bold text-gray-500">Ketuk untuk pilih foto</p>

						<p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG (Maks 5MB)</p>
					</>
				)}
			</div>

			<input type="file" ref={inputRef} onChange={onChange} className="hidden" accept="image/*" />

			<div className="flex items-center gap-4 mt-10">
				{onBack && (
					<button onClick={onBack} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-all">
						Kembali
					</button>
				)}

				<button
					onClick={onNext}
					disabled={!file}
					className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
				>
					Lanjut <ChevronRight size={20} />
				</button>
			</div>
		</div>
	);
}

function ReviewCard({ label, img }) {
	return (
		<div className="bg-gray-50 p-2 rounded-2xl border border-gray-100">
			<img src={img} className="w-full h-32 object-cover rounded-xl mb-2" alt="Review" />

			<p className="text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">{label}</p>
		</div>
	);
}

function InputField({ label, name, value, onChange, type = "text" }) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-black text-gray-500 uppercase tracking-wider">{label}</label>

			<input type={type} name={name} value={value} onChange={onChange} className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-semibold" />
		</div>
	);
}

function SelectField({ label, name, value, onChange, options = [] }) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-black text-gray-500 uppercase tracking-wider">{label}</label>

			<select name={name} value={value} onChange={onChange} className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-semibold">
				<option value="">Pilih</option>

				{options.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
		</div>
	);
}
