import "./style.css";
import * as dat from "dat.gui";
import Circle from "./cercle.js";
import Joint, { initJointCanvas, flushJoints } from "./joint.js";
import { loadAllSounds, playSound, playSoundReversed, startDing, stopDing, pauseDing, resumeDing, playHoly, fadeOutHolySounds, playBop, playArpege, MOLECULE_SOUND } from "./sound.js";
import { buildDecor, drawDecor, addDecorCluster, clearDecor } from "./decor.js";
import { MOLECULES, palettes } from "./molecules.js";
import { UI, measureUnderlineThickness } from "./ui.js";

// ─── Audio ────────────────────────────────────────────────────────────────────

loadAllSounds();
// const audio = new Audio('disparition.wav'); 

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Préchargement des fonts depuis public/font/

const FONTS = {
  "EurocatBase Light": "/font/EurocatBase-Light.otf",
  "Eurocat Light": "/font/Eurocat-Light.otf",
  "EurocatSans Light": "/font/EurocatSans-Light.otf",
  "ClashDisplay Bold": "/font/ClashDisplay-Bold.otf",
  "ClashDisplay Semibold": "/font/ClashDisplay-Semibold.otf",
  "ClashDisplay Extralight": "/font/ClashDisplay-Extralight.otf",
  "Elms Italic": "/font/ElmsSans-Italic-VariableFont_wght.ttf",
  "Elms Normal": "/font/ElmsSans-VariableFont_wght.ttf",

};

(async () => {
  for (const [name, url] of Object.entries(FONTS)) {
    const face = new FontFace(name, `url(${url})`);
    try { await face.load(); document.fonts.add(face); }
    catch (e) { console.warn(`Font "${name}" non trouvée :`, e); }
  }
})();

// ─── GUI ─────────────────────────────────────────────────────────────────────

const gui = new dat.GUI();

// ─── Canvases ─────────────────────────────────────────────────────────────────

const decorCanvas = document.createElement("canvas");
decorCanvas.width = window.innerWidth;
decorCanvas.height = window.innerHeight;
decorCanvas.style.cssText = "position:fixed;top:0;left:0;z-index:0;";
document.body.appendChild(decorCanvas);
const decorCtx = decorCanvas.getContext("2d");

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.cssText = "position:fixed;top:0;left:0;z-index:1;";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

gui.domElement.parentElement.style.zIndex = "2";
gui.domElement.parentElement.style.position = "relative";
initJointCanvas(canvas.width, canvas.height);

// ─── Settings ─────────────────────────────────────────────────────────────────

const settings = {
  diam: 70,

  omega: 19,
  gamma: 3.35,
  speedBack: 1.291,
  omegaBonded: 19,
  gammaBonded: 3.35,
  speedBackBonded: 1.291,
  omegaFree: 10,
  gammaFree: 1.5,
  speedBackFree: 0.4,

  detuneAmount: 0,
  reverbMix: 0,

  disparition: 0.5,
  threshold: 180,
  dragSpeed: 0.013,
  followSpeed: 0.19,
  hoverRadius: 242,
  hoverStrength: 0.3,

  noiseAmount: 58.9,
  noiseSpeed: 0.41,
  noiseFq1: 1.0,
  noiseFq2: 3.57,
  noiseFq3: 5.67,
  noiseAmp1: 0.79,
  noiseAmp2: 0.38,
  noiseAmp3: 0.37,
  maxAmplitude: 300,
  minVolume: 0.05,

  omegaFull: 19,
  gammaFull: 3.35,
  speedBackFull: 1.291,

  omegaFree: 8,
  gammaFree: 1.0,
  speedBackFree: 0.3,

  soundDetune: 0,
  soundReverb: 0.2,
  soundPlaybackRate: 1,

  doVolume: 1, doDetune: 0, doReverb: 0.2,
  miVolume: 1.55, miDetune: 0, miReverb: 0.2,
  solGVolume: 1.55, miDetune: 0, miReverb: 0.2,
  solGDetune: 0, solGReverb: 0.2, // (restaurés — requis par dat.gui folderSolG)
  // solGVolume: 1.5, solGDetune: 1200, solGReverb: 0.2,

  border: `rgb(0, 15, 195)`,
  middle: `rgb(91, 132, 255)`,
  center: `rgb(180, 240, 255)`,
  appearance: 0.5,
  compositeOperation: "lighter",

  hideAuto: false,
  deleteMode: false,

  decorClusterCount: 6,
  decorFlatFill: false,
  style: "different",

  fadeSpeed: 0.01,

  noiseAmplitudeMin: 20,
  noiseAmplitudeMax: 80,
  noiseSpeedMin: 0.4,
  noiseSpeedMax: 1.5,

  moleculeLabel: "",
  labelSize: 60,
  labelOpacity: 0.85,
  labelBottom: 64,  // distance depuis le bas de l'écran (px)

  mute: false,
  holyFadeOut: 1.0,   // durée du fade out holy
  hoverWhiteOnHovered: false, // true = blanc sur les atomes hovérés, false = blanc sur les autres

  atomSpawnInterval: 200,

  dissolveSpeed: 8,        // vitesse initiale des atomes à l'explosion
  dissolveAccel: 1.01,     // accélération par frame (multiplicateur)
  dissolveScatter: 1.5,    // dispersion angulaire
  throwBorder: 20,         // px depuis le bord pour déclencher l'explosion
  throwMinSpeed: 8,        // vitesse souris minimum pour déclencher
  spawnSpeedBack: 0.02,    // vitesse de retour à la création
  atomScale: 1.15,

  // ── Capsules & groupes (hover sur le label) ──────────────────────────────
  // Tous les paramètres visuels des capsules sont ici — consommés dans drawGroupCapsules().
  // L'épaisseur du trait lue depuis l'underline CSS
  // via underlineThicknessPx (calculé au démarrage, voir measureUnderlineThickness() dans ui.js).
  capsulePadRatio: 0.2,       // marge autour des atomes : rayon capsule = diam * (1 + ratio)
  capsuleStrokeColor: "rgb(255, 255, 255)", // couleur du contour des capsules au hover
  capsuleFillColor: "black",                   // fond des capsules (cache l'intérieur)
  // capsuleLineWidth: null,
  capsuleLineWidth: 0.5,
  // jointWidthRatio: 0.025,  

  // ── Label molécule ──────────────────────────────────────────────────────
  labelMerged: true,       // true = un seul label, false = 3 labels séparés
  // Mode fusionné
  labelSize: 60,
  labelOpacity: 0.85,
  labelBottom: 64,
  // Mode séparé — nom
  labelNameSize: 60,
  labelNameOpacity: 0.85,
  labelNameBottom: 120,
  labelNameX: 0,           // décalage horizontal depuis le centre (px)
  // Mode séparé — vulgarisé
  labelVulgarSize: 36,
  labelVulgarOpacity: 0.5,
  labelVulgarBottom: 72,
  labelVulgarX: 0,
  // Mode séparé — formule
  labelFormulaSize: 48,
  labelFormulaOpacity: 0.85,
  labelFormulaBottom: 20,
  labelFormulaX: 0,

  // ── Halo dégradé ──────────────────────────────────────────────────────────
  // haloRatio: 2, // rayon du halo = c.diam * haloRatio
  // haloComposite: "source-over",
  // // Carbon — couleurs en hex, opacités séparées
  // haloC_inner: "#00ffc3",
  // haloC_innerAlpha: 1.0,
  // haloC_mid: "#6dc9ff",
  // haloC_midAlpha: 0.3,
  // haloC_midPos: 0.54,
  // haloC_outer: "#ffffff",
  // haloC_outerAlpha: 0.0,
  // // Oxygen
  // haloO_inner: "#fcff50",
  // haloO_innerAlpha: 1.0,
  // haloO_mid: "#ff6d8a",
  // haloO_midAlpha: 0.28,
  // haloO_midPos: 0.52,
  // haloO_outer: "#ffffff",
  // haloO_outerAlpha: 0.0,
  // // Hydrogen
  // haloH_inner: "#83e9ff",
  // haloH_innerAlpha: 1.0,
  // haloH_mid: "#8d7fff",
  // haloH_midAlpha: 0.38,
  // haloH_midPos: 0.51,
  // haloH_outer: "#ffffff",
  // haloH_outerAlpha: 0.0,


  // // //HALO COOL
  // haloRatio: 1, // rayon du halo = c.diam * haloRatio
  // haloComposite: "source-over",
  // // Carbon — couleurs en hex, opacités séparées
  // haloC_inner: `rgb(180, 240, 255)`,
  // haloC_innerAlpha: 1.0,
  // haloC_mid: `rgb(107, 137, 255)`,
  // haloC_midAlpha: 1.0,
  // haloC_midPos: 0.56,
  // haloC_outer: `rgb(0, 0, 118)`,
  // haloC_outerAlpha: 1.0,
  // // Oxygen
  // haloO_inner: `rgb(255, 224, 166)`,
  // haloO_innerAlpha: 1.0,
  // haloO_mid: `rgb(255, 100, 73)`,
  // haloO_midAlpha: 1,
  // haloO_midPos: 0.56,
  // haloO_outer: `rgb(147, 0, 9)`,
  // haloO_outerAlpha: 1.0,
  // // Hydrogen
  // haloH_inner: `rgb(180, 255, 243)`,
  // haloH_innerAlpha: 1.0,
  // haloH_mid: `rgb(156, 107, 255)`,
  // haloH_midAlpha: 1,
  // haloH_midPos: 0.64,
  // haloH_outer: `rgb(80, 0, 195)`,
  // haloH_outerAlpha: 1.0,

  // //HALO BLANC
  haloRatio: 1, // rayon du halo = c.diam * haloRatio
  haloComposite: "source-over",
  // Carbon — couleurs en hex, opacités séparées
  haloC_inner: `rgb(255, 255, 255)`,
  haloC_innerAlpha: 1.0,
  haloC_mid: `rgb(255, 255, 255)`,
  haloC_midAlpha: 1.0,
  haloC_midPos: 0.56,
  haloC_outer: `rgb(255, 255, 255)`,
  haloC_outerAlpha: 1.0,
  // Oxygen
  haloO_inner: `rgb(255, 255, 255)`,
  haloO_innerAlpha: 1.0,
  haloO_mid: `rgb(255, 255, 255)`,
  haloO_midAlpha: 1,
  haloO_midPos: 0.56,
  haloO_outer: `rgb(255, 255, 255)`,
  haloO_outerAlpha: 1.0,
  // Hydrogen
  haloH_inner: `rgb(255, 255, 255)`,
  haloH_innerAlpha: 1.0,
  haloH_mid: `rgb(255, 255, 255)`,
  haloH_midAlpha: 1,
  haloH_midPos: 0.64,
  haloH_outer: `rgb(255, 255, 255)`,
  haloH_outerAlpha: 1.0,

  //HALO POUR ORIGINAL
  // haloRatio: 1, // rayon du halo = c.diam * haloRatio
  // haloComposite: "source-over",
  // // Carbon — couleurs en hex, opacités séparées
  // haloC_inner: `rgb(255, 255, 255)`,
  // haloC_innerAlpha: 1.0,
  // haloC_mid: `rgb(174, 225, 255)`,
  // haloC_midAlpha: 1.0,
  // haloC_midPos: 0.56,
  // haloC_outer: `rgb(76, 145, 255)`,
  // haloC_outerAlpha: 1.0,
  // // Oxygen
  // haloO_inner: `rgb(255, 224, 166)`,
  // haloO_innerAlpha: 1.0,
  // haloO_mid: `rgb(255, 100, 73)`,
  // haloO_midAlpha: 1,
  // haloO_midPos: 0.56,
  // haloO_outer: `rgb(147, 0, 9)`,
  // haloO_outerAlpha: 1.0,
  // // Hydrogen
  // haloH_inner: `rgb(180, 255, 243)`,
  // haloH_innerAlpha: 1.0,
  // haloH_mid: `rgb(156, 107, 255)`,
  // haloH_midAlpha: 1,
  // haloH_midPos: 0.64,
  // haloH_outer: `rgb(80, 0, 195)`,
  // haloH_outerAlpha: 1.0,


};

