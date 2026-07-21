import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../middleware/ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";

/* ADMIN */
import Dashboard from "../pages/admin/Dashboard";
import Pesanan from "../pages/admin/Pesanan";
import Laporan from "../pages/admin/Laporan";
import Refund from "../pages/admin/Refund";
import BlokirCustomer from "../pages/admin/BlokirCustomer";
import BlokirMitra from "../pages/admin/BlokirMitra";
import DaftarCustomer from "../pages/admin/DaftarCustomer";
import DaftarMitra from "../pages/admin/DaftarMitra";
import KendaraanMitra from "../pages/admin/KendaraanMitra";
import Setting from "../pages/admin/Setting";
import VerifikasiCustomer from "../pages/admin/VerifikasiCustomer";
import VerifikasiMitra from "../pages/admin/VerifikasiMitra";
import DetailMitraAdmin from "../pages/admin/DetailMitra";
import DetailCustomerAdmin from "../pages/admin/DetailCustomer";
import DetailOrderAdmin from "../pages/admin/DetailOrder";
import ProfileAdmin from "../pages/admin/Profile";
import EditProfileAdmin from "../pages/admin/EditProfile";
import AturPasswordAdmin from "../pages/customer/AturPassword";
import AturHarga from "../pages/admin/PricingManagement";

/* CUSTOMER */
import DashboardCustomer from "../pages/customer/Dashboard";
import NebengMotor from "../pages/customer/NebengMotor";
import NebengMobil from "../pages/customer/NebengMobil";
import NebengBarang from "../pages/customer/NebengBarang";
import Riwayat from "../pages/customer/Riwayat";
import Pesan from "../pages/customer/Pesan";
import Profile from "../pages/customer/Profile";
import Notifikasi from "../pages/customer/Notifikasi";
import OrderMotor from "../pages/customer/OrderMotor";
import OrderMobil from "../pages/customer/OrderMobil";
import OrderBarang from "../pages/customer/OrderBarang";
import DetailOrder from "../pages/customer/DetailOrder";
import Pembayaran from "../pages/customer/Pembayaran";
import PembayaranSelesai from "../pages/customer/PembayaranSelesai";
import RefundCustomer from "../pages/customer/Refund";
import EditProfile from "../pages/customer/EditProfile";
import Alamat from "../pages/customer/Alamat";
import Keamanan from "../pages/customer/Keamanan";
import PusatBantuan from "../pages/customer/PusatBantuan";
import AturPIN from "../pages/customer/AturPIN";
import AturPassword from "../pages/customer/AturPassword";
import KonfirmasiPIN from "../pages/customer/KonfirmasiPIN";
import RewardPoints from "../pages/customer/RewardPoint";
import RewardHistory from "../pages/customer/RewardHistory";
import Verification from "../pages/customer/Verification";
import PerjalananCustomer from "../pages/customer/PerjalananCustomer";
import DetailPesanan from "../pages/customer/Pesanan";
import BeriRating from "../pages/customer/BeriRating";

/* MITRA */
import DashboardMitra from "../pages/mitra/Dashboard";
import TambahNebengMotor from "../pages/mitra/NebengMotor";
import TambahNebengMobil from "../pages/mitra/NebengMobil";
import TambahNebengBarang from "../pages/mitra/NebengBarang";
import PesanMitra from "../pages/mitra/Pesan";
import MitraProfile from "../pages/mitra/Profile";
import MitraRiwayat from "../pages/mitra/Riwayat";
import KeamananMitra from "../pages/mitra/Keamanan";
import PusatBantuanMitra from "../pages/mitra/PusatBantuan";
import StatusAkun from "../pages/mitra/StatusAkun";
import Dokumen from "../pages/mitra/Dokumen";
import EditProfileMitra from "../pages/mitra/EditProfile";
import KonfirmasiTebengan from "../pages/mitra/KonfirmasiTebengan";
import DetailTebenganMitra from "../pages/mitra/DetailTebengan";
import RiwayatSaldo from "../pages/mitra/RiwayatSaldo";
import TarikSaldo from "../pages/mitra/TarikSaldo";
import AturPINMitra from "../pages/mitra/AturPIN";
import KonfirmasiPINMitra from "../pages/mitra/KonfirmasiPIN";
import AturPasswordMitra from "../pages/mitra/AturPassword";
import NotifikasiMitra from "../pages/mitra/Notifikasi";
import KonfirmasiWithdrawPIN from "../pages/mitra/KonfirmasiWithdrawPIN";
import VerificationMitra from "../pages/mitra/Verification";
import PerjalananMitra from "../pages/mitra/PerjalananMitra";
import BeriRatingMitra from "../pages/mitra/BeriRatingMitra";

