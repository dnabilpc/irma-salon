import http from 'k6/http';
import { check, sleep } from 'k6';

// ── KONFIGURASI PENGUJIAN ───────────────────────────────────────────────────
const useMock = true; // Set ke 'false' jika ingin menguji API Replicate riil (memotong credit)
const targetVUs = useMock ? 50 : 2; // PENTING: Jika menguji API riil, gunakan maksimal 2 VUs saja agar credit $1.5 Anda tidak habis dalam 2 detik!

export const options = {
  stages: [
    { duration: '5s', target: targetVUs },   // Ramp-up
    { duration: '15s', target: targetVUs },  // Maintain load
    { duration: '5s', target: 0 },           // Ramp-down
  ],
  thresholds: {
    // Abaikan threshold jika menguji API riil karena inferensi AI memakan waktu 3 - 11 detik
    http_req_duration: useMock ? ['p(95)<300'] : [],
    http_req_failed: ['rate<0.01'],
  },
};

// 1x1 transparent PNG base64 data as fallback
const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Membaca file gambar asli di folder root jika ada, gunakan fallback jika tidak ada
let personFile;
let clothesFile;

try {
  // k6 memuat berkas secara sinkron pada tahap inisialisasi
  personFile = open('./person.png', 'b');
  clothesFile = open('./clothes.png', 'b');
  console.log("SUCCESS: Gambar asli (person.png dan clothes.png) berhasil dimuat dari disk.");
} catch (err) {
  // Jika gambar tidak ada di root, gunakan base64 dummy
  personFile = dummyPngBase64;
  clothesFile = dummyPngBase64;
  console.log("WARNING: person.png/clothes.png tidak ditemukan. Menggunakan fallback dummy 1x1 PNG.");
}

export default function () {
  // 1. Simulasikan kunjungan ke halaman utama Website Irma Salon
  const homepageUrl = 'http://dnabilpc.site';
  const resWeb = http.get(homepageUrl);
  
  check(resWeb, {
    'Website: status is 200': (r) => r.status === 200,
    'Website: response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  sleep(1); // Tunggu 1 detik

  // 2. Simulasikan throughput API Virtual Try-On
  const apiUrl = 'http://api.dnabilpc.site/api/virtual-tryon'; 
  
  const data = {
    person: http.file(personFile, 'person.png', 'image/png'),
    clothes: http.file(clothesFile, 'clothes.png', 'image/png'),
  };
  
  const params = {
    headers: {
      'x-mock-request': useMock ? 'true' : 'false', // Mengaktifkan/menonaktifkan bypass mock di backend
    },
    timeout: '60s' // Inferensi AI Replicate bisa memakan waktu lama, set timeout ke 60 detik
  };
  
  const resApi = http.post(apiUrl, data, params);
  
  check(resApi, {
    'API: status is 200': (r) => r.status === 200,
    'API: status is not 500': (r) => r.status !== 500,
  });

  sleep(1);
}