// ─── Épaisseur underline CSS — synchronisée avec les joints et capsules ───────
// Mesurée une fois au démarrage (après que les fonts soient chargées si possible).
// Utilisée comme lineWidth de référence pour joints ET contours de capsules.
let underlineThicknessPx = 2; // valeur par défaut avant mesure

// Mesurer après le premier frame pour laisser les fonts s'appliquer
requestAnimationFrame(() => {
  underlineThicknessPx = measureUnderlineThickness();
});

// ─── État molécule ────────────────────────────────────────────────────────────

let currentMolecule = null;
let atomQueue = [];
let moleculeComplete = false;
const recentMoleculeIndices = [];
const moleculeScale = { x: 2.0, y: 2.0 };
const moleculeOffset = { x: 0, y: 0 };

function getMoleculeTargetPos(atomDef) {
  const margin = 110;
  const rawXs = currentMolecule.atoms.map(a => a.x);
  const rawYs = currentMolecule.atoms.map(a => a.y);
  const rawW = (Math.max(...rawXs) - Math.min(...rawXs)) || 1;
  const rawH = (Math.max(...rawYs) - Math.min(...rawYs)) || 1;
  const sx = Math.min(moleculeScale.x, (window.innerWidth - margin * 2) / rawW);
  const sy = Math.min(moleculeScale.y, (window.innerHeight - margin * 2) / rawH);
  const xs = currentMolecule.atoms.map(a => a.x * sx);
  const ys = currentMolecule.atoms.map(a => a.y * sy);
  const offsetX = window.innerWidth / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 + moleculeOffset.x;
  const offsetY = window.innerHeight / 2 - (Math.min(...ys) + Math.max(...ys)) / 2 + moleculeOffset.y;
  return { tx: atomDef.x * sx + offsetX, ty: atomDef.y * sy + offsetY };
}

function pickRandomMolecule() {
  let idx;
  do { idx = Math.floor(Math.random() * MOLECULES.length); }
  while (recentMoleculeIndices.includes(idx) && recentMoleculeIndices.length < MOLECULES.length);
  recentMoleculeIndices.push(idx);
  if (recentMoleculeIndices.length > 7) recentMoleculeIndices.shift();
  currentMolecule = MOLECULES[idx];
  // BFS depuis l'atome 0 — garantit que chaque atome révélé a un voisin déjà posé
  const n = currentMolecule.atoms.length;
  const adj = Array.from({ length: n }, () => []);
  for (const bond of currentMolecule.bonds) {
    adj[bond[0]].push(bond[1]);
    adj[bond[1]].push(bond[0]);
  }
  const visited = new Set([0]);
  atomQueue = [0];
  const frontier = [...adj[0]];
  for (let i = frontier.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [frontier[i], frontier[j]] = [frontier[j], frontier[i]];
  }
  while (frontier.length > 0) {
    const ri = Math.floor(Math.random() * frontier.length);
    const idx = frontier.splice(ri, 1)[0];
    if (visited.has(idx)) continue;
    visited.add(idx);
    atomQueue.push(idx);
    for (const nb of adj[idx]) {
      if (!visited.has(nb) && !frontier.includes(nb)) frontier.push(nb);
    }
  }

  const full = `${currentMolecule.name} — ${currentMolecule.formula}`;
  settings.moleculeLabel = full;
  moleculeComplete = false;
  ui.setMoleculeLabel({
    name: currentMolecule.name,
    vulgar: currentMolecule.vulgar || "",
    formula: currentMolecule.formula,
    full,
    groups: currentMolecule.groups || [],
  });
}

// ─── UI ───────────────────────────────────────────────────────────────────────

const ui = new UI({
  onRecommencer: () => {
    if (objects.length > 0 && !moleculeFading) {
      moleculeFading = true;
      moleculeOpacity = 1;
    } else if (!moleculeFading) {
      objects = [];
      joints = [];
      moleculeComplete = false;
      pickRandomMolecule();
    }
  }

});

