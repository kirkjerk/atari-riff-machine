import React from 'react';

import RiffGrid from './RiffGrid';
// import DefaultKbdSoundMaps from './DefaultKbdSoundMaps.js';
import DefaultSoundSets from './DefaultSoundSets.js';

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
