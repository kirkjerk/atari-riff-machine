import React from 'react';
import { beats2Pixels, frame2pixel, MODE } from '../Utils.js';

import styles from './RiffGrid.module.css';

const ColHilite = ({ colHilite, noteAlignMode, BPM, envelope, quantizeMode }) => {
    const fullColWidth = beats2Pixels(1 / quantizeMode, BPM);
    const left = noteAlignMode == MODE.QUANTIZE ? fullColWidth * colHilite : colHilite;

    const markerWidth = frame2pixel(envelope.length);

    const style = { width: `${markerWidth}px`, left: `${left}px` };

    return colHilite !== -1 ? <div className={styles.colHilite} style={style}></div> : null;
};
export default ColHilite;
