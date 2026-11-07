// A pirâmide: o mesmo motor, parâmetros diferentes.
// carWeight sobe conforme a categoria (na F1 o carro decide; no kart, o piloto).

export const CATEGORIES = {
  kart: { id: 'kart', name: 'Karting',   carWeight: 0.30, gridSize: 20, races: 10, typicalAge: [14, 17], carSpread: 3, npcSkill: [40, 60] },
  f4:   { id: 'f4',   name: 'Fórmula 4', carWeight: 0.40, gridSize: 20, races: 14, typicalAge: [15, 19], carSpread: 4, npcSkill: [52, 74] },
  f3:   { id: 'f3',   name: 'Fórmula 3', carWeight: 0.50, gridSize: 20, races: 16, typicalAge: [16, 21], carSpread: 5, npcSkill: [58, 80] },
  f2:   { id: 'f2',   name: 'Fórmula 2', carWeight: 0.60, gridSize: 22, races: 20, typicalAge: [17, 23], carSpread: 6, npcSkill: [64, 86] },
  f1:   { id: 'f1',   name: 'Fórmula 1', carWeight: 0.75, gridSize: 22, races: 24, typicalAge: [18, 45], carSpread: 0, npcSkill: [0, 0], ordersEnabled: true },
};

export const BASE_LADDER = ['kart', 'f4', 'f3', 'f2'];