// ─── État interactif ──────────────────────────────────────────────────────────

let pressed = false;
let activeIndex = -1;
let time = 0;
let objects = [];
let joints = [];
let moleculeFading = false;
let moleculeOpacity = 1;
let autoCircles = [];
let mouseX = -9999, mouseY = -9999;
let mouseDX = 0, mouseDY = 0;


// ─── Cercles ──────────────────────────────────────────────────────────────────

function addCircle(x, y) {
  const c = new Circle(ctx, 1, 1, 0);
  c.startX = x; c.startY = y;
  c.x = x; c.y = y;
  c.drawX = x; c.drawY = y;
  c.snapX = x; c.snapY = y;
  c.A = 0;
  c.compositeOperation = settings.compositeOperation;

  let palettePool;
  if (settings.style === "different") {
    const carbonCount = objects.filter(o => o.soundIndex === 0).length;
    palettePool = carbonCount >= 5 ? palettes.slice(1, 3) : palettes.slice(0, 3);
  } else {
    palettePool = palettes;
  }
  const palette = palettePool[Math.floor(Math.random() * palettePool.length)];
  c.border = palette.border;
  c.middle = palette.middle;
  c.center = palette.center;
  c.soundIndex = palette.soundIndex;
  c.maxBonds = palette.maxBonds;
  c.diam = settings.style === "different" ? palette.diam : settings.diam;
  c.playing = false;
  c.hovered = false;
  c.noiseOffsetX = Math.random() * 100;
  c.noiseOffsetY = Math.random() * 100;
  c.noiseTime = Math.random() * 100;
  c.noiseX = 0;
  c.noiseY = 0;
  c.hasDoubleJoint = false;
  return c;
}

// ─── Liaisons ─────────────────────────────────────────────────────────────────

function usedBonds(circle) {
  let count = 0;
  for (const j of joints) {
    if (j.circleA === circle || j.circleB === circle) count += j.double ? 2 : 1;
  }
  return count;
}

function freeBonds(circle) { return circle.maxBonds - usedBonds(circle); }

function getDoubleJoint(circle) {
  return joints.find(j => j.double && (j.circleA === circle || j.circleB === circle)) || null;
}

function addJointsForNewCircle(newCircle) {
  if (objects.length === 0) return;

  if (settings.style === "different") {
    let closestFreeIndex = -1, closestFreeDist = Infinity;
    for (let i = 0; i < objects.length; i++) {
      if (freeBonds(objects[i]) < 1) continue;
      const dx = newCircle.startX - objects[i].startX;
      const dy = newCircle.startY - objects[i].startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestFreeDist) { closestFreeDist = dist; closestFreeIndex = i; }
    }
    let closestDoubleIndex = -1, closestDoubleDist = Infinity;
    if (closestFreeIndex === -1) {
      for (let i = 0; i < objects.length; i++) {
        if (getDoubleJoint(objects[i]) === null) continue;
        const dx = newCircle.startX - objects[i].startX;
        const dy = newCircle.startY - objects[i].startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDoubleDist) { closestDoubleDist = dist; closestDoubleIndex = i; }
      }
    }
    const targetIndex = closestFreeIndex !== -1 ? closestFreeIndex : closestDoubleIndex;
    if (targetIndex === -1) return;
    const target = objects[targetIndex];
    if (freeBonds(target) < 1) {
      const dj = getDoubleJoint(target);
      if (dj) dj.double = false;
    }
    const allowDouble = freeBonds(target) >= 2 && freeBonds(newCircle) >= 2;
    const j = new Joint(ctx, target, newCircle, settings.diam, allowDouble);
    if (j.double) { target.hasDoubleJoint = true; newCircle.hasDoubleJoint = true; }
    joints.push(j);
  } else {
    let closestIndex = 0, closestDist = Infinity;
    for (let i = 0; i < objects.length; i++) {
      const dx = newCircle.startX - objects[i].startX;
      const dy = newCircle.startY - objects[i].startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) { closestDist = dist; closestIndex = i; }
    }
    const allowDouble = !objects[closestIndex].hasDoubleJoint && !newCircle.hasDoubleJoint && Math.random() < 0.5;
    const j = new Joint(ctx, objects[closestIndex], newCircle, settings.diam, allowDouble);
    if (j.double) { objects[closestIndex].hasDoubleJoint = true; newCircle.hasDoubleJoint = true; }
    joints.push(j);
  }
}

function deleteCircle(index) {
  const c = objects[index];
  joints = joints.filter(j => j.circleA !== c && j.circleB !== c);
  objects.splice(index, 1);
  removeOrphanCircles();
}

function removeOrphanCircles() {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = objects.length - 1; i >= 0; i--) {
      const c = objects[i];
      const hasJoint = joints.some(j => j.circleA === c || j.circleB === c);
      if (!hasJoint) {
        joints = joints.filter(j => j.circleA !== c && j.circleB !== c);
        objects.splice(i, 1);
        changed = true;
      }
    }
  }
}

// ─── Son ──────────────────────────────────────────────────────────────────────

const _playSound = playSound;
function playSoundMuted(...args) { if (!settings.mute) _playSound(...args); }

function computeVolume(c) {
  const base = settings.minVolume + (1 - settings.minVolume) * Math.min(c.A / settings.maxAmplitude, 1);
  const perSound = [settings.doVolume, settings.miVolume, settings.solGVolume];
  return base * (perSound[c.soundIndex] ?? 1);
}

function computeDetune(c) {
  const perDetune = [settings.doDetune, settings.miDetune, settings.solGDetune];
  const base = perDetune[c.soundIndex] ?? settings.soundDetune;
  if (settings.style !== "different" || !c.maxBonds) return base;
  const ratio = 1 - freeBonds(c) / c.maxBonds;
  return base + ratio * 0; // détune fixé à 0 pour l'instant !!!
}

function computeReverb(c) {
  const perReverb = [settings.doReverb, settings.miReverb, settings.solGReverb];
  return perReverb[c.soundIndex] ?? settings.soundReverb;
}

// ─── Collisions & molécule complète ──────────────────────────────────────────

function checkCollisions() {
  for (let i = 0; i < objects.length; i++) {
    if (!objects[i].returning) continue;
    for (let j = 0; j < objects.length; j++) {
      if (i === j) continue;
      if (settings.hideAuto && objects[j].auto) continue;
      const dx = objects[i].drawX - objects[j].drawX;
      const dy = objects[i].drawY - objects[j].drawY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < objects[i].diam + objects[j].diam && !objects[j].playing) {
        objects[j].playing = true;
        playSoundMuted(objects[j].soundIndex, computeVolume(objects[i]), { detune: computeDetune(objects[j]), reverb: computeReverb(objects[j]), playbackRate: settings.soundPlaybackRate });
        setTimeout(() => { objects[j].playing = false; }, 500);
      }
    }
  }
}

function checkMoleculeComplete() {
  if (settings.style !== "different") return;
  if (objects.length === 0 || moleculeFading) return;

  const complete = objects.every(c => freeBonds(c) === 0);
  if (complete && !moleculeComplete) {
    const lastCircle = objects[objects.length - 1];
    if (lastCircle && !lastCircle.playing) {
      lastCircle.playing = true;
      playSoundMuted(lastCircle.soundIndex, computeVolume(lastCircle), { detune: computeDetune(lastCircle), reverb: computeReverb(lastCircle), playbackRate: settings.soundPlaybackRate });
      setTimeout(() => { lastCircle.playing = false; }, 500);
    }
    // addDecorCluster(objects, joints); // commenté — décor désactivé à la complétion
    moleculeComplete = true;
    stopDing(); // ding s'arrête quand molécule complète
  }
}

// ─── Noise ────────────────────────────────────────────────────────────────────

function noise(x) {
  return Math.sin(x * settings.noiseFq1) * settings.noiseAmp1 +
    Math.sin(x * settings.noiseFq2 + 1.3) * settings.noiseAmp2 +
    Math.sin(x * settings.noiseFq3 + 2.8) * settings.noiseAmp3;
}

