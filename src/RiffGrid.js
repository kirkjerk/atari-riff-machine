/*
TODO

-need idea of "env note" with ADSR - or fancyNote...

-erasing notes when painting...
-zebra bars and line up with keyboard shortcuts on grid

- when playing make sure it resets previous play through


-need to modify notesAreSame so it has different event for Volume Change in playback


-looping in js
-envelope sounds

*/

import React, { useState, useEffect } from 'react';

import styles from './RiffGrid.module.css';

import {
    settings,
    beats2Pixels,
    beats2Frames,
    pixel2frame,
    frame2pixel,
    map,
    frames2mills,
    useInterval,
} from './Utils.js';

import SoundCache from '/SoundCache.js';

const envelopes = {
    steadyHalfBeat: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    steadyQuarterBeat: [8, 8, 8, 8, 8, 8, 8, 8],
    quickRelease: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    slowRelease: [15, 15, 14, 14, 13, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1],
    quickReverse: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    slowReverse: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
};

const w = 500;

const x_y2index = (x, y) => {
    return y * w + x;
};
const index2x_y = (index) => {
    const x = index % w;
    const y = Math.floor(index / w);
    return { x, y };
};

const renderNoteBlocks = (notes) => {
    const blocks = Object.keys(notes).map((f) => {
        //{"t":6,"f":21,"v":15,"p":"f1#","key":"g","frame":383,"row":6,"v":8}
        let { row, v } = notes[f];

        const rowTop = settings.PixelsPerRow * row;

        const offsetFromRowTop = map(v, 0, settings.AtariMaxVol, settings.PixelsPerRow / 2, 0);

        return (
            <div
                className={styles.note}
                key={f}
                style={{
                    left: `${frame2pixel(f)}px`,
                    top: `${rowTop + offsetFromRowTop}px`,
                    width: `${frame2pixel(1)}px`,
                    height: `${v}px`,
                }}
            ></div>
        );
    });
    //console.log(blocks);
    return blocks;
};
const renderRowHilite = (rowHilite) => {
    return rowHilite !== -1 ? (
        <div
            className={styles.rowHilite}
            style={{ height: `${settings.PixelsPerRow}px`, top: `${rowHilite * settings.PixelsPerRow}px` }}
        ></div>
    ) : null;
};

const renderColHilite = (colHilite, soundLengthInFrames, quantizeMode, BPM) => {
    const colWidth = beats2Pixels(1 / quantizeMode, BPM);
    //console.log({ quantizeMode, colHilite, colWidth });
    return colHilite !== -1 ? (
        <div
            className={styles.colHilite}
            style={{ width: `${frame2pixel(soundLengthInFrames)}px`, left: `${colWidth * colHilite}px` }}
        ></div>
    ) : null;
};

const renderRowLabels = (soundSet) => {
    return soundSet.sounds.map((sound, index) => (
        <div
            key={`label${sound.f}_${sound.t}_${index}`}
            className={styles.rowLabel}
            style={{ top: `${index * settings.PixelsPerRow}px`, height: `${settings.PixelsPerRow}px` }}
        >
            {sound.key}
        </div>
    ));
};

const renderBeatLines = (totalBeats, measureLengthInBeasts, BPM) => {
    // fill array from 1 to beats - 1 so we can do a nice little map...
    const counts = Array.from(Array(totalBeats - 1), (_, i) => i + 1);
    return counts.map((b) => {
        const style = `${styles.beatLine} ${b % measureLengthInBeasts === 0 ? styles.measureLine : ''}`;
        return <div className={style} style={{ left: `${beats2Pixels(b, BPM)}px` }} key={b}></div>;
    });
};

const primeSoundCache = (soundSet) => {
    SoundCache.loadSoundsForMap(soundSet);
};

const y2Row = (y) => {
    return Math.floor(y / settings.PixelsPerRow);
};
const x2Col = (x, quantizeMode, BPM) => {
    const colWidthInFrames = beats2Pixels(1 / quantizeMode, BPM);
    return Math.floor(x / colWidthInFrames);
};

