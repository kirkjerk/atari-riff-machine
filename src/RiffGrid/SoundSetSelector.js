import React from 'react';

const SoundSetSelector = ({ selectedVal, setter, soundSet }) => {
    return (
        <select
            onChange={(e) => {
                setter(e.target.value);
            }}
            value={selectedVal}
        >
            {soundSet.map((val, i) => {
                return (
                    <option key={i} value={i}>
                        {val.desc}
                    </option>
                );
            })}
        </select>
    );
};
export default SoundSetSelector;
