import React from 'react';
const { useRef, useState } = React;

import RiffGrid from './RiffGrid/RiffGrid.js';
import SoundSetSelector from './RiffGrid/SoundSetSelector.js';
// import DefaultKbdSoundMaps from './DefaultKbdSoundMaps.js';
import DefaultSoundSets from './defs/DefaultSoundSets.js';

/*
TODO

--when envelope sound going and another key in, figure out how to stop or 

\-visual keyboard and drumpads

-zebra bars rows and line up with keyboard shortcuts on grid?

- when playing make sure it resets previous play through

-looping in js

-second riff, with playback controlled from parent

*/

const App = () => {
    // const newForm = DefaultKbdSoundMaps.map((wholeMap) => {
    //     let hasPiano = false;
    //     const { desc, keyboard, key2tfm } = wholeMap;
    //     const sounds = Object.keys(key2tfm)
    //         .reverse()
    //         .map((key) => {
    //             const tfm = key2tfm[key];
    //             if (tfm.p) hasPiano = true;
    //             tfm.key = key;
    //             return tfm;
    //         });
    //     return { desc, keyboard, hasPiano, sounds };
    // });
    // console.log(newForm);
    // console.log(JSON.stringify(newForm, null, ' '));

    const childRef0 = useRef();
    const childRef1 = useRef();

    const [whichHasFocus, setWhichHasFocus] = useState(0);

    return (
        <React.Fragment>
            <button
                onClick={() => {
                    childRef0.current.externalTogglePlayback();
                    childRef1.current.externalTogglePlayback();
                }}
            >
                Toggle All Playback
            </button>
            <br />
            <RiffGrid
                isFocused={whichHasFocus == 0}
                getFocus={() => setWhichHasFocus(0)}
                title="AUD*0"
                ref={childRef0}
                startingSoundSet={2}
            />
            <br />
            <RiffGrid
                isFocused={whichHasFocus == 1}
                getFocus={() => setWhichHasFocus(1)}
                title="AUD*1"
                ref={childRef1}
                startingSoundSet={2}
            />
        </React.Fragment>
    );
};

export default App;
