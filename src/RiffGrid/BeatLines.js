import React from 'react';

import styles from './RiffGrid.module.css';

import { beats2Pixels } from '../Utils.js';

const BeatLines = ({ totalBeats, measureLengthInBeasts, BPM }) => {
    // fill array from 1 to beats - 1 so we can do a nice little map...
    if (totalBeats <= 0) return null;
    const counts = Array.from(Array(totalBeats - 1), (_, i) => i + 1);
    return counts.map((b) => {
        const style = `${styles.beatLine} ${b % measureLengthInBeasts === 0 ? styles.measureLine : ''}`;
        return <div className={style} style={{ left: `${beats2Pixels(b, BPM)}px` }} key={b}></div>;
    });
};
export default BeatLines;
