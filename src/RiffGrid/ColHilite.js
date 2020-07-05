import React from 'react';
import { beats2Pixels, frame2pixel, MODE } from '../Utils.js';

import styles from './RiffGrid.module.css';

const ColHilite = ({ colHilite, quantizeMode, BPM, noteMode, envelope }) => {
    const fullColWidth = beats2Pixels(1 / quantizeMode, BPM);
    //console.log({ quantizeMode, colHilite, colWidth });

    const markerWidth = frame2pixel(noteMode == MODE.QUANTIZE ? envelope.length : 1);

    const left = noteMode == MODE.QUANTIZE ? fullColWidth * colHilite : colHilite;

    const style = { width: `${markerWidth}px`, left: `${left}px` };

    return colHilite !== -1 ? <div className={styles.colHilite} style={style}></div> : null;
};
export default ColHilite;
