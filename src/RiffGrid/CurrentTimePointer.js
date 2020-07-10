import React, { useState, useEffect } from 'react';
import styles from './RiffGrid.module.css';

import { millis2frames, frame2pixel } from '../Utils.js';

let isNowPlaying = false;
let setNowishPasser = null;

const tryBeginTimer = (shouldBePlaying) => {
    isNowPlaying = shouldBePlaying;
    if (shouldBePlaying) {
        setTimeout(continueTimerOrNo, 100);
    }
};

const continueTimerOrNo = () => {
    if (setNowishPasser) {
        setNowishPasser(Date.now());
    }
    console.log('continue?');
    if (isNowPlaying) {
        setTimeout(continueTimerOrNo, 100);
    }
};

const CurrentTimePointer = ({ startTime, BPM, isPlaying }) => {
    useEffect(() => tryBeginTimer(isPlaying), [isPlaying]);

    const [nowish, setNowish] = useState(0);

    setNowishPasser = setNowish;

    if (!isPlaying) return null;
    return (
        <div
            className={styles.timePointer}
            style={{ left: `${frame2pixel(millis2frames(nowish - startTime, BPM))}px` }}
        ></div>
    );
};
export default CurrentTimePointer;
