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

export const millis2pixels = (time) => {
    return frame2pixel(millis2frames(time));
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

export const beats2millis = (beats, BPM) => {
    const frames = beats2Frames(beats, BPM);
    return frames2mills(frames);
};

export const map = (val, inputMin, inputMax, outputMin, outputMax) => {
    const inputRange = inputMax - inputMin;
    const outputRange = outputMax - outputMin;
    const scale = outputRange / inputRange;
    const trueVal = val - inputMin;
    return outputMin + trueVal * scale;
};

export const MODE = {
    FREEHAND: 'freehand',
    QUANTIZE: 'quantize',
};
export const QUANT = {
    WHOLEBEAT: 1,
    HALFBEAT: 2,
    THIRDBEAT: 3,
    QUARTERBEAT: 4,
    EIGHTHBEAT: 8,
};
