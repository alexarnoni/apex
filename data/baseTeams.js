// Equipes reais das categorias de base (nomes reais por enquanto; modo fictício = outro arquivo).
// Conferido na web em 2026-11-07: F2 (11 equipes) e F3 (10 equipes, a DAMS entrou no lugar da Jenzer em 2025-2027)
// batem com os grids de 2026. F4 e kart são equipes e marcas reais, mas essas séries variam por país e por ano.
// strength: -1 (fundo do grid) a +1 (equipe de ponta); vira carro via category.carSpread.
// Cada categoria tem gridSize / 2 equipes (2 carros por equipe; no F3 real são 3 por equipe, simplificado).
// academy: id da equipe de F1 ligada à estrutura (aproximação de jogo, não retrato exato do paddock).

export const BASE_TEAMS = {
  kart: [
    { id: 'tonykart', name: 'Tony Kart', strength: 0.9 },
    { id: 'birel', name: 'Birel ART', strength: 0.8 },
    { id: 'crg', name: 'CRG', strength: 0.5 },
    { id: 'kartrepublic', name: 'Kart Republic', strength: 0.3 },
    { id: 'parolin', name: 'Parolin', strength: 0.1 },
    { id: 'energy', name: 'Energy Corse', strength: -0.1 },
    { id: 'sodikart', name: 'Sodikart', strength: -0.3 },
    { id: 'praga', name: 'Praga', strength: -0.5 },
    { id: 'exprit', name: 'Exprit', strength: -0.8 },
    { id: 'kosmic', name: 'Kosmic', strength: -0.9 },
  ],
  f4: [
    { id: 'prema', name: 'Prema Racing', strength: 0.95, academy: 'fer' },
    { id: 'vanamersfoort', name: 'Van Amersfoort Racing', strength: 0.7 },
    { id: 'us', name: 'US Racing', strength: 0.5 },
    { id: 'race', name: 'R-ace GP', strength: 0.3 },
    { id: 'mp', name: 'MP Motorsport', strength: 0.1 },
    { id: 'mucke', name: 'Mücke Motorsport', strength: -0.1 },
    { id: 'jenzer', name: 'Jenzer Motorsport', strength: -0.3 },
    { id: 'ironlynx', name: 'Iron Lynx', strength: -0.5 },
    { id: 'kic', name: 'KIC Motorsport', strength: -0.75 },
    { id: 'cram', name: 'Cram Competition', strength: -0.9 },
  ],
  f3: [
    { id: 'prema', name: 'Prema Racing', strength: 0.95, academy: 'fer' },
    { id: 'trident', name: 'Trident', strength: 0.8 },
    { id: 'art', name: 'ART Grand Prix', strength: 0.7 },
    { id: 'hitech', name: 'Hitech', strength: 0.5 },
    { id: 'mp', name: 'MP Motorsport', strength: 0.3 },
    { id: 'vanamersfoort', name: 'Van Amersfoort Racing', strength: 0.1 },
    { id: 'campos', name: 'Campos Racing', strength: -0.1 },
    { id: 'rodin', name: 'Rodin Motorsport', strength: -0.5 },
    { id: 'aix', name: 'AIX Racing', strength: -0.7 },
    { id: 'dams', name: 'DAMS', strength: -0.9, academy: 'alp' },
  ],
  f2: [
    { id: 'prema', name: 'Prema Racing', strength: 0.9, academy: 'fer' },
    { id: 'invicta', name: 'Invicta Racing', strength: 0.8 },
    { id: 'dams', name: 'DAMS', strength: 0.6, academy: 'alp' },
    { id: 'art', name: 'ART Grand Prix', strength: 0.5 },
    { id: 'campos', name: 'Campos Racing', strength: 0.2 },
    { id: 'mp', name: 'MP Motorsport', strength: 0.0 },
    { id: 'hitech', name: 'Hitech', strength: -0.2 },
    { id: 'trident', name: 'Trident', strength: -0.4 },
    { id: 'rodin', name: 'Rodin Motorsport', strength: -0.6 },
    { id: 'vanamersfoort', name: 'Van Amersfoort Racing', strength: -0.8 },
    { id: 'aix', name: 'AIX Racing', strength: -0.9 },
  ],
};
