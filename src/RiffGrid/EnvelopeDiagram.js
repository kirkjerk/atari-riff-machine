import React from 'react';
import styles from './RiffGrid.module.css';

import { settings } from '../Utils.js';

const EnvelopeDiagram = ({ env }) => {
    return (
        <div
            className={styles.envDiagram}
            style={{ height: `${settings.AtariMaxVol}px`, width: `${env.length * settings.PixelsPerFrame}px` }}
        >
            {env.map((v, i) => (
                <div key={i} style={{ height: `${v}px` }}></div>
            ))}
        </div>
    );
};
export default EnvelopeDiagram;
