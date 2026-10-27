import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';

const VALID = 'Semoga harimu tenang dan penuh kebaikan kecil.';

async function toWriteStep(user: ReturnType<typeof userEvent.setup>) {
  render(<Composer onExplore={() => {}} onReceive={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Harapan' }));
}

describe('Composer', () => {
  it('menampilkan prompt kategori dan menonaktifkan lanjut sampai pesan valid', async () => {
    const user = userEvent.setup();
    await toWriteStep(user);
    expect(screen.getByText('Apa yang ingin kamu harapkan untuk seseorang yang belum kamu kenal?')).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Lihat pratinjau' });
    expect(next).toBeDisabled();
    await user.type(screen.getByRole('textbox'), 'pendek');
    expect(next).toBeDisabled();
    expect(screen.getByText(/Tulis minimal 20 karakter/)).toBeInTheDocument();
  });

  it('menolak pesan bertautan dengan penjelasan teks', async () => {
    const user = userEvent.setup();
    await toWriteStep(user);
    await user.type(screen.getByRole('textbox'), 'Kunjungi https://contoh.com ya teman');
    expect(screen.getByRole('button', { name: 'Lihat pratinjau' })).toBeDisabled();
    expect(screen.getByText(/tidak boleh memuat tautan/)).toBeInTheDocument();
  });

  it('alur lengkap: pratinjau, kirim, status menunggu moderasi, tidak langsung publik', async () => {
    const user = userEvent.setup();
    await toWriteStep(user);
    await user.type(screen.getByRole('textbox'), VALID);
    await user.click(screen.getByRole('button', { name: 'Lihat pratinjau' }));
    expect(screen.getByText(VALID)).toBeInTheDocument();
    expect(screen.getByText(/belum tentu langsung tampil/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kirim pesan' }));

    expect(await screen.findByText('Pesanmu menunggu ditinjau.')).toBeInTheDocument();
    expect(screen.getByText(/Mode demo/)).toBeInTheDocument();
    const pending = JSON.parse(localStorage.getItem('satucahaya:demo:pending') ?? '[]');
    expect(pending).toHaveLength(1);
    expect(pending[0].body).toBe(VALID);
    // ID pengirim tersimpan lokal untuk pengecualian pesan sendiri.
    expect(JSON.parse(localStorage.getItem('satucahaya:mine') ?? '[]')).toEqual([pending[0].id]);
  });

  it('kegagalan simpan tidak pernah dilaporkan sebagai sukses', async () => {
    const user = userEvent.setup();
    await toWriteStep(user);
    await user.type(screen.getByRole('textbox'), VALID);
    await user.click(screen.getByRole('button', { name: 'Lihat pratinjau' }));
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await user.click(screen.getByRole('button', { name: 'Kirim pesan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('belum terkirim');
    expect(screen.queryByText('Pesanmu menunggu ditinjau.')).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