const launchPlayback = (origNotes, totalBeats, BPM) => {
    const notes = {};

    //need to make a deep copy of origNotes, otherwise references
    //are messing up our source material

    Object.keys(origNotes).forEach((key) => {
        const note = origNotes[key];
        notes[key] = { ...note };
    });

    let currentlyPlayingTFV = null;
    const notesWithStartAndEnd = [];

    //go over every frame
    for (let i = 0; i < beats2Frames(totalBeats, BPM); i++) {
        const thisFrameTFV = notes[i]; //grab this

        if (i < 6) console.log({ i, thisFrameTFV });

        if (!notesAreSameTFV(thisFrameTFV, currentlyPlayingTFV, i)) {
            //OK WE ARE STARTING A NEW NOTE OF SOME SORT (MAYBE JUST VOLUME CHANGE)
            if (currentlyPlayingTFV) {
                //IF THERE WAS A THING PLAYING, WE EITHER MODIFY IT
                if (notesDifferOnlyInV(thisFrameTFV, currentlyPlayingTFV)) {
                    if (!currentlyPlayingTFV.volChange) currentlyPlayingTFV.volChange = [];
                    currentlyPlayingTFV.volChange.push({ frame: i, v: thisFrameTFV.v });
                    currentlyPlayingTFV.v = thisFrameTFV.v;
                } else {
                    //new note so end what was playing before
                    console.log(`frame ${i} ending this one`, currentlyPlayingTFV);
                    currentlyPlayingTFV.endFrame = i - 1;
                    notesWithStartAndEnd.push(currentlyPlayingTFV);

                    if (thisFrameTFV) {
                        console.log(`looking at frame ${i} we grab start frame because chnging note`);
                        thisFrameTFV.startFrame = i;
                        thisFrameTFV.startV = thisFrameTFV.v;
                        thisFrameTFV.volChange = null;
                    }
                    currentlyPlayingTFV = thisFrameTFV;
                }
            } else {
                //notes are differe, nothing previous playing
                if (thisFrameTFV) {
                    console.log(`looking at frame ${i} we grab start frame because no currently playing note`);
                    thisFrameTFV.startFrame = i;
                    thisFrameTFV.startV = thisFrameTFV.v;
                    thisFrameTFV.volChange = null;
                }
                currentlyPlayingTFV = thisFrameTFV;
            }

            if (currentlyPlayingTFV) {
                console.log(`frame ${i} currentlyPlayingTFV.startFrame is ${currentlyPlayingTFV.startFrame}`);
            }
        }
    }
    if (currentlyPlayingTFV) {
        currentlyPlayingTFV.endFrame = beats2Frames(totalBeats, BPM) - 1;
        notesWithStartAndEnd.push(currentlyPlayingTFV);
    }
    console.log(notes);
    console.log(notesWithStartAndEnd);

    notesWithStartAndEnd.forEach((note) => {
        setTimeout(() => {
            SoundCache.playByTFV(note.t, note.f, note.startV);
        }, frames2mills(note.startFrame));

        if (note.volChange) {
            note.volChange.forEach((change) => {
                setTimeout(() => {
                    SoundCache.changeVolByTFV(note.t, note.f, change.v);
                }, frames2mills(change.frame));
            });
        }

        setTimeout(() => {
            SoundCache.stopByTF(note.t, note.f);
        }, frames2mills(note.endFrame));
    });
};

const notesAreSameTFV = (noteA, noteB, i) => {
    // console.log(i, noteA, 'vs', noteB);
    if (noteA == null && noteB == null) return true;
    if (noteA == null && noteB != null) return false;
    if (noteA != null && noteB == null) return false;

    return noteA.t == noteB.t && noteA.f == noteB.f && noteA.v == noteB.v;
};

const notesDifferOnlyInV = (noteA, noteB) => {
    // console.log(i, noteA, 'vs', noteB);
    if (noteA == null && noteB == null) return false;
    if (noteA == null && noteB != null) return false;
    if (noteA != null && noteB == null) return false;

    return noteA.t == noteB.t && noteA.f == noteB.f && noteA.v != noteB.v;
};

const MODE = {
    FREEPAINT: 'freepaint',
    QUANTIZE: 'quantize',
};
const QUANT = {
    WHOLEBEAT: 1,
    HALFBEAT: 2,
    THIRDBEAT: 3,
    QUARTERBEAT: 4,
};

