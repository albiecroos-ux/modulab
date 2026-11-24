// src/lib/password.js
// Validasi aturan password kuat, meter kekuatan, dan daftar password umum.

export const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'football', 'monkey', 'letmein', 'shadow',
  'master', '666666', 'sunshine', '123321', '654321', 'princess', 'welcome', 'superman',
  'passcode', 'password1', 'password123', 'qwerty123', 'admin', 'root', 'root123',
  'iloveyou', 'secret', 'trustno1', 'starwars', 'killer', 'batman', 'system', 'test',
  'testing', 'guest', 'pass1234', 'default', 'charlie', 'jordan', 'michael', 'hacker',
  'football1', 'dragon1', 'soccer', 'mustang', 'chelsea', 'arsenal', 'liverpool', 'barcelona',
  'realmadrid', 'keyboard', 'computer', 'technology', 'internet', 'indonesia', 'jakarta',
  'kampus', 'universitas', 'mahasiswa', 'dosen', 'praktikum', 'laboratorium', 'modulab',
  'labassist', 'abcdef', 'abcdefg', '1234567890', '0987654321', '000000', '11111111',
  'password!1', 'p@ssword', 'p@ssw0rd', 'admin!1', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '123456a', 'a1234567', 'pass@123', 'admin@123', 'root@123', 'user123', 'member123',
  'access', 'master123', 'server123', 'database123', 'developer', 'engineer', 'teknikmesin'
]);

/**
 * Validasi password berdasarkan aturan MODULAB:
 * 1. Minimal 12 karakter.
 * 2. Wajib huruf besar, huruf kecil, angka, simbol.
 * 3. Tanpa spasi.
 * 4. Tidak boleh memuat bagian depan email atau nama lengkap.
 * 5. Tidak boleh ada tiga karakter sama berurutan (misal: aaa).
 * 6. Tidak ada di daftar password umum.
 */
export function validatePassword(password, { email = '', fullName = '' } = {}) {
  const pwd = String(password || '');
  
  const minLength = pwd.length >= 12;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(pwd);
  const noSpace = !/\s/.test(pwd);
  const noTripleChar = !/(.)\1\1/.test(pwd);
  
  // Periksa bagian depan email (sebelum @)
  const emailPrefix = String(email || '').split('@')[0].trim().toLowerCase();
  const hasEmailPrefix = emailPrefix.length >= 3 && pwd.toLowerCase().includes(emailPrefix);
  
  // Periksa nama lengkap dan token kata nama (>= 3 karakter)
  const nameClean = String(fullName || '').trim().toLowerCase();
  const nameTokens = nameClean.split(/\s+/).filter((t) => t.length >= 3);
  const hasName = (nameClean.length >= 3 && pwd.toLowerCase().includes(nameClean)) ||
    nameTokens.some((token) => pwd.toLowerCase().includes(token));
  
  const noUserInfo = !hasEmailPrefix && !hasName;
  const notCommon = !COMMON_PASSWORDS.has(pwd.toLowerCase());

  const rules = {
    minLength: {
      passed: minLength,
      label: 'Minimal 12 karakter'
    },
    hasUpper: {
      passed: hasUpper,
      label: 'Ada huruf besar (A-Z)'
    },
    hasLower: {
      passed: hasLower,
      label: 'Ada huruf kecil (a-z)'
    },
    hasNumber: {
      passed: hasNumber,
      label: 'Ada angka (0-9)'
    },
    hasSymbol: {
      passed: hasSymbol,
      label: 'Ada simbol khusus (contoh: !@#$%^&*)'
    },
    noSpace: {
      passed: noSpace,
      label: 'Tanpa karakter spasi'
    },
    noTripleChar: {
      passed: noTripleChar,
      label: 'Tidak ada 3 karakter sama berturut-turut (misal: aaa)'
    },
    noUserInfo: {
      passed: noUserInfo,
      label: 'Tidak memuat nama atau bagian email'
    },
    notCommon: {
      passed: notCommon,
      label: 'Bukan password umum yang sering dipakai'
    }
  };

  const allPassed = Object.values(rules).every((r) => r.passed);

  // Perhitungan meter kekuatan (Lemah, Sedang, Kuat)
  let strength = 'Lemah';
  let passedCount = Object.values(rules).filter((r) => r.passed).length;
  
  if (allPassed) {
    if (pwd.length >= 16) {
      strength = 'Kuat';
    } else {
      strength = 'Sedang';
    }
  } else if (passedCount >= 6) {
    strength = 'Sedang';
  } else {
    strength = 'Lemah';
  }

  return {
    isValid: allPassed,
    strength,
    rules,
    passedCount,
    totalRules: Object.keys(rules).length
  };
}

