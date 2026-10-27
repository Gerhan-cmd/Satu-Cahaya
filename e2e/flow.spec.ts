import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Intro dilewati secara default; tes intro di bawah menghapus kunci ini.
  await page.addInitScript(() => sessionStorage.setItem('satucahaya:intro-seen', '1'));
});

const VALID = 'Semoga harimu tenang dan penuh kebaikan kecil.';

/** Tunggu animasi CSS/Web Animations selesai agar axe tidak menghitung kontras pada opacity sementara. */
async function settle(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
}

/** Ringkas pelanggaran serius agar kegagalan langsung menunjukkan aturan dan elemennya. */
async function seriousViolations(page: Page, include?: string) {
  await settle(page);
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']);
  const results = await (include ? builder.include(include) : builder).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.map((n) => `${n.target.join(' ')} :: ${n.failureSummary?.split('\n')[1] ?? ''}`) }));
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('landing: tanpa overflow horizontal di semua lebar target dan tanpa error konsol', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Satu Cahaya' })).toBeVisible();
    await noHorizontalOverflow(page);
  }
  expect(errors).toEqual([]);
});

test('landing: tanpa pelanggaran aksesibilitas serius (axe)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Satu Cahaya' })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});

test('menulis pesan, pratinjau, kirim, lalu menerima satu cahaya dan membuat kartu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nyalakan Cahaya' }).click();
  await page.getByRole('button', { name: 'Harapan' }).click();
  const next = page.getByRole('button', { name: 'Lihat pratinjau' });
  await expect(next).toBeDisabled();
  await page.getByRole('textbox').fill('pendek');
  await expect(next).toBeDisabled();
  await page.getByRole('textbox').fill(VALID);
  await next.click();
  await expect(page.getByText(VALID)).toBeVisible();
  await page.getByRole('button', { name: 'Kirim pesan' }).click();
  await expect(page.getByText('Pesanmu menunggu ditinjau.')).toBeVisible();

  await page.getByRole('button', { name: 'Terima satu cahaya' }).click();
  await expect(page.getByRole('blockquote')).toBeVisible();
  await noHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Buat kartu' }).click();
  await expect(page.getByRole('img', { name: /Kartu pesan/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Unduh' })).toHaveAttribute('download', 'satu-cahaya.png');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('langit: bintang dapat dibuka lewat keyboard dan ditutup dengan Esc', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jelajahi Langit' }).click();
  await expect(page.getByText(/pesan contoh untuk demo/)).toBeVisible();
  const star = page.getByRole('button', { name: /^Baca bintang 1:/ });
  await star.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Contoh pesan untuk demo/)).toBeVisible();
  expect(await seriousViolations(page, 'dialog')).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('langit: tombol Cahaya acak membuka pesan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jelajahi Langit' }).click();
  await page.getByRole('button', { name: 'Cahaya acak' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('reduced motion: animasi masuk dimatikan', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('main section').first().evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});

test('refleksi pribadi tersimpan lokal dan tidak dikirim ke jaringan', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await page.getByRole('button', { name: 'Refleksi pribadi' }).click();
  await page.getByLabel('Tulisan refleksimu').fill('Aku bersyukur untuk pagi yang tenang.');
  const before = requests.length;
  await page.getByRole('button', { name: 'Simpan di perangkat ini' }).click();
  await expect(page.getByText('Aku bersyukur untuk pagi yang tenang.')).toBeVisible();
  expect(requests.length).toBe(before);
});

test.describe('intro', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.removeItem('satucahaya:intro-seen'));
  });

  test('tampil hitam-putih, bisa dilewati, dan tidak muncul lagi di sesi yang sama', async ({ page }) => {
    await page.goto('/');
    const intro = page.getByRole('dialog', { name: 'Pembuka Satu Cahaya' });
    await expect(intro).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lewati' })).toBeFocused();
    await page.getByRole('button', { name: 'Lewati' }).click();
    await expect(intro).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Satu Cahaya' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Pembuka Satu Cahaya' })).toHaveCount(0);
  });

  test('menutup sendiri setelah animasi selesai', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Pembuka Satu Cahaya' })).toHaveCount(0, { timeout: 10_000 });
  });
});
