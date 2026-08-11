import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "") + "/api",
	withCredentials: true,
	headers: {
		Accept: "application/json",
	},
});

// Aplikasi ini pakai token-based auth (Bearer token dari localStorage),
// bukan cookie/session Sanctum SPA. Sebelumnya instance axios ini tidak
// pernah nempelin token sama sekali ke request manapun - jadi setiap
// endpoint yang butuh login (auth:sanctum), termasuk kirim SOS, selalu
// gagal dengan 401 Unauthorized. Interceptor ini nempelin token secara
// otomatis ke SEMUA request yang lewat instance ini, sama seperti yang
// sudah dilakukan manual di fetch() lain di seluruh aplikasi.
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export default api;