// Pos Mitra
import DashboardPosMitra from "../pages/pos_mitra/Dashboard";
import Aktivitas from "../pages/pos_mitra/Aktivitas";
import DetailAktivitas from "../pages/pos_mitra/DetailAktivitas";
import Scan from "../pages/pos_mitra/Scan";
import ProfilePosMitra from "../pages/pos_mitra/Profile";
import EditProfilePosMitra from "../pages/pos_mitra/EditProfile";
import AturPINPosMitra from "../pages/pos_mitra/AturPin";
import AturPasswordPosMitra from "../pages/pos_mitra/AturPassword";

function AppRouter() {
	return (
		<Routes>
			{/* PUBLIC */}
			<Route path="/" element={<Login />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			{/* ================= ADMIN ================= */}

			<Route
				path="/admin/dashboard"
				element={
					<ProtectedRoute role="admin">
						<Dashboard />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/profil"
				element={
					<ProtectedRoute role="admin">
						<ProfileAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/edit-profile"
				element={
					<ProtectedRoute role="admin">
						<EditProfileAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/atur-password"
				element={
					<ProtectedRoute role="admin">
						<AturPasswordAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/pesanan"
				element={
					<ProtectedRoute role="admin">
						<Pesanan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/pengaturan/tarif"
				element={
					<ProtectedRoute role="admin">
						<AturHarga />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/laporan"
				element={
					<ProtectedRoute role="admin">
						<Laporan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/refund"
				element={
					<ProtectedRoute role="admin">
						<Refund />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/blokir-customer"
				element={
					<ProtectedRoute role="admin">
						<BlokirCustomer />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/blokir-mitra"
				element={
					<ProtectedRoute role="admin">
						<BlokirMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/detail-mitra/:mitraId"
				element={
					<ProtectedRoute role="admin">
						<DetailMitraAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/detail-orders/:tripId"
				element={
					<ProtectedRoute role="admin">
						<DetailOrderAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/detail-customer/:customerId"
				element={
					<ProtectedRoute role="admin">
						<DetailCustomerAdmin />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/customer"
				element={
					<ProtectedRoute role="admin">
						<DaftarCustomer />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/mitra"
				element={
					<ProtectedRoute role="admin">
						<DaftarMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/kendaraan-mitra"
				element={
					<ProtectedRoute role="admin">
						<KendaraanMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/settings"
				element={
					<ProtectedRoute role="admin">
						<Setting />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/verifikasi-customer"
				element={
					<ProtectedRoute role="admin">
						<VerifikasiCustomer />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/admin/verifikasi-mitra"
				element={
					<ProtectedRoute role="admin">
						<VerifikasiMitra />
					</ProtectedRoute>
				}
			/>

			{/* ================= CUSTOMER ================= */}

			<Route
				path="/customer/dashboard"
				element={
					<ProtectedRoute role="customer">
						<DashboardCustomer />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/verification"
				element={
					<ProtectedRoute role="customer">
						<Verification />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/nebeng-motor"
				element={
					<ProtectedRoute role="customer">
						<NebengMotor />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/nebeng-mobil"
				element={
					<ProtectedRoute role="customer">
						<NebengMobil />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/nebeng-barang"
				element={
					<ProtectedRoute role="customer">
						<NebengBarang />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/perjalanan/:tripId"
				element={
					<ProtectedRoute role="customer">
						<PerjalananCustomer />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/riwayat"
				element={
					<ProtectedRoute role="customer">
						<Riwayat />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/pesanan/:orderId"
				element={
					<ProtectedRoute role="customer">
						<DetailPesanan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/beri-rating/:tripId"
				element={
					<ProtectedRoute role="customer">
						<BeriRating />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/pesan"
				element={
					<ProtectedRoute role="customer">
						<Pesan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/profil"
				element={
					<ProtectedRoute role="customer">
						<Profile />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/edit-profile"
				element={
					<ProtectedRoute role="customer">
						<EditProfile />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/alamat"
				element={
					<ProtectedRoute role="customer">
						<Alamat />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/keamanan"
				element={
					<ProtectedRoute role="customer">
						<Keamanan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/pusat-bantuan"
				element={
					<ProtectedRoute role="customer">
						<PusatBantuan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/atur-pin"
				element={
					<ProtectedRoute role="customer">
						<AturPIN />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/konfirmasi-pin"
				element={
					<ProtectedRoute role="customer">
						<KonfirmasiPIN />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/atur-password"
				element={
					<ProtectedRoute role="customer">
						<AturPassword />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/reward-points"
				element={
					<ProtectedRoute role="customer">
						<RewardPoints />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/reward-history"
				element={
					<ProtectedRoute role="customer">
						<RewardHistory />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/notifikasi"
				element={
					<ProtectedRoute role="customer">
						<Notifikasi />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/order-motor"
				element={
					<ProtectedRoute role="customer">
						<OrderMotor />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/order-mobil"
				element={
					<ProtectedRoute role="customer">
						<OrderMobil />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/order-barang"
				element={
					<ProtectedRoute role="customer">
						<OrderBarang />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/detail-order/:tripId"
				element={
					<ProtectedRoute role="customer">
						<DetailOrder />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/pembayaran"
				element={
					<ProtectedRoute role="customer">
						<Pembayaran />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/pembayaran-selesai"
				element={
					<ProtectedRoute role="customer">
						<PembayaranSelesai />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/customer/refund"
				element={
					<ProtectedRoute role="customer">
						<RefundCustomer />
					</ProtectedRoute>
				}
			/>

			{/* ================= MITRA ================= */}

			<Route
				path="/mitra/dashboard"
				element={
					<ProtectedRoute role="mitra">
						<DashboardMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/verification"
				element={
					<ProtectedRoute role="mitra">
						<VerificationMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/nebeng-motor"
				element={
					<ProtectedRoute role="mitra">
						<TambahNebengMotor />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/nebeng-mobil"
				element={
					<ProtectedRoute role="mitra">
						<TambahNebengMobil />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/nebeng-barang"
				element={
					<ProtectedRoute role="mitra">
						<TambahNebengBarang />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/konfirmasi-tebengan"
				element={
					<ProtectedRoute role="mitra">
						<KonfirmasiTebengan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/detail-tebengan/:tripId"
				element={
					<ProtectedRoute role="mitra">
						<DetailTebenganMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				// path="/mitra/perjalanan"
				path="/mitra/perjalanan/:tripId"
				element={
					<ProtectedRoute role="mitra">
						<PerjalananMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/beri-rating/:tripId/:customerId"
				element={
					<ProtectedRoute role="mitra">
						<BeriRatingMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/riwayat-saldo"
				element={
					<ProtectedRoute role="mitra">
						<RiwayatSaldo />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/konfirmasi-withdraw-pin"
				element={
					<ProtectedRoute role="mitra">
						<KonfirmasiWithdrawPIN />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/tarik-saldo"
				element={
					<ProtectedRoute role="mitra">
						<TarikSaldo />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/pesan-mitra"
				element={
					<ProtectedRoute role="mitra">
						<PesanMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/notifikasiMitra"
				element={
					<ProtectedRoute role="mitra">
						<NotifikasiMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/profil"
				element={
					<ProtectedRoute role="mitra">
						<MitraProfile />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/edit-profile"
				element={
					<ProtectedRoute role="mitra">
						<EditProfileMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/atur-pin"
				element={
					<ProtectedRoute role="mitra">
						<AturPINMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/konfirmasi-pin"
				element={
					<ProtectedRoute role="mitra">
						<KonfirmasiPINMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/atur-password"
				element={
					<ProtectedRoute role="mitra">
						<AturPasswordMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/riwayat"
				element={
					<ProtectedRoute role="mitra">
						<MitraRiwayat />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/status-akun"
				element={
					<ProtectedRoute role="mitra">
						<StatusAkun />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/keamanan"
				element={
					<ProtectedRoute role="mitra">
						<KeamananMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/pusat-bantuan"
				element={
					<ProtectedRoute role="mitra">
						<PusatBantuanMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/mitra/dokumen"
				element={
					<ProtectedRoute role="mitra">
						<Dokumen />
					</ProtectedRoute>
				}
			/>

			{/* ================ POS MITRA ================ */}
			<Route
				path="/pos-mitra/dashboard"
				element={
					<ProtectedRoute role="pos_mitra">
						<DashboardPosMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/pos-mitra/aktivitas"
				element={
					<ProtectedRoute role="pos_mitra">
						<Aktivitas />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/pos-mitra/detail-aktivitas/:tripId"
				element={
					<ProtectedRoute role="pos_mitra">
						<DetailAktivitas />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/pos-mitra/scan"
				element={
					<ProtectedRoute role="pos_mitra">
						<Scan />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/pos-mitra/profil"
				element={
					<ProtectedRoute role="pos_mitra">
						<ProfilePosMitra />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/pos-mitra/edit-profile"
				element={
					<ProtectedRoute role="pos_mitra">
						<EditProfilePosMitra />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/pos-mitra/atur-pin"
				element={
					<ProtectedRoute role="pos_mitra">
						<AturPINPosMitra />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/pos-mitra/atur-password"
				element={
					<ProtectedRoute role="pos_mitra">
						<AturPasswordPosMitra />
					</ProtectedRoute>
				}
			/>
		</Routes>
	);
}

export default AppRouter;