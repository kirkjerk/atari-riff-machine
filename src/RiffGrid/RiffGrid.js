import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import styles from './RiffGrid.module.css';

import {
    settings,
    beats2Pixels,
    beats2Frames,
    pixel2frame,
    map,
    beats2millis,
    frames2mills,
    MODE,
    QUANT,
    millis2frames,
} from '../Utils.js';

import RadioSet from './RadioSet.js';
import ControlStackWrap from './ControlStackWrap.js';
import NoteBlocks from './NoteBlocks.js';
import RowLabels from './RowLabels.js';
import BeatLines from './BeatLines.js';
import ColHilite from './ColHilite.js';
import RowHilite from './RowHilite.js';
import SoundSetSelector from './SoundSetSelector.js';
import EnvelopeDiagram from './EnvelopeDiagram.js';
import CurrentTimePointer from './CurrentTimePointer.js';

import { launchPlayback, setShouldRepeat, makeBatariMusic } from './PlayBackHelper.js';

import SoundCache from '../SoundCache/SoundCache.js';

import envelopes from '../defs/envelopes.js';

import DefaultSoundSets from '../defs/defaultSoundSets.js';

const w = 500;

const primeSoundCache = (soundSet, setKeyboardToNote) => {
    // console.log(`LOADING SOUNDS FOR "${JSON.stringify(soundSet)}"`);
    SoundCache.loadSoundsForMap(soundSet);
    // console.log(soundSet);
    const keyToNote = {};
    // console.log(soundSet);
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

const RiffGrid = forwardRef(
    ({ startingSoundSet, title, isFocused, getFocus, isPlaying, setIsPlaying, startDualPlayback }, ref) => {
        //red hilite bar position
        const [rowHilite, setRowHilite] = useState(-1);
        //red coloumn bar
        const [colHilite, setColHilite] = useState(-1);
        // current set of notes at specific frames
        const [notes, setNotes] = useState(
            localStorage.getItem(`notes_${title}`) ? JSON.parse(localStorage.getItem(`notes_${title}`)) : {}
        );
        //how long the whole thing is
        const [totalBeats, setTotalBeats] = useState(
            localStorage.getItem(`totalbeats_${title}`) ? JSON.parse(localStorage.getItem(`totalbeats_${title}`)) : 16
        );
        //how often to draw measure markers
        const [measureLengthInBeasts, setMeasureLengthInBeats] = useState(4);
        //immediate sound when mousing down
        const [currrentlyPlayingSound, setCurrrentlyPlayingSound] = React.useState(null);
        const [currrentlyPlayingEnvelopeSound, setCurrrentlyPlayingEnvelopeSound] = React.useState(null);
        const [currrentlyPlayingEnvelopeTimeouts, setCurrrentlyPlayingEnvelopeTimeouts] = React.useState([]);

        const [BPM, setBPM] = React.useState(120);

        const [noteAlignMode, setNoteAlignMode] = React.useState(MODE.QUANTIZE);
        const [quantizeMode, setQuantizeMode] = React.useState(QUANT.WHOLEBEAT);

        const [currentEnvelope, setCurrentEnvelope] = React.useState('slowRelease');

        const [keyCurrentlyPressed, setKeyCurrentlyPressed] = React.useState(null);
        const [keyboardToNote, setKeyboardToNote] = React.useState({});

        const [drawEraseMode, setDrawEraseMode] = React.useState('draw');

        const [playbackStartingTime, setPlaybackStartingTime] = React.useState(0);

        const [currentSoundSetIndex, setCurrentSoundSetIndex] = React.useState(startingSoundSet);

        const [rowForT_F, setRowForT_F] = React.useState({});
        const [soundForRow, setSoundForRow] = React.useState([]);

        const [isRecording, setIsRecording] = React.useState(false);
        const [recordingStartTime, setRecordingStartTime] = React.useState(0);

        useEffect(() => {
            setAndLoadSoundset(currentSoundSetIndex);
            SoundCache.loadRecordingSounds();
        }, [startingSoundSet]);

        const TFcount = Object.keys(soundForRow).length;
        const gridHeight = TFcount * settings.PixelsPerRow;

        const setNotesAndStore = (notes) => {
            setNotes(notes);
            localStorage.setItem(`notes_${title}`, JSON.stringify(notes));
        };
        const setTotalBeatsAndStore = (beats) => {
            setTotalBeats(beats);
            localStorage.setItem(`totalbeats_${title}`, JSON.stringify(beats));
        };

        //we will be preserving rows for the old ones if they still have notes in play
        const setAndLoadSoundset = (soundIndex) => {
            setCurrentSoundSetIndex(soundIndex);
            const newSoundSet = DefaultSoundSets[soundIndex];

            const newTF2Row = {};
            const newRow2Sound = [];

            //so if we have TFs from rows that aren't in the current sound set add them to end
            const TFsAlsoNeeded = {};

            Object.keys(notes).forEach((frame) => {
                const sound = notes[frame];
                TFsAlsoNeeded[`${sound.t}_${sound.f}`] = sound;
            });

            let rowIndex = 0;

            newSoundSet.sounds.forEach((sound) => {
                const T_F = `${sound.t}_${sound.f}`;
                newTF2Row[T_F] = rowIndex;
                newRow2Sound[rowIndex] = sound;
                delete TFsAlsoNeeded[T_F];
                rowIndex++;
            });

            Object.keys(TFsAlsoNeeded).forEach((T_F) => {
                //const sound = TFsAlsoNeeded[t_f];
                //const T_F = `${sound.t}_${sound.f}`;
                //console.log(T_F);
                newTF2Row[T_F] = rowIndex;
                newRow2Sound[rowIndex] = TFsAlsoNeeded[T_F];
                rowIndex++;
            });

            setRowForT_F(newTF2Row);
            setSoundForRow(newRow2Sound);
            // console.log(notes);
            setNotesAndStore({ ...notes });
            primeSoundCache(newSoundSet, setKeyboardToNote);
        };

        const launchRecording = () => {
            for (let i = 4; i >= 1; i--) {
                setTimeout(() => SoundCache.playSayNum(i), beats2millis(4 - i, BPM));
            }
            console.log(`THENISH ${Date.now()}`);
            setTimeout(() => {
                setIsRecording(true);
                console.log(`NOWISH ${Date.now()}`);
                setRecordingStartTime(Date.now());
                startDualPlayback();
            }, beats2millis(4, BPM));
        };

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

            if (noteAlignMode == MODE.QUANTIZE) {
                const col = x2BeatCol(x, quantizeMode, BPM);
                setColHilite(col);
            } else {
                setColHilite(x);
            }

            const frame = pixel2frame(x);

            const newSound = soundForRow[row];

            if (noteAlignMode === MODE.FREEHAND) {
                if (buttons) {
                    const note = { ...newSound };

                    // this used to be a simple
                    //    notesClone[frame] = note;
                    // but we were missing spaces... we are going to
                    // grind through 100 spots between start and end
                    // and make sure it's painted in...
                    if (row !== prevRow) {
                        //ehh if they're skipping rows/changing notes screw 'em, they just get this
                        setNotesAndStore(newNoteSetApplyingNoteWithEnvelope(notes, note, frame));
                    }
                    let existingNotes = { ...notes };
                    for (let i = 0; i <= 100; i++) {
                        const checkX = parseInt(map(i, 0, 100, prevX, x));
                        const checkFrame = pixel2frame(checkX);
                        existingNotes = newNoteSetApplyingNoteWithEnvelope(existingNotes, note, checkFrame);
                    }
                    setNotesAndStore(existingNotes);
                    if (drawEraseMode != 'erase') startOrContinueCurrentlyPlayingSound(newSound);
                } else {
                    stopAnyCurrentlyPlayingSound();
                }
            }
        };

        const handleKeyDown = (e) => {
            setKeyCurrentlyPressed(e.key);
            const note = keyboardToNote[e.key];
            if (note) handleNoteStart(note);
        };
        const handleNoteStart = (note) => {
            const envelope = envelopes[currentEnvelope];
            const soundSet = DefaultSoundSets[currentSoundSetIndex];
            setRowHilite(soundSet.sounds.findIndex((soundsnote) => soundsnote.t == note.t && soundsnote.f == note.f));

            if (noteAlignMode == MODE.QUANTIZE) {
                //stopAnyCurrentlyPlayingSound();

                if (isRecording) {
                    const addNote = { ...note };
                    const frameStart = Math.round(millis2frames(Date.now() - recordingStartTime));

                    // console.log(frameStart, x2BeatCol(x, quantizeMode, BPM), beats2Frames(1 / quantizeMode, BPM));
                    console.log(newNoteSetApplyingNoteWithEnvelope(notes, addNote, frameStart));
                    setNotesAndStore(newNoteSetApplyingNoteWithEnvelope(notes, addNote, frameStart));
                }

                playSoundInEnvelopeNow(note, envelope);
            } else {
                startOrContinueCurrentlyPlayingSound(note);
            }
        };

        const handleNoteStop = () => {
            setKeyCurrentlyPressed(null);
            setRowHilite(-1);
            stopAnyCurrentlyPlayingSound();
        };

        const handleMouseDown = (e) => {
            const { offsetX: x, offsetY: y, buttons } = e.nativeEvent;
            if (noteAlignMode === MODE.QUANTIZE && buttons) {
                const row = y2NoteRow(y);
                const newSound = soundForRow[row];
                const note = { ...newSound, row };
                const frameStart = Math.floor(x2BeatCol(x, quantizeMode, BPM) * beats2Frames(1 / quantizeMode, BPM));
                // console.log(frameStart, x2BeatCol(x, quantizeMode, BPM), beats2Frames(1 / quantizeMode, BPM));
                setNotesAndStore(newNoteSetApplyingNoteWithEnvelope(notes, note, frameStart));
                playSoundInEnvelopeNow(newSound, envelopes[currentEnvelope]);
            }
        };

        const newNoteSetApplyingNoteWithEnvelope = (notes, note, frameStart) => {
            const newNotes = { ...notes };
            const envelope = envelopes[currentEnvelope];

            for (let i = 0; i < envelope.length; i++) {
                const noteWithVol = { ...note, v: envelope[i] };
                const thisFrame = frameStart + i;
                if (thisFrame < beats2Frames(totalBeats, BPM)) {
                    switch (drawEraseMode) {
                        case 'draw':
                            newNotes[thisFrame] = noteWithVol;
                            break;
                        case 'erase':
                            delete newNotes[thisFrame];
                            break;
                        case 'neither':
                            break;
                    }
                }
            }

            return newNotes;
        };

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
            if (currrentlyPlayingEnvelopeSound) {
                SoundCache.stopByTF(currrentlyPlayingEnvelopeSound.t, currrentlyPlayingEnvelopeSound.f);
                currrentlyPlayingEnvelopeTimeouts.forEach((timeout) => {
                    clearTimeout(timeout);
                });
            }
            setCurrrentlyPlayingEnvelopeSound(note);
            setTimeout(() => {
                SoundCache.playByTFV(note.t, note.f, envelope[0]);
            }, frames2mills(0));
            const currentTimeouts = [];
            for (let i = 1; i < envelope.length; i++) {
                currentTimeouts.push(
                    setTimeout(() => {
                        SoundCache.changeVolByTFV(note.t, note.f, envelope[i]);
                    }, frames2mills(i))
                );
            }
            setCurrrentlyPlayingEnvelopeTimeouts(currentTimeouts);

            setTimeout(() => {
                SoundCache.stopByTF(note.t, note.f);
                setCurrrentlyPlayingEnvelopeSound(null);
                setCurrrentlyPlayingEnvelopeTimeouts([]);
            }, frames2mills(envelope.length));
        };

        //console.log(soundMap); //sound_06_25.wav

        const envelopeToDiagram = {};
        Object.keys(envelopes).map((key) => {
            envelopeToDiagram[key] = <EnvelopeDiagram env={envelopes[key]} />;
        });

        const togglePlayback = () => {
            if (!isPlaying) startPlayback();
            else stopPlayback();
        };

        const startPlayback = () => {
            setIsPlaying(true);
            setShouldRepeat(true);
            launchPlayback(notes, totalBeats, BPM, setPlaybackStartingTime);
        };

        const stopPlayback = () => {
            setIsPlaying(false);
            setShouldRepeat(false);
        };

        useImperativeHandle(ref, () => ({
            externalStartPlayback() {
                startPlayback();
            },
            externalStopPlayback() {
                stopPlayback();
            },
            externalGetBatari() {
                return makeBatariMusic(notes, totalBeats, BPM);
            },
        }));

        return (
            <div
                className={`${styles.riffMachine} ${isFocused && styles.focused} `}
                onMouseDown={(e) => {
                    getFocus();
                }}
                onKeyDown={(e) => handleKeyDown(e, keyboardToNote, setKeyCurrentlyPressed)}
                onKeyUp={(e) => handleNoteStop()}
                tabIndex="0"
            >
                <h2>{title}</h2>

                <SoundSetSelector
                    selectedVal={currentSoundSetIndex}
                    setter={setAndLoadSoundset}
                    soundSet={DefaultSoundSets}
                />

                <div
                    className={styles.grid}
                    style={directStyle}
                    onMouseMove={(e) => {
                        handleMouseMove(e, setRowHilite);
                    }}
                    onMouseDown={(e) => {
                        handleMouseMove(e, setRowHilite);
                        if (noteAlignMode === MODE.QUANTIZE) {
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
                >
                    {/* soundSet={soundSet} keyCurrentlyPressed={keyCurrentlyPressed} */}
                    <RowLabels
                        {...{ keyCurrentlyPressed, keyboardToNote, handleNoteStart, handleNoteStop }}
                        rows2Sound={soundForRow}
                    />
                    <RowHilite {...{ rowHilite }} />

                    <ColHilite
                        {...{ colHilite, noteAlignMode, BPM, noteAlignMode, quantizeMode }}
                        envelope={envelopes[currentEnvelope]}
                    />
                    <BeatLines {...{ totalBeats, measureLengthInBeasts, BPM }} />
                    <NoteBlocks {...{ notes }} T_F2Row={rowForT_F} />

                    <CurrentTimePointer startTime={playbackStartingTime} isPlaying={isPlaying} />
                </div>

                {isFocused && (
                    <div>
                        <div>
                            <ControlStackWrap title="mode">
                                <RadioSet
                                    selectedVal={drawEraseMode}
                                    setter={setDrawEraseMode}
                                    valToCaptions={{ draw: 'place note', erase: 'erase note', neither: 'just sound' }}
                                />

                                <button
                                    onClick={() => {
                                        if (confirm('erase all notes?')) {
                                            setNotesAndStore({});
                                        }
                                    }}
                                >
                                    clear all
                                </button>
                            </ControlStackWrap>
                            <ControlStackWrap title="alignment">
                                <label>
                                    <input
                                        onChange={() => setNoteAlignMode(MODE.FREEHAND)}
                                        type="radio"
                                        checked={noteAlignMode == MODE.FREEHAND}
                                    />
                                    {MODE.FREEHAND}
                                </label>
                                <br />
                                <label>
                                    <input
                                        onChange={() => setNoteAlignMode(MODE.QUANTIZE)}
                                        type="radio"
                                        checked={noteAlignMode == MODE.QUANTIZE}
                                    />
                                    {MODE.QUANTIZE} to:
                                </label>
                                <div style={{ marginLeft: '1em' }}>
                                    <RadioSet
                                        selectedVal={quantizeMode}
                                        setter={(val) => {
                                            setQuantizeMode(val);
                                            setNoteAlignMode(MODE.QUANTIZE);
                                        }}
                                        valToCaptions={{
                                            [QUANT.WHOLEBEAT]: 'beat',
                                            [QUANT.HALFBEAT]: '1/2 beat',
                                            [QUANT.THIRDBEAT]: '1/3 beat',
                                            [QUANT.QUARTERBEAT]: '1/4 beat',
                                            [QUANT.EIGHTHBEAT]: '1/8 beat',
                                        }}
                                    />
                                </div>
                            </ControlStackWrap>
                            <ControlStackWrap title="envelope">
                                <RadioSet
                                    selectedVal={currentEnvelope}
                                    setter={setCurrentEnvelope}
                                    valToCaptions={envelopeToDiagram}
                                />
                            </ControlStackWrap>

                            <ControlStackWrap title="riff details">
                                <div>
                                    <label>
                                        Loop Length:
                                        <br />
                                        <input
                                            className={styles.short}
                                            value={totalBeats}
                                            onChange={(e) => setTotalBeatsAndStore(e.target.value ? e.target.value : 4)}
                                        />{' '}
                                        Beats
                                    </label>
                                </div>
                                <div>
                                    <label>
                                        Tempo:
                                        <br />
                                        <input
                                            className={styles.short}
                                            value={BPM}
                                            onChange={(e) => setBPM(e.target.value)}
                                        />{' '}
                                        BPM
                                    </label>
                                </div>

                                {/* <button
                                    onClick={(e) => {
                                        launchRecording();
                                    }}
                                >
                                    Record
                                </button> */}

                                {/* {
                                    <button
                                        onClick={() => {
                                            console.log(notes);
                                        }}
                                    >
                                        show notes
                                    </button>
                                } */}
                            </ControlStackWrap>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

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
