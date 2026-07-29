import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	optimizeDeps: {
		// Pre-bundle library berat supaya halaman peta (Leaflet) & QR code
		// tidak nge-compile dari nol pas pertama kali dibuka (mengurangi
		// jeda loading pas navigasi pertama ke halaman tersebut).
		include: ["leaflet", "react-leaflet", "react-qr-code", "laravel-echo", "pusher-js"],
	},
});