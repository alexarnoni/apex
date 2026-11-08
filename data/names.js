// Sobrenomes antigos (compatibilidade: o mundo ainda recebe esta lista, mas os novatos agora usam NAME_POOLS).
export const SURNAMES = [
  'Almeida', 'Kovac', 'Tanaka', 'Rossi', 'Dubois', 'Ivanov', 'Berg', 'Costa',
  'Moretti', 'Nakamura', 'Weber', 'Olsen', 'Duarte', 'Fontana', 'Marino', 'Vieira',
  'Klein', 'Sato', 'Lindqvist', 'Ferraro', 'Mendes', 'Novak', 'Ricci', 'Andrade',
  'Petrov', 'Larsen', 'Bianchi', 'Okafor', 'Silveira', 'Kimura', 'Halvorsen', 'Toledo',
  'Zanetti', 'Reyes', 'Muller', 'Oliveira', 'Sorensen', 'Takahashi', 'Vargas', 'Elias',
];

// Nomes por país para os pilotos gerados: w = peso no sorteio, firsts = nomes (só a inicial aparece),
// surnames = sobrenomes comuns do país. Todos fictícios na combinação; o código do país bate com ui/assets/flags.
// O nome mostrado é "I. Sobrenome", que nunca colide com os pilotos reais (só sobrenome).
const pool = (w, firsts, surnames) => ({ w, firsts: firsts.split(','), surnames: surnames.split(',') });

