// 88 Constellations with accurate data from CSV
// RA/Dec coordinates converted to decimal degrees
// RA (hours:decimal_minutes) → (hours + minutes/60) * 15 degrees
// Dec (decimal_degrees° decimal_minutes') → degrees + minutes/60

const CONSTELLATIONS_DATA = [
  { iau: "Tri", eng: "Triangle", ra: 70.53, dec: 32.39, area: 131.847, bright: "β Trianguli", season: "Autumn" },
  { iau: "Gem", eng: "Gemini", ra: 169.69, dec: 22.60, area: 513.761, bright: "Pollux", season: "Winter" },
  { iau: "CMi", eng: "Canis Minor", ra: 218.64, dec: 6.43, area: 183.367, bright: "Procyon", season: "Winter" },
  { iau: "Cru", eng: "Crux", ra: 310.68, dec: -60.19, area: 68.447, bright: "Acrux", season: "Southern Hemisphere" },
  { iau: "Lyr", eng: "Lyra", ra: 154.27, dec: 36.69, area: 286.476, bright: "Vega", season: "Summer" },
  { iau: "PsA", eng: "Piscis Austrinus", ra: 303.47, dec: -30.64, area: 245.375, bright: "Fomalhaut", season: "Summer" },
  { iau: "Cam", eng: "Camelopardalis", ra: 129.84, dec: 69.38, area: 756.828, bright: "β Camelopardalis", season: "Autumn" },
  { iau: "Pav", eng: "Pavo", ra: 85.61, dec: -65.78, area: 377.666, bright: "Peacock", season: "Southern Hemisphere" },
  { iau: "Oph", eng: "Ophiuchus", ra: 294.18, dec: -7.91, area: 948.34, bright: "Rasalhague", season: "Winter" },
  { iau: "Hor", eng: "Horologium", ra: 49.41, dec: -53.34, area: 248.885, bright: "α Horologii", season: "Southern Hemisphere" },
  { iau: "Lep", eng: "Lepus", ra: 83.57, dec: -19.05, area: 290.291, bright: "Arneb", season: "Winter" },
  { iau: "Ser", eng: "Serpens", ra: 58.79, dec: 6.12, area: 636.928, bright: "Unukalhai", season: "Spring" },
  { iau: "Gru", eng: "Grus", ra: 336.55, dec: -46.35, area: 365.513, bright: "Alnair", season: "Autumn" },
  { iau: "CrA", eng: "Corona Australis", ra: 237.65, dec: -41.15, area: 127.696, bright: "Meridiana", season: "Summer" },
  { iau: "TrA", eng: "Triangulum Australe", ra: 81.24, dec: -51.04, area: 109.978, bright: "Atria", season: "Spring" },
  { iau: "Aqr", eng: "Aquarius", ra: 25.00, dec: -10.79, area: 979.854, bright: "Sadalsuud", season: "Summer" },
  { iau: "And", eng: "Andromeda", ra: 295.00, dec: 37.43, area: 722.278, bright: "Alpheratz", season: "Autumn" },
  { iau: "Ari", eng: "Aries", ra: 134.29, dec: 20.79, area: 441.395, bright: "Hamal", season: "Autumn" },
  { iau: "Com", eng: "Coma Berenices", ra: 279.82, dec: 23.31, area: 386.475, bright: "β Comae Berenices", season: "Spring" },
  { iau: "Del", eng: "Delphinus", ra: 49.70, dec: 11.67, area: 188.549, bright: "Rotanev", season: "Summer" },
  { iau: "Oct", eng: "Octans", ra: 83.58, dec: -82.15, area: 291.045, bright: "ν Octantis", season: "Autumn" },
  { iau: "Sct", eng: "Scutum", ra: 238.61, dec: -9.89, area: 109.114, bright: "α Scuti", season: "Summer" },
  { iau: "Sgr", eng: "Sagittarius", ra: 6.44, dec: -28.05, area: 867.432, bright: "Kaus Australis", season: "Summer" },
  { iau: "CVn", eng: "Canes Venatici", ra: 226.29, dec: 40.10, area: 465.194, bright: "Cor Caroli", season: "Spring" },
  { iau: "Cyg", eng: "Cygnus", ra: 280.10, dec: 44.55, area: 803.983, bright: "Deneb", season: "Summer" },
  { iau: "Lyn", eng: "Lynx", ra: 282.80, dec: 47.47, area: 545.386, bright: "α Lyncis", season: "Winter" },
  { iau: "Vir", eng: "Virgo", ra: 334.29, dec: -4.16, area: 1294.428, bright: "Spica", season: "Spring" },
  { iau: "Lac", eng: "Lacerta", ra: 336.92, dec: 46.04, area: 200.688, bright: "α Lacertae", season: "Summer" },
  { iau: "Sex", eng: "Sextans", ra: 286.49, dec: -2.62, area: 313.515, bright: "α Sextantis", season: "Spring" },
  { iau: "Vol", eng: "Volans", ra: 201.07, dec: -69.81, area: 141.354, bright: "β Volantis", season: "Winter" },
  { iau: "Tuc", eng: "Tucana", ra: 356.48, dec: 31.48, area: 294.557, bright: "α Tucanae", season: "Autumn" },
  { iau: "Her", eng: "Hercules", ra: 260.98, dec: 27.50, area: 1225.148, bright: "Kornephoros", season: "Spring" },
  { iau: "Col", eng: "Columba", ra: 170.88, dec: -35.06, area: 270.184, bright: "Phact", season: "Winter" },
  { iau: "Phe", eng: "Phoenix", ra: 114.88, dec: -48.70, area: 469.319, bright: "Ankaa", season: "Autumn" },
  { iau: "Scl", eng: "Sculptor", ra: 7.24, dec: -32.06, area: 474.764, bright: "α Sculptoris", season: "Autumn" },
  { iau: "Mic", eng: "Microscopium", ra: 188.82, dec: -36.27, area: 209.513, bright: "γ Microscopii", season: "Summer" },
  { iau: "Ara", eng: "Ara", ra: 39.57, dec: -56.59, area: 237.057, bright: "β Arae", season: "Summer" },
  { iau: "Dra", eng: "Draco", ra: 41.98, dec: 67.01, area: 1082.952, bright: "Eltanin", season: "Spring" },
  { iau: "Tau", eng: "Taurus", ra: 254.26, dec: 14.89, area: 797.249, bright: "Aldebaran", season: "Winter" },
  { iau: "Men", eng: "Mensa", ra: 314.47, dec: -77.50, area: 153.484, bright: "α Mensae", season: "Winter" },
  { iau: "Vul", eng: "Vulpecula", ra: 143.73, dec: 24.48, area: 268.165, bright: "Anser", season: "Summer" },
  { iau: "Dor", eng: "Dorado", ra: 294.86, dec: -59.38, area: 179.173, bright: "α Doradus", season: "Winter" },
  { iau: "Aql", eng: "Aquila", ra: 227.79, dec: 3.41, area: 652.473, bright: "Altair", season: "Summer" },
  { iau: "Cep", eng: "Cepheus", ra: 330.00, dec: 71.01, area: 587.787, bright: "Alderamin", season: "Summer" },
  { iau: "Cet", eng: "Cetus", ra: 191.81, dec: -7.18, area: 1231.411, bright: "Diphda", season: "Autumn" },
  { iau: "Cen", eng: "Centaurus", ra: 195.64, dec: -47.35, area: 1060.422, bright: "Rigil Centaurus", season: "Spring" },
  { iau: "Vel", eng: "Vela", ra: 289.93, dec: -47.17, area: 499.649, bright: "γ Velorum", season: "Winter" },
  { iau: "Cas", eng: "Cassiopeia", ra: 19.79, dec: 62.18, area: 598.407, bright: "Schedar", season: "Autumn" },
  { iau: "Nor", eng: "Norma", ra: 260.60, dec: -50.50, area: 165.29, bright: "γ Normae", season: "Spring" },
  { iau: "Lib", eng: "Libra", ra: 160.00, dec: -9.50, area: 538.052, bright: "Zubeneschamali", season: "Spring" },
  { iau: "Sge", eng: "Sagitta", ra: 253.31, dec: 18.24, area: 79.941, bright: "γ Sagittae", season: "Summer" },
  { iau: "CMa", eng: "Canis Major", ra: 87.79, dec: -22.14, area: 380.125, bright: "Sirius", season: "Winter" },
  { iau: "Ant", eng: "Antlia", ra: 12.12, dec: -32.48, area: 239.654, bright: "α Antliae", season: "Spring" },
  { iau: "Crv", eng: "Corvus", ra: 78.63, dec: -18.44, area: 184.0, bright: "Gienah", season: "Spring" },
  { iau: "Lup", eng: "Lupus", ra: 119.99, dec: -42.71, area: 333.682, bright: "α Lupi", season: "Spring" },
  { iau: "UMi", eng: "Ursa Minor", ra: 240.74, dec: 77.70, area: 255.21, bright: "Polaris", season: "Spring" },
  { iau: "UMa", eng: "Ursa Major", ra: 32.76, dec: 50.72, area: 1279.66, bright: "Dubhe", season: "Spring" },
  { iau: "Mon", eng: "Monoceros", ra: 345.00, dec: 0.28, area: 481.569, bright: "β Monocerotis", season: "Winter" },
  { iau: "Leo", eng: "Leo", ra: 105.55, dec: 13.14, area: 946.713, bright: "Regulus", season: "Spring" },
  { iau: "Aur", eng: "Auriga", ra: 220.64, dec: 42.03, area: 657.438, bright: "Capella", season: "Winter" },
  { iau: "Cir", eng: "Circinus", ra: 91.07, dec: -63.03, area: 93.348, bright: "α Circini", season: "Spring" },
  { iau: "Boo", eng: "Boötes", ra: 70.71, dec: 31.21, area: 906.831, bright: "Arcturus", season: "Spring" },
  { iau: "Hya", eng: "Hydra", ra: 174.61, dec: -14.53, area: 1302.844, bright: "Alphard", season: "Spring" },
  { iau: "Ret", eng: "Reticulum", ra: 116.95, dec: -60.00, area: 113.636, bright: "α Reticuli", season: "Winter" },
  { iau: "Pyx", eng: "Pyxis", ra: 334.54, dec: -27.35, area: 220.83, bright: "α Pyxidis", season: "Spring" },
  { iau: "Tel", eng: "Telescopium", ra: 154.24, dec: -65.83, area: 151.588, bright: "α Telescopii", season: "Summer" },
  { iau: "Eri", eng: "Eridanus", ra: 132.86, dec: -28.76, area: 1137.919, bright: "Achernar", season: "Autumn" },
  { iau: "Hyi", eng: "Hydrus", ra: 35.10, dec: -69.96, area: 243.629, bright: "β Hydri", season: "Autumn" },
  { iau: "CrB", eng: "Corona Borealis", ra: 186.54, dec: 32.62, area: 179.178, bright: "Alphecca", season: "Spring" },
  { iau: "LMi", eng: "Leo Minor", ra: 228.21, dec: 32.13, area: 232.259, bright: "46 LMi", season: "Spring" },
  { iau: "Car", eng: "Carina", ra: 130.42, dec: -63.22, area: 494.184, bright: "Canopus", season: "Winter" },
  { iau: "For", eng: "Fornax", ra: 102.46, dec: -31.63, area: 398.407, bright: "Fornacis", season: "Autumn" },
  { iau: "Pup", eng: "Puppis", ra: 13.49, dec: -31.18, area: 673.429, bright: "Naos", season: "Winter" },
  { iau: "Cae", eng: "Caelum", ra: 160.64, dec: -37.88, area: 124.865, bright: "α Caeli", season: "Winter" },
  { iau: "Equ", eng: "Equuleus", ra: 105.64, dec: 7.76, area: 71.641, bright: "Kitalpha", season: "Summer" },
  { iau: "Per", eng: "Perseus", ra: 317.69, dec: 45.01, area: 615.0, bright: "Mirfak", season: "Winter" },
  { iau: "Cha", eng: "Chamaeleon", ra: 196.54, dec: -79.21, area: 131.589, bright: "α Chamaeleontis", season: "Winter" },
  { iau: "Cap", eng: "Capricornus", ra: 315.73, dec: -18.02, area: 413.947, bright: "δ Capricorni", season: "Summer" },
  { iau: "Cnc", eng: "Cancer", ra: 186.66, dec: 19.81, area: 505.889, bright: "β Cancri", season: "Winter" },
  { iau: "Crt", eng: "Crater", ra: 308.82, dec: -15.93, area: 282.398, bright: "δ Crateris", season: "Spring" },
  { iau: "Ori", eng: "Orion", ra: 339.30, dec: 5.95, area: 1270.7, bright: "Rigel", season: "Winter" },
  { iau: "Pic", eng: "Pictor", ra: 153.72, dec: -53.48, area: 246.739, bright: "α Pictoris", season: "Winter" },
  { iau: "Ind", eng: "Indus", ra: 329.58, dec: -59.71, area: 294.557, bright: "α Indi", season: "Autumn" },
  { iau: "Psc", eng: "Pisces", ra: 225.00, dec: 13.69, area: 889.42, bright: "η Piscium", season: "Autumn" },
  { iau: "Peg", eng: "Pegasus", ra: 47.66, dec: 19.47, area: 1120.794, bright: "Enif", season: "Autumn" },
  { iau: "Aps", eng: "Apus", ra: 260.87, dec: -75.30, area: 206.327, bright: "α Apodis", season: "Winter" },
  { iau: "Sco", eng: "Scorpius", ra: 108.93, dec: -27.03, area: 496.783, bright: "Antares", season: "Spring" },
  { iau: "Mus", eng: "Musca", ra: 242.13, dec: -70.16, area: 138.348, bright: "α Muscae", season: "Spring" }
];

// Helper functions for constellation lookup
function getConstellation(iau) {
  return CONSTELLATIONS_DATA.find(c => c.iau === iau);
}

function getConstellationByEnglish(name) {
  return CONSTELLATIONS_DATA.find(c => c.eng === name);
}

// Additional helper for finding constellation center
function getConstellationData(identifier) {
  // Try by IAU code first
  let constellation = getConstellation(identifier);
  if (constellation) return constellation;

  // Try by English name
  constellation = getConstellationByEnglish(identifier);
  return constellation;
}
