import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDeckMotion } from '@/pages/memories/model/createDeckMotion';

const setup = (reduced = false) => {
  vi.useFakeTimers();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let count = 3;
  const motion = createDeckMotion(() => count, vi.fn(), {
    reduced: () => reduced,
    viewport: () => 390,
    frame: (callback) => {
      frames.set(++nextFrame, callback);

      return nextFrame;
    },
    cancelFrame: (id) => frames.delete(id),
  });

  const flushFrames = () => {
    while (frames.size) {
      const batch = [...frames.values()];
      frames.clear();
      batch.forEach((callback) => callback(0));
    }
  };

  return {
    motion,
    flushFrames,
    setCount: (value: number) => {
      count = value;
    },
  };
};

afterEach(() => vi.useRealTimers());

describe('album deck motion', () => {
  it('returns a short slow gesture to the same photo and unlocks after rollback', () => {
    const { motion } = setup();
    motion.drag(17, 4);
    motion.finish(17, 0.1, 300);
    expect(motion.read()).toMatchObject({
      index: 0,
      offset: 0,
      vertical: 0,
      phase: 'returning',
    });
    expect(motion.canOpen()).toBe(false);
    vi.runAllTimers();
    expect(motion.canOpen()).toBe(true);
  });

  it.each([-1, 1])(
    'advances in order after a short fast flick in direction %s',
    (side) => {
      const { motion, flushFrames } = setup();
      motion.drag(side * 23);
      motion.finish(side * 23, side * 0.8, 300);
      flushFrames();
      expect(motion.read().index).toBe(0);
      vi.runAllTimers();
      flushFrames();
      expect(motion.read()).toMatchObject({ index: 1, offset: 0, phase: 'idle' });
    },
  );

  it('cycles from the last photo through assembly and preserves the selected photo on grid switch', () => {
    const { motion, flushFrames } = setup();
    motion.select(2);
    motion.finish(-100, 0.2, 300);
    flushFrames();
    vi.advanceTimersByTime(320);
    expect(motion.read()).toMatchObject({ index: 0, phase: 'assembling' });
    motion.setGrid(true);
    vi.runAllTimers();
    expect(motion.read()).toMatchObject({
      index: 0,
      phase: 'idle',
      grid: true,
      offset: 0,
    });
  });

  it('keeps manual tracking with reduced motion and commits without a flight', () => {
    const { motion } = setup(true);
    motion.drag(-110, 5);
    expect(motion.read()).toMatchObject({ offset: -110, vertical: 5 });
    motion.finish(-110, 0.1, 300);
    expect(motion.read()).toMatchObject({ index: 1, offset: 0, phase: 'idle' });
  });

  it('cancels pending transitions on disposal and clamps after access/count changes', () => {
    const { motion, flushFrames, setCount } = setup();
    motion.advance(1, 300);
    motion.dispose();
    flushFrames();
    vi.runAllTimers();
    expect(motion.read().index).toBe(0);
    motion.activate();
    motion.select(2);
    setCount(0);
    motion.countChanged();
    expect(motion.read()).toMatchObject({ index: 0, offset: 0, phase: 'idle' });
  });
});
