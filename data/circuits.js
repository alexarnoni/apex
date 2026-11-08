// Calendário da F1: 24 etapas, uma pista por etapa, na ordem do calendário 2026 anunciado originalmente.
// (O calendário real de 2026 caiu para 22 etapas, sem Bahrein e Arábia Saudita; o jogo mantém as 24
// porque cada temporada simulada tem 24 corridas e o mesmo calendário se repete a cada ano.)
//
// tags mexem no motor de corrida (valores em CONFIG.tracks):
//   rua       largada vale mais (ultrapassar é difícil) e há mais abandonos
//   potencia  o carro pesa mais (retas longas)
//   tecnica   o piloto pesa mais (curvas lentas e traçado exigente)
// flag = código ISO do país (a UI desenha a bandeira em SVG; emoji de bandeira não aparece no Windows).
// chuva = chance de a corrida ser molhada nessa pista (média do calendário ≈ 0,14).

export const CIRCUITS = [
  { id: 'aus', gp: 'GP da Austrália',      venue: 'Albert Park, Melbourne',            flag: 'AU', tags: [],                    chuva: 0.15 },
  { id: 'chn', gp: 'GP da China',          venue: 'Circuito de Xangai',                flag: 'CN', tags: [],                    chuva: 0.18 },
  { id: 'jpn', gp: 'GP do Japão',          venue: 'Suzuka',                            flag: 'JP', tags: ['tecnica'],           chuva: 0.22 },
  { id: 'bhr', gp: 'GP do Bahrein',        venue: 'Sakhir',                            flag: 'BH', tags: ['potencia'],          chuva: 0.01 },
  { id: 'sau', gp: 'GP da Arábia Saudita', venue: 'Jeddah Corniche',                   flag: 'SA', tags: ['rua', 'potencia'],   chuva: 0.01 },
  { id: 'mia', gp: 'GP de Miami',          venue: 'Miami International Autodrome',     flag: 'US', tags: ['rua'],               chuva: 0.12 },
  { id: 'can', gp: 'GP do Canadá',         venue: 'Gilles Villeneuve, Montreal',       flag: 'CA', tags: ['potencia'],          chuva: 0.25 },
  { id: 'mon', gp: 'GP de Mônaco',         venue: 'Circuito de Monte Carlo',           flag: 'MC', tags: ['rua', 'tecnica'],    chuva: 0.10 },
  { id: 'bcn', gp: 'GP da Espanha',        venue: 'Barcelona-Catalunya',               flag: 'ES', tags: [],                    chuva: 0.08 },
  { id: 'aut', gp: 'GP da Áustria',        venue: 'Red Bull Ring, Spielberg',          flag: 'AT', tags: ['potencia'],          chuva: 0.20 },
  { id: 'gbr', gp: 'GP da Grã-Bretanha',   venue: 'Silverstone',                       flag: 'GB', tags: ['potencia'],          chuva: 0.25 },
  { id: 'bel', gp: 'GP da Bélgica',        venue: 'Spa-Francorchamps',                 flag: 'BE', tags: ['potencia'],          chuva: 0.30 },
  { id: 'hun', gp: 'GP da Hungria',        venue: 'Hungaroring, Budapeste',            flag: 'HU', tags: ['tecnica'],           chuva: 0.15 },
  { id: 'ned', gp: 'GP dos Países Baixos', venue: 'Zandvoort',                         flag: 'NL', tags: ['tecnica'],           chuva: 0.20 },
  { id: 'ita', gp: 'GP da Itália',         venue: 'Monza',                             flag: 'IT', tags: ['potencia'],          chuva: 0.10 },
  { id: 'mad', gp: 'GP de Madri',          venue: 'Madring, Madri',                    flag: 'ES', tags: ['rua'],               chuva: 0.08 },
  { id: 'aze', gp: 'GP do Azerbaijão',     venue: 'Circuito urbano de Baku',           flag: 'AZ', tags: ['rua', 'potencia'],   chuva: 0.05 },
  { id: 'sgp', gp: 'GP de Singapura',      venue: 'Marina Bay',                        flag: 'SG', tags: ['rua', 'tecnica'],    chuva: 0.25 },
  { id: 'usa', gp: 'GP dos Estados Unidos', venue: 'Circuito das Américas, Austin',    flag: 'US', tags: [],                    chuva: 0.12 },
  { id: 'mex', gp: 'GP do México',         venue: 'Autódromo Hermanos Rodríguez',      flag: 'MX', tags: [],                    chuva: 0.08 },
  { id: 'bra', gp: 'GP de São Paulo',      venue: 'Interlagos (José Carlos Pace)',     flag: 'BR', tags: [],                    chuva: 0.30 },
  { id: 'lvg', gp: 'GP de Las Vegas',      venue: 'Las Vegas Strip',                   flag: 'US', tags: ['rua', 'potencia'],   chuva: 0.02 },
  { id: 'qat', gp: 'GP do Catar',          venue: 'Lusail',                            flag: 'QA', tags: [],                    chuva: 0.01 },
  { id: 'abu', gp: 'GP de Abu Dhabi',      venue: 'Yas Marina',                        flag: 'AE', tags: [],                    chuva: 0.01 },
];

export const TAG_LABEL = { rua: 'Circuito de rua', potencia: 'Pista de potência', tecnica: 'Pista técnica' };

// O que cada etiqueta muda, em uma frase para o jogador.
export const TAG_HINT = {
  rua: 'Largar bem vale mais e o risco de abandono sobe.',
  potencia: 'O carro pesa mais no resultado.',
  tecnica: 'O piloto pesa mais no resultado.',
};

// Pista da etapa n (1 a 24). O calendário se repete a cada ano.
export const circuitFor = (n) => CIRCUITS[(n - 1) % CIRCUITS.length];
