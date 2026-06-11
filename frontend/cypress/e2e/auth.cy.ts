// frontend/cypress/e2e/auth.cy.ts

describe("Alur Autentikasi Pengguna & Approval Admin", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testName = `Pelanggan Test ${randomSuffix}`;
  const testEmail = `test.user.${randomSuffix}@irmasalon.com`;
  const testPhone = `0800000${Math.floor(10000 + Math.random() * 90000)}`;
  const testPassword = "passwordTest123";

  // Kita gunakan timeout 15 detik (15000ms) untuk mengantisipasi delay dingin database (cold-start) atau latency jaringan
  const EXTENDED_TIMEOUT = 15000;

  it("1. Melakukan Registrasi Pelanggan Baru (Status Pending)", () => {
    cy.visit("/register");
    cy.get('input[placeholder="Nama lengkapmu"]').type(testName);
    cy.get('input[placeholder="email@contoh.com"]').type(testEmail);
    cy.get('input[placeholder="08xxxxxxxxxx"]').type(testPhone);
    cy.get('input[placeholder="Minimal 8 karakter"]').type(testPassword);
    cy.get('input[placeholder="Ulangi password"]').type(testPassword);

    cy.get('button[type="submit"]').click();

    // Cek jika ada banner error merah di UI pendaftaran sebelum assert timeout
    cy.get("body").then(($body) => {
      const errorDivs = $body.find('div[style*="rgba(192,80,96,0.07)"]');
      if (errorDivs.length > 0) {
        const errorText = errorDivs.text();
        throw new Error(`Pendaftaran gagal di UI dengan pesan: "${errorText.trim()}". Harap pastikan Express Backend dan Database PostgreSQL Anda sudah aktif.`);
      }
    });

    // Pastikan redirect ke halaman pending approval dengan timeout yang diperpanjang
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/pending-approval");
    cy.contains("Pendaftaran Berhasil", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("menunggu verifikasi admin", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });

  it("2. Akun Pending Tidak Bisa Login Sebelum Disetujui", () => {
    cy.visit("/login");
    cy.get('input[id="email"]').type(testEmail);
    cy.get('input[id="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Menampilkan pesan error pending dengan timeout yang diperpanjang
    cy.contains("menunggu persetujuan admin", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });

  it("3. Admin Login dan Menyetujui Akun Pelanggan Baru", () => {
    const adminEmail = Cypress.env("adminEmail");
    const adminPassword = Cypress.env("adminPassword");

    cy.visit("/login");
    cy.get('input[id="email"]').type(adminEmail);
    cy.get('input[id="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();

    // Masuk ke dashboard admin
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/admin/dashboard");

    // Navigasi ke manajemen pelanggan
    cy.visit("/admin/customers");
    cy.contains("Manajemen Pelanggan", { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // Cari pendaftar baru berdasarkan email
    cy.get('.search-input').type(testEmail);

    // Klik tombol Setujui
    cy.contains(testName, { timeout: EXTENDED_TIMEOUT })
      .parents('div')
      .contains("✓ Setujui")
      .click();

    // Verifikasi pesan sukses
    cy.contains("Akun berhasil disetujui", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });

  it("4. Pelanggan Baru Berhasil Login Setelah Disetujui", () => {
    cy.visit("/login");
    cy.get('input[id="email"]').type(testEmail);
    cy.get('input[id="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Masuk ke dashboard pelanggan
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
    cy.contains("Selamat datang kembali", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains(testName, { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });
});
