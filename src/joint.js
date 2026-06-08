export default class Joint {
    constructor(ctx, circleA, circleB, diam, allowDouble = true) {
        this.ctx = ctx;
        this.circleA = circleA;
        this.circleB = circleB;
        // this.width = diam / 5;
        this.width = diam / 10;

        this.double = allowDouble;
        this.flatColor = null;
    }

    draw(allCircles) {
        const ax = this.circleA.drawX + this.circleA.noiseX;
        const ay = this.circleA.drawY + this.circleA.noiseY;
        const bx = this.circleB.drawX + this.circleB.noiseX;
        const by = this.circleB.drawY + this.circleB.noiseY;

        const dx = bx - ax;
        const dy = by - ay;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;

        const angle = Math.atan2(dy, dx);

        // Canvas partagé entre tous les joints — passé depuis main.js
        const off = Joint.sharedCtx;
        if (!off) return;

        off.save();
        off.translate(ax, ay);
        off.rotate(angle);

        const color = this.flatColor || "white";

        if (this.double) {
            const offset = Math.min(this.circleA.diam, this.circleB.diam) / 3;
            off.fillStyle = color;
            off.beginPath();
            off.rect(0, -offset - this.width / 2, length, this.width);
            off.fill();
            off.beginPath();
            off.rect(0, offset - this.width / 2, length, this.width);
            off.fill();
        } else {
            off.fillStyle = color;
            off.beginPath();
            off.rect(0, -this.width / 2, length, this.width);
            off.fill();
        }

        off.restore();
    }
}

// Canvas offscreen partagé — initialisé une fois depuis main.js
Joint.sharedCanvas = null;
Joint.sharedCtx = null;

export function initJointCanvas(width, height) {
    Joint.sharedCanvas = document.createElement("canvas");
    Joint.sharedCanvas.width = width;
    Joint.sharedCanvas.height = height;
    Joint.sharedCtx = Joint.sharedCanvas.getContext("2d");
}

// Appeler après avoir dessiné tous les joints :
// efface les zones des atomes puis composite sur le canvas principal
export function flushJoints(mainCtx, allCircles) {
    const off = Joint.sharedCtx;
    if (!off) return;

    // Effacer les zones des atomes (punch out)
    off.globalCompositeOperation = "destination-out";
    for (const c of allCircles) {
        off.beginPath();
        off.arc(c.drawX + c.noiseX, c.drawY + c.noiseY, c.diam, 0, Math.PI * 2);
        off.fill();
    }

    // Compositer sur le canvas principal
    off.globalCompositeOperation = "source-over";
    mainCtx.drawImage(Joint.sharedCanvas, 0, 0);

    // Effacer pour la prochaine frame
    off.clearRect(0, 0, Joint.sharedCanvas.width, Joint.sharedCanvas.height);
}