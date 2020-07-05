import { useEffect, useRef } from 'react';

export const settings = {
    FramesPerSecond: 60,

    PixelsPerFrame: 1,
    SecondsPerMinute: 60,
    PixelsPerRow: 20,

    AtariMaxVol: 15,
};

export const frames2mills = (frames) => {
    return 1000 * (frames / settings.FramesPerSecond);
};

export const millis2frames = (millis) => {
    return (millis / 1000) * settings.FramesPerSecond;
};

export const pixel2frame = (pixel) => {
    return pixel / settings.PixelsPerFrame;
};
export const frame2pixel = (frame) => {
    return frame * settings.PixelsPerFrame;
};

export const beats2Pixels = (beats, BPM) => {
    if (!BPM) console.log('duh b2p');
    const pixels = beats2Frames(beats, BPM) * settings.PixelsPerFrame;
    return pixels;
};
export const beats2Frames = (beats, BPM) => {
    if (!BPM) console.log('duh b2f');
    return (beats / BPM) * settings.SecondsPerMinute * settings.FramesPerSecond;
};

export const map = (val, inputMin, inputMax, outputMin, outputMax) => {
    const inputRange = inputMax - inputMin;
    const outputRange = outputMax - outputMin;
    const scale = outputRange / inputRange;
    const trueVal = val - inputMin;
    return outputMin + trueVal * scale;
};

export function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export const MODE = {
    FREEHAND: 'freehand',
    QUANTIZE: 'quantize',
};
export const QUANT = {
    WHOLEBEAT: 1,
    HALFBEAT: 2,
    THIRDBEAT: 3,
    QUARTERBEAT: 4,
};
