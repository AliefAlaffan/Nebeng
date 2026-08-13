// src/utils/scheduleValidation.js
// Helper untuk membatasi jadwal keberangkatan yang bisa dipilih mitra
// saat membuat tebengan.
// Aturan:
// 1. Tanggal keberangkatan tidak boleh sebelum hari ini.
// 2. Jam keberangkatan minimal 3 jam dari waktu sekarang.
//    (Jika sisa waktu hari ini < 3 jam, maka tanggal paling awal yang
//    bisa dipilih otomatis bergeser ke hari berikutnya.)

const MIN_LEAD_HOURS = 3;

function pad(num) {
	return String(num).padStart(2, "0");
}

function toDateInputValue(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInputValue(d) {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Waktu paling awal yang boleh dipilih (sekarang + 3 jam)
export function getMinDepartureDateTime() {
	return new Date(Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000);
}

// Nilai untuk atribut `min` pada <input type="date" />
export function getMinDateValue() {
	return toDateInputValue(getMinDepartureDateTime());
}

// Nilai untuk atribut `min` pada <input type="time" />.
// Hanya relevan kalau tanggal yang dipilih == tanggal paling awal (minDate).
// Untuk tanggal setelahnya, jam bebas dipilih (00:00 - 23:59).
export function getMinTimeValue(selectedDate) {
	const minDateTime = getMinDepartureDateTime();
	if (selectedDate === toDateInputValue(minDateTime)) {
		return toTimeInputValue(minDateTime);
	}
	return undefined;
}

// Validasi gabungan tanggal + jam sebelum submit.
// Mengembalikan { valid: boolean, message?: string }
export function validateDepartureSchedule(date, time) {
	if (!date || !time) {
		return { valid: false, message: "Mohon lengkapi tanggal dan jam keberangkatan" };
	}

	const selected = new Date(`${date}T${time}`);
	if (Number.isNaN(selected.getTime())) {
		return { valid: false, message: "Format tanggal/jam tidak valid" };
	}

	const minDateTime = getMinDepartureDateTime();

	if (selected < minDateTime) {
		return {
			valid: false,
			message: `Jadwal keberangkatan minimal ${MIN_LEAD_HOURS} jam dari sekarang. Silakan pilih tanggal/jam lain.`,
		};
	}

	return { valid: true };
}