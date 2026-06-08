// ─── ui.js ───────────────────────────────────────────────────────────────────
// Gère le label de molécule en bas de l'écran.
// Deux modes : fusionné (un seul div) ou séparé (3 divs indépendants).
//
// Styles visuels centralisés ici :
//   LABEL_STYLES définit polices, tailles, positions par défaut.
//   applyLabelMode(settings) les applique selon le mode actif.

// ─── Styles centralisés ───────────────────────────────────────────────────────

import { playHoverAtom, playHoverGroup, hoverGroupSounds } from "./sound.js";

export const LABEL_STYLES = {
    // Durées des fades (ms) — tout le reste dans style.css
    fadeInDuration: 400,
    fadeOutDuration: 400,
};

/**
 * Mesure l'épaisseur réelle du trait text-decoration-underline sur un .label-token.
 * Crée un span hors-écran temporaire avec les mêmes styles que .label-token,
 * lit getComputedStyle pour récupérer text-decoration-thickness, puis le supprime.
 * Retourne la valeur en px (number).
 */
export function measureUnderlineThickness() {
    const span = document.createElement("span");
    span.className = "label-token";
    // Position hors-écran, texte visible pour forcer le calcul du style
    span.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;font-size:100px;";
    span.textContent = "C";
    document.body.appendChild(span);
    const style = getComputedStyle(span);
    // text-decoration-thickness peut être "auto", "from-font" ou une valeur px
    let thickness = parseFloat(style.textDecorationThickness);
    if (isNaN(thickness) || thickness <= 0) {
        // Fallback : 0.025em * font-size
        const fontSize = parseFloat(style.fontSize) || 100;
        thickness = fontSize * 0.025;
    }
    document.body.removeChild(span);
    return thickness;
}

export class UI {
    constructor({ onRecommencer }) {
        this.onRecommencer = onRecommencer;

        // État du hover pour la surbrillance canvas
        this.hoveredAtomType = null;
        this.hoveredGroups = [];
        this.hoveredAtomIndices = null;

        this._labelBuilt = false;
        this._groupSoundMap = new Map(); // groupe label → url son, assigné une fois par molécule
        this._labelName = "";
        this._labelVulgar = "";
        this._labelFormula = "";
        this._labelFull = "";

        this._buildLabel();
    }

    _fadeOutDivs() {
        const fadeOut = (div) => {
            if (div.style.display === "none") return;
            div.style.transition = `opacity ${LABEL_STYLES.fadeOutDuration}ms ease`;
            div.style.opacity = "0";
            setTimeout(() => {
                div.style.display = "none";
                div.style.opacity = "";
                div.innerHTML = "";
            }, LABEL_STYLES.fadeOutDuration);
        };
        fadeOut(this.labelNameDiv);
        fadeOut(this.labelVulgarDiv);
        fadeOut(this.labelFormulaDiv);
    }

    // ─── Construction des divs ────────────────────────────────────────────────

    _buildLabel() {
        // Mode fusionné
        this.labelDiv = document.createElement("div");
        this.labelDiv.className = "molecule-label";
        document.body.appendChild(this.labelDiv);

        // Mode séparé — 3 divs indépendants
        this.labelNameDiv = document.createElement("div");
        this.labelNameDiv.className = "molecule-label molecule-label-name";
        this.labelNameDiv.style.display = "none";
        document.body.appendChild(this.labelNameDiv);

        this.labelVulgarDiv = document.createElement("div");
        this.labelVulgarDiv.className = "molecule-label molecule-label-vulgar";
        this.labelVulgarDiv.style.display = "none";
        document.body.appendChild(this.labelVulgarDiv);

        this.labelFormulaDiv = document.createElement("div");
        this.labelFormulaDiv.className = "molecule-label molecule-label-formula";
        this.labelFormulaDiv.style.display = "none";
        document.body.appendChild(this.labelFormulaDiv);

        // Spans hors-écran pour mesurer largeur texte
        this._measureSpan = document.createElement("span");
        this._measureSpan.style.cssText = "position:fixed;visibility:hidden;font-size:60px;white-space:nowrap;";

        document.body.appendChild(this._measureSpan);

        this._spaceSpan = document.createElement("span");
        this._spaceSpan.style.cssText = "position:fixed;visibility:hidden;font-size:60px;white-space:pre;";

        this._spaceSpan.textContent = " ";
        document.body.appendChild(this._spaceSpan);
    }

