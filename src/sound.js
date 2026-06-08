// ─── sound.js ─────────────────────────────────────────────────────────────────
// Gère tous les sons du projet :
//   - Sons des molécules (joués ponctuellement)
//   - Sons d'ambiance (joués en boucle en fond)

const audioCtx = new AudioContext();

// ─── Sons des molécules ───────────────────────────────────────────────────────
// Commentés car déplacés dans /old/ — à réactiver quand de nouveaux sons seront prêts
// const moleculeSounds = [
//     "/sounds/carbone.wav",
//     "/sounds/oxygene.wav",
//     "/sounds/hydrogene.wav",
// ];

const moleculeSounds = [
    "/old/do.mp3",    // 0 — carbone
    "/old/do.mp3",    // 0 — carbone
    "/old/do.mp3",    // 0 — carbone


    // "/sounds/hover/2.mp3",
    // "/sounds/hover/3.mp3",

    // "/sounds/whistle.wav",
    // "/old/mi.mp3",    // 1 — oxygène
    // "/old/solG.wav",  // 2 — hydrogène
    // "/old/mi.mp3",  // 2 — hydrogène
    // "/old/boom.wav",  // 3 — classic4
];

const volumeBoost = [1.8, 1.8, 1.5, 1];

const buffers = []; // buffers audio des sons molécules, indexés comme moleculeSounds

// ─── Sons d'ambiance ──────────────────────────────────────────────────────────

const ambientSounds = [
    // "/sounds/ambient.wav",
    // "/sounds/whistle.wav",
];

// ─── Sons de molécule ─────────────────────────────────────────────────────────
// ding.wav  : joué en boucle pendant la construction
// holy.wav  : joué à chaque nouvel atome (avec detune par atome)
// bop.wav   : joué au déclenchement de l'explosion

let dingSource = null;      // source en cours pour ding (pour pouvoir l'arrêter)
let bopTimeout = null;      // timeout pour arrêter bop

export const MOLECULE_SOUND = {
    bopDuration: 2000,      // durée de bop en ms
};

let dingGain = null; // gain node pour ding (pour pause/resume)

export async function startDing() {
    if (dingSource && dingGain) {
        // Son déjà en cours — juste remonter le volume (annuler le fade out)
        dingGain.gain.cancelScheduledValues(audioCtx.currentTime);
        dingGain.gain.setValueAtTime(1, audioCtx.currentTime);
        return;
    }
    const buffer = await loadBuffer("/sounds/ding.wav");
    dingGain = audioCtx.createGain();
    dingGain.gain.value = 1;
    dingGain.connect(audioCtx.destination);
    dingSource = audioCtx.createBufferSource();
    dingSource.buffer = buffer;
    dingSource.loop = true;
    dingSource.connect(dingGain);
    dingSource.start(0);
}

export function pauseDing(fadeDuration = 0.3) {
    if (dingGain) {
        dingGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDuration);
    }
}

export function resumeDing() {
    if (dingGain) {
        dingGain.gain.cancelScheduledValues(audioCtx.currentTime);
        dingGain.gain.setValueAtTime(1, audioCtx.currentTime);
    }
}

export function stopDing(fadeDuration = 0.4) {
    if (dingGain && dingSource) {
        // Fade out progressif puis arrêt
        dingGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDuration);
        const src = dingSource;
        dingSource = null;
        dingGain = null;
        setTimeout(() => { try { src.stop(); } catch (e) { } }, fadeDuration * 1000);
    }
}

// ─── Holy : une entrée par atome, se relance à la fin ───────────────────────
// Map atomId → { src, gainNode, wetGain, detune, active }
const holyAtoms = new Map();

// Construit le graphe audio pour un holy (dry + reverb wet)
function buildHolyChain(buffer, detune) {
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(audioCtx.destination);

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.detune.value = detune;
    src.connect(gainNode);
    return { src, gainNode };
}

async function startHolyAtom(atomId, detune, reverb) {
    const entry = holyAtoms.get(atomId);
    if (!entry || !entry.active) return; // stoppé entre-temps
    const buffer = await loadBuffer("/sounds/holy.wav");
    if (!holyAtoms.get(atomId)?.active) return; // vérifier encore après le await
    const { src, gainNode } = buildHolyChain(buffer, detune);
    entry.src = src;
    entry.gainNode = gainNode;
    src.start(0);
    src.onended = () => {
        if (holyAtoms.get(atomId)?.active) {
            startHolyAtom(atomId, entry.detune, entry.reverb);
        }
    };
}

