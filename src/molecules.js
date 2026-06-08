// ─── molecules.js ────────────────────────────────────────────────────────────
// Données des molécules et des palettes d'atomes.
// Chaque molécule : { name, formula, atoms, bonds, groups?, formulaGroups? }
// Chaque atome    : { type: "carbon"|"oxygen"|"hydrogen", x, y }
// x/y : coordonnées relatives en px (échelle ~150px par liaison)
// bonds : [i, j] = simple, [i, j, true] = double

// export const palettes = [ //GRADIENT
//     // carbon → do.mp3 — 4 bonds
//     { name: "carbon", border: `rgb(25, 0, 70)`, middle: `rgb(107, 137, 255)`, center: `rgb(180, 240, 255)`, soundIndex: 0, diam: 90, maxBonds: 4 },
//     // oxygen → mi.mp3 — 2 bonds
//     { name: "oxygen", border: `rgb(24, 0, 49)`, middle: `rgb(255, 100, 73)`, center: `rgb(255, 190, 166)`, soundIndex: 1, diam: 75, maxBonds: 2 },
//     // hydrogen → solG.wav — 1 bond
//     { name: "hydrogen", border: `rgb(70, 0, 0)`, middle: `rgb(156, 107, 255)`, center: `rgb(180, 255, 243)`, soundIndex: 2, diam: 60, maxBonds: 1 },
// ];

export const palettes = [
    // carbon → do.mp3 — 4 bonds
    { name: "carbon", border: `rgb(107, 137, 255)`, middle: `rgb(107, 137, 255)`, center: `rgb(107, 137, 255)`, soundIndex: 0, diam: 90, maxBonds: 4 },
    // oxygen → mi.mp3 — 2 bonds
    { name: "oxygen", border: `rgb(255, 100, 73)`, middle: `rgb(255, 100, 73)`, center: `rgb(255, 100, 73)`, soundIndex: 1, diam: 75, maxBonds: 2 },
    // hydrogen → solG.wav — 1 bond
    { name: "hydrogen", border: `rgb(156, 107, 255)`, middle: `rgb(156, 107, 255)`, center: `rgb(156, 107, 255)`, soundIndex: 2, diam: 60, maxBonds: 1 },
];