const RiffGrid = ({ soundSet }) => {
    //red hilite bar position
    const [rowHilite, setRowHilite] = useState(-1);
    //red coloumn bar
    const [colHilite, setColHilite] = useState(-1);
    // current set of notes at specific frames
    const [notes, setNotes] = useState({});
    //how long the whole thing is
    const [totalBeats, setTotalBeats] = useState(4);
    //how often to draw measure markers
    const [measureLengthInBeasts, setMeasureLengthInBeats] = useState(4);
    //immediate sound when mousing down
    const [currrentlyPlayingSound, setCurrrentlyPlayingSound] = React.useState(null);

    const [timePointer, setTimePointer] = React.useState(0);
    const [isPlaying, setIsPlaying] = React.useState(false);

    const [BPM, setBPM] = React.useState(120);

    const [noteMode, setNoteMode] = React.useState(MODE.QUANTIZE);
    const [quantizeMode, setQuantizeMode] = React.useState(QUANT.HALFBEAT);

    const [soundLengthInFrames, setSoundLengthInFrames] = React.useState(30);

    const [currentEnvelope, setCurrentEnvelope] = React.useState('quickRelease');

    useEffect(() => primeSoundCache(soundSet), [soundSet]);

    const TFcount = soundSet.sounds.length;
    const gridHeight = TFcount * settings.PixelsPerRow;

    const directStyle = {
        width: `${beats2Pixels(totalBeats, BPM)}px`,
        height: `${gridHeight}px`,
    };

    const handleMouseMove = (e) => {
        const { offsetX: x, offsetY: y, movementX, movementY, buttons } = e.nativeEvent;

        const prevX = x - movementX;
        const prevY = y - movementY;

        if (y < 0) return;

        const row = y2Row(y);
        const prevRow = y2Row(prevY);
        setRowHilite(row);

        if (noteMode == MODE.QUANTIZE) {
            const col = x2Col(x, quantizeMode, BPM);
            setColHilite(col);
        } else {
            setColHilite(-1);
        }

        const frame = pixel2frame(x);

        const newSound = soundSet.sounds[row];
        if (noteMode === MODE.FREEPAINT) {
            if (buttons) {
                const note = { ...newSound, row, v: 8 };
                const notesClone = { ...notes };

                // this used to be a simple
                //    notesClone[frame] = note;
                // but we were missing spaces... we are going to
                // grind through 100 spots between start and end
                // and make sure it's painted in...
                if (row !== prevRow) {
                    //ehh if they're skipping rows screw 'em, they just get this
                    notesClone[frame] = note;
                }
                for (let i = 0; i <= 100; i++) {
                    const checkX = parseInt(map(i, 0, 100, prevX, x));
                    const checkFrame = pixel2frame(checkX);
                    notesClone[checkFrame] = note;
                }
                setNotes(notesClone);
                startOrContinueCurrentlyPlayingSound(newSound);
            } else {
                stopAnyCurrentlyPlayingSound();
            }
        }
    };

    const handleMouseDown = (e) => {
        const { offsetX: x, offsetY: y, buttons } = e.nativeEvent;
        if (noteMode === MODE.QUANTIZE && buttons) {
            const row = y2Row(y);
            const newSound = soundSet.sounds[row];
            const note = { ...newSound, row, v: 8 };
            const notesClone = { ...notes };
            const frameStart = x2Col(x, quantizeMode, BPM) * beats2Frames(1 / quantizeMode, BPM);

            console.log(beats2Frames(0.5, 120));

            // for (let i = 0; i <= 60; i++) {
            //     const v = Math.round((i + 2) / 4);
            //     const noteWithVol = { ...note, v };
            //     notesClone[frameStart + i] = noteWithVol;
            // }

            const envelope = envelopes[currentEnvelope];

            for (let i = 0; i < envelope.length; i++) {
                const noteWithVol = { ...note, v: envelope[i] };
                notesClone[frameStart + i] = noteWithVol;
            }

            setNotes(notesClone);
            playSoundInEnvelopeNow(newSound, envelope);
        }
    };

    //oof intervals and react don't play too well together -- I had to jam this here
    // https://overreacted.io/making-setinterval-declarative-with-react-hooks/
    useInterval(() => {
        // Your custom logic here
        setTimePointer(timePointer + 1);
    }, frames2mills(1));

    const startOrContinueCurrentlyPlayingSound = (newSound) => {
        if (currrentlyPlayingSound && newSound != currrentlyPlayingSound) {
            SoundCache.stopSound(currrentlyPlayingSound);
        }
        setCurrrentlyPlayingSound(newSound);
        SoundCache.playSound(newSound);
    };

    const stopAnyCurrentlyPlayingSound = () => {
        if (currrentlyPlayingSound) {
            SoundCache.stopSound(currrentlyPlayingSound);
            setCurrrentlyPlayingSound(null);
        }
    };

    const playSoundInEnvelopeNow = (note, envelope) => {
        setTimeout(() => {
            SoundCache.playByTFV(note.t, note.f, envelope[0]);
        }, frames2mills(0));
        for (let i = 1; i < envelope.length; i++) {
            setTimeout(() => {
                SoundCache.changeVolByTFV(note.t, note.f, envelope[i]);
            }, frames2mills(i));
        }
        setTimeout(() => {
            SoundCache.stopByTF(note.t, note.f);
        }, frames2mills(envelope.length));
    };

    //console.log(soundMap); //sound_06_25.wav

    return (
        <div>
            <label>
                Riff Length in Beats:{' '}
                <input className={styles.short} value={totalBeats} onChange={(e) => setTotalBeats(e.target.value)} />
            </label>
            <label>
                BPM: <input className={styles.short} value={BPM} onChange={(e) => setBPM(e.target.value)} />
            </label>

            <button
                onClick={() => {
                    launchPlayback(notes, totalBeats, BPM);
                    setTimePointer(0);
                    setIsPlaying(true);
                }}
            >
                play
            </button>
            <div
                style={directStyle}
                onMouseMove={(e) => {
                    handleMouseMove(e, setRowHilite);
                }}
                onMouseDown={(e) => {
                    handleMouseMove(e, setRowHilite);
                    if (noteMode === MODE.QUANTIZE) {
                        handleMouseDown(e);
                    }
                }}
                onMouseUp={() => {
                    stopAnyCurrentlyPlayingSound();
                }}
                onMouseOut={() => {
                    stopAnyCurrentlyPlayingSound();
                    setRowHilite(-1);
                    setColHilite(-1);
                }}
                className={styles.grid}
            >
                {renderRowLabels(soundSet)}
                {renderRowHilite(rowHilite)}
                {noteMode == MODE.QUANTIZE && renderColHilite(colHilite, soundLengthInFrames, quantizeMode, BPM)}
                {renderBeatLines(totalBeats, measureLengthInBeasts, BPM)}
                {renderNoteBlocks(notes)}
                {isPlaying && <div className={styles.timePointer} style={{ left: `${timePointer}px` }}></div>}
                {/* {renderGhost(rowHilite)} */}
            </div>
            {
                <label>
                    Note Length (in Frames)
                    <input
                        className={styles.short}
                        value={soundLengthInFrames}
                        onChange={(e) => setSoundLengthInFrames(e.target.value)}
                    />
                </label>
            }
            <div>
                <label>
                    <input
                        onChange={() => setNoteMode(MODE.FREEPAINT)}
                        type="radio"
                        checked={noteMode == MODE.FREEPAINT}
                    />
                    {MODE.FREEPAINT}
                </label>
                <br />
                <label>
                    <input
                        onChange={() => setNoteMode(MODE.QUANTIZE)}
                        type="radio"
                        checked={noteMode == MODE.QUANTIZE}
                    />
                    {MODE.QUANTIZE} to:
                </label>
                <RadioSet
                    selectedVal={quantizeMode}
                    setter={setQuantizeMode}
                    valToCaptions={{
                        [QUANT.WHOLEBEAT]: 'beat',
                        [QUANT.HALFBEAT]: '1/2 beat',
                        [QUANT.THIRDBEAT]: '1/3 beat',
                        [QUANT.QUARTERBEAT]: '1/4 beat',
                    }}
                />
                <RadioSet
                    selectedVal={currentEnvelope}
                    setter={setCurrentEnvelope}
                    valToCaptions={{
                        steadyHalfBeat: 'steadyHalfBeat',
                        steadyQuarterBeat: 'steadyHalfBeat',
                        quickRelease: 'quickRelease',
                        slowRelease: 'slowRelease',
                        quickReverse: 'quickReverse',
                        slowReverse: 'slowReverse',
                    }}
                />
            </div>
        </div>
    );
};

