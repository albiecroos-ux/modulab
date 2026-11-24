// test/test-password.js
// Uji unit mandiri untuk validasi password MODULAB.

import { validatePassword } from '../src/lib/password.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${message}`);
  }
}

console.log('--- Memulai Uji Unit password.js ---');

// 1. Password pendek (< 12 karakter)
const res1 = validatePassword('Short1!a');
assert(!res1.isValid && !res1.rules.minLength.passed, 'Password < 12 karakter harus ditolak');

// 2. Tanpa simbol
const res2 = validatePassword('PasswordPanjang123');
assert(!res2.isValid && !res2.rules.hasSymbol.passed, 'Password tanpa simbol harus ditolak');

// 3. Tanpa huruf besar
const res3 = validatePassword('passwordpanjang123!');
assert(!res3.isValid && !res3.rules.hasUpper.passed, 'Password tanpa huruf besar harus ditolak');

// 4. Ada spasi
const res4 = validatePassword('Password Kuat!123');
assert(!res4.isValid && !res4.rules.noSpace.passed, 'Password berspasi harus ditolak');

// 5. Tiga karakter kembar berurutan (aaa / 111)
const res5 = validatePassword('Batuuungaa123!@#');
assert(!res5.isValid && !res5.rules.noTripleChar.passed, 'Password dengan triple char (uuu) harus ditolak');

// 6. Memuat nama atau email pengguna
const res6 = validatePassword('AlbieRahman123!@#', { email: 'user@ui.ac.id', fullName: 'Albie Rahman' });
assert(!res6.isValid && !res6.rules.noUserInfo.passed, 'Password memuat nama lengkap harus ditolak');

const res7 = validatePassword('UserKeren123!@#', { email: 'userkeren@ui.ac.id', fullName: 'Budi' });
assert(!res7.isValid && !res7.rules.noUserInfo.passed, 'Password memuat prefix email harus ditolak');

// 7. Password umum
const res8 = validatePassword('password123');
assert(!res8.isValid && !res8.rules.notCommon.passed, 'Password umum harus ditolak');

// 8. Password valid kuat
const res9 = validatePassword('KombinasiAman#2026', { email: 'albie@ui.ac.id', fullName: 'Budi Santoso' });
assert(res9.isValid, 'Password valid yang memenuhi semua kriteria harus diterima');
assert(res9.strength === 'Kuat' || res9.strength === 'Sedang', 'Kekuatan password valid harus Sedang/Kuat');

console.log(`\nHasil Uji: ${passed} lulus, ${failed} gagal.`);
if (failed > 0) {
  process.exit(1);
}

