/**
 * Chemistry Quiz Data
 * 20 Questions Question Bank
 */

window.CHEMISTRY_QUIZ_DATA = [
    {
        question: "What is the atomic number of Carbon?",
        options: ["4", "6", "12", "14"],
        correctAnswer: 1,
        explanation: "Carbon has an atomic number of 6, meaning it has 6 protons in its nucleus."
    },
    {
        question: "What type of bond is formed when atoms share electrons?",
        options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
        correctAnswer: 1,
        explanation: "A covalent bond is formed when two atoms share one or more pairs of electrons."
    },
    {
        question: "What is the pH of a neutral solution?",
        options: ["0", "7", "14", "1"],
        correctAnswer: 1,
        explanation: "A neutral solution has a pH of 7. Solutions with pH below 7 are acidic, and above 7 are basic."
    },
    {
        question: "Which gas is released when an acid reacts with a metal?",
        options: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"],
        correctAnswer: 2,
        explanation: "When acids react with metals, hydrogen gas is released. For example: Zn + 2HCl → ZnCl₂ + H₂"
    },
    {
        question: "What is the chemical formula for water?",
        options: ["H₂O₂", "HO₂", "H₂O", "OH"],
        correctAnswer: 2,
        explanation: "Water has the chemical formula H₂O, consisting of two hydrogen atoms and one oxygen atom."
    },
    {
        question: "Which element has the symbol 'Na'?",
        options: ["Nitrogen", "Neon", "Sodium", "Nickel"],
        correctAnswer: 2,
        explanation: "Na is the symbol for Sodium, derived from the Latin word 'Natrium'."
    },
    {
        question: "What is the process of a liquid changing to a gas called?",
        options: ["Condensation", "Evaporation", "Sublimation", "Deposition"],
        correctAnswer: 1,
        explanation: "Evaporation is the process where a liquid changes to a gas, typically occurring at the surface of the liquid."
    },
    {
        question: "Which subatomic particle has a negative charge?",
        options: ["Proton", "Neutron", "Electron", "Positron"],
        correctAnswer: 2,
        explanation: "Electrons are negatively charged particles that orbit the nucleus of an atom."
    },
    {
        question: "What is Avogadro's number approximately equal to?",
        options: ["6.02 × 10²³", "3.14 × 10¹⁰", "9.8 × 10²", "1.6 × 10⁻¹⁹"],
        correctAnswer: 0,
        explanation: "Avogadro's number is approximately 6.022 × 10²³, representing the number of particles in one mole of a substance."
    },
    {
        question: "What is the most abundant gas in Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"],
        correctAnswer: 3,
        explanation: "Nitrogen makes up about 78% of Earth's atmosphere, followed by oxygen at about 21%."
    },
    {
        question: "Which type of reaction releases energy?",
        options: ["Endothermic", "Exothermic", "Neutralization", "Decomposition"],
        correctAnswer: 1,
        explanation: "Exothermic reactions release energy, usually in the form of heat, to the surroundings."
    },
    {
        question: "What is the valency of oxygen?",
        options: ["1", "2", "3", "4"],
        correctAnswer: 1,
        explanation: "Oxygen has a valency of 2, meaning it can form two covalent bonds or gain two electrons."
    },
    {
        question: "Which indicator turns pink in basic solutions?",
        options: ["Methyl Orange", "Litmus", "Phenolphthalein", "Universal Indicator"],
        correctAnswer: 2,
        explanation: "Phenolphthalein is colorless in acidic solutions and turns pink/magenta in basic solutions."
    },
    {
        question: "What is the molar mass of CO₂?",
        options: ["28 g/mol", "44 g/mol", "32 g/mol", "18 g/mol"],
        correctAnswer: 1,
        explanation: "CO₂ has a molar mass of 44 g/mol (Carbon: 12 + Oxygen: 16 × 2 = 44)."
    },
    {
        question: "Which law states that the total mass is conserved in a chemical reaction?",
        options: ["Law of Definite Proportions", "Law of Conservation of Mass", "Avogadro's Law", "Dalton's Law"],
        correctAnswer: 1,
        explanation: "The Law of Conservation of Mass states that mass cannot be created or destroyed in a chemical reaction."
    },
    {
        question: "What type of reaction involves a substance reacting with oxygen?",
        options: ["Reduction", "Combustion", "Synthesis", "Hydrolysis"],
        correctAnswer: 1,
        explanation: "Combustion is a chemical reaction where a substance reacts rapidly with oxygen, producing heat and light."
    },
    {
        question: "Which element is a noble gas?",
        options: ["Chlorine", "Fluorine", "Argon", "Oxygen"],
        correctAnswer: 2,
        explanation: "Argon is a noble gas found in Group 18 of the periodic table. Noble gases are chemically inert."
    },
    {
        question: "What is the oxidation state of hydrogen in most compounds?",
        options: ["-1", "0", "+1", "+2"],
        correctAnswer: 2,
        explanation: "Hydrogen typically has an oxidation state of +1 in most compounds (except in metal hydrides where it is -1)."
    },
    {
        question: "Which salt is formed when HCl reacts with NaOH?",
        options: ["NaCl", "Na₂CO₃", "NaNO₃", "Na₂SO₄"],
        correctAnswer: 0,
        explanation: "When hydrochloric acid (HCl) reacts with sodium hydroxide (NaOH), it forms sodium chloride (NaCl) and water."
    },
    {
        question: "What is the electron configuration of neon?",
        options: ["1s² 2s²", "1s² 2s² 2p⁶", "1s² 2s² 2p⁶ 3s²", "1s² 2s² 2p⁴"],
        correctAnswer: 1,
        explanation: "Neon has 10 electrons with the configuration 1s² 2s² 2p⁶, making it a stable noble gas with a full outer shell."
    }
];

// Export if module system is used, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHEMISTRY_QUIZ_DATA;
}
