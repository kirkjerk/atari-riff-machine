import React, { useState } from 'react';
import styles from './RiffGrid.module.css';
import { millis2pixels } from '../Utils.js';

const CurrentTimePointer = ({ startTime, isPlaying }) => {
    const [nowish, setNowish] = useState(0);
    let timerRef = null;

    if (isPlaying) {
        timerRef = setTimeout(() => setNowish(Date.now()), 100);
    }
    if (!isPlaying) {
        clearTimeout(timerRef);
        return null;
    }

    return <div className={styles.timePointer} style={{ left: `${millis2pixels(nowish - startTime)}px` }}></div>;
};
export default CurrentTimePointer;