export const NAME_POOLS = {
  BR: pool(10, 'Lucas,Gabriel,Rafael,Pedro,Bruno,Thiago,Felipe,Mateus,Caio,Vinícius', 'Almeida,Costa,Duarte,Mendes,Silveira,Oliveira,Andrade,Vieira,Toledo,Ramos,Barros,Moura,Teixeira,Cardoso'),
  GB: pool(10, 'Oliver,Harry,George,Jack,Charlie,Thomas,Freddie,Oscar,Callum,Ethan', 'Whitaker,Hargreaves,Ellison,Prescott,Fenwick,Langley,Ashworth,Bradshaw,Cartwright,Hollis,Marlowe,Thorne'),
  IT: pool(10, 'Marco,Luca,Matteo,Andrea,Giorgio,Federico,Alessio,Lorenzo,Davide,Nicolò', 'Rossi,Moretti,Fontana,Marino,Ferraro,Ricci,Bianchi,Zanetti,Conti,Greco,Lombardi,Barbieri'),
  FR: pool(9, 'Hugo,Théo,Louis,Nathan,Jules,Léo,Mathis,Arthur,Enzo,Baptiste', 'Dubois,Laurent,Moreau,Lefèvre,Garnier,Roussel,Fournier,Mercier,Girard,Chevalier,Lambert,Bonnet'),
  DE: pool(9, 'Lukas,Jonas,Felix,Leon,Maximilian,Tim,Paul,Niklas,Moritz,Fabian', 'Weber,Klein,Müller,Becker,Hoffmann,Schäfer,Koch,Richter,Wolf,Neumann,Braun,Krüger'),
  ES: pool(8, 'Pablo,Álvaro,Diego,Javier,Adrián,Sergio,Marcos,Iker,Hugo,Daniel', 'Reyes,Vargas,Navarro,Ortega,Molina,Castillo,Herrera,Domínguez,Serrano,Iglesias,Cabrera,Peña'),
  NL: pool(6, 'Daan,Sem,Luuk,Bram,Milan,Thijs,Jesse,Finn,Ruben,Stijn', 'De Vries,Van Dijk,Bakker,Visser,Smit,Meijer,Mulder,De Boer,Bos,Vos,Peters,Hendriks'),
  JP: pool(7, 'Haruto,Ren,Sota,Kaito,Yuto,Riku,Daiki,Takumi,Shun,Kenji', 'Tanaka,Nakamura,Sato,Kimura,Takahashi,Watanabe,Ito,Yamamoto,Kobayashi,Hayashi,Saito,Matsuda'),
  US: pool(7, 'Ethan,Mason,Logan,Tyler,Jacob,Cole,Brady,Austin,Grant,Wyatt', 'Carter,Mitchell,Brooks,Hayes,Sullivan,Parker,Reed,Coleman,Foster,Hughes,Bennett,Lawson'),
  AU: pool(5, 'Jack,Noah,Lachlan,Riley,Mitchell,Cooper,Hayden,Flynn,Blake,Jett', 'Mackenzie,Fraser,Gallagher,Sinclair,Kendall,Doyle,Walsh,Gibson,Hartley,Pearce,Quinn,Tait'),
  FI: pool(4, 'Eino,Aleksi,Juho,Mikko,Onni,Elias,Jesse,Ville,Tuomas,Joonas', 'Halvorsen,Virtanen,Korhonen,Mäkelä,Laine,Heikkinen,Koskinen,Salo,Lehtonen,Niemi,Rantanen,Järvinen'),
  MX: pool(4, 'Santiago,Mateo,Emiliano,Diego,Leonardo,Sebastián,Axel,Iván,Rodrigo,Fernando', 'Hernández,García,Ramírez,Cárdenas,Ibarra,Rangel,Salazar,Mejía,Aguilar,Cortés,Villalobos,Montes'),
  AR: pool(4, 'Facundo,Joaquín,Tomás,Nicolás,Agustín,Franco,Lautaro,Matías,Bautista,Santino', 'Acosta,Ferreyra,Giménez,Sosa,Benítez,Maldonado,Quiroga,Peralta,Ledesma,Figueroa,Rojas,Paz'),
  CA: pool(3, 'Liam,Ryan,Owen,Connor,Dylan,Nolan,Evan,Carter,Tristan,Julien', 'Tremblay,Gagnon,Roy,Campbell,MacDonald,Fortin,Bouchard,Gauthier,Pelletier,Murray,Lavoie,Stewart'),
  DK: pool(3, 'Mads,Emil,Frederik,Mikkel,Oskar,Rasmus,Anders,Magnus,Villads,Lasse', 'Sørensen,Larsen,Jensen,Nielsen,Hansen,Andersen,Pedersen,Christensen,Møller,Rasmussen,Holm,Kjær'),
  PT: pool(3, 'João,Tiago,Rodrigo,Duarte,Gonçalo,Diogo,Rúben,Bernardo,Nuno,Miguel', 'Ferreira,Pereira,Carvalho,Sousa,Marques,Gomes,Lopes,Fonseca,Monteiro,Cruz,Nunes,Teles'),
  TH: pool(3, 'Napat,Thanawat,Kritsada,Natthaphon,Pitchaya,Phurinat,Sorrawit,Chayanon,Pawat,Tanapat', 'Srisai,Chaiyasit,Wongsawat,Kittisak,Boonmee,Saetang,Rattanakul,Pongpan,Suwan,Charoen,Kaewmanee,Sirichai'),
  CH: pool(3, 'Noah,Luca,Nico,Livio,Fabio,Elias,Dario,Jan,Reto,Silvan', 'Keller,Meier,Huber,Schmid,Brunner,Baumann,Frei,Gerber,Zimmermann,Steiner,Moser,Lüthi'),
  PL: pool(2, 'Jakub,Kacper,Szymon,Michał,Mateusz,Filip,Bartosz,Piotr,Wojciech,Dawid', 'Novak,Kowalski,Wiśniewski,Zieliński,Szymański,Woźniak,Kamiński,Lewandowski,Dąbrowski,Kozłowski,Jankowski,Mazur'),
  AT: pool(2, 'Lukas,Florian,Tobias,Jakob,Matthias,Sebastian,Dominik,Stefan,Manuel,Philipp', 'Gruber,Huber,Bauer,Wagner,Pichler,Steiner,Moser,Mayer,Hofer,Leitner,Fuchs,Eder'),
  NZ: pool(2, 'Jack,Finn,Hunter,Mitchell,Caleb,Callum,Tane,Riley,Kai,Josh', 'Tāne,Harrington,Mahoney,Caldwell,Rutherford,Pomare,Ngata,Whitmore,Kerr,Lowe,Brennan,Hale'),
  BE: pool(3, 'Arthur,Noah,Lucas,Louis,Mathis,Victor,Maxime,Robin,Thomas,Senne', 'Peeters,Janssens,Maes,Jacobs,Willems,Claes,Goossens,Wouters,De Smet,Mertens,Dupont,Lambrecht'),
  CN: pool(3, 'Wei,Jun,Hao,Yu,Chen,Ming,Tao,Lei,Bo,Kai', 'Wang,Li,Zhang,Liu,Chen,Yang,Huang,Zhao,Wu,Zhou,Xu,Sun'),
  SE: pool(2, 'Oscar,Hugo,Elias,Liam,Axel,Alvin,Noel,Viktor,Isak,Melvin', 'Lindqvist,Johansson,Karlsson,Nilsson,Eriksson,Larsson,Olsson,Persson,Svensson,Gustafsson,Pettersson,Lindberg'),
};
