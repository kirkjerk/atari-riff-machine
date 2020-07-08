import { settings, frame2pixel, map } from '../Utils.js';
import React from 'react';
import styles from './RiffGrid.module.css';

const NoteBlocks = ({ notes, T_F2Row }) => {
    //console.log(T_F2Row);
    const blocks = Object.keys(notes).map((frame) => {
        //{"t":6,"f":21,"v":15,"p":"f1#","key":"g","frame":383,"row":6,"v":8}

        //console.log(notes);

        let { v, t, f } = notes[frame];

        const row = T_F2Row[`${t}_${f}`];

        //console.log(`row at ${row} for ${JSON.stringify({ v, t, f })} and ${JSON.stringify(T_F2Row)}`);

        //console.log(row);
        //debugger;
        if (isNaN(row)) return null;

        const rowTop = settings.PixelsPerRow * row;

        const offsetFromRowTop = map(v, 0, settings.AtariMaxVol, settings.PixelsPerRow / 2, 0);

        return (
            <div
                className={styles.note}
                key={frame}
                style={{
                    left: `${frame2pixel(frame)}px`,
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
