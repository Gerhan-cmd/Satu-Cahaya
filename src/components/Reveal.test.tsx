import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEMO_MESSAGES } from '../lib/demoMessages';
import { Reveal } from './Reveal';

const props = {
  isSaved: () => false,
  saveError: null,
  onToggleSave: () => {},
  onCard: () => {},
  onReport: () => {},
  onSky: () => {},
  onReflect: () => {},
};

describe('Reveal', () => {
  it('menampilkan satu pesan berlabel asal', async () => {
    render(<Reveal {...props} />);
    expect(await screen.findByRole('blockquote')).toBeInTheDocument();
    expect(screen.getByText(/Contoh pesan untuk demo/)).toBeInTheDocument();
  });

  it('tidak pernah menampilkan pesan milik sendiri; beralih ke pesan kurasi berlabel', async () => {
    localStorage.setItem('satucahaya:mine', JSON.stringify(DEMO_MESSAGES.map((m) => m.id)));
    render(<Reveal {...props} />);
    expect(await screen.findByText(/Pesan kurasi dari Satu Cahaya/)).toBeInTheDocument();
    expect(screen.queryByText(/Contoh pesan untuk demo/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tulis refleksi' })).toBeInTheDocument();
  });
});
