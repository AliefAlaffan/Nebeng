import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Eye, EyeOff, ShieldCheck, ArrowRight, User, Mail, Phone, Lock } from "lucide-react";

export default function Register() {
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		phone: "",
		role: "customer",
		password: "",
		confirmPassword: "",
	});

	const handleRegister = async (e) => {
		e.preventDefault();

		setIsLoading(true);

		try {
			const response = await fetch("http://127.0.0.1:8000/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fullName: formData.fullName,
					email: formData.email,
					phone: formData.phone,
					role: formData.role,
					password: formData.password,
					password_confirmation: formData.confirmPassword,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				alert("Registrasi berhasil!");
				navigate("/login");
			} else {
				let errorMessage = "Registrasi gagal";

				if (data.errors) {
					const firstError = Object.values(data.errors)[0];

					if (Array.isArray(firstError)) {
						errorMessage = firstError[0];
					}
				} else if (data.message) {
					errorMessage = data.message;
				}

				alert(errorMessage);
			}
		} catch (error) {
			console.error(error);
			alert("Server error");
		}

		setIsLoading(false);
	};

	return (
		<div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans overflow-hidden">
			{/* LEFT SIDE */}
			<div className="hidden md:flex bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 text-white flex-col justify-between p-16 relative">
				<div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-[-5%] right-[-5%] w-48 h-48 bg-sky-400/20 rounded-full blur-2xl"></div>

				<div className="relative z-10">
					<img src={logo} alt="Nebeng Logo" className="w-40 drop-shadow-xl hover:scale-105 transition-transform" />
				</div>

				<div className="relative z-10">
					<h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tighter">
						Bergabung <br />
						<span className="text-sky-300">dengan Kami</span>
					</h1>

					<p className="max-w-md text-blue-100 text-lg leading-relaxed font-medium">Mulai pengalaman perjalanan yang lebih cerdas, hemat, dan aman bersama komunitas Nebeng.</p>
				</div>

				<div className="relative z-10 flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
					<ShieldCheck className="text-sky-300" size={20} />
					<p className="text-xs text-blue-100 font-bold uppercase tracking-widest">Data Privacy Guaranteed</p>
				</div>
			</div>

			{/* RIGHT SIDE */}
			<div className="flex items-center justify-center bg-white px-8 lg:px-16 py-10 relative overflow-y-auto">
				<div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
					{/* MOBILE LOGO */}
					<div className="flex justify-center md:hidden mb-8">
						<img src={logo} alt="Nebeng Logo" className="w-36" />
					</div>

					<div className="mb-8 text-center md:text-left">
						<h2 className="text-2xl md:text-3xl font-black text-indigo-900 tracking-tight">Buat Akun Baru</h2>

						<p className="text-gray-400 mt-2 text-sm font-medium">Lengkapi data diri Anda untuk memulai perjalanan.</p>
					</div>

					<form onSubmit={handleRegister} className="space-y-4">
						{/* Full Name */}
						<div className="space-y-1">
							<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nama Pengguna</label>

							<div className="relative group">
								<User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />

								<input
									type="text"
									required
									placeholder="Nama Pengguna"
									className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
									value={formData.fullName}
									onChange={(e) =>
										setFormData({
											...formData,
											fullName: e.target.value,
										})
									}
								/>
							</div>
						</div>

						{/* Email */}
						<div className="space-y-1">
							<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>

							<div className="relative group">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />

								<input
									type="email"
									required
									placeholder="Email Gmail"
									pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
									title="Gunakan email dengan format @gmail.com"
									className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
								/>
							</div>
						</div>

						{/* Phone */}
						<div className="space-y-1">
							<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nomor Telepon</label>

							<div className="relative group">
								<Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />

								<input
									type="tel"
									required
									placeholder="Nomor Telepon"
									className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
								/>
							</div>
						</div>

						{/* ROLE */}
						<div className="space-y-1">
							<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Daftar Sebagai</label>

							<select
								className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
								value={formData.role}
								onChange={(e) =>
									setFormData({
										...formData,
										role: e.target.value,
									})
								}
							>
								<option value="customer">Customer</option>
								<option value="mitra">Mitra</option>
							</select>
						</div>

						{/* Password */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>

								<div className="relative group">
									<Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />

									<input
										type={showPassword ? "text" : "password"}
										required
										placeholder="Password"
										className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
										value={formData.password}
										onChange={(e) =>
											setFormData({
												...formData,
												password: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Konfirmasi</label>

								<div className="relative group">
									<input
										type={showPassword ? "text" : "password"}
										required
										placeholder="Konfirmasi Password"
										className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
										value={formData.confirmPassword}
										onChange={(e) =>
											setFormData({
												...formData,
												confirmPassword: e.target.value,
											})
										}
									/>

									<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors">
										{showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
									</button>
								</div>
							</div>
						</div>

						{/* BUTTON */}
						<button
							type="submit"
							disabled={isLoading}
							className={`w-full mt-6 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-xl ${
								isLoading ? "bg-indigo-300 cursor-wait" : "bg-indigo-900 hover:bg-indigo-800 text-white shadow-indigo-200 active:scale-[0.98]"
							}`}
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								<>
									Daftar Sekarang
									<ArrowRight size={18} />
								</>
							)}
						</button>

						<p className="text-sm text-center text-gray-500 font-medium pt-4">
							Sudah memiliki akun?{" "}
							<Link to="/login" className="text-indigo-600 font-black hover:underline transition-all">
								MASUK DISINI
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
