// frontend/cypress/e2e/booking.cy.ts

describe("Alur Pemesanan Layanan Salon (Booking Flow)", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testName = `User Booking ${randomSuffix}`;
  const testEmail = `booking.user.${randomSuffix}@irmasalon.com`;
  const testPhone = `0800000${Math.floor(10000 + Math.random() * 90000)}`;
  const testPassword = "passwordTest123";

  const EXTENDED_TIMEOUT = 15000;

  before(() => {
    // 1. Registrasi Akun Baru
    cy.visit("/register");
    cy.get('input[placeholder="Nama lengkapmu"]').type(testName);
    cy.get('input[placeholder="email@contoh.com"]').type(testEmail);
    cy.get('input[placeholder="08xxxxxxxxxx"]').type(testPhone);
    cy.get('input[placeholder="Minimal 8 karakter"]').type(testPassword);
    cy.get('input[placeholder="Ulangi password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Pastikan berada di form verifikasi OTP (inline di register page)
    cy.get('input[placeholder="123456"]', { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Ambil kode OTP dari database
    cy.task("getRegistrationOTP", testEmail).then((otpCode) => {
      expect(otpCode).to.exist;
      cy.get('input[placeholder="123456"]').type(otpCode as string);
      cy.get('button[type="submit"]').click();
    });

    // Pastikan redirect ke login dengan parameter sukses
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/login");
  });

  after(() => {
    // Bersihkan user pengujian dari database setelah pengujian selesai
    cy.task("deleteUser", testEmail);
  });

  beforeEach(() => {
    // Login sebagai user sebelum setiap test booking
    cy.visit("/login");
    cy.get('input[id="email"]').type(testEmail);
    cy.get('input[id="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
  });

  it("Melakukan Reservasi Salon Hingga Selesai (QRIS Statis)", () => {
    cy.visit("/booking");

    // Step 0: Pilih Layanan (misal Hair Treatment)
    cy.contains("Pilih Layanan", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.get('button').contains("Potong Rambut").click();
    cy.get('button').contains("Lanjut →").click();

    // Step 1: Pilih Jadwal
    cy.contains("Pilih Jadwal", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    
    // Pilih Tanggal Besok (agar selalu valid)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    cy.get('input[type="date"]').type(tomorrowStr);

    // Tunggu slots dirender lalu klik slot jam tersedia
    cy.get('button', { timeout: EXTENDED_TIMEOUT }).contains("09:00").click();
    cy.get('button').contains("Lanjut →").click();

    // Step 2: Catatan Tambahan
    cy.contains("Catatan Tambahan", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.get('textarea[placeholder*="Contoh: ada alergi"]').type("Request stylist senior.");
    cy.get('button').contains("Lanjut →").click();

    // Step 3: Konfirmasi & QRIS Statis (Locked)
    cy.contains("Konfirmasi Booking", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("QRIS Statis").should("be.visible");
    cy.get('button').contains("Konfirmasi Booking").click();

    // Verifikasi Booking Sukses
    cy.contains("Booking Berhasil!", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("ID Booking:", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });
});
