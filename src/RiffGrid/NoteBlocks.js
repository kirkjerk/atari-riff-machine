import { settings, frame2pixel, map } from '../Utils.js';
import React from 'react';
import styles from './RiffGrid.module.css';

const NoteBlocks = ({ notes }) => {
    const blocks = Object.keys(notes).map((f) => {
        //{"t":6,"f":21,"v":15,"p":"f1#","key":"g","frame":383,"row":6,"v":8}
        let { row, v } = notes[f];

        const rowTop = settings.PixelsPerRow * row;

        const offsetFromRowTop = map(v, 0, settings.AtariMaxVol, settings.PixelsPerRow / 2, 0);

        return (
            <div
                className={styles.note}
                key={f}
                style={{
                    left: `${frame2pixel(f)}px`,
                    top: `${rowTop + offsetFromRowTop}px`,
                    width: `${frame2pixel(1)}px`,
                    height: `${v}px`,
                }}
            ></div>
        );
    });
    //console.log(blocks);
    return blocks;
};
export default NoteBlocks;
