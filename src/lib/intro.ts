const KEY = 'satucahaya:intro-seen';

/** Total tayang sebelum menutup sendiri, dan durasi memudar keluar (ms). */
export const INTRO_AUTO_MS = 6400;
export const INTRO_FADE_MS = 600;

/** Intro tampil sekali per sesi tab. Bila storage diblokir, tampil di setiap muat (aman). */
export function shouldShowIntro(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* tidak masalah: intro hanya tampil lagi di muat berikutnya */
  }
}
