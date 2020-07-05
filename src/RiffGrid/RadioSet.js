import React from 'react';
import styles from './RadioSet.module.css';

const RadioSet = ({ selectedVal, setter, valToCaptions }) => {
    return Object.keys(valToCaptions).map((val) => {
        const caption = valToCaptions[val];
        return (
            <label className={styles.radioLabel} key={val}>
                <input onChange={() => setter(val)} type="radio" checked={val == selectedVal} />
                &nbsp;
                {caption}&nbsp;&nbsp;
            </label>
        );
    });
};
export default RadioSet;