    // ─── Mise à jour du label ─────────────────────────────────────────────────

    updateLabel(currentMolecule, moleculeComplete) {
        if (!currentMolecule) {
            this._fadeOutDivs();
            this._labelBuilt = false;
            return;
        }

        if (!moleculeComplete) {
            // Fade out puis cacher les divs séparés
            this._fadeOutDivs();
            this._labelBuilt = false;
            // Afficher des espaces de même largeur que le futur label

            this.labelDiv.style.pointerEvents = "none";
            this._measureSpan.textContent = this._labelFull;
            const fullPx = this._measureSpan.offsetWidth;
            const spacePx = this._spaceSpan.offsetWidth || 10;
            const n = Math.round(fullPx / spacePx);
            this.labelDiv.innerHTML = `<span style="white-space:pre;">${" ".repeat(n)}</span>`;
            return;
        }

        if (this._labelBuilt) return;
        this._labelBuilt = true;


        this.labelDiv.style.pointerEvents = "auto";

        const nomPart = this._labelName;
        const formula = this._labelFormula;
        const vulgar = this._labelVulgar;
        const molGroups = currentMolecule.groups || [];

        // ── HTML du nom (avec groupes interactifs) ────────────────────────────
        // Les sons sont déjà assignés dans _groupSoundMap (peuplé une fois dans setMoleculeLabel)
        let nameHtml = "";
        if (molGroups.length > 0) {
            let remaining = nomPart;
            for (let gi = 0; gi < molGroups.length; gi++) {
                const g = molGroups[gi];
                const idx = remaining.indexOf(g.label);
                if (idx === -1) continue;
                if (idx > 0) nameHtml += `<span>${remaining.slice(0, idx)}</span>`;
                const soundUrl = this._groupSoundMap.get(g.label) || "";
                nameHtml += `<span class="label-group" data-group="${g.label}" data-group-sound="${soundUrl}">${g.label}</span>`;
                remaining = remaining.slice(idx + g.label.length);
            }
            if (remaining) nameHtml += `<span>${remaining}</span>`;
        } else {
            nameHtml = `<span>${nomPart}</span>`;
        }

        // ── HTML de la formule (avec tokens interactifs) ──────────────────────
        const formulaHtml = this._buildFormulaHtml(formula, currentMolecule);

        // ── Remplir les divs ──────────────────────────────────────────────────
        // Mode fusionné : tout dans labelDiv
        const sep = `<span> — </span>`;
        this.labelDiv.innerHTML = `${nameHtml}${vulgar ? `<span class="label-vulgar"> (${vulgar})</span>` : ""}${sep}${formulaHtml}`;

        // Mode séparé : chaque div a son contenu + listeners
        this.labelNameDiv.innerHTML = nameHtml;
        this.labelVulgarDiv.textContent = vulgar ? `(${vulgar})` : "";
        this.labelFormulaDiv.innerHTML = formulaHtml;

        // En mode séparé, montrer les divs avec fade in
        if (!this._labelMerged) {
            const fadeIn = (div) => {
                div.style.transition = `opacity ${LABEL_STYLES.fadeInDuration}ms ease`;
                div.style.opacity = "0";
                div.style.display = "";
                requestAnimationFrame(() => requestAnimationFrame(() => { div.style.opacity = ""; }));
            };
            fadeIn(this.labelNameDiv);
            fadeIn(this.labelVulgarDiv);
            fadeIn(this.labelFormulaDiv);
        }

        // ── Listeners hover — appliqués sur TOUS les divs ─────────────────────
        const allDivs = [this.labelDiv, this.labelNameDiv, this.labelVulgarDiv, this.labelFormulaDiv];
        for (const div of allDivs) {
            this._attachTokenListeners(div, molGroups, allDivs);
        }
    }

