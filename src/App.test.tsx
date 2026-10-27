import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App (mode demo)', () => {
  it('landing memuat tagline, intro, CTA, dan penjelasan moderasi', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Satu Cahaya' })).toBeInTheDocument();
    expect(screen.getByText('Leave One Light. Receive Another.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nyalakan Cahaya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jelajahi Langit' })).toBeInTheDocument();
    expect(screen.getByText(/anonim dan dimoderasi/)).toBeInTheDocument();
    expect(screen.getByText('Mode demo')).toBeInTheDocument();
  });

  it('langit: pilih bintang lewat keyboard-list, baca, simpan, dan laporkan', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Jelajahi Langit' }));
    expect(await screen.findByText(/pesan contoh untuk demo/)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^Baca bintang 1:/ })[0]);
    const dialog = screen.getByRole('dialog', { name: /Cahaya/ });
    expect(within(dialog).getByText(/Contoh pesan untuk demo/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    expect(JSON.parse(localStorage.getItem('satucahaya:favorites') ?? '[]')).toHaveLength(1);

    await user.click(within(dialog).getByRole('button', { name: 'Laporkan' }));
    const report = screen.getByRole('dialog', { name: 'Laporkan pesan' });
    const send = within(report).getByRole('button', { name: 'Kirim laporan' });
    expect(send).toBeDisabled();
    await user.click(within(report).getByLabelText('Spam atau promosi'));
    await user.click(send);
    expect(await within(report).findByText(/Laporanmu akan ditinjau/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('satucahaya:demo:reports') ?? '[]')).toHaveLength(1);
  });

  it('tombol tutup menutup dialog pesan', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Jelajahi Langit' }));
    await user.click((await screen.findAllByRole('button', { name: /^Baca bintang 1:/ }))[0]);
    await user.click(screen.getByRole('button', { name: 'Tutup pesan' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
