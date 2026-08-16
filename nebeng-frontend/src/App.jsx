import AppRouter from "./router/Router";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "./context/UserContext";

function App() {
	<Route path="/customer/upload-bukti-pembayaran/:orderId?" element={<UploadBuktiPembayaran />} />
	return (
		<UserProvider>
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
				}}
			/>
			<AppRouter />
		</UserProvider>
	);
}

export default App;