// ─── Boucle de rendu ──────────────────────────────────────────────────────────

function draw() {
  time += settings.noiseSpeed / 60;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fade out
  if (moleculeFading) {
    moleculeOpacity -= settings.fadeSpeed;
    if (moleculeOpacity <= 0) {
      objects = [];
      joints = [];
      moleculeFading = false;
      moleculeOpacity = 1;
      moleculeComplete = false;
      pickRandomMolecule();
      requestAnimationFrame(draw);
      return;
    }
    ctx.globalAlpha = moleculeOpacity;
  }

  // Joints — tous dessinés sur un canvas partagé, puis flushé d'un coup
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < joints.length; i++) {
    joints[i].width = underlineThicknessPx; // synchronisé avec l'underline CSS
    // joints[i].width = joints[i].circleA.diam * settings.jointWidthRatio; // ancienne valeur ratio
    joints[i].draw(objects);
  }
  flushJoints(ctx, objects);

  // Cercles
  for (let i = 0; i < objects.length; i++) {
    if (settings.hideAuto && objects[i].auto) continue;
    const c = objects[i];

    const fb = (settings.style === "different" && c.maxBonds) ? freeBonds(c) : null;
    const ratio = fb !== null ? fb / c.maxBonds : null;

    if (ratio !== null) {
      c.omega = settings.omegaFull + ratio * (settings.omegaFree - settings.omegaFull);
      c.gamma = settings.gammaFull + ratio * (settings.gammaFree - settings.gammaFull);
      if (c._spawnSpeedBack !== undefined) {
        c.speedBack = c._spawnSpeedBack;
        if (!c.returning) delete c._spawnSpeedBack;
      } else {
        c.speedBack = settings.speedBackFull + ratio * (settings.speedBackFree - settings.speedBackFull);
      }
    } else {
      c.omega = settings.omega;
      c.gamma = settings.gamma;
      c.speedBack = settings.speedBack;
    }

    c.threshold = settings.threshold;
    c.dragSpeed = settings.dragSpeed;
    c.followSpeed = settings.followSpeed;
    c.compositeOperation = settings.compositeOperation;

    const noiseAmount = ratio !== null
      ? settings.noiseAmplitudeMin + ratio * (settings.noiseAmplitudeMax - settings.noiseAmplitudeMin)
      : settings.noiseAmount;
    const noiseSpeed = ratio !== null
      ? settings.noiseSpeedMin + ratio * (settings.noiseSpeedMax - settings.noiseSpeedMin)
      : settings.noiseSpeed;

    if (!moleculeFading) {
      c.noiseTime += noiseSpeed / 60;
      c.noiseX = noise(c.noiseTime + c.noiseOffsetX) * noiseAmount;
      c.noiseY = noise(c.noiseTime + c.noiseOffsetY) * noiseAmount;
    }

    // Fade bouton recommencer : gelé, pas d'interaction
    if (moleculeFading) { c.draw(false); continue; }

    // Explosion drag : accélération à chaque frame → impression d'explosion
    if (dissolving) {
      c._vx = (c._vx || 0) * settings.dissolveAccel;
      c._vy = (c._vy || 0) * settings.dissolveAccel;

      c.drawX += c._vx;
      c.drawY += c._vy;
      c.noiseX = 0;
      c.noiseY = 0;
      c.draw(false);
      continue;
    }

    if (pressed && i === activeIndex) {
      c.noiseX = 0; c.noiseY = 0;
      c.update(true);
    } else if (!pressed) {
      const dx = mouseX - c.startX;
      const dy = mouseY - c.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < settings.hoverRadius) {
        const influence = (1 - dist / settings.hoverRadius) * settings.hoverStrength;
        c.drawX += mouseDX * influence;
        c.drawY += mouseDY * influence;
        c.returning = false;
        c.hovered = true;
      } else {
        if (c.hovered) {
          c.hovered = false;
          c.A = Math.sqrt((c.drawX - c.startX) ** 2 + (c.drawY - c.startY) ** 2);
          c.returning = true;
          c.t = 0;
          if (!c.playing) {
            c.playing = true;
            playSoundMuted(c.soundIndex, computeVolume(c), { detune: computeDetune(c), reverb: computeReverb(c), playbackRate: settings.soundPlaybackRate });
            setTimeout(() => { c.playing = false; }, 500);
          }
        }
        c.update(false);
      }
    } else {
      c.update(false);
    }

    c.draw(pressed && i === activeIndex);
  }

  // checkCollisions(); // sons mutés — inutile pour l'instant
  ctx.globalAlpha = 1;
  checkMoleculeComplete();
  checkDissolveComplete();

  // Label & surbrillance
  ui.updateLabel(currentMolecule, moleculeComplete);
  // Capsules désactivées temporairement
  drawGroupCapsules();

  drawHighlights();

  drawCursor();


  requestAnimationFrame(draw);
}

// ─── Curseur custom ──────────────────────────────────────────────────────────