export function playHoly(atomId, detune = 0) {
    if (holyAtoms.has(atomId)) return; // déjà lancé pour cet atome
    const entry = { active: true, detune, src: null, gainNode: null };
    holyAtoms.set(atomId, entry);
    startHolyAtom(atomId, detune, 0);
}



export async function playHolyShort(detune = 0, volume = 0.3) {
    const buffer = await loadBuffer("/sounds/holy.wav");
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.12); // 120ms fade out
    gainNode.connect(audioCtx.destination);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.detune.value = detune;
    src.connect(gainNode);
    src.start(0);
    setTimeout(() => { try { src.stop(); } catch (e) { } }, 150);
}

export function fadeOutHolySounds(fadeDuration = 2) {
    for (const [id, entry] of holyAtoms) {
        entry.active = false;
        if (entry.gainNode) {
            entry.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            entry.gainNode.gain.setValueAtTime(entry.gainNode.gain.value, audioCtx.currentTime);
            entry.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDuration);
        }
        const src = entry.src;
        setTimeout(() => { try { src?.stop(); } catch (e) { } }, fadeDuration * 1000);
    }
    holyAtoms.clear();
}

export async function playBop() {
    const buffer = await loadBuffer("/sounds/bop.wav");
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(audioCtx.destination);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(gainNode);
    src.start(0);
    // Fade out progressif sur bopDuration ms
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + MOLECULE_SOUND.bopDuration / 1000);
    clearTimeout(bopTimeout);
    bopTimeout = setTimeout(() => { try { src.stop(); } catch (e) { } }, MOLECULE_SOUND.bopDuration);
}

// ─── Hover ────────────────────────────────────────────────────────────────────
// Sons joués au hover des éléments interactifs du label.
//
// Deux fonctions publiques :
//   playHoverAtom(type)  — type = "carbon" | "oxygen" | "hydrogen"
//                          joue le son indexé : carbon→[0], oxygen→[1], hydrogen→[2]
//   playHoverGroup(url)  — joue un son de groupe ; url assignée par ui.js à la construction du label

// Sons des tokens de formule — un son par type d'atome (carbon=0, oxygen=1, hydrogen=2)
const hoverAtomSounds = [
    "/sounds/hover/2.mp3",   // 0 — carbon   (C)
    "/sounds/hover/3.mp3",   // 1 — oxygen   (O)
    "/sounds/hover/4.mp3",   // 2 — hydrogen (H)


];

// Sons des groupes (nom de molécule) — exporté pour que ui.js puisse assigner un son fixe par groupe
export const hoverGroupSounds = [

    "/sounds/groupes/dang.mp3",
    "/sounds/groupes/ding5.wav",
    "/sounds/groupes/ding3.wav",


    // "/sounds/groupes/dang7.mp3",

    // "/sounds/groupes/ding.wav",
    // "/sounds/groupes/ding2.wav",

    // "/sounds/groupes/ding4.wav", //bof
    // "/sounds/groupes/ding6.wav",


];

export const HOVER_SOUND = {
    fadeOutDuration: 0.5, // durée du fade out avant la fin (s)
};

let currentHoverSrc = null;
let currentHoverGain = null;

// Fonction interne — joue une URL et gère le fade out du son précédent
async function _playHover(url) {
    if (currentHoverGain && currentHoverSrc) {
        const g = currentHoverGain;
        const s = currentHoverSrc;
        g.gain.cancelScheduledValues(audioCtx.currentTime);
        g.gain.setValueAtTime(g.gain.value, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + HOVER_SOUND.fadeOutDuration);
        setTimeout(() => { try { s.stop(); } catch (e) { } }, HOVER_SOUND.fadeOutDuration * 1000);
        currentHoverSrc = null;
        currentHoverGain = null;
    }
    const buffer = await loadBuffer(url);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(audioCtx.destination);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(gainNode);
    src.start(0);
    currentHoverSrc = src;
    currentHoverGain = gainNode;
    const duration = buffer.duration;
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration - HOVER_SOUND.fadeOutDuration);
    src.onended = () => {
        if (currentHoverSrc === src) { currentHoverSrc = null; currentHoverGain = null; }
    };
}

