import AppRouter from "./router/router";
import { Toaster } from "react-hot-toast";

function App() {
	return (
		<>
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
				}}
			/>
			<AppRouter />
		</>
	);
}

export default App;
