import React, { useState, useEffect } from 'react';

import styles from './RiffGrid.module.css';

import {
    settings,
    beats2Pixels,
    beats2Frames,
    pixel2frame,
    map,
    frames2mills,
    useInterval,
    MODE,
    QUANT,
} from '../Utils.js';

import RadioSet from './RadioSet.js';
import NoteBlocks from './NoteBlocks.js';
import RowLabels from './RowLabels.js';
import BeatLines from './BeatLines.js';
import ColHilite from './ColHilite.js';
import RowHilite from './RowHilite.js';

import { launchPlayback } from './PlayBackHelper.js';

import SoundCache from '../SoundCache/SoundCache.js';

import envelopes from '../defs/envelopes.js';

const w = 500;

const primeSoundCache = (soundSet, setKeyboardToNote) => {
    SoundCache.loadSoundsForMap(soundSet);
    console.log(soundSet);
    const keyToNote = {};
    console.log(soundSet);
    soundSet.sounds.forEach((sound) => {
        keyToNote[sound.key] = sound;
    });
    setKeyboardToNote(keyToNote);
};

const y2NoteRow = (y) => {
    return Math.floor(y / settings.PixelsPerRow);
};
const x2BeatCol = (x, quantizeMode, BPM) => {
    const colWidthInFrames = beats2Pixels(1 / quantizeMode, BPM);
    return Math.floor(x / colWidthInFrames);
};

const diagramForEnvelope = (env) => {
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

const RiffGrid = ({ soundSet }) => {
    //red hilite bar position
    const [rowHilite, setRowHilite] = useState(-1);
    //red coloumn bar
    const [colHilite, setColHilite] = useState(-1);
    // current set of notes at specific frames
    const [notes, setNotes] = useState({});
    //how long the whole thing is
    const [totalBeats, setTotalBeats] = useState(16);
    //how often to draw measure markers
    const [measureLengthInBeasts, setMeasureLengthInBeats] = useState(4);
    //immediate sound when mousing down
    const [currrentlyPlayingSound, setCurrrentlyPlayingSound] = React.useState(null);

    const [timePointer, setTimePointer] = React.useState(0);
    const [isPlaying, setIsPlaying] = React.useState(false);

    const [BPM, setBPM] = React.useState(120);

    const [noteMode, setNoteMode] = React.useState(MODE.FREEHAND);
    const [quantizeMode, setQuantizeMode] = React.useState(QUANT.HALFBEAT);

    const [currentEnvelope, setCurrentEnvelope] = React.useState('quickRelease');

    const [keyCurrentlyPressed, setKeyCurrentlyPressed] = React.useState(null);
    const [keyboardToNote, setKeyboardToNote] = React.useState({});

    useEffect(() => primeSoundCache(soundSet, setKeyboardToNote), [soundSet]);

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

        const row = y2NoteRow(y);
        const prevRow = y2NoteRow(prevY);
        setRowHilite(row);

        if (noteMode == MODE.QUANTIZE) {
            const col = x2BeatCol(x, quantizeMode, BPM);
            setColHilite(col);
        } else {
            setColHilite(x);
        }

        const frame = pixel2frame(x);

        const newSound = soundSet.sounds[row];
        if (noteMode === MODE.FREEHAND) {
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

    const handleKeyDown = (e, keyboardToNote, noteMode, envelope, setKeyCurrentlyPressed, soundSet, setRowHilite) => {
        setKeyCurrentlyPressed(e.key);

        setRowHilite(soundSet.sounds.findIndex((note) => note.key == e.key));

        const note = keyboardToNote[e.key];
        if (note) {
            if (noteMode == MODE.QUANTIZE) {
                //stopAnyCurrentlyPlayingSound();
                playSoundInEnvelopeNow(note, envelope);
            } else {
                startOrContinueCurrentlyPlayingSound(note);
            }
        }
    };

    const handleKeyUp = (e, setKeyCurrentlyPressed, setRowHilite) => {
        setKeyCurrentlyPressed(null);
        setRowHilite(-1);
        stopAnyCurrentlyPlayingSound();
    };

    const handleMouseDown = (e) => {
        const { offsetX: x, offsetY: y, buttons } = e.nativeEvent;
        if (noteMode === MODE.QUANTIZE && buttons) {
            const row = y2NoteRow(y);
            const newSound = soundSet.sounds[row];
            const note = { ...newSound, row, v: 8 };
            const notesClone = { ...notes };
            const frameStart = x2BeatCol(x, quantizeMode, BPM) * beats2Frames(1 / quantizeMode, BPM);

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

    const envelopeToDiagram = {};
    Object.keys(envelopes).map((key) => {
        envelopeToDiagram[key] = diagramForEnvelope(envelopes[key]);
    });

    return (
        <div
            className={styles.riffMachine}
            onKeyDown={(e) =>
                handleKeyDown(
                    e,
                    keyboardToNote,
                    noteMode,
                    envelopes[currentEnvelope],
                    setKeyCurrentlyPressed,
                    soundSet,
                    setRowHilite
                )
            }
            onKeyUp={(e) => handleKeyUp(e, setKeyCurrentlyPressed, setRowHilite)}
            tabIndex="0"
        >
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
                {/* soundSet={soundSet} keyCurrentlyPressed={keyCurrentlyPressed} */}
                <RowLabels {...{ soundSet, keyCurrentlyPressed }} />
                <RowHilite {...{ rowHilite }} />
                <ColHilite {...{ colHilite, quantizeMode, BPM, noteMode }} envelope={currentEnvelope} />
                <BeatLines {...{ totalBeats, measureLengthInBeasts, BPM }} />
                <NoteBlocks {...{ notes }} />
                {isPlaying && <div className={styles.timePointer} style={{ left: `${timePointer}px` }}></div>}
                {/* {renderGhost(rowHilite)} */}
            </div>

            <div>
                <label>
                    <input
                        onChange={() => setNoteMode(MODE.FREEHAND)}
                        type="radio"
                        checked={noteMode == MODE.FREEHAND}
                    />
                    {MODE.FREEHAND}
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
                <br />
                envelope:
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <RadioSet
                        selectedVal={currentEnvelope}
                        setter={setCurrentEnvelope}
                        valToCaptions={envelopeToDiagram}
                    />
                </div>
            </div>
        </div>
    );
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
