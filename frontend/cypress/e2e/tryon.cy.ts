// frontend/cypress/e2e/tryon.cy.ts

describe("Alur AI Virtual Try-On (Mocked API)", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testName = `User Tryon ${randomSuffix}`;
  const testEmail = `tryon.user.${randomSuffix}@irmasalon.com`;
  const testPhone = `0800000${Math.floor(10000 + Math.random() * 90000)}`;
  const testPassword = "passwordTest123";

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
    cy.get('input[placeholder="123456"]').should("be.visible");

    // Ambil kode OTP dari database
    cy.task("getRegistrationOTP", testEmail).then((otpCode) => {
      expect(otpCode).to.exist;
      cy.get('input[placeholder="123456"]').type(otpCode as string);
      cy.get('button[type="submit"]').click();
    });

    // Pastikan redirect ke login dengan parameter sukses
    cy.url().should("include", "/login");
  });

  after(() => {
    // Bersihkan user pengujian dari database setelah pengujian selesai
    cy.task("deleteUser", testEmail);
  });

  beforeEach(() => {
    // Login sebagai user sebelum pengujian VTO
    cy.visit("/login");
    cy.get('input[id="email"]').type(testEmail);
    cy.get('input[id="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("Mengunggah Foto Selfie, Memilih Baju, dan Menjalankan VTO AI (Hasil Mocked)", () => {
    // Intercept API VTO agar tidak menghubungi API Replicate/Backend asli
    cy.intercept("GET", "/api/vto/usage", {
      statusCode: 200,
      body: {
        success: true,
        can_use: true,
        limit: 5,
        remaining: 5,
        next_reset: "2026-06-15T00:00:00.000Z",
      },
    }).as("getQuota");

    cy.intercept("POST", "/api/vto/process", {
      statusCode: 200,
      body: {
        success: true,
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500", // Contoh Gambar Mock
      },
    }).as("processVto");

    cy.intercept("POST", "/api/vto/usage", {
      statusCode: 200,
      body: {
        success: true,
        usage: 1,
        remaining: 4,
      },
    }).as("updateQuota");

    cy.visit("/virtual-try-on");

    // Tunggu kuota termuat
    cy.wait("@getQuota");
    cy.contains("5 / 5 tersisa").should("be.visible");

    // 1. Unggah Foto Diri (Selfie)
    const fileName = "selfie.jpg";
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("dummy image contents"),
      fileName: fileName,
      lastModified: Date.now(),
    }, { force: true });

    cy.contains("✓ Foto siap").should("be.visible");

    // 2. Pilih Baju di Katalog
    // Kita pastikan ada baju yang bisa diklik. Baju dengan model_2d_file_link aktif.
    // Kita klik baju pertama yang tidak berstatus disabled
    cy.get('div[style*="cursor: pointer"]').first().click();

    // 3. Jalankan VTO
    cy.get('button').contains("Mulai Virtual Try-On").click();

    // Verifikasi pemrosesan API dipanggil
    cy.wait("@processVto");
    cy.wait("@updateQuota");

    // Verifikasi hasil VTO muncul
    cy.contains("Hasil Virtual Try-On").should("be.visible");
    cy.get("img[alt='Hasil Virtual Try-On']").should("be.visible");
  });
});
