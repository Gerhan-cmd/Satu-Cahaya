import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { INTRO_AUTO_MS, INTRO_FADE_MS } from '../lib/intro';
import { Intro } from './Intro';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Intro', () => {
  it('dialog berlabel, tombol Lewati terfokus, dan tidak memakai warna selain hitam-putih', () => {
    const { container } = render(<Intro onDone={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Pembuka Satu Cahaya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lewati' })).toHaveFocus();
    const colors = new Set([...container.querySelectorAll('[fill],[stop-color],[stroke]')].flatMap((el) =>
      ['fill', 'stop-color', 'stroke'].map((a) => el.getAttribute(a)).filter((v): v is string => !!v && !v.startsWith('url') && v !== 'none')));
    expect([...colors].every((c) => c === '#fff')).toBe(true);
  });

  it('Lewati menutup setelah memudar', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<Intro onDone={onDone} />);
    act(() => screen.getByRole('button', { name: 'Lewati' }).click());
    expect(onDone).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(INTRO_FADE_MS));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('Esc melewati dan klik ganda tidak memanggil onDone dua kali', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<Intro onDone={onDone} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      screen.getByRole('button', { name: 'Lewati' }).click();
    });
    act(() => void vi.advanceTimersByTime(INTRO_FADE_MS + 50));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('menutup sendiri setelah durasi intro', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<Intro onDone={onDone} />);
    act(() => void vi.advanceTimersByTime(INTRO_AUTO_MS - 1));
    expect(onDone).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1 + INTRO_FADE_MS));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reduced-motion: tombol "Masuk" dan tidak menutup sendiri', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    const onDone = vi.fn();
    render(<Intro onDone={onDone} />);
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(INTRO_AUTO_MS * 3));
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('Intro di App', () => {
  it('tampil di kunjungan pertama, mengunci isi aplikasi, lalu terbuka setelah dilewati; tidak muncul lagi di sesi yang sama', async () => {
    sessionStorage.clear();
    const user = userEvent.setup();
    const { container, unmount } = render(<App />);
    expect(screen.getByRole('dialog', { name: 'Pembuka Satu Cahaya' })).toBeInTheDocument();
    expect(container.querySelector('.relative.min-h-dvh')).toHaveAttribute('inert');

    await user.click(screen.getByRole('button', { name: 'Lewati' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Pembuka Satu Cahaya' })).not.toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Satu Cahaya' })).toBeInTheDocument();
    expect(container.querySelector('.relative.min-h-dvh')).not.toHaveAttribute('inert');

    unmount();
    render(<App />);
    expect(screen.queryByRole('dialog', { name: 'Pembuka Satu Cahaya' })).not.toBeInTheDocument();
  });
});
