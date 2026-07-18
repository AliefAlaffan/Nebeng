import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;
window.Pusher.logToConsole = true;

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
