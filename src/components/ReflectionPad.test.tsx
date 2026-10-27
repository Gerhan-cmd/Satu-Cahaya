import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ReflectionPad } from './ReflectionPad';

describe('ReflectionPad', () => {
  it('menyimpan hanya di localStorage refleksi, tidak menyentuh data publik/pending', async () => {
    const user = userEvent.setup();
    render(<ReflectionPad onBack={() => {}} />);
    expect(screen.getByText(/Tersimpan di browser ini saja/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ekspor/ })).toBeDisabled();

    await user.type(screen.getByLabelText('Tulisan refleksimu'), 'Aku bersyukur masih bisa berjalan pelan-pelan.');
    await user.click(screen.getByRole('button', { name: 'Simpan di perangkat ini' }));

    expect(screen.getByText('Aku bersyukur masih bisa berjalan pelan-pelan.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('satucahaya:reflections') ?? '[]')).toHaveLength(1);
    expect(localStorage.getItem('satucahaya:demo:pending')).toBeNull();
    expect(screen.getByRole('button', { name: /Ekspor/ })).toBeEnabled();
  });

  it('menghapus tulisan', async () => {
    const user = userEvent.setup();
    render(<ReflectionPad onBack={() => {}} />);
    await user.type(screen.getByLabelText('Tulisan refleksimu'), 'Tulisan yang nanti akan dihapus.');
    await user.click(screen.getByRole('button', { name: 'Simpan di perangkat ini' }));
    await user.click(screen.getByRole('button', { name: /Hapus tulisan ini/ }));
    expect(screen.getByText('Belum ada tulisan.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('satucahaya:reflections') ?? '[]')).toEqual([]);
  });
});
