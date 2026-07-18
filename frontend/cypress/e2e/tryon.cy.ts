// frontend/cypress/e2e/tryon.cy.ts

describe("Alur AI Virtual Try-On (Mocked API)", () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testName = `User Tryon ${randomSuffix}`;
  const testEmail = `tryon.user.${randomSuffix}@irmasalon.com`;
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
    cy.intercept("GET", "/api/vto/status/123", {
      statusCode: 200,
      body: {
        success: true,
        task: {
          id: 123,
          status: "completed",
        },
      },
    }).as("taskStatus");

    cy.intercept("POST", "/api/vto/process", {
      statusCode: 200,
      body: {
        success: true,
        taskId: 123,
      },
    }).as("processVto");

    cy.intercept("GET", "/api/vto/history", {
      statusCode: 200,
      body: [
        {
          id: 123,
          status: "completed",
          person_image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
          result_image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
          outfit_name: "Mock Outfit",
          created_at: new Date().toISOString(),
        },
      ],
    }).as("vtoHistory");

    cy.intercept("POST", "/api/vto/status/123/read", {
      statusCode: 200,
      body: { success: true },
    }).as("readTask");

    cy.visit("/virtual-try-on");

    // Tunggu data terload (Koleksi baju dimuat)
    cy.contains("Katalog Baju", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("Memuat koleksi...", { timeout: EXTENDED_TIMEOUT }).should("not.exist");

    // 1. Unggah Foto Diri (Selfie)
    const fileName = "selfie.jpg";
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("dummy image contents"),
      fileName: fileName,
      lastModified: Date.now(),
    }, { force: true });

    cy.contains("✓ Foto siap").should("be.visible");

    // 2. Pilih Baju di Katalog
    // Kita klik baju pertama yang memiliki pointer cursor (ada model_2d_file_link)
    cy.get('div[style*="cursor: pointer"]').first().click();

    // 3. Jalankan VTO
    cy.get('button').contains("Mulai Virtual Try-On").click();

    // Verifikasi API pemrosesan dipanggil
    cy.wait("@processVto");

    // Verifikasi task masuk antrean aktif dan terpantau sampai selesai
    cy.contains("Antrean Virtual Try-On Aktif", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
    cy.contains("Selesai!", { timeout: EXTENDED_TIMEOUT }).should("be.visible");

    // 4. Klik Lihat Hasil
    cy.get('button').contains("Lihat Hasil").click();

    // Verifikasi dialihkan ke dashboard VTO history
    cy.url({ timeout: EXTENDED_TIMEOUT }).should("include", "/dashboard");
    cy.url().should("include", "section=vto");

    // Verifikasi hasil VTO ter-render di dashboard
    cy.get("img[alt='Hasil VTO']", { timeout: EXTENDED_TIMEOUT }).should("be.visible");
  });
});
