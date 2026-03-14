import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDesktopTimerHost } from './runtime';

describe('getDesktopTimerHost', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('binds browser timer functions to window', () => {
        const callback = vi.fn();
        const setTimeoutSpy = vi.spyOn(window, 'setTimeout').mockImplementation(function (
            this: Window,
            handler: TimerHandler
        ): ReturnType<typeof setTimeout> {
            expect(this).toBe(window);
            if (typeof handler === 'function') {
                handler();
            }
            return 1 as unknown as ReturnType<typeof setTimeout>;
        });
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout').mockImplementation(function (
            this: Window,
            _id?: string | number | ReturnType<typeof setTimeout>
        ): void {
            expect(this).toBe(window);
        });

        const timers = getDesktopTimerHost();
        const handle = timers.setTimeout(callback, 10);
        timers.clearTimeout(handle);

        expect(callback).toHaveBeenCalledOnce();
        expect(setTimeoutSpy).toHaveBeenCalledOnce();
        expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    });
});