// Hover sur un token de formule — type = "carbon" | "oxygen" | "hydrogen"
export function playHoverAtom(type) {
    const idx = { carbon: 0, oxygen: 1, hydrogen: 2 }[type] ?? 0;
    const url = hoverAtomSounds[idx];
    if (url) _playHover(url);
}

// Hover sur un groupe du nom — url assignée à la construction du label (1 son fixe par groupe)
// url est passée depuis ui.js via data-group-sound sur le span
export function playHoverGroup(url) {
    // (ancien comportement aléatoire conservé en fallback si pas d'url)
    // const url = hoverGroupSounds[Math.floor(Math.random() * hoverGroupSounds.length)];
    const resolved = url || hoverGroupSounds[Math.floor(Math.random() * hoverGroupSounds.length)];
    if (!resolved) return;
    _playHover(resolved);
}

// (plus utilisé — conservé commenté)
// export async function playHoverSound() { ... }

// ─── Arpèges ──────────────────────────────────────────────────────────────────
// Sons joués au clic de création d'atome — s'arrêtent tout seuls

const arpegeSounds = [
    "/sounds/arpeges/sound_1.wav",
    "/sounds/arpeges/sound_2.wav",
    "/sounds/arpeges/sound_3.wav",
];

export async function playArpege() {
    const url = arpegeSounds[Math.floor(Math.random() * arpegeSounds.length)];
    const buffer = await loadBuffer(url);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtx.destination);
    src.start(0);
    // S'arrête tout seul à la fin du buffer
}

// ─── Chargement ───────────────────────────────────────────────────────────────

async function loadBuffer(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioCtx.decodeAudioData(arrayBuffer);
}

export async function loadAllSounds() {
    // Charger les sons molécules dans buffers[]
    for (const url of moleculeSounds) {
        buffers.push(await loadBuffer(url));
    }

    // Charger et lancer les sons d'ambiance en boucle
    for (const url of ambientSounds) {
        const buffer = await loadBuffer(url);
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(audioCtx.destination);
        src.start(0);
    }
}

// ─── Lecture ponctuelle ───────────────────────────────────────────────────────

export function playSound(index, volume = 1, options = {}) {
    if (!buffers[index]) return;
    const { detune = 0, reverb = 0, playbackRate = 1 } = options;

    const source = audioCtx.createBufferSource();
    source.buffer = buffers[index];
    source.detune.value = detune;
    source.playbackRate.value = playbackRate;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, volume * (volumeBoost[index] || 1)));

    if (reverb > 0) {
        // Reverb synthétique : bruit décroissant convoluté avec le son
        const reverbNode = audioCtx.createConvolver();
        const impulseLength = audioCtx.sampleRate * 1.5;
        const impulse = audioCtx.createBuffer(2, impulseLength, audioCtx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < impulseLength; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
            }
        }
        reverbNode.buffer = impulse;

        const dryGain = audioCtx.createGain();
        const wetGain = audioCtx.createGain();
        dryGain.gain.value = 1 - reverb;
        wetGain.gain.value = reverb;

        source.connect(gainNode);
        gainNode.connect(dryGain);
        gainNode.connect(reverbNode);
        reverbNode.connect(wetGain);
        dryGain.connect(audioCtx.destination);
        wetGain.connect(audioCtx.destination);
    } else {
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
    }

    source.start(0);
}

export function playSoundReversed(index, volume = 1, rate = 3) {
    if (!buffers[index]) return;

    // Créer une copie inversée du buffer
    const original = buffers[index];
    const reversed = audioCtx.createBuffer(
        original.numberOfChannels,
        original.length,
        original.sampleRate
    );
    for (let ch = 0; ch < original.numberOfChannels; ch++) {
        const src = original.getChannelData(ch);
        const dst = reversed.getChannelData(ch);
        for (let i = 0; i < original.length; i++) {
            dst[i] = src[original.length - 1 - i];
        }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = reversed;
    source.playbackRate.value = rate;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, volume * (volumeBoost[index] || 1)));

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
}