export const MOLECULES = [
    {
        name: "éthanol",
        formula: "C₂H₅OH",
        atoms: [
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 0 C
            { type: "carbon", x: 150, y: 0, soundDetune: 702 }, // 1 C
            { type: "oxygen", x: 300, y: 0, soundDetune: 386 }, // 2 O
            { type: "hydrogen", x: -80, y: -80, soundDetune: 1200 }, // 3 H
            { type: "hydrogen", x: -80, y: 80, soundDetune: 1200 }, // 4 H
            { type: "hydrogen", x: 0, y: -120, soundDetune: 702 }, // 5 H
            { type: "hydrogen", x: 150, y: -120, soundDetune: 702 }, // 6 H
            { type: "hydrogen", x: 150, y: 120, soundDetune: 702 }, // 7 H
            { type: "hydrogen", x: 380, y: 60, soundDetune: 386 }, // 8 H (sur O)
        ],
        bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8]],
        // groups : hover sur le NOM → capsule englobante autour des atomes concernés
        groups: [
            { label: "éthan", atomIndices: [0, 1] }, // les deux carbones
            { label: "ol", atomIndices: [2, 8] }, // O + H sur O
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C₂", type: "carbon", atomIndices: null },
            { text: "H₅", type: "hydrogen", atomIndices: [3, 4, 5, 6, 7], individual: true }, // 5 H — cercles séparés
            { text: "O", type: "oxygen", atomIndices: null },
            { text: "H", type: "hydrogen", atomIndices: [8], individual: true },          // H sur O — cercle individuel
        ],
    },
    {
        name: "acide éthanoïque",
        vulgar: "vinaigre",
        formula: "CH₃COOH",
        atoms: [
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 0 CH3
            { type: "carbon", x: 150, y: 0, soundDetune: 700 }, // 1 C=O
            { type: "oxygen", x: 270, y: -90, soundDetune: 700 }, // 2 =O
            { type: "oxygen", x: 270, y: 90, soundDetune: 1000 }, // 3 -OH
            { type: "hydrogen", x: -60, y: -80, soundDetune: 1200 }, // 4 H
            { type: "hydrogen", x: -100, y: 0, soundDetune: 1200 }, // 5 H
            { type: "hydrogen", x: -60, y: 80, soundDetune: 1200 }, // 6 H
            { type: "hydrogen", x: 350, y: 120, soundDetune: 700 }, // 7 H (sur OH)
        ],
        bonds: [[0, 1], [1, 2, true], [1, 3], [0, 4], [0, 5], [0, 6], [3, 7]],

        groups: [
            { label: "acide", atomIndices: [1, 2, 3, 7], linkedGroups: ["oïque"] }, // bidirectionnel
            { label: "éthan", atomIndices: [0, 1] }, // 2C
            { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C", type: "carbon", atomIndices: [0], individual: true },
            { text: "H₃", type: "hydrogen", atomIndices: [4, 5, 6], individual: true }, // 3 H — cercles séparés
            { text: "C", type: "carbon", atomIndices: [1], individual: true },
            { text: "O", type: "oxygen", atomIndices: [2], individual: true },
            { text: "O", type: "oxygen", atomIndices: [3], individual: true },
            { text: "H", type: "hydrogen", atomIndices: [7], individual: true },          // H sur O — cercle individuel
        ],
    },
    {
        name: "propan-2-one",
        vulgar: "acétone",
        formula: "CH₃COCH₃",
        atoms: [
            { type: "carbon", x: -120, y: 0, soundDetune: 0 }, // 0 CH3
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 1 C=O
            { type: "carbon", x: 120, y: 0, soundDetune: 0 }, // 2 CH3
            { type: "oxygen", x: 0, y: -140, soundDetune: 386 }, // 3 =O
            { type: "hydrogen", x: -200, y: -80, soundDetune: 702 }, // 4
            { type: "hydrogen", x: -230, y: 0, soundDetune: 702 }, // 5
            { type: "hydrogen", x: -220, y: 80, soundDetune: 702 }, // 6
            { type: "hydrogen", x: 200, y: -80, soundDetune: 702 }, // 7
            { type: "hydrogen", x: 230, y: 0, soundDetune: 702 }, // 8
            { type: "hydrogen", x: 200, y: 80, soundDetune: 702 }, // 9
        ],
        bonds: [[0, 1], [1, 2], [1, 3, true], [0, 4], [0, 5], [0, 6], [2, 7], [2, 8], [2, 9]],

        groups: [
            // { label: "Propan", atomIndices: [0, 1, 2], capsuleIndices: [0, 2], singleCapsule: true },
            { label: "propan", atomIndices: [0, 1, 2] },
            { label: "2", atomIndices: [0, 1, 2], capsuleIndices: [1] },
            { label: "one", atomIndices: [1, 3] }, // 2C
            // { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["Acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C", type: "carbon", atomIndices: [0], individual: true },
            { text: "H₃", type: "hydrogen", atomIndices: [4, 5, 6], individual: true }, // 3 H — cercles séparés
            { text: "C", type: "carbon", atomIndices: [1], individual: true },
            { text: "O", type: "oxygen", atomIndices: [3], individual: true },
            { text: "C", type: "carbon", atomIndices: [2], individual: true },
            { text: "H₃", type: "hydrogen", atomIndices: [7, 8, 9], individual: true },          // H sur O — cercle individuel
        ],

    },
    {
        name: "méthanal",
        vulgar: "formol",
        formula: "HCHO",
        atoms: [
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 0
            { type: "oxygen", x: 140, y: 0, soundDetune: 386 }, // 1 =O
            { type: "hydrogen", x: -80, y: -80, soundDetune: 702 }, // 2
            { type: "hydrogen", x: -80, y: 80, soundDetune: 702 }, // 3
        ],
        bonds: [[0, 1, true], [0, 2], [0, 3]],

        groups: [
            { label: "méthan", atomIndices: [0], individual: true }, // bidirectionnel
            { label: "al", atomIndices: [0, 1, 3] }, // 2C
            // { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["Acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "H", type: "hydrogen", atomIndices: [2], individual: true },
            { text: "C", type: "carbon", atomIndices: [0], individual: true }, // 3 H — cercles séparés
            { text: "H", type: "hydrogen", atomIndices: [3], individual: true },
            { text: "O", type: "oxygen", atomIndices: [1], individual: true },
        ],

    },
    {
        name: "méthane",
        formula: "CH₄",
        atoms: [
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 0
            { type: "hydrogen", x: 100, y: 0, soundDetune: 702 }, // 1 
            { type: "hydrogen", x: -100, y: 0, soundDetune: 702 }, // 2
            { type: "hydrogen", x: 0, y: -120, soundDetune: 702 }, // 3
            { type: "hydrogen", x: 0, y: 120, soundDetune: 702 }, // 4
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],

        groups: [
            { label: "méth", atomIndices: [0], individual: true }, // bidirectionnel
            // { label: "ane", atomIndices: [0, 1, 3] }, // 2C
            // { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["Acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C", type: "carbon", atomIndices: [0], individual: true }, // 3 H — cercles séparés
            { text: "H₄", type: "hydrogen", atomIndices: [1, 2, 3, 4], individual: true },
        ],

    },
    {
        name: "propane",
        formula: "C₃H₈",
        atoms: [
            { type: "carbon", x: -120, y: 0, soundDetune: 0 }, // 0
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 1
            { type: "carbon", x: 120, y: 0, soundDetune: 0 }, // 2
            { type: "hydrogen", x: -230, y: 0, soundDetune: 702 }, // 3
            { type: "hydrogen", x: -120, y: -100, soundDetune: 702 }, // 4
            { type: "hydrogen", x: -120, y: 100, soundDetune: 702 }, // 5
            { type: "hydrogen", x: 0, y: -100, soundDetune: 702 }, // 6
            { type: "hydrogen", x: 0, y: 100, soundDetune: 702 }, // 7
            { type: "hydrogen", x: 120, y: -100, soundDetune: 702 }, // 8
            { type: "hydrogen", x: 120, y: 100, soundDetune: 702 }, // 9
            { type: "hydrogen", x: 230, y: 0, soundDetune: 702 }, // 10

        ],
        bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9], [2, 10]],

        groups: [
            { label: "prop", atomIndices: [0, 1, 2], individual: true }, // bidirectionnel
            // { label: "ane", atomIndices: [0, 1, 3] }, // 2C
            // { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["Acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        // formulaGroups: [
        //     { text: "C", type: "carbon", atomIndices: [0], individual: true }, // 3 H — cercles séparés
        //     { text: "H₄", type: "hydrogen", atomIndices: [1, 2, 3, 4], individual: true },
        // ],

    },
    {
        name: "butane",
        formula: "C₄H₁₀",
        atoms: [
            { type: "carbon", x: -170, y: 0, soundDetune: 0 }, // 0
            { type: "carbon", x: -60, y: 0, soundDetune: 700 }, // 1
            { type: "carbon", x: 60, y: 0, soundDetune: 0 }, // 2
            { type: "carbon", x: 170, y: 0, soundDetune: 0 }, // 3
            { type: "hydrogen", x: -250, y: 0, soundDetune: 702 }, // 4 
            { type: "hydrogen", x: -170, y: -100, soundDetune: 702 }, // 5
            { type: "hydrogen", x: -170, y: 100, soundDetune: 702 }, // 6
            { type: "hydrogen", x: -60, y: -100, soundDetune: 702 }, // 7
            { type: "hydrogen", x: -60, y: 100, soundDetune: 702 }, // 8 
            { type: "hydrogen", x: 60, y: -100, soundDetune: 702 }, // 9
            { type: "hydrogen", x: 60, y: 100, soundDetune: 702 }, // 10
            { type: "hydrogen", x: 170, y: -100, soundDetune: 702 }, // 11
            { type: "hydrogen", x: 170, y: 100, soundDetune: 702 }, // 12
            { type: "hydrogen", x: 250, y: 0, soundDetune: 702 }, // 13
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8], [2, 9], [2, 10], [3, 11], [3, 12], [3, 13]],

        groups: [
            { label: "but", atomIndices: [0, 1, 2, 3], individual: true }, // bidirectionnel
            // { label: "ane", atomIndices: [0, 1, 3] }, // 2C
            // { label: "oïque", atomIndices: [1, 2, 3, 7], linkedGroups: ["Acide"] }, // bidirectionnel
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        // formulaGroups: [
        //     { text: "C", type: "carbon", atomIndices: [0], individual: true }, // 3 H — cercles séparés
        //     { text: "H₄", type: "hydrogen", atomIndices: [1, 2, 3, 4], individual: true },
        // ],

    },
    {
        name: "diméthyl éther",
        // vulgar: "",
        formula: "CH₃OCH₃",
        atoms: [
            { type: "carbon", x: -100, y: 0, soundDetune: 0 }, // 0
            { type: "oxygen", x: 0, y: 0, soundDetune: 200 }, // 1
            { type: "carbon", x: 100, y: 0, soundDetune: 0 }, // 2
            { type: "hydrogen", x: -170, y: -80, soundDetune: 400 }, // 3
            { type: "hydrogen", x: -200, y: 0, soundDetune: 400 }, // 4
            { type: "hydrogen", x: -170, y: 80, soundDetune: 400 }, // 5
            { type: "hydrogen", x: 170, y: -80, soundDetune: 400 }, // 6
            { type: "hydrogen", x: 200, y: 0, soundDetune: 400 }, // 7
            { type: "hydrogen", x: 170, y: 80, soundDetune: 400 }, // 8
        ],
        bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [2, 6], [2, 7], [2, 8]],

        groups: [
            // { label: "diméthyl", atomIndices: [0, 3, 4, 5, 2, 6, 7, 8], subGroups: [[0, 3, 4, 5], [2, 6, 7, 8]] },
            { label: "diméthyl", atomIndices: [0, 2], subGroups: [[0], [2]] },
            // { label: "diméthyl", atomIndices: [0, 3, 4, 5, 2, 6, 7, 8], subGroups: [[0], [3], [4], [5], [2], [6], [7], [8]] },
            { label: "éther", atomIndices: [0, 1, 2], capsuleIndices: [0, 2], singleCapsule: true },
            // atomIndices = halos sur C, O, C — capsuleIndices = capsule entre les 2 C seulement
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C", type: "carbon", atomIndices: [0], individual: true },
            { text: "H₃", type: "hydrogen", atomIndices: [3, 4, 5], individual: true }, // 3 H — cercles séparés
            { text: "O", type: "oxygen", atomIndices: [1], individual: true },
            { text: "C", type: "carbon", atomIndices: [2], individual: true },
            { text: "H₃", type: "hydrogen", atomIndices: [6, 7, 8], individual: true }, // 3 H — cercles séparés
        ],
    },
    // {
    //     name: "Acide formique",
    //     formula: "HCOOH",
    //     atoms: [
    //         { type: "carbon", x: 0, y: 0 , soundDetune: 0 }, // 0
    //         { type: "oxygen", x: 130, y: -90 , soundDetune: 386 }, // 1 =O
    //         { type: "oxygen", x: 130, y: 90 , soundDetune: 386 }, // 2 -OH
    //         { type: "hydrogen", x: -100, y: 0 , soundDetune: 702 }, // 3 H sur C
    //         { type: "hydrogen", x: 210, y: 140 , soundDetune: 702 }, // 4 H sur OH
    //     ],
    //     bonds: [[0, 1, true], [0, 2], [0, 3], [2, 4]],
    // },
    {
        name: "propane-1,2,3-triol",
        vulgar: "glycérine",
        formula: "C₃H₈O₃",
        atoms: [
            { type: "carbon", x: 0, y: 0, soundDetune: 0 }, // 0 C1
            { type: "carbon", x: 150, y: 0, soundDetune: 0 }, // 1 C2
            { type: "carbon", x: 300, y: 0, soundDetune: 0 }, // 2 C3
            { type: "oxygen", x: 0, y: -110, soundDetune: 386 }, // 3 OH1
            { type: "oxygen", x: 150, y: -110, soundDetune: 386 }, // 4 OH2
            { type: "oxygen", x: 300, y: -110, soundDetune: 386 }, // 5 OH3
            { type: "hydrogen", x: -80, y: 80, soundDetune: 702 }, // 6 H C1a
            { type: "hydrogen", x: 0, y: 90, soundDetune: 702 }, // 7 H C1b
            { type: "hydrogen", x: 150, y: 90, soundDetune: 702 }, // 8 H C2
            { type: "hydrogen", x: 380, y: 80, soundDetune: 702 }, // 9 H C3a
            { type: "hydrogen", x: 300, y: 90, soundDetune: 702 }, // 10 H C3b
            { type: "hydrogen", x: -70, y: -170, soundDetune: 702 }, // 11 H OH1
            { type: "hydrogen", x: 80, y: -170, soundDetune: 702 }, // 12 H OH2
            { type: "hydrogen", x: 230, y: -170, soundDetune: 702 }, // 13 H OH3
        ],
        bonds: [
            [0, 1], [1, 2],
            [0, 3], [1, 4], [2, 5],
            [0, 6], [0, 7], [1, 8], [2, 9], [2, 10],
            [3, 11], [4, 12], [5, 13],
        ],

        groups: [
            { label: "propane", atomIndices: [0, 1, 2] },
            { label: "1", atomIndices: [0] },
            { label: "2", atomIndices: [1] },
            { label: "3", atomIndices: [2] },
            { label: "triol", atomIndices: [0, 1, 2, 3, 4, 5, 11, 12, 13], subGroups: [[0, 3, 11], [1, 4, 12], [2, 5, 13]] },
            // atomIndices = halos sur C, O, C — capsuleIndices = capsule entre les 2 C seulement
        ],
        // formulaGroups : surcharge le rendu de la formule pour séparer des tokens
        formulaGroups: [
            { text: "C₃", type: "carbon", atomIndices: [0, 1, 2], individual: true },
            { text: "H₈", type: "hydrogen", atomIndices: [6, 7, 8, 9, 10, 11, 12, 13], individual: true }, // 3 H — cercles séparés
            { text: "O₃", type: "oxygen", atomIndices: [3, 4, 5], individual: true },
        ],
    },
    // {
    //     name: "Acide pyruvique",
    //     formula: "CH₃COCOOH",
    //     atoms: [
    //         { type: "carbon", x: 0, y: 0 , soundDetune: 0 }, // 0 CH3
    //         { type: "carbon", x: 150, y: 0 , soundDetune: 0 }, // 1 C=O (cétone)
    //         { type: "carbon", x: 300, y: 0 , soundDetune: 0 }, // 2 COOH
    //         { type: "oxygen", x: 150, y: -130 , soundDetune: 386 }, // 3 =O cétone
    //         { type: "oxygen", x: 420, y: -80 , soundDetune: 386 }, // 4 =O acide
    //         { type: "oxygen", x: 420, y: 80 , soundDetune: 386 }, // 5 -OH acide
    //         { type: "hydrogen", x: -80, y: -80 , soundDetune: 702 }, // 6
    //         { type: "hydrogen", x: -80, y: 0 , soundDetune: 702 }, // 7
    //         { type: "hydrogen", x: -80, y: 80 , soundDetune: 702 }, // 8
    //         { type: "hydrogen", x: 500, y: 110 , soundDetune: 702 }, // 9 H OH
    //     ],
    //     bonds: [[0, 1], [1, 2], [1, 3, true], [2, 4, true], [2, 5], [0, 6], [0, 7], [0, 8], [5, 9]],
    // },

];