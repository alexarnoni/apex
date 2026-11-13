// Ponto de partida do mundo (grid 2026). Depois disso o mundo é fictício e vivo.
// Estruturado como registro para troca fácil de nomes (modo fictício = outro arquivo).

export const TEAMS_F1 = [
  { id: 'mcl', name: 'McLaren',      car: 92, budget: 9,  color: '#FF8000' },
  { id: 'mer', name: 'Mercedes',     car: 90, budget: 10, color: '#27F4D2' },
  { id: 'rbr', name: 'Red Bull',     car: 89, budget: 9,  color: '#3671C6' },
  { id: 'fer', name: 'Ferrari',      car: 88, budget: 10, color: '#E8002D' },
  { id: 'ast', name: 'Aston Martin', car: 84, budget: 8,  color: '#229971' },
  { id: 'wil', name: 'Williams',     car: 83, budget: 6,  color: '#64C4FF' },
  { id: 'rb',  name: 'Racing Bulls', car: 80, budget: 6,  color: '#6692FF' },
  { id: 'haa', name: 'Haas',         car: 79, budget: 5,  color: '#B6BABD' },
  { id: 'alp', name: 'Alpine',       car: 78, budget: 7,  color: '#FF87BC' },
  { id: 'aud', name: 'Audi',         car: 77, budget: 8,  color: '#A0E82D' },
  { id: 'cad', name: 'Cadillac',     car: 74, budget: 7,  color: '#D4AF37' },
];

// Equipes irmãs: o piloto vindo de uma tem preferência na outra (programa de jovens, motor ou parceria técnica).
export const SISTER_TEAMS = { rbr: 'rb', rb: 'rbr', fer: 'haa', haa: 'fer', mer: 'wil', wil: 'mer' };

export const DRIVERS_F1 = [
  { name: 'Verstappen', nat: 'NL', team: 'rbr', skill: 98, style: 'agg', age: 28, contract: 3 },
  { name: 'Tsunoda',    nat: 'JP', team: 'rbr', skill: 82, style: 'agg', age: 25, contract: 1 },
  { name: 'Norris',     nat: 'GB', team: 'mcl', skill: 93, style: 'tec', age: 26, contract: 3 },
  { name: 'Piastri',    nat: 'AU', team: 'mcl', skill: 92, style: 'con', age: 24, contract: 3 },
  { name: 'Leclerc',    nat: 'MC', team: 'fer', skill: 91, style: 'agg', age: 28, contract: 2 },
  { name: 'Hamilton',   nat: 'GB', team: 'fer', skill: 87, style: 'tec', age: 41, contract: 1 },
  { name: 'Russell',    nat: 'GB', team: 'mer', skill: 90, style: 'con', age: 28, contract: 2 },
  { name: 'Antonelli',  nat: 'IT', team: 'mer', skill: 86, style: 'agg', age: 19, contract: 2 },
  { name: 'Alonso',     nat: 'ES', team: 'ast', skill: 89, style: 'con', age: 44, contract: 1 },
  { name: 'Stroll',     nat: 'CA', team: 'ast', skill: 78, style: 'con', age: 27, contract: 2 },
  { name: 'Sainz',      nat: 'ES', team: 'wil', skill: 87, style: 'tec', age: 31, contract: 2 },
  { name: 'Albon',      nat: 'TH', team: 'wil', skill: 85, style: 'con', age: 29, contract: 2 },
  { name: 'Hadjar',     nat: 'FR', team: 'rb',  skill: 82, style: 'agg', age: 21, contract: 2 },
  { name: 'Lawson',     nat: 'NZ', team: 'rb',  skill: 80, style: 'agg', age: 24, contract: 1 },
  { name: 'Ocon',       nat: 'FR', team: 'haa', skill: 83, style: 'con', age: 29, contract: 2 },
  { name: 'Bearman',    nat: 'GB', team: 'haa', skill: 81, style: 'agg', age: 20, contract: 2 },
  { name: 'Gasly',      nat: 'FR', team: 'alp', skill: 84, style: 'con', age: 30, contract: 2 },
  { name: 'Colapinto',  nat: 'AR', team: 'alp', skill: 79, style: 'agg', age: 22, contract: 1 },
  { name: 'Hulkenberg', nat: 'DE', team: 'aud', skill: 83, style: 'con', age: 38, contract: 1 },
  { name: 'Bortoleto',  nat: 'BR', team: 'aud', skill: 82, style: 'tec', age: 21, contract: 2 },
  { name: 'Perez',      nat: 'MX', team: 'cad', skill: 84, style: 'con', age: 36, contract: 2 },
  { name: 'Bottas',     nat: 'FI', team: 'cad', skill: 83, style: 'con', age: 36, contract: 2 },
];

// Nacionalidade da equipe (só para a bandeira nas tabelas); fica fora do mundo salvo para não mexer nos saves.
export const TEAM_NAT = { mcl: 'GB', mer: 'DE', rbr: 'AT', fer: 'IT', ast: 'GB', wil: 'GB', rb: 'IT', haa: 'US', alp: 'FR', aud: 'DE', cad: 'US' };
