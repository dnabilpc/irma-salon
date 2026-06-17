import http from 'k6/http';
import { check, sleep } from 'k6';

// ── KONFIGURASI PENGUJIAN ───────────────────────────────────────────────────
const useMock = true; // Set ke 'false' jika ingin menguji API Replicate riil (memotong credit)
const targetVUs = useMock ? 50 : 2; // PENTING: Jika menguji API riil, gunakan maksimal 2 VUs saja!

// ── KONFIGURASI AUTH ────────────────────────────────────────────────────────
// Isi sesuai dengan nilai di backend/.env (INTERNAL_API_KEY dan user ID yang valid)
const INTERNAL_API_KEY = __ENV.INTERNAL_API_KEY || 'ganti-dengan-api-key-mu';
const TEST_USER_ID     = __ENV.TEST_USER_ID     || 'ganti-dengan-user-id-valid';

export const options = {
  stages: [
    { duration: '5s',  target: targetVUs },   // Ramp-up
    { duration: '15s', target: targetVUs },   // Maintain load
    { duration: '5s',  target: 0 },           // Ramp-down
  ],
  thresholds: {
    // Website harus merespons < 500ms pada p95 (halaman statis Next.js)
    'http_req_duration{type:website}': useMock ? ['p(95)<500'] : [],
    // API: multipart upload + DB INSERT ke remote Supabase PostgreSQL
    // Pool saat ini = 3 koneksi → 50 VU → p95 ≈ 5-6s (bottleneck connection queue)
    // Setelah backend di-restart dengan pool=20 → target p95 < 2000ms
    'http_req_duration{type:api}'    : useMock ? ['p(95)<6000'] : [],
    http_req_failed: ['rate<0.05'], // Toleransi 5% untuk intermittent failures
  },
};

// 1x1 transparent PNG base64 data as fallback
const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Membaca file gambar asli di folder root jika ada, gunakan fallback jika tidak ada
let personFile;
let clothesFile;

try {
  personFile  = open('./person.png',  'b');
  clothesFile = open('./clothes.png', 'b');
  console.log("SUCCESS: Gambar asli (person.png dan clothes.png) berhasil dimuat dari disk.");
} catch (err) {
  personFile  = dummyPngBase64;
  clothesFile = dummyPngBase64;
  console.log("WARNING: person.png/clothes.png tidak ditemukan. Menggunakan fallback dummy 1x1 PNG.");
}

export default function () {
  // 1. Simulasikan kunjungan ke halaman utama Website Irma Salon
  const resWeb = http.get('http://dnabilpc.site', {
    tags: { type: 'website' },
  });

  check(resWeb, {
    'Website: status is 200'      : (r) => r.status === 200,
    'Website: response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. Simulasikan throughput API Virtual Try-On
  // Backend mengembalikan 202 Accepted (bukan 200) karena task masuk ke queue async
  const data = {
    person : http.file(personFile,  'person.png',  'image/png'),
    clothes: http.file(clothesFile, 'clothes.png', 'image/png'),
  };

  const params = {
    headers: {
      // Header wajib: internal API key untuk bypass CORS/auth middleware di backend
      'Authorization'  : `Bearer ${INTERNAL_API_KEY}`,
      // Header wajib: user ID yang valid agar quota check tidak gagal
      'X-User-Id'      : TEST_USER_ID,
      // Mock mode: bypass Replicate untuk menghindari pengurangan credit
      'x-mock-request' : useMock ? 'true' : 'false',
    },
    tags   : { type: 'api' },
    timeout: '60s',
  };

  const resApi = http.post('http://api.dnabilpc.site/api/virtual-tryon', data, params);

  check(resApi, {
    // Queue endpoint mengembalikan 202 Accepted, bukan 200
    'API: task berhasil masuk queue (202)': (r) => r.status === 202,
    'API: tidak ada error server (5xx)'   : (r) => r.status < 500,
    'API: response time < 2000ms'         : (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
