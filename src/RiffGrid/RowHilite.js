import React from 'react';
import styles from './RiffGrid.module.css';
import { settings } from '../Utils.js';

const RowHilite = ({ rowHilite }) => {
    return rowHilite !== -1 ? (
        <div
            className={styles.rowHilite}
            style={{ height: `${settings.PixelsPerRow}px`, top: `${rowHilite * settings.PixelsPerRow}px` }}
        ></div>
    ) : null;
};
export default RowHilite;
