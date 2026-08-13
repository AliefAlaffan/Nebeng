import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;
// Log websocket sebelumnya selalu aktif (window.Pusher.logToConsole = true)
// dan membanjiri console dengan ratusan log setiap detik, yang bikin
// DevTools & rendering browser terasa berat/lag. Sekarang cuma aktif kalau
// memang lagi debug websocket (?ws_debug=1 di URL).
window.Pusher.logToConsole = new URLSearchParams(window.location.search).has("ws_debug");

const echo = new Echo({
	broadcaster: "reverb",

	key: 'nebeng_key_dummy',

	wsHost: import.meta.env.VITE_REVERB_HOST,
	wsPort: import.meta.env.VITE_REVERB_PORT,

	forceTLS: false,
	enabledTransports: ["ws"],

	authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",

	auth: {
		headers: {
			Authorization: `Bearer ${localStorage.getItem("token")}`,
			Accept: "application/json",
		},
	},
});

export default echo;