const RadioSet = ({ selectedVal, setter, valToCaptions }) => {
    return Object.keys(valToCaptions).map((val) => {
        const caption = valToCaptions[val];
        return (
            <label key={val}>
                <input onChange={() => setter(val)} type="radio" checked={val == selectedVal} />
                {caption}
            </label>
        );
    });
};

export default RiffGrid;

// if (envelope == 'release') {
//     const steadyHalfBeat = [];
//     const steadyQuarterBeat = [];
//     const quickRelease = [];
//     const slowRelease = [];
//     const quickReverse = [];
//     const slowReverse = [];

//     for (let i = 0; i < 15; i++) {
//         const v = 15 - i;
//         const noteWithVol = { ...note, v };
//         notesClone[frameStart + i] = noteWithVol;
//         quickRelease.push(v);
//         slowRelease.push(v);
//         slowRelease.push(v);
//         quickReverse.push(16 - v);
//         slowReverse.push(16 - v);
//         slowReverse.push(16 - v);
//         steadyHalfBeat.push(8);
//         if (i < 8) steadyQuarterBeat.push(8);
//     }
//     const envelopes = {
//         steadyHalfBeat,
//         steadyQuarterBeat,
//         quickRelease,
//         slowRelease,
//         quickReverse,
//         slowReverse,
//     };
//     console.log(JSON.stringify(envelopes));
