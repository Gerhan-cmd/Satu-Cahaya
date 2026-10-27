import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';

// jsdom tidak punya layout: aturan kontras/ukuran target dimatikan di sini dan dicakup oleh e2e (Playwright + axe).
async function violations(container: HTMLElement) {
  const r = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false }, region: { enabled: false } },
  });
  return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')) }));
}

describe('aksesibilitas (aturan non-layout)', () => {
  it('landing', async () => {
    const { container } = render(<App />);
    expect(await violations(container)).toEqual([]);
  });
  it('langit + dialog pesan', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Jelajahi Langit' }));
    await user.click((await screen.findAllByRole('button', { name: /^Baca bintang 1:/ }))[0]);
    expect(await violations(container)).toEqual([]);
  });
  it('menulis, refleksi, tersimpan', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Nyalakan Cahaya' }));
    expect(await violations(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Harapan' }));
    expect(await violations(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: /Satu Cahaya/ }));
    await user.click(screen.getByRole('button', { name: 'Refleksi pribadi' }));
    expect(await violations(container)).toEqual([]);
  });
});
