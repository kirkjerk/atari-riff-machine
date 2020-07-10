import Pizzicato from '../js/Pizzicato.min.js';

//const bundledFiles = require('./wav/*.wav');

import bundledFiles from '../wav/*.wav';
import fxFiles from '../fx/*.wav';
import { settings } from '../Utils.js';

const clipCache = {};

const num2dig = (d) => {
    return `${d}`.length === 1 ? `0${d}` : d;
};
const tf2filename = (t, f) => {
    return bundledFiles[`sound_${num2dig(t)}_${num2dig(f)}`];
};

const fxFilename = (base) => {
    return fxFiles[`${base}`];
};

const loadLoop = (t, f) => {
    clipCache[tf2filename(t, f)] = new Pizzicato.Sound({
        source: 'file',
        options: { loop: true, path: tf2filename(t, f) },
    });
};
const getLoop = (t, f) => {
    return clipCache[tf2filename(t, f)];
};

const SoundCache = {
    loadSoundsForMap: (set) => {
        // console.log(bundledFiles);
        set.sounds.forEach((item) => {
            const { t, f } = item;

            // console.log(tf2filename(t, f));

            loadLoop(t, f);
        });
        // console.log(map);
        //Pizzicato.pla;
    },

    loadRecordingSounds: () => {
        clipCache[fxFilename('ds_cross_stick_rim')] = new Pizzicato.Sound({
            source: 'file',
            options: { path: fxFilename('ds_cross_stick_rim') },
        });

        for (let i = 1; i <= 4; i++) {
            clipCache[fxFilename(`say${i}`)] = new Pizzicato.Sound({
                source: 'file',
                options: { path: fxFilename(`say${i}`) },
            });
        }
    },

    playTap: () => {
        clipCache[fxFilename('ds_cross_stick_rim')].play();
    },

    playSayNum: (num) => {
        clipCache[fxFilename(`say${num}`)].play();
    },

    playByTFV: (t, f, v) => {
        getLoop(t, f).volume = v / settings.AtariMaxVol;
        getLoop(t, f).play();
    },
    changeVolByTFV: (t, f, v) => {
        const vol = v / settings.AtariMaxVol;
        getLoop(t, f).volume = vol;
    },
    stopByTF: (t, f) => {
        getLoop(t, f).stop();
    },

    playSound: (sound) => {
        //console.log(getLoop(sound.t, sound.f));
        // console.log(sound.t, sound.f);
        getLoop(sound.t, sound.f).play();
    },
    stopSound: (sound) => {
        getLoop(sound.t, sound.f).stop();
    },
};

export default SoundCache;
