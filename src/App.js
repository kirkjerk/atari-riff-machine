import React from 'react';

import RiffGrid from './RiffGrid/RiffGrid.js';
// import DefaultKbdSoundMaps from './DefaultKbdSoundMaps.js';
import DefaultSoundSets from './defs/DefaultSoundSets.js';

/*
TODO
//fix moving bar... might have to recibrate rather than increment x... ***maybve even less often***
-erasing notes when painting...

-zebra bars rows and line up with keyboard shortcuts on grid

- when playing make sure it resets previous play through



-looping in js

-display of envelopes for selection...

-generation of bB code!

-second riff, with playback controlled from parent

*/

class App extends React.Component {
    render() {
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

        return <RiffGrid soundSet={DefaultSoundSets[0]} />;
    }
}

export default App;
