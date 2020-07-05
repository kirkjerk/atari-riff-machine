import React from 'react';
import styles from './RiffGrid.module.css';

import { settings } from '../Utils.js';

const RowLabel = ({ sound, index, isPressed }) => (
    <div
        className={`${styles.rowLabel} ${isPressed ? styles.rowLabelPressed : ''}`}
        style={{ top: `${index * settings.PixelsPerRow}px`, height: `${settings.PixelsPerRow}px` }}
    >
        <div>{sound.key}</div>
        <div>
            <b>{sound.t}</b> {sound.f}
        </div>
    </div>
);
const RowLabels = ({ soundSet, keyCurrentlyPressed }) => {
    return soundSet.sounds.map((sound, index) => {
        const isPressed = keyCurrentlyPressed == sound.key;
        return (
            <RowLabel
                isPressed={isPressed}
                key={`label${sound.f}_${sound.t}_${index}`}
                sound={sound}
                index={index}
            ></RowLabel>
        );
    });
};
export default RowLabels;
