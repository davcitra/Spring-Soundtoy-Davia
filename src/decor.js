/**
 * decor.js
 * Renders static background clusters of circles connected by joints.
 * Non-interactive — purely visual decoration.
 *
 * Usage in main.js:
 *   import { buildDecor, drawDecor } from "./decor.js";
 *   // After canvas is created and before draw():
 *   buildDecor(ctx, canvas, settings.diam, settings.decorClusterCount);
 *   // Inside your draw() loop, call FIRST (before joints and circles):
 *   drawDecor(ctx, 4, 0.15, settings.decorFlatFill);
 */

// ─── Internal state ──────────────────────────────────────────────────────────

let decorClusters = []; // array of { circles, joints, grey }

// ─── Config — change these two values to control decor appearance ─────────────
export const CLUSTER_START_GREY = 150;
export const CLUSTER_DARKEN_SPEED = 0.1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

/** Simple deterministic-ish noise for gentle idle animation */
function decorNoise(x) {
    return (
        Math.sin(x * 1.1) * 0.5 +
        Math.sin(x * 2.3 + 1.4) * 0.25 +
        Math.sin(x * 5.1 + 2.9) * 0.125
    );
}

// ─── Build ────────────────────────────────────────────────────────────────────

/** Clear all decor clusters (used when switching to different style) */
export function clearDecor() {
    decorClusters = [];
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement}        canvas
 * @param {number} interactiveDiam   diameter of the interactive circles
 * @param {number} clusterCount      how many clusters to generate (default 3)
 */
export function buildDecor(ctx, canvas, interactiveDiam, clusterCount = 3) {
    decorClusters = [];

    const diam = interactiveDiam / 2; // decor circles are 2× smaller
    const margin = diam * 4;           // keep away from edges

    for (let c = 0; c < clusterCount; c++) {
        // ── Grey level: each cluster gets its own shade ──────────────────────────
        // Spread shades between 25 (dark) and 80 (lighter) to stay subtle
        const greyValue = Math.round(25 + (c / (clusterCount - 1 || 1)) * 55);
        const grey = `rgb(${greyValue},${greyValue},${greyValue})`;
        const greyDim = `rgb(${Math.round(greyValue * 0.35)},${Math.round(greyValue * 0.35)},${Math.round(greyValue * 0.35)})`;
        const greyBright = `rgb(${Math.min(255, Math.round(greyValue * 1.8))},${Math.min(255, Math.round(greyValue * 1.8))},${Math.min(255, Math.round(greyValue * 1.8))})`;

        // ── Cluster center ───────────────────────────────────────────────────────
        const cx = randomBetween(margin, canvas.width - margin);
        const cy = randomBetween(margin, canvas.height - margin);

        // ── Number of circles in this cluster (2–5) ──────────────────────────────
        const count = Math.floor(randomBetween(2, 6));

        // ── Place circles around the centre with some scatter ────────────────────
        const circles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + randomBetween(-0.4, 0.4);
            const spread = randomBetween(diam * 1.5, diam * 5);
            const x = cx + Math.cos(angle) * spread;
            const y = cy + Math.sin(angle) * spread;

            circles.push({
                x,
                y,
                diam,
                // unique noise phase so they don't all wiggle in sync
                noisePhaseX: Math.random() * 100,
                noisePhaseY: Math.random() * 100,
                noiseX: 0,
                noiseY: 0,
            });
        }

        // ── Build a minimal spanning tree of joints (nearest-neighbour chain) ────
        // This guarantees the cluster is connected without any crossing spaghetti.
        const joints = [];
        const connected = [0];
        const remaining = circles.map((_, i) => i).slice(1);

        while (remaining.length > 0) {
            let bestI = -1, bestJ = -1, bestDist = Infinity;
            for (const ci of connected) {
                for (const ri of remaining) {
                    const dx = circles[ci].x - circles[ri].x;
                    const dy = circles[ci].y - circles[ri].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < bestDist) { bestDist = dist; bestI = ci; bestJ = ri; }
                }
            }
            joints.push({ a: bestI, b: bestJ });
            connected.push(bestJ);
            remaining.splice(remaining.indexOf(bestJ), 1);
        }

        decorClusters.push({ circles, joints, diam, greyValue: CLUSTER_START_GREY });
    }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

let decorTime = 0;

