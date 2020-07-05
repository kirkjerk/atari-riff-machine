import React from 'react';
import styles from './ControlStackWrap.module.css';

const ControlStackWrap = (props) => (
    <div className={styles.wrapper}>
        {props.title && (
            <div>
                <b>{props.title}</b>
            </div>
        )}
        {props.children}
    </div>
);
export default ControlStackWrap;
