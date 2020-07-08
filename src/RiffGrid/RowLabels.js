import React from 'react';
import styles from './RiffGrid.module.css';

import { settings } from '../Utils.js';

const RowLabel = ({ sound, index, isPressed, keyboardKey }) => (
    <div
        className={`${styles.rowLabel} ${isPressed ? styles.rowLabelPressed : ''}`}
        style={{ top: `${index * settings.PixelsPerRow}px`, height: `${settings.PixelsPerRow}px` }}
    >
        <div>{keyboardKey}</div>
        <div>
            <b>{sound.t}</b> {sound.f}
        </div>
    </div>
);
const RowLabels = ({ rows2Sound, keyboardToNote, keyCurrentlyPressed }) => {
    const noteToKeyboard = Object.keys(keyboardToNote).reduce((ret, key) => {
        const tf = keyboardToNote[key];
        ret[`${tf.t}_${tf.f}`] = key;
        return ret;
    }, {});

    return rows2Sound.map((sound, index) => {
        const isPressed = keyCurrentlyPressed == sound.key;
        return (
            <RowLabel
                isPressed={isPressed}
                key={`label${sound.f}_${sound.t}_${index}`}
                sound={sound}
                keyboardKey={noteToKeyboard[`${sound.t}_${sound.f}`]}
                index={index}
            ></RowLabel>
        );
    });
};
export default RowLabels;