/**
 * Call this inside your main draw() loop, BEFORE drawing interactive circles.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} noiseAmount   how many px the decor circles wiggle (default 4)
 * @param {number} noiseSpeed    animation speed (default 0.15)
 * @param {boolean} flatFill     true = solid grey for circles and joints, false = gradients
 */
export function drawDecor(ctx, noiseAmount = 4, noiseSpeed = 0.15, flatFill = false) {
    decorTime += noiseSpeed / 60;

    // always draw decor in source-over, regardless of what the interactive circles use
    ctx.globalCompositeOperation = "source-over";

    for (const cluster of decorClusters) {
        const { circles, joints, diam } = cluster;

        // darken over time — greyValue goes from 255 (white) down to 0 (black)
        cluster.greyValue = Math.max(0, cluster.greyValue - CLUSTER_DARKEN_SPEED);
        const greyValue = Math.round(cluster.greyValue);
        const grey = `rgb(${greyValue},${greyValue},${greyValue})`;
        const greyDim = `rgb(${Math.round(greyValue * 0.35)},${Math.round(greyValue * 0.35)},${Math.round(greyValue * 0.35)})`;
        const greyBright = `rgb(${Math.min(255, Math.round(greyValue * 1.8))},${Math.min(255, Math.round(greyValue * 1.8))},${Math.min(255, Math.round(greyValue * 1.8))})`;

        // ── Update noise positions ────────────────────────────────────────────────
        for (const c of circles) {
            c.noiseX = decorNoise(decorTime + c.noisePhaseX) * noiseAmount;
            c.noiseY = decorNoise(decorTime + c.noisePhaseY) * noiseAmount;
        }

        // ── Draw joints ──────────────────────────────────────────────────────────
        for (const j of joints) {
            const ca = circles[j.a];
            const cb = circles[j.b];

            const ax = ca.x + ca.noiseX;
            const ay = ca.y + ca.noiseY;
            const bx = cb.x + cb.noiseX;
            const by = cb.y + cb.noiseY;

            const dx = bx - ax;
            const dy = by - ay;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) continue;
            const angle = Math.atan2(dy, dx);
            const jWidth = diam / 5;

            const offscreen = document.createElement("canvas");
            offscreen.width = ctx.canvas.width;
            offscreen.height = ctx.canvas.height;
            const off = offscreen.getContext("2d");

            off.save();
            off.translate(ax, ay);
            off.rotate(angle);
            off.fillStyle = grey;

            if (j.double) {
                const offset = jWidth * 1.25;
                off.beginPath();
                off.rect(0, -offset - jWidth / 2, length, jWidth);
                off.fill();
                off.beginPath();
                off.rect(0, offset - jWidth / 2, length, jWidth);
                off.fill();
            } else {
                off.beginPath();
                off.rect(0, -jWidth / 2, length, jWidth);
                off.fill();
            }
            off.restore();

            // punch out circle areas
            off.globalCompositeOperation = "destination-out";
            for (const cc of circles) {
                off.beginPath();
                off.arc(cc.x + cc.noiseX, cc.y + cc.noiseY, cc.diam, 0, Math.PI * 2);
                off.fill();
            }

            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(offscreen, 0, 0);
        }

        // ── Draw circles ─────────────────────────────────────────────────────────
        for (const c of circles) {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = grey;
            ctx.beginPath();
            ctx.arc(c.x + c.noiseX, c.y + c.noiseY, c.diam, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // reset to source-over after decor so the rest of the frame starts clean
    ctx.globalCompositeOperation = "source-over";
}

/**
 * Takes a completed interactive molecule and adds it as a new decor cluster.
 * @param {Array} moleculeCircles  the objects[] array from main.js
 * @param {Array} moleculeJoints   the joints[] array from main.js
 */
export function addDecorCluster(moleculeCircles, moleculeJoints) {
    if (moleculeCircles.length === 0) return;

    const circles = moleculeCircles.map(c => ({
        x: c.drawX,
        y: c.drawY,
        diam: c.diam,
        noisePhaseX: Math.random() * 100,
        noisePhaseY: Math.random() * 100,
        noiseX: 0,
        noiseY: 0,
    }));

    const joints = moleculeJoints.map(j => ({
        a: moleculeCircles.indexOf(j.circleA),
        b: moleculeCircles.indexOf(j.circleB),
        double: j.double,
    })).filter(j => j.a !== -1 && j.b !== -1);

    const diam = circles[0].diam;
    decorClusters.push({ circles, joints, diam, greyValue: CLUSTER_START_GREY });
}