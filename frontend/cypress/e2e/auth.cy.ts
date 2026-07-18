// frontend/cypress/e2e/auth.cy.ts

describe("Alur Autentikasi Pengguna & Verifikasi WhatsApp OTP", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  
  // User 1: Direct verification
  const testName1 = `Pelanggan Test A ${randomSuffix}`;
  const testEmail1 = `test.user.a.${randomSuffix}@irmasalon.com`;
  const testPhone1 = `081234${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword1 = "passwordTest123";

  // User 2: Login-based verification
  const testName2 = `Pelanggan Test B ${randomSuffix}`;
  const testEmail2 = `test.user.b.${randomSuffix}@irmasalon.com`;
  const testPhone2 = `081235${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword2 = "passwordTest123";

  const EXTENDED_TIMEOUT = 15000;

  after(() => {
    // Clean up created test users from the database
    cy.task("deleteUser", testEmail1);
    cy.task("deleteUser", testEmail2);
  });

  it("1. Melakukan Registrasi Pelanggan Baru & Verifikasi OTP Sukses secara Langsung", () => {
    cy.visit("/register");
    cy.get('input[placeholder="Nama lengkapmu"]').type(testName1);
    cy.get('input[placeholder="email@contoh.com"]').type(testEmail1);
    cy.get('input[placeholder="08xxxxxxxxxx"]').type(testPhone1);
    cy.get('input[placeholder="Minimal 8 karakter"]').type(testPassword1);
    cy.get('input[placeholder="Ulangi password"]').type(testPassword1);

    cy.get('button[type="submit"]').click();

    // Pastikan berada di form verifikasi OTP (inline di register page)
    cy.get('input[placeholder="123456"]', { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Ambil kode OTP dari database
    cy.task("getRegistrationOTP", testEmail1).then((otpCode) => {
      expect(otpCode).to.exist;
      
      // Masukkan OTP
      cy.get('input[placeholder="123456"]').type(otpCode as string);
      cy.get('button[type="submit"]').click();
    });

    // Pastikan redirect ke login dengan parameter sukses
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/login");
    cy.url().should("include", "registered=success");
    cy.contains("Pendaftaran berhasil!", { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Login dengan akun yang baru saja diaktifkan
    cy.get('input[id="email"]').type(testEmail1);
    cy.get('input[id="password"]').type(testPassword1);
    cy.get('button[type="submit"]').click();

    // Masuk ke dashboard pelanggan
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
    cy.contains("Selamat datang kembali", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains(testName1, { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Logout
    cy.contains("Keluar").click();
    cy.url().should("include", "/");
  });

  it("2. Akun Pending Login Terblokir, lalu Verifikasi OTP via Halaman Login", () => {
    // 1. Registrasi Akun baru tapi jangan verifikasi OTP langsung
    cy.visit("/register");
    cy.get('input[placeholder="Nama lengkapmu"]').type(testName2);
    cy.get('input[placeholder="email@contoh.com"]').type(testEmail2);
    cy.get('input[placeholder="08xxxxxxxxxx"]').type(testPhone2);
    cy.get('input[placeholder="Minimal 8 karakter"]').type(testPassword2);
    cy.get('input[placeholder="Ulangi password"]').type(testPassword2);

    cy.get('button[type="submit"]').click();

    // Tunggu sampai step OTP muncul, lalu navigasikan ke halaman login
    // cy.get('input[placeholder="123456"]', { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.visit("/login");

    // Coba login dengan akun yang masih pending (belum diverifikasi)
    cy.get('input[id="email"]').type(testEmail2);
    cy.get('input[id="password"]').type(testPassword2);
    cy.get('button[type="submit"]').click();

    // Pastikan muncul pesan error pending verifikasi dan tombol "Verifikasi Sekarang"
    cy.contains("Akun Anda belum diverifikasi", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("Verifikasi Sekarang").should("be.visible");

    // Klik tombol Verifikasi Sekarang
    cy.contains("Verifikasi Sekarang").click();

    // Pastikan berada di form verifikasi OTP (inline di login page)
    cy.get('input[placeholder="123456"]', { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Ambil kode OTP dari database
    cy.task("getRegistrationOTP", testEmail2).then((otpCode) => {
      expect(otpCode).to.exist;

      // Masukkan OTP
      cy.get('input[placeholder="123456"]').type(otpCode as string);
      cy.get('button[type="submit"]').click();
    });

    // Pastikan ada alert berhasil verifikasi
    cy.on("window:alert", (str) => {
      expect(str).to.equal("Akun Anda berhasil diverifikasi! Silakan login.");
    });

    // Login kembali setelah verifikasi
    cy.get('input[id="email"]').clear().type(testEmail2);
    cy.get('input[id="password"]').clear().type(testPassword2);
    cy.get('button[type="submit"]').click();

    // Berhasil masuk ke dashboard
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
    cy.contains("Selamat datang kembali", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains(testName2, { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });
});