    // ─── Construction HTML formule ────────────────────────────────────────────

    _buildFormulaHtml(formula, currentMolecule) {
        const SUBMAP = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
        const renderSub = t => t.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,
            d => `<span class="subscript">${SUBMAP[d] || d}</span>`);

        const formulaGroups = currentMolecule.formulaGroups || null;
        if (formulaGroups) {
            return formulaGroups.map(fg => {
                const rendered = renderSub(fg.text);
                if (fg.atomIndices) {
                    const indAttr = fg.individual ? ` data-individual="true"` : "";
                    return `<span class="label-token" data-type="${fg.type}" data-indices="${fg.atomIndices.join(',')}"${indAttr}>${rendered}</span>`;
                }
                return `<span class="label-token" data-type="${fg.type}">${rendered}</span>`;
            }).join("");
        }

        let html = ""; let i = 0;
        const symbolToType = { C: "carbon", O: "oxygen", H: "hydrogen" };
        while (i < formula.length) {
            const ch = formula[i];
            const type = symbolToType[ch];
            if (type) {
                let group = ch; i++;
                while (i < formula.length && !"COH".includes(formula[i])) group += formula[i++];
                html += `<span class="label-token" data-type="${type}">${renderSub(group)}</span>`;
            } else { html += ch; i++; }
        }
        return html;
    }

    // ─── Listeners hover ──────────────────────────────────────────────────────

    _attachTokenListeners(div, molGroups, allDivs) {
        div.querySelectorAll(".label-token").forEach(span => {
            span.addEventListener("mouseenter", () => {
                playHoverAtom(span.dataset.type); // carbon | oxygen | hydrogen → son indexé
                this.hoveredGroups = [];
                this.hoveredAtomType = null;
                this.hoveredAtomIndices = null;
                allDivs.forEach(d => d.querySelectorAll(".label-group").forEach(s => {
                    s.classList.remove("label-group--hover");
                }));
                if (span.dataset.indices) {
                    const indices = span.dataset.indices.split(",").map(Number);
                    if (span.dataset.individual === "true") this.hoveredAtomIndices = indices;
                    else this.hoveredGroups = [{ label: "_formula", atomIndices: indices }];
                } else {
                    this.hoveredAtomType = span.dataset.type;
                }
            });
        });

        div.querySelectorAll(".label-group").forEach(span => {
            const gLabel = span.dataset.group;
            const g = molGroups.find(g => g.label === gLabel);
            span.addEventListener("mouseenter", () => {
                playHoverGroup(span.dataset.groupSound || undefined); // son fixe assigné au groupe via data-group-sound
                this.hoveredAtomType = null;
                this.hoveredAtomIndices = null;
                if (!g) { this.hoveredGroups = []; return; }
                const active = [g];
                if (g.linkedGroups) {
                    for (const lbl of g.linkedGroups) {
                        const linked = molGroups.find(lg => lg.label === lbl);
                        if (linked) active.push(linked);
                    }
                }
                this.hoveredGroups = active;
                allDivs.forEach(d => d.querySelectorAll(".label-group").forEach(s => {
                    const hovered = active.some(ag => ag.label === s.dataset.group);
                    s.classList.toggle("label-group--hover", hovered);
                }));
            });
        });

        div.addEventListener("mouseleave", () => {
            this.hoveredAtomType = null;
            this.hoveredGroups = [];
            this.hoveredAtomIndices = null;
            allDivs.forEach(d => d.querySelectorAll(".label-group").forEach(s => {
                s.classList.remove("label-group--hover");
            }));
        });
    }

    // ─── Mode fusionné / séparé ───────────────────────────────────────────────

    applyLabelMode(s) {
        this._labelMerged = s.labelMerged;
        if (s.labelMerged) {
            this.labelDiv.style.display = "";
            this.labelNameDiv.style.display = "none";
            this.labelVulgarDiv.style.display = "none";
            this.labelFormulaDiv.style.display = "none";
        } else {
            // Les divs séparés ne s'affichent que si le contenu est là
            this.labelDiv.style.display = "none";
            const hasContent = this._labelBuilt;
            this.labelNameDiv.style.display = hasContent ? "" : "none";
            this.labelVulgarDiv.style.display = hasContent ? "" : "none";
            this.labelFormulaDiv.style.display = hasContent ? "" : "none";
        }
    }

    // ─── Données label ────────────────────────────────────────────────────────

    setMoleculeLabel({ name, vulgar, formula, full, groups }) {
        this._labelName = name || "";
        this._labelVulgar = vulgar || "";
        this._labelFormula = formula || "";
        this._labelFull = full || `${name} — ${formula}`;
        this._labelBuilt = false;

        // ── Assignation des sons par groupe — trois règles ────────────────────
        // 1. groupes liés (linkedGroups) → même son
        // 2. groupes numérotés (ex: "méthyl 1", "méthyl 2") → même son (même racine sans chiffre final)
        // 3. groupes différents → sons différents si possible (on évite les doublons)
        this._groupSoundMap = new Map();
        const gs = groups || [];
        if (gs.length === 0 || hoverGroupSounds.length === 0) return;

        // Mélanger les sons disponibles pour minimiser les doublons
        const shuffled = [...hoverGroupSounds].sort(() => Math.random() - 0.5);

        // Extraire la racine d'un label : retire le chiffre final et les espaces ("méthyl 1" → "méthyl")
        const rootOf = (label) => label.replace(/\s*\d+$/, "").trim();

        // Passe 1 : construire les groupes d'équivalence (labels qui doivent avoir le même son)
        // Un groupe d'équivalence = ensemble de labels reliés par linkedGroups ou par racine commune
        const unionFind = new Map(); // label → representative
        const find = (x) => {
            if (!unionFind.has(x)) unionFind.set(x, x);
            if (unionFind.get(x) === x) return x;
            const root = find(unionFind.get(x));
            unionFind.set(x, root);
            return root;
        };
        const union = (a, b) => {
            const ra = find(a), rb = find(b);
            if (ra !== rb) unionFind.set(ra, rb);
        };

        // Initialiser tous les labels
        for (const g of gs) find(g.label);

        // Relier via linkedGroups
        for (const g of gs) {
            for (const linked of (g.linkedGroups || [])) union(g.label, linked);
        }

        // Relier via racine commune
        const byRoot = new Map();
        for (const g of gs) {
            const r = rootOf(g.label);
            if (!byRoot.has(r)) byRoot.set(r, []);
            byRoot.get(r).push(g.label);
        }
        for (const members of byRoot.values()) {
            for (let i = 1; i < members.length; i++) union(members[0], members[i]);
        }

        // Passe 2 : assigner un son par groupe d'équivalence, en évitant les doublons
        const repToSound = new Map(); // representative → url
        let soundIdx = 0;
        for (const g of gs) {
            const rep = find(g.label);
            if (!repToSound.has(rep)) {
                repToSound.set(rep, shuffled[soundIdx % shuffled.length]);
                soundIdx++;
            }
            this._groupSoundMap.set(g.label, repToSound.get(rep));
        }
    }

    // ─── Utilitaires ─────────────────────────────────────────────────────────

    contains(target) {
        return this.labelDiv?.contains(target) ||
            this.labelNameDiv?.contains(target) ||
            this.labelVulgarDiv?.contains(target) ||
            this.labelFormulaDiv?.contains(target);
    }
}