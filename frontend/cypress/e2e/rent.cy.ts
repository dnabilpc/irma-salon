// frontend/cypress/e2e/rent.cy.ts

describe("Alur Penyewaan Busana (Rental Flow)", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testName = `User Rental ${randomSuffix}`;
  const testEmail = `rent.user.${randomSuffix}@irmasalon.com`;
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
    // Login sebagai user sebelum setiap test sewa
    cy.visit("/login");
    cy.get('input[id="email"]').type(testEmail);
    cy.get('input[id="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
  });

  it("Mencari Baju di Katalog dan Melakukan Sewa (Bayar Di Tempat)", () => {
    cy.visit("/rent");

    cy.contains("Katalog Sewa Baju", { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Pilih baju pertama di katalog yang muncul
    cy.get('button').contains("Sewa Baju Ini").first().click();

    // Modal sewa terbuka
    cy.contains("Sewa Baju", { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Tentukan Tanggal Mulai Sewa (besok)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    cy.get('input[type="date"]').type(tomorrowStr);

    // Naikkan durasi sewa ke 2 hari dengan menekan tombol "+"
    cy.get('button').contains("+").click();

    // Pilih Pembayaran di Tempat (Cash)
    cy.get('button').contains("Bayar Di Tempat").should("be.visible");

    // Klik Konfirmasi Sewa
    cy.get('button').contains("Konfirmasi Sewa").click();

    // Verifikasi Transaksi Berhasil
    cy.contains("Pesanan Sewa Berhasil!", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("ID Sewa:", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });
});
