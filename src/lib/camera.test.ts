import { describe, expect, it } from 'vitest';
import { WORLD, centerOn, clampCamera, easeOutCubic, wrap } from './camera';

const view = { w: 400, h: 700 };

describe('clampCamera', () => {
  it('menjaga viewport di dalam dunia', () => {
    expect(clampCamera({ x: -50, y: -9 }, view, WORLD)).toEqual({ x: 0, y: 0 });
    expect(clampCamera({ x: 99999, y: 99999 }, view, WORLD)).toEqual({ x: WORLD.w - view.w, y: WORLD.h - view.h });
    expect(clampCamera({ x: 100, y: 200 }, view, WORLD)).toEqual({ x: 100, y: 200 });
  });
  it('memusatkan bila viewport lebih besar dari dunia', () => {
    expect(clampCamera({ x: 5, y: 5 }, { w: 4000, h: 2400 }, WORLD)).toEqual({ x: -400, y: -200 });
  });
});

describe('centerOn', () => {
  it('menempatkan titik di tengah layar', () => {
    const c = centerOn({ x: 1600, y: 1000 }, view, WORLD);
    expect(c).toEqual({ x: 1400, y: 650 });
  });
  it('tetap dibatasi di tepi dunia', () => {
    expect(centerOn({ x: 10, y: 10 }, view, WORLD)).toEqual({ x: 0, y: 0 });
  });
});

describe('wrap & easing', () => {
  it('wrap selalu di [0, m)', () => {
    expect(wrap(-1, 10)).toBe(9);
    expect(wrap(25, 10)).toBe(5);
    expect(wrap(0, 10)).toBe(0);
  });
  it('easeOutCubic memetakan 0..1 secara monoton', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(2)).toBe(1);
  });
});
