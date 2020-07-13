import SoundCache from '../SoundCache/SoundCache.js';
import { beats2Frames, frames2mills } from '../Utils.js';

let shouldRepeat = false;

const setShouldRepeat = (val) => {
    shouldRepeat = val;
    // console.log(`setShouldRepeat ${shouldRepeat}`);
};

const launchPlayback = (origNotes, totalBeats, BPM, setPlaybackStartingTime) => {
    const notes = {};

    //need to make a deep copy of origNotes, otherwise references
    //are messing up our source material

    Object.keys(origNotes).forEach((key) => {
        notes[key] = { ...origNotes[key] };
    });

    let currentlyPlayingTFV = null;
    const notesWithStartAndEnd = [];

    //makeBatariMusic(origNotes, totalBeats, BPM);

    //go over every frame and see if the notes are different,
    //make a set notesWithStartAndEnd....
    for (let i = 0; i < beats2Frames(totalBeats, BPM); i++) {
        const thisFrameTFV = notes[i]; //grab this

        if (!notesAreSameTFV(thisFrameTFV, currentlyPlayingTFV)) {
            //OK WE ARE STARTING A NEW NOTE OF SOME SORT (MAYBE JUST VOLUME CHANGE)
            if (currentlyPlayingTFV) {
                //IF THERE WAS A THING PLAYING, WE EITHER MODIFY IT
                if (notesDifferOnlyInV(thisFrameTFV, currentlyPlayingTFV)) {
                    if (!currentlyPlayingTFV.volChange) currentlyPlayingTFV.volChange = [];
                    currentlyPlayingTFV.volChange.push({ frame: i, v: thisFrameTFV.v });
                    currentlyPlayingTFV.v = thisFrameTFV.v;
                } else {
                    //new note so end what was playing before
                    //console.log(`frame ${i} ending this one`, currentlyPlayingTFV);
                    currentlyPlayingTFV.endFrame = i - 1;
                    notesWithStartAndEnd.push(currentlyPlayingTFV);

                    if (thisFrameTFV) {
                        //console.log(`looking at frame ${i} we grab start frame because chnging note`);
                        thisFrameTFV.startFrame = i;
                        thisFrameTFV.startV = thisFrameTFV.v;
                        thisFrameTFV.volChange = null;
                    }
                    currentlyPlayingTFV = thisFrameTFV;
                }
            } else {
                //notes are differe, nothing previous playing
                if (thisFrameTFV) {
                    //console.log(`looking at frame ${i} we grab start frame because no currently playing note`);
                    thisFrameTFV.startFrame = i;
                    thisFrameTFV.startV = thisFrameTFV.v;
                    thisFrameTFV.volChange = null;
                }
                currentlyPlayingTFV = thisFrameTFV;
            }
        }
    }
    if (currentlyPlayingTFV) {
        currentlyPlayingTFV.endFrame = beats2Frames(totalBeats, BPM) - 1;
        notesWithStartAndEnd.push(currentlyPlayingTFV);
    }
    //console.log(notes);
    //console.log(notesWithStartAndEnd);

    playbackNotesWithStartAndEnd(notesWithStartAndEnd, totalBeats, BPM, setPlaybackStartingTime);
};

const playbackNotesWithStartAndEnd = (notesWithStartAndEnd, totalBeats, BPM, setPlaybackStartingTime) => {
    setPlaybackStartingTime(Date.now());

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
    //console.log(`here shouldRepeat is ${shouldRepeat}`);
    if (shouldRepeat) {
        setTimeout(() => {
            if (shouldRepeat) {
                playbackNotesWithStartAndEnd(notesWithStartAndEnd, totalBeats, BPM, setPlaybackStartingTime);
            }
        }, frames2mills(beats2Frames(totalBeats, BPM)));
    }
};

const notesAreSameTFV = (noteA, noteB) => {
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

const makeBatariMusic = (origNotes, totalBeats, BPM) => {
    const notes = {};
    const notesOrRestsWithDuration = [];
    //make a deep copy
    Object.keys(origNotes).forEach((key) => {
        notes[key] = { ...origNotes[key] };
    });
    let currentlyPlayingTFV = null;

    for (let i = 0; i < beats2Frames(totalBeats, BPM); i++) {
        const thisFrameTFV = notes[i]; //grab this
        if (!thisFrameTFV) thisFrameTFV = { t: 0, f: 0, v: 0 };
        if (!notesAreSameTFV(thisFrameTFV, currentlyPlayingTFV)) {
            if (currentlyPlayingTFV) {
                currentlyPlayingTFV.duration = i - currentlyPlayingTFV.startFrame;
                notesOrRestsWithDuration.push(currentlyPlayingTFV);
            }
            currentlyPlayingTFV = { ...thisFrameTFV, startFrame: i };
        }
    }
    if (currentlyPlayingTFV) {
        currentlyPlayingTFV.duration = beats2Frames(totalBeats, BPM) - currentlyPlayingTFV.startFrame;
        notesOrRestsWithDuration.push(currentlyPlayingTFV);
    }

    //debugging stuff
    let totalduration = 0;
    notesOrRestsWithDuration.forEach((tfvd) => {
        console.log(JSON.stringify(tfvd));
        totalduration += tfvd.duration;
    });
    console.log(`totalduration ${totalduration}`);

    //VCFD
    const buf = notesOrRestsWithDuration
        .map((tfvd) => `   ${tfvd.v}, ${tfvd.t}, ${tfvd.f}, ${tfvd.duration}\n`)
        .join('');
    return buf;
};

export { launchPlayback, makeBatariMusic, setShouldRepeat };
