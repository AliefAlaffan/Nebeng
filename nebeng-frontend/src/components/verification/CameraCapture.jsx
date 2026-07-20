import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, RotateCcw, Check, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

/**
 * CameraCapture
 * Modal kamera real-time (bukan file picker) untuk mencegah upload foto dari galeri.
 *
 * Props:
 * - open        : boolean, tampil/tidak
 * - onClose     : () => void
 * - onCapture   : (file: File) => void  -> dipanggil saat user menekan "Gunakan Foto"
 * - facingMode  : "user" | "environment" (default "user")
 * - guide       : "face" | "card" | "none"  -> bentuk panduan bingkai di atas video
 * - title       : judul di header modal
 * - description : instruksi singkat di bawah judul
 * - watermarkText: teks tambahan yang di-burn ke foto (opsional)
 */
export default function CameraCapture({ open, onClose, onCapture, facingMode = "user", guide = "none", title = "Ambil Foto", description = "", watermarkText = "" }) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const streamRef = useRef(null);

	const [status, setStatus] = useState("idle"); // idle | starting | streaming | error
	const [errorMsg, setErrorMsg] = useState("");
	const [capturedUrl, setCapturedUrl] = useState(null);
	const [capturedBlob, setCapturedBlob] = useState(null);
	const [currentFacing, setCurrentFacing] = useState(facingMode);

	const stopStream = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
	}, []);

	const startStream = useCallback(
		async (facing) => {
			setStatus("starting");
			setErrorMsg("");
			stopStream();

			// Cegah dijalankan di context tidak aman (selain localhost)
			if (!window.isSecureContext) {
				setStatus("error");
				setErrorMsg("Kamera hanya bisa diakses melalui koneksi HTTPS yang aman.");
				return;
			}

			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				setStatus("error");
				setErrorMsg("Perangkat/browser ini tidak mendukung akses kamera.");
				return;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: facing },
						width: { ideal: 1280 },
						height: { ideal: 960 },
					},
					audio: false,
				});

				streamRef.current = stream;

				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					await videoRef.current.play();
				}

				setStatus("streaming");
			} catch (err) {
				console.error("Camera error:", err);
				setStatus("error");

				if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
					setErrorMsg("Akses kamera ditolak. Mohon izinkan akses kamera pada browser Anda untuk melanjutkan verifikasi.");
				} else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
					setErrorMsg("Kamera tidak ditemukan pada perangkat ini.");
				} else if (err.name === "NotReadableError") {
					setErrorMsg("Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.");
				} else {
					setErrorMsg("Gagal mengakses kamera. Silakan coba lagi.");
				}
			}
		},
		[stopStream]
	);

	useEffect(() => {
		if (open) {
			setCapturedUrl(null);
			setCapturedBlob(null);
			setCurrentFacing(facingMode);
			startStream(facingMode);
		} else {
			stopStream();
			setStatus("idle");
		}

		return () => {
			stopStream();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const handleSwitchCamera = () => {
		const next = currentFacing === "user" ? "environment" : "user";
		setCurrentFacing(next);
		startStream(next);
	};

	const handleCapture = () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas) return;

		const w = video.videoWidth;
		const h = video.videoHeight;
		canvas.width = w;
		canvas.height = h;

		const ctx = canvas.getContext("2d");

		// Mirror hanya untuk kamera depan agar terasa natural, tapi tetap simpan hasil apa adanya
		if (currentFacing === "user") {
			ctx.translate(w, 0);
			ctx.scale(-1, 1);
		}
		ctx.drawImage(video, 0, 0, w, h);
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		// Watermark timestamp -> jejak bukti foto diambil real-time
		const now = new Date();
		const stamp = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
		const label = watermarkText ? `${watermarkText} • ${stamp}` : `Nebeng Verifikasi • ${stamp}`;

		const fontSize = Math.max(16, Math.round(w * 0.022));
		ctx.font = `600 ${fontSize}px sans-serif`;
		const paddingX = 16;
		const paddingY = 12;
		const textWidth = ctx.measureText(label).width;
		const boxHeight = fontSize + paddingY * 2;

		ctx.fillStyle = "rgba(0,0,0,0.55)";
		ctx.fillRect(0, h - boxHeight, textWidth + paddingX * 2, boxHeight);

		ctx.fillStyle = "#ffffff";
		ctx.textBaseline = "middle";
		ctx.fillText(label, paddingX, h - boxHeight / 2);

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				setCapturedBlob(blob);
				setCapturedUrl(URL.createObjectURL(blob));
			},
			"image/jpeg",
			0.92
		);
	};

	const handleRetake = () => {
		setCapturedUrl(null);
		setCapturedBlob(null);
		startStream(currentFacing);
	};

	const handleConfirm = () => {
		if (!capturedBlob) return;
		const file = new File([capturedBlob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
		onCapture(file);
		handleClose();
	};

	const handleClose = () => {
		stopStream();
		setCapturedUrl(null);
		setCapturedBlob(null);
		onClose();
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
			<div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
				{/* HEADER */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
					<div>
						<h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
							<Camera size={18} className="text-indigo-600" /> {title}
						</h3>
						{description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
					</div>
					<button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
						<X size={20} />
					</button>
				</div>

				{/* BODY */}
				<div className="relative bg-black aspect-[3/4] w-full overflow-hidden">
					{status === "starting" && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white z-10">
							<Loader2 size={32} className="animate-spin" />
							<p className="text-sm font-semibold">Membuka kamera...</p>
						</div>
					)}

					{status === "error" && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white z-10 px-8 text-center">
							<AlertTriangle size={32} className="text-amber-400" />
							<p className="text-sm font-semibold">{errorMsg}</p>
							<button onClick={() => startStream(currentFacing)} className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-2">
								<RefreshCw size={14} /> Coba Lagi
							</button>
						</div>
					)}

					{!capturedUrl && (
						<video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${currentFacing === "user" ? "-scale-x-100" : ""}`} />
					)}

					{capturedUrl && <img src={capturedUrl} alt="Hasil foto" className="w-full h-full object-cover" />}

					{/* GUIDE OVERLAY */}
					{!capturedUrl && status === "streaming" && guide === "face" && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
							<div className="w-[62%] aspect-[3/4] border-4 border-white/70 rounded-[50%]" />
						</div>
					)}
					{!capturedUrl && status === "streaming" && guide === "card" && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-8">
							<div className="w-full aspect-[1.586/1] border-4 border-white/70 rounded-2xl" />
						</div>
					)}

					<canvas ref={canvasRef} className="hidden" />
				</div>

				{/* FOOTER / CONTROLS */}
				<div className="px-6 py-5 flex items-center justify-center gap-4">
					{!capturedUrl ? (
						<>
							<button
								onClick={handleSwitchCamera}
								disabled={status !== "streaming"}
								className="p-4 rounded-2xl border-2 border-gray-100 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30"
								title="Ganti kamera"
							>
								<RotateCcw size={20} />
							</button>
							<button
								onClick={handleCapture}
								disabled={status !== "streaming"}
								className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
							>
								<Camera size={20} /> Ambil Foto
							</button>
						</>
					) : (
						<>
							<button onClick={handleRetake} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
								<RotateCcw size={18} /> Ambil Ulang
							</button>
							<button
								onClick={handleConfirm}
								className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
							>
								<Check size={20} /> Gunakan Foto
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
