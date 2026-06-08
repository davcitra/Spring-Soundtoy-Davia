export default class Circle {
    constructor(ctx, columns, rows, i) {
        this.ctx = ctx;
        this.columns = columns;
        this.rows = rows;
        this.i = i;
        // cercle.startX = canvas.width / 2;
        // cercle.startY = canvas.height / 2;

        // this.startX = window.innerWidth / 2;
        // this.startY = window.innerHeight / 2;

        this.startX = ((this.i % this.columns) + 1) * (window.innerWidth / (columns + 1));
        this.startY = (Math.floor(this.i / this.columns) + 1) * (window.innerHeight / (rows + 1));

        this.x = this.startX; // initialize so draw() never gets NaN before first update
        this.y = this.startY;

        this.A = 0;
        this.omega = 8; //avant 1
        this.phi = 0;
        this.radius = 25;
        this.diam = this.radius * 2;
        this.color = "#ffffff";
        this.gamma = 1.5;
        this.t = 0;
        this.angle = 0;
        this.snapX = this.startX;
        this.snapY = this.startY;
        this.drawX = this.startX;
        this.drawY = this.startY;
        this.speedBack = 0.05;
        this.disparition = 0.5;
        this.border = `rgb(0, 15, 195)`;
        this.middle = `rgb(91, 132, 255)`;
        this.center = `rgb(180, 240, 255)`;
        this.appearance = 0.5;
        this.returning = false;
        this.dragging = false; // true once threshold is passed
        this.threshold = 60;  // px to drag before snapping
        this.dragSpeed = 0.01;
        this.followSpeed = 0.15;
        this.hovered = false;
        this.noiseX = 0; // noise offset applied at draw time
        this.noiseY = 0;
    }

    update(pressed) {
        if (pressed) {
            this.returning = false;
            const dx = this.snapX - this.startX;
            const dy = this.snapY - this.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (!this.dragging && dist > this.threshold) {
                // threshold passed, snap and follow freely
                this.dragging = true;
            }

            if (this.dragging) {
                // smooth follow once threshold passed
                this.drawX += (this.snapX - this.drawX) * this.followSpeed;
                this.drawY += (this.snapY - this.drawY) * this.followSpeed;
            } else {
                // very slow drag with strong distance delay
                this.drawX += (this.snapX - this.drawX) * this.dragSpeed;
                this.drawY += (this.snapY - this.drawY) * this.dragSpeed;
            }
            return;
        }

        this.t += 1 / 60;
        this.x = this.startX + this.A * Math.exp(-this.gamma * this.t) * Math.cos(this.omega * this.t + this.phi);
        this.v = -this.A * this.omega * Math.sin(this.omega * this.t + this.phi);

        const targetX = this.startX + (this.x - this.startX) * Math.cos(this.angle);
        const targetY = this.startY + (this.x - this.startX) * Math.sin(this.angle);

        if (this.returning) {
            const dx = targetX - this.drawX;
            const dy = targetY - this.drawY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2) {
                this.returning = false;
            } else {
                this.drawX += dx * this.speedBack;
                this.drawY += dy * this.speedBack;
            }
        }

        // if (pressed) {
        //     if (!pressed) {
        //         this.drop();
        //     }
        //     this.force();
        // }
    }

    release() {
        if (this.dragging) {
            // was dragged past threshold, spring back
            this.returning = true;
            this.A = Math.sqrt(
                Math.pow(this.drawX - this.startX, 2) +
                Math.pow(this.drawY - this.startY, 2)
            );
            this.t = 0;
        }
        this.dragging = false;
    }

    drawBase() {
        // solid black circle to block joints underneath
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.arc(this.drawX + this.noiseX, this.drawY + this.noiseY, this.diam, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // draw(pressed) {
    //     // this.ctx.strokeStyle = this.color;
    //     this.ctx.fillStyle = this.color;
    //     this.ctx.lineWidth = 2;

    //     if (!pressed) {
    //         const offset = this.x - this.startX;
    //         this.drawX = this.startX + offset * Math.cos(this.angle);
    //         this.drawY = this.startY + offset * Math.sin(this.angle);
    //     }

    //     this.ctx.beginPath();
    //     // this.ctx.arc(this.x, this.startY, this.diam, 0, Math.PI * 2);
    //     this.ctx.arc(this.drawX, this.drawY, this.diam, 0, Math.PI * 2);
    //     // this.ctx.stroke();
    //     this.ctx.fill();
    // }

    draw(pressed) {
        this.ctx.globalCompositeOperation = this.compositeOperation;

        // only recompute drawX/drawY from oscillation if not pressed, not returning, and not being hovered
        if (!pressed && !this.returning && !this.hovered) {
            const offset = this.x - this.startX;
            this.drawX = this.startX + offset * Math.cos(this.angle);
            this.drawY = this.startY + offset * Math.sin(this.angle);
        }

        // apply noise on top of drawX/drawY — reset to 0 when pressed or dragged
        const nx = pressed ? 0 : this.noiseX;
        const ny = pressed ? 0 : this.noiseY;

        const gradient = this.ctx.createRadialGradient(
            this.drawX + nx, this.drawY + ny, 0,
            this.drawX + nx, this.drawY + ny, this.diam
        );

        gradient.addColorStop(0, this.center);
        gradient.addColorStop(this.appearance, this.middle);
        gradient.addColorStop(1, this.border);
        this.ctx.fillStyle = gradient;

        this.ctx.beginPath();
        // this.ctx.arc(this.x, this.startY, this.diam, 0, Math.PI * 2);
        this.ctx.arc(this.drawX + nx, this.drawY + ny, this.diam, 0, Math.PI * 2);
        // this.ctx.stroke();
        this.ctx.fill();
    }
}



// const gradient = ctx.createRadialGradient(110, 90, 30, 100, 100, 70);

// // Add three color stops
// gradient.addColorStop(0, "pink");
// gradient.addColorStop(0.9, "white");
// gradient.addColorStop(1, "green");

// // Set the fill style and draw a rectangle
// ctx.fillStyle = gradient;
// ctx.fillRect(20, 20, 160, 160);