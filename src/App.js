import React from 'react';
const { useRef, useState } = React;

import RiffGrid from './RiffGrid/RiffGrid.js';
import RadioSet from './RiffGrid/RadioSet.js';

import { doBasicTemplateSingle, doBasicTemplateDouble } from './defs/templateBas.js';

// import SoundSetSelector from './RiffGrid/SoundSetSelector.js';
// // import DefaultKbdSoundMaps from './DefaultKbdSoundMaps.js';
import DefaultSoundSets from './defs/DefaultSoundSets.js';
// import { makeBatariMusic } from './RiffGrid/PlayBackHelper.js';

/*
TODO

    Getting burnt out - just barely started keyboard 
    recording. Think I might roll back the keyboard play in general. 
    didn't get up to quantizing. Really tired of having slightly bungeled 
    the two different tracks... everything should have been handled at the app level


--when envelope sound going and another key in, figure out how to stop or 

\-visual keyboard and drumpads


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
    const [isPlaying0, setIsPlaying0] = useState(false);
    const [isPlaying1, setIsPlaying1] = useState(false);

    const [batariChannel, setBatariChannel] = useState('both');
    const [batariCode, setBatariCode] = useState(null);

    const startDualPlayback = () => {
        childRef0.current.externalStartPlayback();
        childRef1.current.externalStartPlayback();
    };

    const show = (go0) => {
        let sum0 = 0;

        go0.split('\n').forEach((line) => {
            const parts = line.split(',');
            if (parts.length == 4) {
                const hold = parseInt(parts[3]);
                sum0 += hold;
                console.log(parts, 'to ', hold, sum0);
            }
        });
        console.log('sum0', sum0);
    };

    const makeBatariMusic = () => {
        //console.log(doBasicTemplateSingle(buf));console.log(doBasicTemplateSingle(buf));
        switch (batariChannel) {
            case 'both':
                /*const go0 = childRef0.current.externalGetBatari();
                const go1 = childRef1.current.externalGetBatari();
                show(go0);
                show(go1);*/

                setBatariCode(
                    doBasicTemplateDouble(childRef0.current.externalGetBatari(), childRef1.current.externalGetBatari())
                );
                break;
            case 'audc0':
                setBatariCode(doBasicTemplateSingle(childRef0.current.externalGetBatari()));
                break;
            case 'audc1':
                setBatariCode(doBasicTemplateSingle(childRef1.current.externalGetBatari()));
                break;
        }
    };

    const transform = () => {
        const newSet = [];
        const allPiano = {};
        DefaultSoundSets.forEach((blurp) => {
            const sounds = blurp.sounds;
            sounds.forEach((sound) => {
                const { t, f, p } = sound;
                //console.log({ t, f, p });
                if (p) {
                    const key = `${t}_${f}`;
                    allPiano[key] = p;
                }
            });
        });
        DefaultSoundSets.forEach((blurp) => {
            const newBlurp = { desc: blurp.desc, sounds: [] };

            const sounds = blurp.sounds;
            sounds.forEach((sound) => {
                const { t, f } = sound;
                const key = `${t}_${f}`;
                const newsound = allPiano[key] ? { t, f, p: allPiano[key] } : { t, f };
                newBlurp.sounds.push(newsound);
            });
            newSet.push(newBlurp);
        });

        console.log(JSON.stringify(newSet, null, ' '));
    };

    return (
        <React.Fragment>
            <div>
                {!isPlaying0 && !isPlaying1 && (
                    <button
                        onClick={() => {
                            childRef0.current.externalStartPlayback();
                            childRef1.current.externalStartPlayback();
                        }}
                    >
                        Start Playback
                    </button>
                )}
                {(isPlaying0 || isPlaying1) && (
                    <button
                        onClick={() => {
                            childRef0.current.externalStopPlayback();
                            childRef1.current.externalStopPlayback();
                        }}
                    >
                        End Playback
                    </button>
                )}

                <br />
                <RiffGrid
                    isFocused={whichHasFocus == 0}
                    getFocus={() => setWhichHasFocus(0)}
                    title="AUDC0"
                    ref={childRef0}
                    startingSoundSet={1}
                    isPlaying={isPlaying0}
                    setIsPlaying={setIsPlaying0}
                    startDualPlayback={startDualPlayback}
                />
                <br />
                <RiffGrid
                    isFocused={whichHasFocus == 1}
                    getFocus={() => setWhichHasFocus(1)}
                    title="AUDC1"
                    ref={childRef1}
                    startingSoundSet={2}
                    isPlaying={isPlaying1}
                    setIsPlaying={setIsPlaying1}
                    startDualPlayback={startDualPlayback}
                />
            </div>
            <button
                onClick={(e) => {
                    makeBatariMusic();
                }}
            >
                generate batari Basic code
            </button>
            <br />

            <RadioSet
                oneLine={true}
                selectedVal={batariChannel}
                setter={setBatariChannel}
                valToCaptions={{ both: 'both channels', audc0: 'audc0', audc1: 'audc1' }}
            />
            <br />
            <br />
            {batariCode && <textarea readOnly value={batariCode} />}
            {/* 
            <button
                onClick={() => {
                    transform();
                }}
            >
                do the thing{' '}
            </button> */}
        </React.Fragment>
    );
};

export default App;
