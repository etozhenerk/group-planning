import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHoldGesture } from '@/shared/lib/hold-gesture/createHoldGesture';

afterEach(() => vi.useRealTimers());

describe('message and reaction-chip hold gestures', () => {
  it('opens once after the hold threshold and consumes the following tap', () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const pressed = vi.fn();
    const gesture = createHoldGesture(open, pressed, 450, 12);
    gesture.start(20, 20);
    vi.advanceTimersByTime(449);
    expect(open).not.toHaveBeenCalled();
    expect(pressed).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(1);
    gesture.activate();
    gesture.cancel();
    expect(open).toHaveBeenCalledTimes(1);
    expect(gesture.consumeClick()).toBe(true);
    expect(gesture.consumeClick()).toBe(false);
    expect(pressed).toHaveBeenLastCalledWith(false);
  });

  it('leaves a short tap available for toggling the own reaction', () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const gesture = createHoldGesture(open, vi.fn(), 450, 12);
    gesture.start(0, 0);
    vi.advanceTimersByTime(200);
    gesture.cancel();
    vi.advanceTimersByTime(500);
    expect(open).not.toHaveBeenCalled();
    expect(gesture.consumeClick()).toBe(false);
  });

  it('cancels on movement or scroll/cancel without blocking the next gesture', () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const gesture = createHoldGesture(open, vi.fn(), 450, 12);
    gesture.start(0, 0);
    gesture.move(13, 0);
    vi.advanceTimersByTime(500);
    gesture.start(0, 0);
    gesture.cancel();
    vi.advanceTimersByTime(500);
    expect(open).not.toHaveBeenCalled();
    gesture.start(0, 0);
    vi.advanceTimersByTime(450);
    expect(open).toHaveBeenCalledOnce();
  });
});
