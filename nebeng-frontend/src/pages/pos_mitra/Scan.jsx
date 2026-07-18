import React, { useEffect, useState } from "react";
import PosMitraLayout from "../../components/dashboard/PosMitraLayout";
import { ChevronLeft, CheckCircle2, XCircle, ScanLine, Loader2, RefreshCw } from "lucide-react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

export default function Scan() {
	const [scanResult, setScanResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [scanType, setScanType] = useState(null);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const [scannerInstance, setScannerInstance] = useState(null);
	const [successMessage, setSuccessMessage] = useState("");
	const [successDescription, setSuccessDescription] = useState("");

	const initScanner = () => {
		setScanResult(null);
		setSuccess(false);
		setError("");

		const scanner = new Html5QrcodeScanner(
			"reader",
			{
				qrbox: {
					width: 250,
					height: 250,
				},
				fps: 10, // Ditingkatkan menjadi 10 agar tracking kamera lebih responsif
			},
			false,
		);

		scanner.render(
			async (decodedText) => {
				scanner.clear().catch((err) => console.error("Gagal clear scanner:", err));
				setScanResult(decodedText);

				let parsedQR;

				try {
					parsedQR = JSON.parse(decodedText);
				} catch {
					throw new Error("Format QR tidak valid");
				}

				setScanType(parsedQR.type);

				try {
					setLoading(true);
					setError("");

					const token = localStorage.getItem("token");
					let endpoint = "";

					if (parsedQR.type === "departure") {
						endpoint = "http://127.0.0.1:8000/api/pos-mitra/scan-departure-qr";
					} else if (parsedQR.type === "trip") {
						endpoint = "http://127.0.0.1:8000/api/pos-mitra/scan-qr";
					} else if (parsedQR.type === "customer") {
						endpoint = "http://127.0.0.1:8000/api/pos-mitra/scan-customer-qr";
					} else {
						throw new Error("Jenis QR tidak dikenali");
					}

					const response = await fetch(endpoint, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							qr_token: parsedQR.token,
						}),
					});

					const data = await response.json();

					console.log("SCAN RESPONSE:", data);

					if (!response.ok) {
						throw new Error(data.message || "Gagal memproses QR Token");
					}

					if (parsedQR.type === "customer") {
						setSuccessMessage("Customer Berhasil Diverifikasi");
						setSuccessDescription("Customer telah terverifikasi dan siap mengikuti perjalanan.");
					} else if (parsedQR.type === "departure") {
						setSuccessMessage("Perjalanan Berhasil Dimulai");
						setSuccessDescription("QR keberangkatan berhasil diverifikasi. Status perjalanan telah berubah menjadi dalam perjalanan.");
					} else if (parsedQR.type === "trip") {
						setSuccessMessage("Trip Berhasil Diselesaikan");
						setSuccessDescription("QR kedatangan berhasil diverifikasi. Status perjalanan telah diperbarui menjadi selesai.");
					}

					setSuccess(true);

					setSuccess(true);
				} catch (err) {
					setError(err.message);
				} finally {
					setLoading(false);
				}
			},
			(errorMessage) => {
				// Realtime match errors ignored
			},
		);

		setScannerInstance(scanner);
	};

	useEffect(() => {
		initScanner();
		return () => {
			if (scannerInstance) {
				scannerInstance.clear().catch(() => {});
			}
		};
	}, []);

	return (
		<PosMitraLayout>
			{/* Kontainer utama dengan padding-bottom aman agar tidak tertimpa bottom navigation */}
			<div className="w-full max-w-screen-md mx-auto px-4 py-6 pb-32 md:pb-10 space-y-8 font-sans">
				{/* HEADER NAVIGATION */}
				<div className="flex items-center gap-4">
					<button onClick={() => window.history.back()} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
						<ChevronLeft size={24} className="text-indigo-900" />
					</button>
					<div>
						<h1 className="text-2xl font-black text-indigo-900 tracking-tight">Scan QR Trip</h1>
						<p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Konfirmasi Penyelesaian Perjalanan</p>
					</div>
				</div>

				{/* SCANNER CARD CONTAINER */}
				<div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-indigo-950/5 border border-indigo-50/50 space-y-6">
					<div className="flex items-center justify-between border-b border-gray-50 pb-4">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
								<ScanLine size={20} />
							</div>
							<div>
								<h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Kamera Scanner</h2>
								<p className="text-[11px] font-medium text-gray-400">Posisikan kode QR di tengah kotak</p>
							</div>
						</div>
					</div>

					{/* Area Kamera Viewfinder */}
					<div className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-900/5 relative">
						<div id="reader" className="w-full h-full" />

						{/* Overlay State Loading */}
						{loading && (
							<div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-200">
								<Loader2 className="animate-spin mb-3 text-sky-400" size={36} />
								<p className="text-xs font-black uppercase tracking-widest">Memproses QR Code...</p>
							</div>
						)}
					</div>

					{/* FEEDBACK NOTIFIKASI STATUS */}

					{/* Status Sukses */}
					{success && (
						<div className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 animate-in zoom-in-95 duration-300">
							<div className="p-2 bg-white rounded-xl text-emerald-500 shadow-sm shrink-0">
								<CheckCircle2 size={24} />
							</div>
							<div className="space-y-0.5">
								<p className="font-black text-emerald-800 text-sm uppercase tracking-wide">{successMessage}</p>

								<p className="text-xs text-emerald-600 font-medium leading-relaxed">{successDescription}</p>
							</div>
						</div>
					)}

					{/* Status Gagal / Error */}
					{error && (
						<div className="space-y-4 animate-in zoom-in-95 duration-300">
							<div className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-2xl p-5">
								<div className="p-2 bg-white rounded-xl text-red-500 shadow-sm shrink-0">
									<XCircle size={24} />
								</div>
								<div className="space-y-0.5">
									<p className="font-black text-red-800 text-sm uppercase tracking-wide">Proses Scan Gagal</p>
									<p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
								</div>
							</div>

							{/* Tombol Interaktif Ulangi jika Error */}
							<button
								onClick={initScanner}
								className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
							>
								<RefreshCw size={16} /> Scan Ulang Kembali
							</button>
						</div>
					)}

					{/* Token Debug Data (Hanya muncul jika fungsionalitas debug diperlukan) */}
					{scanResult && !error && !loading && (
						<div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[10px] font-mono text-gray-400 break-all leading-tight">
							<span className="font-black text-gray-500 uppercase block mb-1">Decoded Data String:</span>
							{scanResult}
						</div>
					)}
				</div>
			</div>

			{/* Custom Styling untuk Overwrite library html5-qrcode agar serasi */}
			<style>{`
				#reader {
					border: none !important;
				}
				#reader__dashboard_section_csr button {
					background-color: #1e1b4b !important;
					color: white !important;
					padding: 0.5rem 1rem !important;
					border-radius: 0.75rem !important;
					font-weight: 800 !important;
					font-size: 0.75rem !important;
					text-transform: uppercase !important;
					letter-spacing: 0.05em !important;
					border: none !important;
					transition: all 0.2s !important;
				}
				#reader__dashboard_section_csr button:hover {
					background-color: #312e81 !important;
				}
				#reader__camera_permission_button {
					background-color: #1e1b4b !important;
					color: white !important;
					padding: 0.75rem 1.5rem !important;
					border-radius: 1rem !important;
					font-weight: 900 !important;
					text-transform: uppercase !important;
					letter-spacing: 0.1em !important;
					border: none !important;
				}
				#reader__scan_region {
					border-radius: 1.5rem !important;
					overflow: hidden !important;
				}

				#reader__dashboard {
					padding: 1rem !important;
				}

				#reader__dashboard_section {
					display: flex !important;
					flex-direction: column !important;
					gap: 1rem !important;
				}

				#reader__dashboard_section_swaplink {
					color: #4338ca !important;
					font-weight: 800 !important;
					font-size: 0.75rem !important;
					text-transform: uppercase !important;
					letter-spacing: 0.08em !important;
					text-decoration: none !important;
					cursor: pointer !important;
				}
			`}</style>
		</PosMitraLayout>
	);
}