function drawCursor() {
  const labelHovered = ui.hoveredAtomType || ui.hoveredGroups.length > 0 || ui.hoveredAtomIndices;
  ctx.globalCompositeOperation = "xor";
  // ctx.globalCompositeOperation = "overlay";

  if (labelHovered) {
    // Remplir le cercle en blanc quand on hover un label
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 22, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

// ─── Surbrillance canvas ──────────────────────────────────────────────────────

// ── Fonction unique de dessin du halo pour un atome ─────────────────────────
// Convertit un hex + alpha en rgba(r,g,b,a)
function hexAlpha(hex, alpha) {
  // dat.GUI addColor peut renvoyer un tableau [r,g,b], une string hex, ou rgb()
  if (Array.isArray(hex)) {
    return `rgba(${Math.round(hex[0])},${Math.round(hex[1])},${Math.round(hex[2])},${alpha})`;
  }
  if (typeof hex === "string" && hex.startsWith("rgb")) {
    const m = hex.match(/[\d.]+/g);
    return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Retourne les couleurs du dégradé halo pour un atome donné
function getHaloColors(c) {
  if (c.soundIndex === 0) return {
    center: hexAlpha(settings.haloC_inner, settings.haloC_innerAlpha),
    middle: hexAlpha(settings.haloC_mid, settings.haloC_midAlpha),
    border: hexAlpha(settings.haloC_outer, settings.haloC_outerAlpha),
    midPos: settings.haloC_midPos,
  };
  if (c.soundIndex === 1) return {
    center: hexAlpha(settings.haloO_inner, settings.haloO_innerAlpha),
    middle: hexAlpha(settings.haloO_mid, settings.haloO_midAlpha),
    border: hexAlpha(settings.haloO_outer, settings.haloO_outerAlpha),
    midPos: settings.haloO_midPos,
  };
  return {
    center: hexAlpha(settings.haloH_inner, settings.haloH_innerAlpha),
    middle: hexAlpha(settings.haloH_mid, settings.haloH_midAlpha),
    border: hexAlpha(settings.haloH_outer, settings.haloH_outerAlpha),
    midPos: settings.haloH_midPos,
  };
}

// Appliquer les couleurs halo sur un cercle (stocker les originales)
function applyHalo(c) {
  if (c._origCenter !== undefined) return; // déjà appliqué
  c._origCenter = c.center;
  c._origMiddle = c.middle;
  c._origBorder = c.border;
  c._origAppearance = c.appearance;
  const h = getHaloColors(c);
  c.center = h.center;
  c.middle = h.middle;
  c.border = h.border;
  c.appearance = h.midPos;
}

// Restaurer les couleurs originales
function removeHalo(c) {
  if (c._origCenter === undefined) return;
  c.center = c._origCenter;
  c.middle = c._origMiddle;
  c.border = c._origBorder;
  c.appearance = c._origAppearance;
  delete c._origCenter; delete c._origMiddle;
  delete c._origBorder; delete c._origAppearance;
}

// ── ancien drawHaloForCircle conservé mais commenté ──────────────────────────
// // function drawHaloForCircle(c) { ... } // remplacé par applyHalo/removeHalo

// ─── Capsules de groupe (dessinées AVANT la molécule) ────────────────────────
// Chaque capsule a un remplissage noir pour cacher l'intérieur,
// et un stroke blanc pour le contour — le tout derrière les atomes et joints.
function drawGroupCapsules() {
  if (!moleculeComplete) return;
  if (!ui.hoveredGroups || ui.hoveredGroups.length === 0) return;

  const allIndices = [...new Set(ui.hoveredGroups.flatMap(g => g.atomIndices))];
  const groupCircles = objects.filter(c => allIndices.includes(c.moleculeAtomIndex));
  if (groupCircles.length === 0) return;

  // ── Paramètres visuels des capsules — tous dans settings (bloc "Capsules & groupes") ──
  // capsulePadRatio    → marge autour des atomes
  // capsuleStrokeColor → couleur du contour
  // capsuleFillColor   → couleur du fond
  // lineWidth          → lu depuis underlineThicknessPx (synchronisé avec l'underline CSS du label)

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  // Dessiner sur un canvas offscreen : d'abord tous les fonds, puis tous les contours
  // → les contours ne sont jamais recouverts par le fond d'une capsule voisine
  const off = document.createElement("canvas");
  off.width = canvas.width; off.height = canvas.height;
  const offCtx = off.getContext("2d");

  // Helper : dessine le path d'une capsule dans un contexte donné
  function capsulePath(octx, cx2, cy2, angle, halfLen, halfH) {
    octx.save();
    octx.translate(cx2, cy2);
    octx.rotate(angle);
    octx.beginPath();
    octx.roundRect(-halfLen, -halfH, halfLen * 2, halfH * 2, halfH);
    octx.restore();
  }

  const capsules = [];

  // Si le groupe a des subGroups, on dessine chaque sous-groupe séparément
  const activeGroup = ui.hoveredGroups[0];
  // capsuleIndices permet de restreindre les capsules à un sous-ensemble des halos
  const capsuleIndicesOverride = activeGroup && activeGroup.capsuleIndices;
  const subGroupsList = (activeGroup && activeGroup.subGroups)
    ? activeGroup.subGroups
    : [capsuleIndicesOverride || allIndices];

  function buildCapsulesForIndices(indices) {
    const subCircles = objects.filter(c => indices.includes(c.moleculeAtomIndex));
    if (subCircles.length === 0) return;
    if (subCircles.length === 1) {
      const c = subCircles[0];
      capsules.push({ type: "arc", x: c.drawX + c.noiseX, y: c.drawY + c.noiseY, r: c.diam * (1 + settings.capsulePadRatio) });
      return;
    }
    const molBonds = currentMolecule ? currentMolecule.bonds : [];
    const drawn = new Set();
    const atomsWithNeighbour = new Set();
    for (const bond of molBonds) {
      const [ia, ib] = bond;
      if (!indices.includes(ia) || !indices.includes(ib)) continue;
      atomsWithNeighbour.add(ia); atomsWithNeighbour.add(ib);
      const key = ia < ib ? `${ia}-${ib}` : `${ib}-${ia}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const ca = objects.find(c => c.moleculeAtomIndex === ia);
      const cb = objects.find(c => c.moleculeAtomIndex === ib);
      if (!ca || !cb) continue;
      const ax = ca.drawX + ca.noiseX, ay = ca.drawY + ca.noiseY;
      const bx = cb.drawX + cb.noiseX, by = cb.drawY + cb.noiseY;
      const angle = Math.atan2(by - ay, bx - ax);
      const cos = Math.cos(-angle), sin = Math.sin(-angle);
      const cx2 = (ax + bx) / 2, cy2 = (ay + by) / 2;
      const pad = Math.max(ca.diam, cb.diam) * settings.capsulePadRatio;
      const pts = [{ x: ax, y: ay, diam: ca.diam }, { x: bx, y: by, diam: cb.diam }];
      const localPts = pts.map(p => ({ lx: (p.x - cx2) * cos - (p.y - cy2) * sin, r: p.diam + pad }));
      const halfLen = Math.max(...localPts.map(p => Math.abs(p.lx) + p.r));
      const halfH = Math.max(ca.diam, cb.diam) + pad;
      capsules.push({ type: "rect", cx2, cy2, angle, halfLen, halfH });
    }
    // Si aucune capsule créée (pas de bond direct entre les indices),
    // et exactement 2 atomes : capsule directe entre eux
    if (drawn.size === 0 && subCircles.length === 2) {
      const ca = subCircles[0], cb = subCircles[1];
      const ax = ca.drawX + ca.noiseX, ay = ca.drawY + ca.noiseY;
      const bx = cb.drawX + cb.noiseX, by = cb.drawY + cb.noiseY;
      const angle = Math.atan2(by - ay, bx - ax);
      const cos = Math.cos(-angle), sin = Math.sin(-angle);
      const cx2 = (ax + bx) / 2, cy2 = (ay + by) / 2;
      const pad = Math.max(ca.diam, cb.diam) * settings.capsulePadRatio;
      const pts = [{ x: ax, y: ay, diam: ca.diam }, { x: bx, y: by, diam: cb.diam }];
      const localPts = pts.map(p => ({ lx: (p.x - cx2) * cos - (p.y - cy2) * sin, r: p.diam + pad }));
      const halfLen = Math.max(...localPts.map(p => Math.abs(p.lx) + p.r));
      const halfH = Math.max(ca.diam, cb.diam) + pad;
      capsules.push({ type: "rect", cx2, cy2, angle, halfLen, halfH });
    }
  }

  for (const subIndices of subGroupsList) buildCapsulesForIndices(subIndices);

  // Passe 1 : tous les contours blancs
  offCtx.strokeStyle = settings.capsuleStrokeColor; // ← settings bloc "Capsules & groupes"
  offCtx.lineWidth = settings.capsuleLineWidth ?? underlineThicknessPx; // ← null = sync underline/joints
  for (const cap of capsules) {
    if (cap.type === "arc") {
      offCtx.beginPath();
      offCtx.arc(cap.x, cap.y, cap.r, 0, Math.PI * 2);
      offCtx.stroke();
    } else {
      offCtx.save();
      offCtx.translate(cap.cx2, cap.cy2);
      offCtx.rotate(cap.angle);
      offCtx.beginPath();
      offCtx.roundRect(-cap.halfLen, -cap.halfH, cap.halfLen * 2, cap.halfH * 2, cap.halfH);
      offCtx.stroke();
      offCtx.restore();
    }
  }

  // Passe 2 : tous les fonds par-dessus — cache l'intérieur, le contour reste visible sur les bords
  offCtx.fillStyle = settings.capsuleFillColor; // ← settings bloc "Capsules & groupes"
  for (const cap of capsules) {
    if (cap.type === "arc") {
      offCtx.beginPath();
      // offCtx.arc(cap.x, cap.y, cap.r-4, 0, Math.PI * 2);
      offCtx.arc(cap.x, cap.y, cap.r - offCtx.lineWidth / 2, 0, Math.PI * 2);
      offCtx.fill();
    } else {
      offCtx.save();
      offCtx.translate(cap.cx2, cap.cy2);
      offCtx.rotate(cap.angle);
      offCtx.beginPath();
      // offCtx.roundRect(-cap.halfLen, -cap.halfH, cap.halfLen * 2, cap.halfH * 2, cap.halfH);
      const lw2 = offCtx.lineWidth / 2;
      offCtx.roundRect(-(cap.halfLen - lw2), -(cap.halfH - lw2), (cap.halfLen - lw2) * 2, (cap.halfH - lw2) * 2, cap.halfH - lw2);
      offCtx.fill();
      offCtx.restore();
    }
  }

  // Compositer l'offscreen DERRIÈRE tout ce qui est déjà dessiné
  ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

function drawHighlights() {
  if (!moleculeComplete) { for (const c of objects) removeHalo(c); return; }

  // Déterminer quels atomes doivent avoir le halo cette frame
  const highlighted = new Set();

  if (ui.hoveredAtomType) {
    const typeMap = { 0: "carbon", 1: "oxygen", 2: "hydrogen" };
    for (const c of objects) {
      if (typeMap[c.soundIndex] === ui.hoveredAtomType) highlighted.add(c);
    }
  }
  if (ui.hoveredAtomIndices) {
    for (const c of objects) {
      if (ui.hoveredAtomIndices.includes(c.moleculeAtomIndex)) highlighted.add(c);
      // if (ui.hoveredAtomIndices.includes(c.moleculeAtomIndex)) {
      //   for (let i = 0; i < objects.length; i++) {
      //     if (i != c) {
      //       highlighted.add(i);
      //     }
      //   }
      //   // highlighted.add(c);
      // }
      //!!!
    }
  }
  // Hover groupes → halo atomes commenté
  // if (ui.hoveredGroups && ui.hoveredGroups.length > 0) {
  //   const allIndices = [...new Set(ui.hoveredGroups.flatMap(g => g.atomIndices))];
  //   for (const c of objects) { if (allIndices.includes(c.moleculeAtomIndex)) highlighted.add(c); }
  // }

  const hasHover = highlighted.size > 0;

  for (const c of objects) {
    const isHighlighted = highlighted.has(c);
    let shouldBeWhite;
    if (!hasHover) {
      // Rien de hovered — tout normal
      shouldBeWhite = false;
    } else if (settings.hoverWhiteOnHovered) {
      // Blanc sur les hovérés
      shouldBeWhite = isHighlighted;
    } else {
      // Blanc sur les autres, hovérés restent normaux
      shouldBeWhite = !isHighlighted;
    }
    if (shouldBeWhite) applyHalo(c);
    else removeHalo(c);
  }
}



// ─── Interactions souris ──────────────────────────────────────────────────────

function mousePressed() {
  document.addEventListener("mousedown", (e) => {
    if (gui.domElement.contains(e.target)) return;
    if (ui.contains(e.target)) return;

    pressed = true;
    activeIndex = -1;

    for (let i = 0; i < objects.length; i++) {
      if (settings.hideAuto && objects[i].auto) continue;
      const dx = e.clientX - objects[i].drawX;
      const dy = e.clientY - objects[i].drawY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < objects[i].diam) {
        if (settings.deleteMode) { deleteCircle(i); pressed = false; return; }
        if (moleculeFading) return;
        activeIndex = i;
        objects[i].snapX = e.clientX;
        objects[i].snapY = e.clientY;
        return;
      }
    }

    if (moleculeFading || moleculeComplete) return;
    if (currentMolecule && atomQueue.length === 0) return;

    // Premier atome immédiatement au mousedown
    startDing(); // ding démarre au clic de création
    playArpege(); // arpège aléatoire au clic
    spawnAtom(e.clientX, e.clientY);

    // Continuer à en créer tant que la souris reste pressée
    atomSpawnTimer = setInterval(() => {
      if (!pressed || activeIndex >= 0) return;
      if (moleculeFading || moleculeComplete) { clearInterval(atomSpawnTimer); return; }
      if (currentMolecule && atomQueue.length === 0) { clearInterval(atomSpawnTimer); return; }
      spawnAtom(mouseX, mouseY);
    }, settings.atomSpawnInterval);
  });
}

// ─── Création d'un atome à une position donnée ────────────────────────────────
let atomSpawnTimer = null;

function spawnAtom(x, y) {
  const c = addCircle(x, y);

  if (currentMolecule && atomQueue.length > 0) {
    const atomIdx = atomQueue.shift();
    const atomDef = currentMolecule.atoms[atomIdx];
    const paletteByType = { carbon: 0, oxygen: 1, hydrogen: 2 };
    const p = palettes[paletteByType[atomDef.type]];
    c.border = p.border; c.middle = p.middle; c.center = p.center;
    c.soundIndex = p.soundIndex; c.maxBonds = p.maxBonds; c.diam = p.diam;
    c.moleculeAtomIndex = atomIdx;
    c.atomDef = atomDef;

    const { tx: targetX, ty: targetY } = getMoleculeTargetPos(atomDef);
    c.startX = targetX; c.startY = targetY;
    c.x = targetX; c.y = targetY;
    c.drawX = x; c.drawY = y;
    c.snapX = targetX; c.snapY = targetY;
    c.A = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
    c.angle = Math.atan2(y - targetY, x - targetX);
    c.t = 0;
    c.returning = true;
    c._spawnSpeedBack = settings.spawnSpeedBack; // retour lent uniquement à la création

    // Liaisons guidées par la définition
    const newIdx = c.moleculeAtomIndex;
    for (const bond of currentMolecule.bonds) {
      const [ia, ib, isDouble] = bond;
      const partnerDefIdx = ia === newIdx ? ib : ib === newIdx ? ia : -1;
      if (partnerDefIdx === -1) continue;
      const partner = objects.find(o => o.moleculeAtomIndex === partnerDefIdx);
      if (!partner) continue;
      joints.push(new Joint(ctx, partner, c, Math.max(partner.diam, c.diam), !!isDouble));
    }
  } else {
    addJointsForNewCircle(c); // fallback mode classic
  }

  objects.push(c);
  activeIndex = -1; // pas de drag — l'atome part librement vers sa position

  // Son à la création
  playHoly(objects.length - 1, c.atomDef?.soundDetune ?? 0); // atomId = index dans objects
  // if (!c.playing) {
  //   c.playing = true;
  //   playSoundMuted(c.soundIndex, 0.6, { detune: computeDetune(c), reverb: settings.soundReverb, playbackRate: settings.soundPlaybackRate });
  //   setTimeout(() => { c.playing = false; }, 500);
  // }
}

// ─── Dissolution : atomes "jetés" hors écran ─────────────────────────────────
// Si un atome est relâché hors de l'écran (avec une marge),
// tous les atomes partent vers l'extérieur et on recommence.
// const THROW_MARGIN = 60; // px hors de la zone visible pour déclencher la dissolution

let dissolving = false; // true pendant que les atomes s'envolent

function triggerDissolve(throwSpeed = settings.dissolveSpeed) {
  if (dissolving || moleculeFading) return;
  dissolving = true;
  fadeOutHolySounds(settings.holyFadeOut); // fade out des sons holy liés à la molécule
  stopDing();          // fade out du ding
  playBop();           // pas affecté par mute

  // Supprimer les joints immédiatement
  joints = [];

  // Chaque atome reçoit une vitesse initiale depuis le centre + écart aléatoire
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (const c of objects) {
    const dx = c.drawX - cx;
    const dy = c.drawY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const scatter = (Math.random() - 0.5) * (Math.PI / settings.dissolveScatter);
    const angle = baseAngle + scatter;
    c._vx = Math.cos(angle) * throwSpeed;
    c._vy = Math.sin(angle) * throwSpeed;
    // returning=true bloque le recalcul drawX/drawY depuis startX dans cercle.draw()
    c.returning = true;
    c.hovered = false;
  }
}

function checkDissolveComplete() {
  if (!dissolving) return;
  // Tous les atomes hors écran ?
  const margin = 200;
  const allOut = objects.every(c =>
    c.drawX < -margin || c.drawX > window.innerWidth + margin ||
    c.drawY < -margin || c.drawY > window.innerHeight + margin
  );
  if (allOut) {
    dissolving = false;
    objects = [];
    joints = [];
    moleculeComplete = false;
    pickRandomMolecule();
  }
}

function mouseReleased() {
  document.addEventListener("mouseup", (e) => {
    if (gui.domElement.contains(e.target)) return;
    if (ui.contains(e.target)) return;
    pressed = false;
    pauseDing(); // ding en pause au relâchement
    // Arrêter la création automatique d'atomes
    if (atomSpawnTimer) { clearInterval(atomSpawnTimer); atomSpawnTimer = null; }
    if (activeIndex >= 0) {
      const c = objects[activeIndex];

      if (c.dragging && !c.playing) {
        c.playing = true;
        playSoundMuted(c.soundIndex, computeVolume(c), { detune: computeDetune(c), reverb: computeReverb(c), playbackRate: settings.soundPlaybackRate });
        setTimeout(() => { c.playing = false; }, 500);
      }
      c.release();
    }
    activeIndex = -1;
  });
}

// THROW_BORDER et THROW_MIN_SPEED gérés dans settings.throwBorder / settings.throwMinSpeed

function mouseMove() {
  document.addEventListener("mousemove", (e) => {
    mouseDX = e.clientX - mouseX;
    mouseDY = e.clientY - mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Détecter un throw : atome draggé + souris rapide + proche du bord
    if (pressed && activeIndex >= 0 && !dissolving) {
      const c = objects[activeIndex];
      if (c && c.dragging) {
        const speed = Math.sqrt(mouseDX * mouseDX + mouseDY * mouseDY);
        const atBorder =
          e.clientX < settings.throwBorder ||
          e.clientX > window.innerWidth - settings.throwBorder ||
          e.clientY < settings.throwBorder ||
          e.clientY > window.innerHeight - settings.throwBorder;
        if (atBorder && speed >= settings.throwMinSpeed) {
          pressed = false;
          activeIndex = -1;
          triggerDissolve(speed);
        }
      }
    }

    for (let i = 0; i < objects.length; i++) {
      const dx = e.clientX - objects[i].startX;
      const dy = e.clientY - objects[i].startY;
      objects[i].angle = Math.atan2(dy, dx);
      if (pressed && i === activeIndex) {
        objects[i].snapX = e.clientX;
        objects[i].snapY = e.clientY;
      }
    }
  });
}

function mouseLeave() {
  document.addEventListener("mouseleave", () => {
    mouseX = -9999; mouseY = -9999;
    mouseDX = 0; mouseDY = 0;
    for (const c of objects) {
      if (!c.hovered) continue;
      c.hovered = false;
      c.A = Math.sqrt((c.drawX - c.startX) ** 2 + (c.drawY - c.startY) ** 2);
      c.returning = true;
      c.t = 0;
    }
  });
}

function mouseEnter() {
  document.addEventListener("mouseenter", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    mouseDX = 0; mouseDY = 0;
  });
}



function backgroundNoise() {
  // ambient sounds handled by loadAndLoopAmbient
}
// ─── Démarrage ────────────────────────────────────────────────────────────────

pickRandomMolecule();
ui.applyLabelMode(settings);

mousePressed();
mouseReleased();
mouseMove();
mouseLeave();
mouseEnter();
draw();
backgroundNoise();

function drawDecorLoop() {
  decorCtx.globalCompositeOperation = "source-over";
  decorCtx.fillStyle = `rgba(0,0,0,${settings.disparition})`;
  decorCtx.fillRect(0, 0, decorCanvas.width, decorCanvas.height);
  drawDecor(decorCtx, 4, 0.15, settings.decorFlatFill);
  requestAnimationFrame(drawDecorLoop);
}
drawDecorLoop();

// ─── dat.GUI ──────────────────────────────────────────────────────────────────

// const folderOscillateur = gui.addFolder("Oscillateur harmonique");
// folderOscillateur.add(settings, "omega", 0, 30).name("Fréquence angulaire");
// folderOscillateur.add(settings, "gamma", 0, 10).step(0.05).name("Amortissement");
// folderOscillateur.add(settings, "speedBack", 0, 5).step(0.001).name("Retour");
// folderOscillateur.add(settings, "hoverRadius", 0, 800).step(1).name("Rayon hover");
// folderOscillateur.add(settings, "hoverStrength", 0, 0.3).step(0.001).name("Force hover");
// folderOscillateur.open();

// const folderDynamique = gui.addFolder("Dynamique moléculaire");
// folderDynamique.add(settings, "omegaFull", 0, 30).step(0.1).name("Fréq. lié");
// folderDynamique.add(settings, "gammaFull", 0, 10).step(0.05).name("Amorti. lié");
// folderDynamique.add(settings, "speedBackFull", 0, 5).step(0.001).name("Retour lié");
// folderDynamique.add(settings, "omegaFree", 0, 30).step(0.1).name("Fréq. libre");
// folderDynamique.add(settings, "gammaFree", 0, 10).step(0.05).name("Amorti. libre");
// folderDynamique.add(settings, "speedBackFree", 0, 5).step(0.001).name("Retour libre");
// folderDynamique.open();

// const folderApparence = gui.addFolder("Apparence");
// folderApparence.add(settings, "style", ["classic", "different"]).name("Style").onChange(() => {
//   for (const c of objects) {
//     c.diam = settings.style === "different" ? palettes[c.soundIndex].diam : settings.diam;
//   }
//   if (settings.style === "classic") {
//     buildDecor(decorCtx, decorCanvas, settings.diam, settings.decorClusterCount);
//   } else {
//     clearDecor();
//   }
// });
// folderApparence.add(settings, "diam", 0, 200).name("Diamètre");
// folderApparence.add(settings, "compositeOperation", ["lighter", "lighten", "multiply", "screen", "color-dodge", "color-burn"]).name("Fusion");
// //lighter, multiply, screen, color dodge, color burn ?, 
// folderApparence.open();

// const folderNoise = gui.addFolder("Bruit");
// folderNoise.add(settings, "noiseAmount", 0, 100).step(0.1).name("Amplitude");
// folderNoise.add(settings, "noiseSpeed", 0, 2).step(0.01).name("Vitesse");
// folderNoise.add(settings, "noiseAmplitudeMin", 0, 100).step(0.1).name("Amplitude min (lié)");
// folderNoise.add(settings, "noiseAmplitudeMax", 0, 100).step(0.1).name("Amplitude max (libre)");
// folderNoise.add(settings, "noiseSpeedMin", 0, 3).step(0.01).name("Vitesse min (lié)");
// folderNoise.add(settings, "noiseSpeedMax", 0, 3).step(0.01).name("Vitesse max (libre)");
// folderNoise.add(settings, "noiseFq1", 0, 10).step(0.01).name("Fréquence 1");
// folderNoise.add(settings, "noiseAmp1", 0, 1).step(0.01).name("Amplitude 1");
// folderNoise.add(settings, "noiseFq2", 0, 10).step(0.01).name("Fréquence 2");
// folderNoise.add(settings, "noiseAmp2", 0, 1).step(0.01).name("Amplitude 2");
// folderNoise.add(settings, "noiseFq3", 0, 10).step(0.01).name("Fréquence 3");
// folderNoise.add(settings, "noiseAmp3", 0, 1).step(0.01).name("Amplitude 3");
// folderNoise.open();

const folderSon = gui.addFolder("Son");
folderSon.add(settings, "maxAmplitude", 0, 800).step(1).name("Amplitude max");
folderSon.add(settings, "minVolume", 0, 1).step(0.01).name("Volume minimum");
folderSon.add(settings, "soundPlaybackRate", 0.25, 4).step(0.01).name("Vitesse lecture");

const folderDo = folderSon.addFolder("do (carbone)");
folderDo.add(settings, "doVolume", 0, 2, 0.05).name("Volume");
folderDo.add(settings, "doDetune", -1200, 1200, 1).name("Détune (cents)");
folderDo.add(settings, "doReverb", 0, 1, 0.01).name("Reverb");

const folderMi = folderSon.addFolder("mi (oxygène)");
folderMi.add(settings, "miVolume", 0, 2, 0.05).name("Volume");
folderMi.add(settings, "miDetune", -1200, 1200, 1).name("Détune (cents)");
folderMi.add(settings, "miReverb", 0, 1, 0.01).name("Reverb");

const folderSolG = folderSon.addFolder("solG (hydrogène)");
folderSolG.add(settings, "solGVolume", 0, 2, 0.05).name("Volume");
folderSolG.add(settings, "solGDetune", -1200, 1200, 1).name("Détune (cents)");
folderSolG.add(settings, "solGReverb", 0, 1, 0.01).name("Reverb");
// folderSon.add(settings, "mute").name("Mute");
// folderSon.open();

// const folderOptions = gui.addFolder("Options");
// folderOptions.add(settings, "hideAuto").name("Cacher auto");
// folderOptions.add(settings, "deleteMode").name("Mode suppression");
// folderOptions.open();

// const folderDecor = gui.addFolder("Décor");
// folderDecor.add(settings, "fadeSpeed", 0.001, 0.05).step(0.001).name("Vitesse disparition");
// folderDecor.add(settings, "decorClusterCount", 0, 10).step(1).name("Nb clusters").onChange(() => {
//   buildDecor(decorCtx, decorCanvas, settings.diam, settings.decorClusterCount);
// });
// folderDecor.add(settings, "decorFlatFill").name("Aplat uni");
// folderDecor.open();


// ─── Dossier GUI : Halo ──────────────────────────────────────────────────────
// const folderHalo = gui.addFolder("Halo");
// folderHalo.add(settings, "haloRatio", 0.5, 5).step(0.05).name("Ratio taille/atome");
// folderHalo.add(settings, "haloComposite", ["source-over", "screen", "lighten", "difference", "exclusion", "overlay", "color-dodge"]).name("Composite");
// // const folderHaloC = folderHalo.addFolder("Carbone");
// // folderHaloC.addColor(settings, "haloC_inner").name("Inner");
// // folderHaloC.add(settings, "haloC_innerAlpha", 0, 1).step(0.01).name("Inner alpha");
// // folderHaloC.addColor(settings, "haloC_mid").name("Mid");
// // folderHaloC.add(settings, "haloC_midAlpha", 0, 1).step(0.01).name("Mid alpha");
// // folderHaloC.add(settings, "haloC_midPos", 0, 1).step(0.01).name("Mid pos");
// // folderHaloC.addColor(settings, "haloC_outer").name("Outer");
// // folderHaloC.add(settings, "haloC_outerAlpha", 0, 1).step(0.01).name("Outer alpha");
// const folderHaloO = folderHalo.addFolder("Oxygène");
// folderHaloO.addColor(settings, "haloO_inner").name("Inner");
// // folderHaloO.add(settings, "haloO_innerAlpha", 0, 1).step(0.01).name("Inner alpha");
// folderHaloO.addColor(settings, "haloO_mid").name("Mid");
// // folderHaloO.add(settings, "haloO_midAlpha", 0, 1).step(0.01).name("Mid alpha");
// folderHaloO.add(settings, "haloO_midPos", 0, 1).step(0.01).name("Mid pos");
// folderHaloO.addColor(settings, "haloO_outer").name("Outer");
// // folderHaloO.add(settings, "haloO_outerAlpha", 0, 1).step(0.01).name("Outer alpha");
// // const folderHaloH = folderHalo.addFolder("Hydrogène");
// // folderHaloH.addColor(settings, "haloH_inner").name("Inner");
// // folderHaloH.add(settings, "haloH_innerAlpha", 0, 1).step(0.01).name("Inner alpha");
// // folderHaloH.addColor(settings, "haloH_mid").name("Mid");
// // folderHaloH.add(settings, "haloH_midAlpha", 0, 1).step(0.01).name("Mid alpha");
// // folderHaloH.add(settings, "haloH_midPos", 0, 1).step(0.01).name("Mid pos");
// // folderHaloH.addColor(settings, "haloH_outer").name("Outer");
// // folderHaloH.add(settings, "haloH_outerAlpha", 0, 1).step(0.01).name("Outer alpha");
// folderHalo.open();

// const folderInteraction = gui.addFolder("Interaction");
// folderInteraction.add(settings, "atomSpawnInterval", 100, 2000).step(50).name("Intervalle atomes (ms)");
// folderInteraction.open();

function repositionAllAtoms() {
  if (!currentMolecule) return;
  for (const c of objects) {
    if (!c.atomDef) continue;
    const { tx, ty } = getMoleculeTargetPos(c.atomDef);
    c.startX = tx; c.startY = ty;
    c.snapX = tx; c.snapY = ty;
    c.A = Math.sqrt((c.drawX - tx) ** 2 + (c.drawY - ty) ** 2);
    c.angle = Math.atan2(c.drawY - ty, c.drawX - tx);
    c.t = 0;
    c.returning = true;
  }
}

// const folderExplosion = gui.addFolder("Explosion");
// folderExplosion.add(settings, "dissolveSpeed", 1, 30).step(0.5).name("Vitesse initiale");
// folderExplosion.add(settings, "dissolveAccel", 1, 1.3).step(0.01).name("Accélération");
// folderExplosion.add(settings, "dissolveScatter", 0.5, 4).step(0.1).name("Dispersion");
// folderExplosion.add(settings, "throwBorder", 5, 100).step(1).name("Zone de bord (px)");
// folderExplosion.add(settings, "throwMinSpeed", 1, 30).step(1).name("Vitesse min souris");
// folderExplosion.open();

// const folderMolecule = gui.addFolder("Molécule");
// folderMolecule.add(moleculeScale, "x", 0.5, 5).step(0.05).name("Scale X").onChange(repositionAllAtoms);
// folderMolecule.add(moleculeScale, "y", 0.5, 5).step(0.05).name("Scale Y").onChange(repositionAllAtoms);
// folderMolecule.add(moleculeOffset, "x", -window.innerWidth / 2, window.innerWidth / 2).step(1).name("Position X").onChange(repositionAllAtoms);
// folderMolecule.add(moleculeOffset, "y", -window.innerHeight / 2, window.innerHeight / 2).step(1).name("Position Y").onChange(repositionAllAtoms);
// folderMolecule.add(settings, "spawnSpeedBack", 0.001, 1).step(0.001).name("Vitesse retour création");
// folderMolecule.open();

// const folderAtomes = gui.addFolder("Atomes");
// folderAtomes.add(settings, "atomScale", 0.1, 3).step(0.05).name("Scale atomes").onChange(() => {
//   for (const c of objects) { c.diam = palettes[c.soundIndex].diam * settings.atomScale; }
// });
// folderAtomes.add(settings, "jointWidthRatio", 0.01, 0.5).step(0.01).name("Largeur joints");
// folderAtomes.add(settings, "capsulePadRatio", 0, 1).step(0.001).name("Marge capsule/atome");
// folderAtomes.open();

// ── Label molécule — tailles/positions dans LABEL_STYLES (ui.js), opacités ici ──
// const folderLabel = gui.addFolder("Label molécule");
// folderLabel.add(settings, "labelMerged").name("Fusionné").onChange(() => ui.applyLabelMode(settings));
// folderLabel.add(settings, "hoverWhiteOnHovered").name("Blanc sur hovérés");

// const folderSonHoly = gui.addFolder("Son Holy");
// folderSonHoly.add(settings, "holyFadeOut", 0.1, 5, 0.1).name("Fade out (s)");

// const folderSonHoly = gui.addFolder("Son Holy");
// folderSonHoly.add(settings, "holyFreqMin", 100, 2000, 10).name("Fréquence repos (Hz)");
// folderSonHoly.add(settings, "holyFreqMax", 500, 8000, 50).name("Fréquence max (Hz)");
// folderSonHoly.add(settings, "holyOffsetMin", 0, 50, 1).name("Offset min (px)");
// folderSonHoly.add(settings, "holyOffsetMax", 10, 300, 5).name("Offset max (px)");

// folderLabel.add(settings, "hoverWhiteOnHovered").name("Blanc sur hovérés");

// const folderLabelMerge = folderLabel.addFolder("Mode fusionné");
// folderLabelMerge.add(settings, "labelOpacity", 0, 1).step(0.01).name("Opacité").onChange(() => ui.applyLabelMode(settings));

// const folderLabelName = folderLabel.addFolder("Nom");
// folderLabelName.add(settings, "labelNameOpacity", 0, 1).step(0.01).name("Opacité").onChange(() => ui.applyLabelMode(settings));

// const folderLabelVulgar = folderLabel.addFolder("Vulgarisé");
// folderLabelVulgar.add(settings, "labelVulgarOpacity", 0, 1).step(0.01).name("Opacité").onChange(() => ui.applyLabelMode(settings));

// const folderLabelFormula = folderLabel.addFolder("Formule");
// folderLabelFormula.add(settings, "labelFormulaOpacity", 0, 1).step(0.01).name("Opacité").onChange(() => ui.applyLabelMode(settings));
// folderLabel.open();