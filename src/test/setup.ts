import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Tes berlingkungan node (handlers, parity) tidak punya DOM; lewati polyfill di sana.
if (typeof window !== 'undefined') {
  // jsdom belum mengimplementasikan <dialog>.showModal/close dan matchMedia.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    // Intro dilewati secara default di tes; tes intro menghapus kunci ini sendiri.
    sessionStorage.setItem('satucahaya:intro-seen', '1');
  });
  afterEach(() => cleanup());
}
