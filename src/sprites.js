'use strict';
// Pixel art for characters, items and tiles. Every sprite is a list of rows;
// each character is a palette role ('.' = transparent). All art is original.

const BASE_PAL = {
  K: '#1a1020', k: '#3a2e3e', W: '#ffffff', w: '#cfd3dc', E: '#8e909e', e: '#5a5c6a',
  R: '#e2352b', r: '#9e1c1c', O: '#f5821f', o: '#b0561a', Y: '#fcd23c', y: '#c8920e',
  G: '#3cb043', g: '#1e7030', L: '#9ce05a', B: '#2f63d8', b: '#1d3c8f', C: '#8fd8f8',
  S: '#d99a6c', s: '#a9693f', H: '#2b1a12', N: '#8a4a22', n: '#50280e', T: '#f0c890',
  t: '#b8844a', P: '#f07cb0', p: '#a8406a', V: '#8a4ad0', D: '#6a3a1a',
};

// ---------------------------------------------------------------- hero ----
// A Pune kid in a white Maharashtrian topi, a kurta and pyjama, with chappals.
// Roles: W/w/k topi, R/r kurta, Y kurta buttons, B/b pyjama, S/s skin, H hair, N chappals.
const HERO_SMALL_HEAD = [
  '....kkkkkkk.....',
  '...kWWWWWWWk....',
  '..kWWWWWWWWWk...',
  '..kwwwwwwwwwk...',
  '..HHHHSSSSKS....',
  '.HHHSSSSSSKSS...',
  '.HHHSSSSSSSSSS..',
  '..HHSSSSSSKKS...',
  '...sSSSSSSSs....',
];
const HERO_SMALL_BODY = {
  stand: [
    '....RRRrRRRR....',
    '...RRRRrRRRRR...',
    '..SRRRRrRRRRRS..',
    '..SRRRRRRRRRRS..',
    '...rRRRRRRRRr...',
    '....BBB..BBB....',
    '...NNNN..NNNN...',
  ],
  walk1: [
    '....RRRrRRRR....',
    '..SRRRRrRRRRRS..',
    '..SRRRRrRRRRRSS.',
    '...RRRRRRRRRR...',
    '..rRRRRRRRRRRr..',
    '..BBB......BBB..',
    '.NNNN......NNNN.',
  ],
  walk2: [
    '....RRRrRRRR....',
    '...RRRRrRRRRR...',
    '...SRRRrRRRRS...',
    '...SRRRRRRRRS...',
    '....rRRRRRRr....',
    '.....BBBBBB.....',
    '....NNNNNNNN....',
  ],
  walk3: [
    '....RRRrRRRR....',
    '...RRRRrRRRRSS..',
    '..SSRRRrRRRRSS..',
    '...RRRRRRRRRR...',
    '...rRRRRRRRRr...',
    '....BBB.BBB.....',
    '...NNNN..NNNN...',
  ],
  jump: [
    '..SSRRRrRRRRSS..',
    '..SSRRRrRRRRSS..',
    '...RRRRrRRRRR...',
    '...RRRRRRRRRR...',
    '..rRRRRRRRRRRr..',
    '..BBB.....BBBN..',
    '.NNN.......NN...',
  ],
  skid: [
    '....RRRrRRRR....',
    '...RRRRrRRRRSS..',
    '...RRRRrRRRRSS..',
    '...RRRRRRRRRR...',
    '..rRRRRRRRRRr...',
    '.BBB...BBB......',
    'NNNN...NNNN.....',
  ],
  climb1: [
    '....RRRrRRRRSS..',
    '...RRRRrRRRRSS..',
    '...RRRRrRRRR....',
    '...RRRRRRRRR....',
    '...rRRRRRRRRr...',
    '....BBB.BBB.....',
    '....NNN..NNN....',
  ],
  climb2: [
    '....RRRrRRRRSS..',
    '...RRRRrRRRRSS..',
    '...RRRRrRRRR....',
    '...RRRRRRRRR....',
    '...rRRRRRRRRr...',
    '...BBB..BBB.....',
    '...NNN...NNN....',
  ],
};
const HERO_SMALL_DIE = [
  '....kkkkkkkk....',
  '...kWWWWWWWWk...',
  '...kwwwwwwwwk...',
  '..HHSSSSSSSSHH..',
  '.SHSSKSSSSKSSHS.',
  '.SHSSKSSSSKSSHS.',
  '.SSSSSSSSSSSSSS.',
  '.SS.SSSKKSSS.SS.',
  '.SS..sSSSSs..SS.',
  '..SRRRRrRRRRRS..',
  '...RRRRrRRRRR...',
  '...RRRRrRRRRR...',
  '...rRRRRRRRRr...',
  '....BBB..BBB....',
  '...NNNN..NNNN...',
  '...NNN....NNN...',
];

const HERO_BIG_HEAD = [
  '................',
  '.....kkkkkkk....',
  '....kWWWWWWWk...',
  '...kWWWWWWWWWk..',
  '...kWWWWWWWWWk..',
  '..kwwwwwwwwwwwk.',
  '..HHHHHHSSSSSS..',
  '.HHHHHSSSSSKSS..',
  '.HHHHSSSSSSKSSS.',
  '.HHHSSSSSSSSSSSS',
  '..HHSSSSSSSSSSS.',
  '..HHSSSSSSKKKS..',
  '...sSSSSSSSSSs..',
];
const KURTA_TOP = [
  '....SSSSSSSS....',
  '...RRRRrrRRRR...',
  '..RRRRRrRRRRRR..',
];
const HERO_BIG_BODY = {
  stand: KURTA_TOP.concat([
    '..RRRRRYRRRRRR..',
    '.RRRRRRrRRRRRRR.',
    '.RRRRRRYRRRRRRR.',
    '.SRRRRRrRRRRRRS.',
    '.SSRRRRRRRRRRSS.',
    '.SS.RRRRRRRR.SS.',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '...rRRRRRRRRr...',
    '....BBBB..BBBB..',
    '....BBBB..BBBB..',
    '....BBBB..BBBB..',
    '....bBBB..bBBB..',
    '....BBBB..BBBB..',
    '...NNNNN..NNNNN.',
    '..NNNNNN..NNNNNN',
  ]),
  walk1: KURTA_TOP.concat([
    '.RRRRRRYRRRRRRR.',
    'SSRRRRRrRRRRRRSS',
    'SSRRRRRYRRRRRRSS',
    'SS.RRRRrRRRRR.SS',
    '...RRRRRRRRRR...',
    '...RRRRRRRRRRR..',
    '..RRRRRRRRRRRRR.',
    '..RRRRRRRRRRRRR.',
    '..rRRRRRRRRRRRr.',
    '..BBBB....BBBBB.',
    '.BBBB......BBBB.',
    '.BBBB......BBBB.',
    '.bBBB.......BBB.',
    '.BBB........BBB.',
    'NNNNN......NNNN.',
    'NNNN.......NNNNN',
  ]),
  walk2: KURTA_TOP.concat([
    '..RRRRRYRRRRR...',
    '..RRRRRrRRRRR...',
    '..RSSRRYRRRSSR..',
    '...SSRRrRRRSS...',
    '....RRRRRRRR....',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '...RRRRRRRRRR...',
    '...rRRRRRRRRr...',
    '.....BBBBBB.....',
    '.....BBBBBB.....',
    '.....BBBBBB.....',
    '.....bBBBBB.....',
    '.....BBBBBB.....',
    '....NNNNNNNN....',
    '...NNNNNNNNN....',
  ]),
  walk3: KURTA_TOP.concat([
    '..RRRRRYRRRRRRS.',
    '..RRRRRrRRRRRRSS',
    '..SSRRRYRRRRRRSS',
    '..SSRRRrRRRRR...',
    '...RRRRRRRRRR...',
    '...RRRRRRRRRRR..',
    '...RRRRRRRRRRR..',
    '...RRRRRRRRRRR..',
    '...rRRRRRRRRRr..',
    '....BBBB..BBBB..',
    '...BBBB....BBB..',
    '...BBBB....BBB..',
    '...bBBB....BBB..',
    '...BBB.....BBB..',
    '..NNNNN....NNNN.',
    '..NNNN.....NNNNN',
  ]),
  jump: [
    '....SSSSSSSS.SS.',
    '...RRRRrrRRRRSS.',
    '..RRRRRrRRRRRRS.',
    '.RRRRRRYRRRRRRR.',
    'SSRRRRRrRRRRRR..',
    'SSRRRRRYRRRRRR..',
    'SS.RRRRrRRRRRR..',
    '...RRRRRRRRRRR..',
    '...RRRRRRRRRRRR.',
    '..RRRRRRRRRRRRRR',
    '..RRRRRRRRRRRRRR',
    '..rRRRRRRRRRRRRr',
    '..BBBB.....BBBBN',
    '..BBBB.....BBBNN',
    '..BBBB......NNNN',
    '..bBBB.......NN.',
    '..BBBB..........',
    '.NNNNN..........',
    'NNNN............',
  ],
  skid: [
    '....SSSSSSSS....',
    '...RRRRrrRRRR...',
    '..RRRRRrRRRRRRSS',
    '..RRRRRYRRRRRRSS',
    '..RRRRRrRRRRRRS.',
    '..RRRRRYRRRRRR..',
    '...SSRRrRRRRR...',
    '...SSRRRRRRRR...',
    '....RRRRRRRRRR..',
    '...RRRRRRRRRRR..',
    '..RRRRRRRRRRRR..',
    '..rRRRRRRRRRRr..',
    '.BBBB...BBBB....',
    '.BBBB...BBBB....',
    'BBBB....BBBB....',
    'bBBB....bBBB....',
    'BBBB....BBBB....',
    'NNNNN..NNNNN....',
    'NNNN..NNNNN.....',
  ],
  climb1: [
    '....SSSSSSSS.SS.',
    '...RRRRrrRRRRSS.',
    '..RRRRRrRRRRRRS.',
    '..RRRRRYRRRRRR..',
    '..RRRRRrRRRRR...',
    '..RRRRRYRRRRR...',
    '...SSRRrRRRRR...',
    '...SSRRRRRRRR...',
    '....RRRRRRRRR...',
    '....RRRRRRRRR...',
    '....RRRRRRRRR...',
    '....rRRRRRRRr...',
    '....BBBB.BBBB...',
    '....BBBB.BBBB...',
    '....BBBB.BBBB...',
    '....bBBB.bBBB...',
    '....BBBB.BBBB...',
    '...NNNNN.NNNNN..',
    '...NNNN..NNNN...',
  ],
  climb2: [
    '....SSSSSSSS.SS.',
    '...RRRRrrRRRRSS.',
    '..RRRRRrRRRRRRS.',
    '..RRRRRYRRRRRR..',
    '..RRRRRrRRRRR...',
    '..RRRRRYRRRRR...',
    '...SSRRrRRRRR...',
    '...SSRRRRRRRR...',
    '....RRRRRRRRR...',
    '....RRRRRRRRR...',
    '....RRRRRRRRR...',
    '....rRRRRRRRr...',
    '...BBBBB.BBBB...',
    '...BBBB..BBBB...',
    '..BBBB...BBBB...',
    '..bBBB...bBBB...',
    '..BBBB...BBBB...',
    '.NNNNN..NNNNN...',
    '..NNN....NNN....',
  ],
};
const HERO_BIG_CROUCH_BODY = [
  '..RRRRrRRRRRRR..',
  '.SSRRRYRRRRRRSS.',
  '.SSRRRRRRRRRRSS.',
  '..RRRRRRRRRRRR..',
  '..RRRRRRRRRRRRR.',
  '..rBBBBBBBBBBBr.',
  '..BBBBBBBBBBBBB.',
  '.NNNNNN..NNNNNN.',
  'NNNNNNN..NNNNNNN',
];

const KURTA = { R: '#f39a2e', r: '#b8601a', Y: '#7a3e12', B: '#f4efe2', b: '#c8c0ac' };
const HERO_PALETTES = {
  normal: KURTA,
  fire: { ...KURTA, R: '#44b848', r: '#1e7a2a', Y: '#fcd23c' },
  star1: { ...KURTA, R: '#fcd23c', r: '#c8920e', B: '#e2352b', b: '#9e1c1c' },
  star2: { ...KURTA, R: '#ffffff', r: '#c0c0c0', B: '#3cb043', b: '#1e7030', S: '#f0c8a0' },
  star3: { ...KURTA, R: '#e2352b', r: '#9e1c1c', B: '#8a4ad0', b: '#5a2a90' },
};

// ------------------------------------------------------------- enemies ----
const SPR_DEFS = {
  auto1: [
    '................',
    '...yyyyyyyyyy...',
    '..yYYYYYYYYYYy..',
    '.yYYYYYYYYYYYYy.',
    '.YKKKKKKKKYYYYY.',
    '.YKWWKCWWKKYY.Y.',
    '.YKKWCCKWCKYY.Y.',
    '.YKCCCCCCCKYY.Y.',
    'KKKKKKKKKKKKKKKK',
    'KWWKKKKKKKKKKKKK',
    'KWWKKKYYYYYYYKK.',
    '.KKKKKKKKKKKKKK.',
    '..KKKKKKKKKKKKK.',
    '.eEEe......eEEe.',
    '.EwwE......EwwE.',
    '..EE........EE..',
  ],
  auto2: [
    '................',
    '...yyyyyyyyyy...',
    '..yYYYYYYYYYYy..',
    '.yYYYYYYYYYYYYy.',
    '.YKKKKKKKKYYYYY.',
    '.YKWWKCWWKKYY.Y.',
    '.YKKWCCKWCKYY.Y.',
    '.YKCCCCCCCKYY.Y.',
    'KKKKKKKKKKKKKKKK',
    'KWWKKKKKKKKKKKKK',
    'KWWKKKYYYYYYYKK.',
    '.KKKKKKKKKKKKKK.',
    '..KKKKKKKKKKKKK.',
    '.EeeE......EeeE.',
    '.eEwe......eEwe.',
    '..ee........ee..',
  ],
  autoFlat: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..yYYYYYYYYYYy..',
    '.YKCKCKCKCKYYYY.',
    'KKKKKKKKKKKKKKKK',
    'KWWKKKYYYYYYYKKK',
    '.KKKKKKKKKKKKKK.',
    '.eEEe......eEEe.',
    '..EE........EE..',
  ],
  monkey1: [
    '................',
    '...NNNN.........',
    '..NNNNNN........',
    '.NTTTTTTN.......',
    'NNTKTTKTNN......',
    'NNTKTTKTNN......',
    '..TTPPTT........',
    '...TTTT.....NN..',
    '..NNNNNNN..N..N.',
    '.NNNNNNNNNN...N.',
    'TNNNNTTNNNN..NN.',
    'TTNNTTTTNNN.....',
    '..NNNTTNNNN.....',
    '..NN.....NN.....',
    '.NN.......NN....',
    'TT.........TT...',
  ],
  monkey2: [
    '................',
    '...NNNN.........',
    '..NNNNNN........',
    '.NTTTTTTN.......',
    'NNTKTTKTNN......',
    'NNTKTTKTNN...NN.',
    '..TTPPTT....N..N',
    '...TTTT.....N...',
    '..NNNNNNN..N....',
    '.NNNNNNNNNN.....',
    '.NNNNTTNNNNT....',
    '.NNNTTTTNNNTT...',
    '..NNNTTNNNN.....',
    '...NN...NN......',
    '...NN...NN......',
    '..TT...TT.......',
  ],
  monkeyBall1: [
    '................',
    '................',
    '.....NNNNNN.....',
    '...NNNNNNNNNN...',
    '..NNNnNNNNNNNN..',
    '..NNnNNNNNNNNN..',
    '.NNNNnnNNNNnNNN.',
    '.NNNNNNnnnnNNNN.',
    '.NNTTTTNNNNNNNN.',
    '.NTTKKTTNNNNNNN.',
    '.NTTTTTTNNNNNnN.',
    '..NTTTTNNNNNnN..',
    '..NNNNNNNNnnNN..',
    '...NNNNNNNNNN...',
    '.....NNNNNN.....',
    '................',
  ],
  monkeyBall2: [
    '................',
    '................',
    '.....NNNNNN.....',
    '...NNNNNNNNNN...',
    '..NNNnNNNNNNNN..',
    '..NNnNNNNNNNNN..',
    '.NNNNnnNNNNnNNN.',
    '.NNNNNNnnnnNNNN.',
    '.NNTTTTNNNNNNNN.',
    '.NTKTKTTNNNNNNN.',
    '.NTTPTTTNNNNNnN.',
    '..NTTTTNNNNNnN..',
    '..NNNNNNNNnnNN..',
    '...NNNNNNNNNN...',
    '.....NNNNNN.....',
    '................',
  ],
  pigeon1: [
    '................',
    '................',
    '........wwE.....',
    '.......wwEEE....',
    '..EE...wEEEe....',
    '.EKEE..wEEe.....',
    'OEEEE.wEEe......',
    '..GVEEEEEe......',
    '..EEEEEEEEEEe...',
    '..wEEEEEEEEEee..',
    '...wEEEEEEEeeee.',
    '....wwEEEEe..ee.',
    '......O..O......',
    '................',
    '................',
    '................',
  ],
  pigeon2: [
    '................',
    '................',
    '................',
    '................',
    '..EE............',
    '.EKEE...........',
    'OEEEE...........',
    '..GVEEEEEe......',
    '..EEEEEEEEEEe...',
    '..wEEwwwwEEEee..',
    '...wEEwEEwwEeeee',
    '....wwEwwEe..ee.',
    '......OwwO......',
    '.......ww.......',
    '................',
    '................',
  ],
  cobra1: [
    '.....gggggg.....',
    '...ggGGGGGGgg...',
    '..gGGGLLLLGGGg..',
    '.gGGLLLLLLLLGGg.',
    '.gGLLWKLLWKLLGg.',
    '.gGLLKKLLKKLLGg.',
    '.gGLLLLLLLLLLGg.',
    '.gGGLLRRRRLLGGg.',
    '..gGGLRWWRLGGg..',
    '...gGGLRRLGGg...',
    '....ggLLLLgg....',
    '......GLLG......',
    '......GLLG......',
    '.....gGLLGg.....',
    '.....gGYLGg.....',
    '.....gGLLGg.....',
    '.....gGLYGg.....',
    '.....gGLLGg.....',
    '.....gGYLGg.....',
    '.....gGLLGg.....',
    '.....gGLYGg.....',
    '.....gGLLGg.....',
    '.....gGYLGg.....',
    '.....gGLLGg.....',
  ],
  cobra2: [
    '.....gggggg.....',
    '...ggGGGGGGgg...',
    '..gGGGLLLLGGGg..',
    '.gGGLLLLLLLLGGg.',
    '.gGLLWKLLWKLLGg.',
    '.gGLLKKLLKKLLGg.',
    '.gGLLLLLLLLLLGg.',
    '.gGGLLLLLLLLGGg.',
    '..gGGLKKKKLGGg..',
    '...gGGLLLLGGg...',
    '....ggLLLLgg....',
    '......GLLG......',
    '......GLLG......',
    '.....gGLLGg.....',
    '.....gGLYGg.....',
    '.....gGLLGg.....',
    '.....gGYLGg.....',
    '.....gGLLGg.....',
    '.....gGLYGg.....',
    '.....gGLLGg.....',
    '.....gGYLGg.....',
    '.....gGLLGg.....',
    '.....gGLYGg.....',
    '.....gGLLGg.....',
  ],
  flame1: [
    '.......Y........',
    '......YY........',
    '.....YOY...Y....',
    '....YOOY..YY....',
    '...YOOOOYYOY....',
    '...YOORROOOY....',
    '..YORRRRROOY....',
    '..YORRRRRROOY...',
    '.YORRWKRWKROY...',
    '.YORRWKRWKROY...',
    '.YORRRRRRRROY...',
    '.YOORRRRRROOY...',
    '..YOORRRROOY....',
    '...YOOOOOOY.....',
    '....YYYYYY......',
    '................',
  ],
  flame2: [
    '........Y.......',
    '....Y...YY......',
    '....YY..YOY.....',
    '....YOYYOOY.....',
    '...YOOOOOOY.....',
    '...YOORROOOY....',
    '..YORRRRROOY....',
    '..YORRRRRROOY...',
    '.YORRWKRWKROY...',
    '.YORRWKRWKROY...',
    '.YORRRRRRRROY...',
    '.YOORRKKRROOY...',
    '..YOORRRROOY....',
    '...YOOOOOOY.....',
    '....YYYYYY......',
    '................',
  ],
  fireball: [
    '..YYYY..',
    '.YOOOOY.',
    'YOORROOY',
    'YORWRROY',
    'YORRRROY',
    'YOORROOY',
    '.YOOOOY.',
    '..YYYY..',
  ],
  banana: [
    '......n.',
    '.....YY.',
    '....YYy.',
    '...YYYy.',
    '..YYYy..',
    '.YYYy...',
    'YYyy....',
    '.y......',
  ],
  // ------------------------------------------------------------ items ----
  vadapav: [
    '................',
    '.....tTTTTTt....',
    '...tTTTTTTTTTt..',
    '..tTTWTTTTTTTTt.',
    '..TTWTTTTTTTTTT.',
    '..tTTTTTTTTTTTt.',
    '..GGRGGGRGGGRGG.',
    '.OOOOOOOOOOOOOOO',
    '.OoOOOoOOOoOOOoO',
    '..OOOOOOOOOOOOO.',
    '..ttttttttttttt.',
    '..tTTKTTTTTKTTt.',
    '..tTTKTTTTTKTTt.',
    '...tTTTTTTTTTt..',
    '....ttttttttt...',
    '................',
  ],
  mirchi: [
    '.........gg.....',
    '........gGg.....',
    '.......gGg......',
    '.....GGGGGGG....',
    '....GLLGGGGGg...',
    '....GLGGGGGGg...',
    '...GLGGGGGGg....',
    '...GLGGGGGGg....',
    '..GLGGGGGGg.....',
    '..GGGGGGGGg.....',
    '..GGGGGGGg......',
    '..GGGGGGg.......',
    '...GGGGg........',
    '....GGg.........',
    '.....Gg.........',
    '......g.........',
  ],
  dhol: [
    '................',
    '.....nnnnnn.....',
    '...nn......nn...',
    '..n..........n..',
    '.TTRRRRRRRRRRTT.',
    'TTtRYRRRYRRRYtTT',
    'TtTRRYRYRYRYRTtT',
    'TtTRRRYRRRYRRTtT',
    'TtTRRYRYRYRYRTtT',
    'TtTRYRRRYRRRYTtT',
    'TtTRRRRRRRRRRTtT',
    'TTtrrrrrrrrrrtTT',
    '.TTrrrrrrrrrrTT.',
    '................',
    '................',
    '................',
  ],
  modak: [
    '.......O........',
    '.......W........',
    '......WWW.......',
    '......WwW.......',
    '.....WWwWW......',
    '.....WwWwW......',
    '....WWwWwWW.....',
    '....WwWWWwW.....',
    '...WWwWWWwWW....',
    '...WwWWWWWwW....',
    '..WWwWWWWWwWW...',
    '..WwWWWWWWWwW...',
    '..WWwWWWWWwWW...',
    '...WWWWWWWWW....',
    '....wwwwwww.....',
    '................',
  ],
  coin0: [
    '................',
    '.....yyyyyy.....',
    '....yYYYYYYy....',
    '...yYWYYYYYYy...',
    '...yYWooooYYy...',
    '...yYYYYoYYYy...',
    '...yYWooooYYy...',
    '...yYYYoYYYYy...',
    '...yYYYYoYYYy...',
    '...yYYYYYoYYy...',
    '...yYYYYYYoYy...',
    '...yYYYYYYYYy...',
    '....yYYYYYYy....',
    '.....yyyyyy.....',
    '................',
    '................',
  ],
  coin1: [
    '................',
    '......yyyy......',
    '.....yYYYYy.....',
    '.....yWYYYy.....',
    '.....yWoooy.....',
    '.....yYYoYy.....',
    '.....yWoooy.....',
    '.....yYoYYy.....',
    '.....yYYoYy.....',
    '.....yYYYoy.....',
    '.....yYYYYy.....',
    '.....yYYYYy.....',
    '.....yYYYYy.....',
    '......yyyy......',
    '................',
    '................',
  ],
  coin2: [
    '................',
    '.......yy.......',
    '......yWYy......',
    '......yWYy......',
    '......yWYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '......yYYy......',
    '.......yy.......',
    '................',
    '................',
  ],
  bell: [
    '.......yy.......',
    '......yYYy......',
    '.......yy.......',
    '.....yyYYyy.....',
    '....yYYYYYYy....',
    '....YWYYYYYy....',
    '...yYWYYYYYYy...',
    '...yYWYYYYYYy...',
    '...YYWYYYYYYy...',
    '..yYYYYYYYYYYy..',
    '..YYYYYYYYYYYy..',
    '.yYYYYYYYYYYYYy.',
    '.yyyyyyyyyyyyyy.',
    '......yYYy......',
    '.......yy.......',
    '................',
  ],
};

// Makad Raja (the monkey king boss), 32x32, facing left.
const BOSS_TOP = [
  '................................',
  '...........Y...Y...Y............',
  '...........YY.YYY.YY............',
  '...........YYYYYYYYY............',
  '...........YRYYGYYRY............',
  '...........yyyyyyyyy............',
  '.........NNNNNNNNNNNNN..........',
  '........NNNNNNNNNNNNNNN.........',
  '......NNNNNNNNNNNNNNNNNN........',
  '.....NNNTTTTTTTTTTNNNNNNN.......',
  '...NNNTTTTTTTTTTTTTTNNNNNN......',
  '..NTNNKKKTTTTTKKKTTTTNNNNN......',
  '..NTNTTWKKTTTTWKKTTTTNNTN.......',
  '..NTNTTWKTTTTTWKTTTTTNNTN.......',
  '...NNTTTTTTTTTTTTTTTTNNN........',
  '.....TTTTPPPPPPTTTTTNN..........',
  '.....TTTPKKKKKKPTTTTN...........',
  '.....TTTPKWWWWKPTTTN............',
  '......TTTPPPPPPTTTN.............',
  '.......NNTTTTTTNNNRRR...........',
];
const BOSS_BOTTOM = {
  walk1: [
    '.....NNNNNNNNNNNNNRRRRR.........',
    '...TTNNNNNNNNNNNNNNRRRRR........',
    '..TTTNNNNTTTTTTNNNNRRRRRR.......',
    '..TTNNNNTTTTTTTTNNNRRRRRR.......',
    '..TTNNNNTTTTTTTTNNNNRRRRR....NN.',
    '...TTNNNTTTTTTTTNNNNRRRR....N..N',
    '......NNNTTTTTTNNNNNNRR....N....',
    '......NNNNNNNNNNNNNNNN....NN....',
    '......NNNNN....NNNNNNNNNNN......',
    '.....NNNNN......NNNNN...........',
    '....TTTTT.......TTTTT...........',
    '...TTTTTT......TTTTTT...........',
  ],
  walk2: [
    '.....NNNNNNNNNNNNNRRRRR.........',
    '...TTNNNNNNNNNNNNNNRRRRR........',
    '..TTTNNNNTTTTTTNNNNRRRRRR.......',
    '..TTNNNNTTTTTTTTNNNRRRRRR.......',
    '..TTNNNNTTTTTTTTNNNNRRRRR.......',
    '...TTNNNTTTTTTTTNNNNRRRR....NN..',
    '......NNNTTTTTTNNNNNNRR....N..N.',
    '......NNNNNNNNNNNNNNNNNNNNNN....',
    '.......NNNNNNNNNNNNNN...........',
    '........NNNNN..NNNNN............',
    '.......TTTTT..TTTTT.............',
    '......TTTTTT.TTTTTT.............',
  ],
  throw: [
    '..YY.NNNNNNNNNNNNRRRRR..........',
    '.YYTTNNNNNNNNNNNNNRRRRR.........',
    '.YTTTNNNNTTTTTTNNNNRRRRR........',
    '..TTNNNNTTTTTTTTNNNRRRRRR.......',
    '...TNNNNTTTTTTTTNNNNRRRRR....NN.',
    '....NNNNTTTTTTTTNNNNRRRR....N..N',
    '......NNNTTTTTTNNNNNNRR....N....',
    '......NNNNNNNNNNNNNNNN....NN....',
    '......NNNNN....NNNNNNNNNNN......',
    '.....NNNNN......NNNNN...........',
    '....TTTTT.......TTTTT...........',
    '...TTTTTT......TTTTTT...........',
  ],
};

// ----------------------------------------------------------------- tiles ---
// Roles: a = main, b = dark/mortar, c = light edge, d = speckle, K = rivet, q = glyph
const TILE_DEFS = {
  ground: [
    'cccccccbcccccccb',
    'caaaaaabcaaaaaab',
    'caadaaabcaaaadab',
    'caaaaaabcadaaaab',
    'caaaadabcaaaaaab',
    'cadaaaabcaaaaaab',
    'caaaaaabcaaadaab',
    'bbbbbbbbbbbbbbbb',
    'cccbcccccccbcccc',
    'aaabcaaaaaabcaaa',
    'adabcaadaaabcada',
    'aaabcaaaaaabcaaa',
    'aaabcaaaadabcaaa',
    'daabcadaaaabcaad',
    'aaabcaaaaaabcaaa',
    'bbbbbbbbbbbbbbbb',
  ],
  groundTop: [
    'LLLLLLLLLLLLLLLL',
    'GLGGLGGGLGGLGGGL',
    'GGgGGgGGGgGGgGGG',
    'gcgggcgggcgggcgg',
    'caaaadabcaaaaaab',
    'cadaaaabcaaaaaab',
    'caaaaaabcaaadaab',
    'bbbbbbbbbbbbbbbb',
    'cccbcccccccbcccc',
    'aaabcaaaaaabcaaa',
    'adabcaadaaabcada',
    'aaabcaaaaaabcaaa',
    'aaabcaaaadabcaaa',
    'daabcadaaaabcaad',
    'aaabcaaaaaabcaaa',
    'bbbbbbbbbbbbbbbb',
  ],
  brick: [
    'cccccccbcccccccb',
    'aaaaaaabaaaaaaab',
    'aadaaaabaaaadaab',
    'bbbbbbbbbbbbbbbb',
    'cccbcccccccbcccc',
    'aaabaaaaaaabaaaa',
    'adabaaaadaabaada',
    'bbbbbbbbbbbbbbbb',
    'cccccccbcccccccb',
    'aaaaaaabaaaaaaab',
    'aaaadaabadaaaaab',
    'bbbbbbbbbbbbbbbb',
    'cccbcccccccbcccc',
    'aaabaaaaaaabaaaa',
    'adabaadaaaabaada',
    'bbbbbbbbbbbbbbbb',
  ],
  qblock: [
    'cccccccccccccccb',
    'caaaaaaaaaaaaaab',
    'caKaaaaaaaaaaKab',
    'caaaaqqqqqaaaaab',
    'caaaqqbbbqqaaaab',
    'caaaqqbaaqqbaaab',
    'caaaabbaaqqbaaab',
    'caaaaaaaqqbbaaab',
    'caaaaaaqqbbaaaab',
    'caaaaaaqqbaaaaab',
    'caaaaaaabbaaaaab',
    'caaaaaaqqaaaaaab',
    'caaaaaaqqbaaaaab',
    'caKaaaaabbaaaKab',
    'caaaaaaaaaaaaaab',
    'bbbbbbbbbbbbbbbb',
  ],
  used: [
    'bbbbbbbbbbbbbbbb',
    'bccccccccccccccb',
    'bcKaaaaaaaaaaKab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcaaaaaaaaaaaaab',
    'bcKaaaaaaaaaaKab',
    'bcaaaaaaaaaaaaab',
    'bbbbbbbbbbbbbbbb',
  ],
  hard: [
    'cccccccccccccccb',
    'ccccccccccccccbb',
    'ccaaaaaaaaaaaabb',
    'ccaaaaaadaaaaabb',
    'ccaadaaaaaaaaabb',
    'ccaaaaaaaaadaabb',
    'ccaaaaaaaaaaaabb',
    'ccaaadaaaaaaaabb',
    'ccaaaaaaaadaaabb',
    'ccaaaaaaaaaaaabb',
    'ccaaaaadaaaaaabb',
    'ccadaaaaaaaaaabb',
    'ccaaaaaaaaadaabb',
    'ccaaaaaaaaaaaabb',
    'cbbbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbbbb',
  ],
  stone: [
    'cccccccccccccccb',
    'caaaaaaaaaaaaaab',
    'caadaaaaaaadaaab',
    'caaaaaaaaaaaaaab',
    'caaaaaadaaaaaaab',
    'caaaaaaaaaaaadab',
    'caadaaaaaaaaaaab',
    'bbbbbbbbbbbbbbbb',
    'ccccccbccccccccc',
    'aaaaacbaaaaaaaaa',
    'aadaacbaaaadaaaa',
    'aaaaacbaaaaaaaaa',
    'aaaaacbaaaaaadaa',
    'adaaacbaaaaaaaaa',
    'aaaaacbaadaaaaaa',
    'bbbbbbbbbbbbbbbb',
  ],
  bridge: [
    'cccccccccccccccc',
    'aaaaaaaaaaaaaaaa',
    'abaaaaaabaaaaaaa',
    'abaaaaaabaaaaaaa',
    'bbbbbbbbbbbbbbbb',
    '.d...........d..',
    '..d.........d...',
    '...dd.....dd....',
    '.....ddddd......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  ledge: [
    'LLLLLLLLLLLLLLLL',
    'GLGGLGGGLGGGLGLG',
    'gcgcccgcccgcccgc',
    'aaaaaaabaaaaaaab',
    'aaadaaabaaadaaab',
    'aaaaaaabaaaaaaab',
    'bbbbbbbbbbbbbbbb',
    '.b...b...b...b..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

const DEBRIS_DEF = [
  '.cc.....',
  'caab....',
  'caaab...',
  '.aaab...',
  '..bb....',
  '........',
  '........',
  '........',
];

const THEME_PALS = {
  overworld: {
    ground: { a: '#c0643a', b: '#6e2e1a', c: '#e89a64', d: '#a4502c', L: '#8ee05a', G: '#4fae3a', g: '#2c7a2a' },
    brick: { a: '#b8522e', b: '#4e1a0c', c: '#e28a5c', d: '#9c4424' },
    qblock: { a: '#f0a020', b: '#8a4a10', c: '#ffe08a', K: '#5a2a08', q: '#fff4d0' },
    used: { a: '#9a6434', b: '#3e2210', c: '#c08a58', K: '#3e2210' },
    hard: { a: '#7c7068', b: '#38302c', c: '#b4a89c', d: '#6a5e56' },
    pipe: { K: '#0f2c12', a: '#3caa44', b: '#1f6e2a', c: '#9ae67a', L: '#e4ffd0' },
  },
  underground: {
    ground: { a: '#566a86', b: '#1e2838', c: '#8aa0bc', d: '#4a5c76' },
    brick: { a: '#2f78b0', b: '#0c2440', c: '#6cb6ea', d: '#28689c' },
    qblock: { a: '#f0a020', b: '#8a4a10', c: '#ffe08a', K: '#5a2a08', q: '#fff4d0' },
    used: { a: '#7a6048', b: '#2e2018', c: '#a08468', K: '#2e2018' },
    hard: { a: '#5c6a80', b: '#222a38', c: '#94a4bc', d: '#4e5a6e' },
    pipe: { K: '#0f2c12', a: '#3caa44', b: '#1f6e2a', c: '#9ae67a', L: '#e4ffd0' },
  },
  metro: {
    ground: { a: '#b4b8c2', b: '#5c6270', c: '#e2e5ec', d: '#a2a6b2', L: '#f8d030', G: '#e0b020', g: '#8a8f9c' },
    brick: { a: '#7a4ab0', b: '#321a58', c: '#ac80dc', d: '#6a3ea0' },
    qblock: { a: '#f0a020', b: '#8a4a10', c: '#ffe08a', K: '#5a2a08', q: '#fff4d0' },
    used: { a: '#7a6048', b: '#2e2018', c: '#a08468', K: '#2e2018' },
    hard: { a: '#8a94a4', b: '#3a404c', c: '#c8d0dc', d: '#7a8494' },
    pipe: { K: '#0f2c12', a: '#3caa44', b: '#1f6e2a', c: '#9ae67a', L: '#e4ffd0' },
  },
  sky: {
    ground: { a: '#8e8270', b: '#3e362c', c: '#c4b8a2', d: '#7a6e5e', L: '#a8e070', G: '#5aa840', g: '#357a30' },
    brick: { a: '#9a6a48', b: '#3e2616', c: '#c8966c', d: '#86583a' },
    qblock: { a: '#f0a020', b: '#8a4a10', c: '#ffe08a', K: '#5a2a08', q: '#fff4d0' },
    used: { a: '#9a6434', b: '#3e2210', c: '#c08a58', K: '#3e2210' },
    hard: { a: '#86796a', b: '#3a3228', c: '#bcae9a', d: '#74685a' },
    ledge: { a: '#9a8e7a', b: '#4a4034', c: '#c8bca6', d: '#867a68', L: '#a8e070', G: '#5aa840', g: '#357a30' },
    pipe: { K: '#0f2c12', a: '#3caa44', b: '#1f6e2a', c: '#9ae67a', L: '#e4ffd0' },
  },
  castle: {
    ground: { a: '#6e6a78', b: '#2a2832', c: '#a09cac', d: '#5e5a68' },
    stone: { a: '#6e6a78', b: '#2a2832', c: '#a09cac', d: '#5e5a68' },
    brick: { a: '#6e6a78', b: '#2a2832', c: '#a09cac', d: '#5e5a68' },
    qblock: { a: '#f0a020', b: '#8a4a10', c: '#ffe08a', K: '#5a2a08', q: '#fff4d0' },
    used: { a: '#7a6048', b: '#2e2018', c: '#a08468', K: '#2e2018' },
    hard: { a: '#6e6a78', b: '#2a2832', c: '#a09cac', d: '#5e5a68' },
    bridge: { a: '#b06a30', b: '#5a3010', c: '#e09a58', d: '#c8c8d0' },
    pipe: { K: '#0f2c12', a: '#3caa44', b: '#1f6e2a', c: '#9ae67a', L: '#e4ffd0' },
  },
};

// Ganesha idol for the festival pandals (front view, 24x28). Most rows are
// symmetric, so only the left half is written and mirrored; the trunk and the
// single tusk are drawn on top afterwards.
const GANESHA_LEFT = [
  '..........yY',
  '.........yYY',
  '.........YRY',
  '........yYYY',
  '........YYGY',
  '.......yYYYY',
  '..ssss.yyyyy',
  '.sSSSSsSSSSS',
  'sSSPSSSSSKWS',
  'sSPPSSSSSSSS',
  'sSSPSSSSSSSS',
  'sSSSSSSSSSSS',
  '.sSSSSsSSSSS',
  '..sSSs.SSSSS',
  '.......sSSSS',
  '...SS..RSSSS',
  '..SSSSRRRSSS',
  '..SSSRRRRRSS',
  '..SS.RRRRRRS',
  '..SW.RRRRRRS',
  '.....SSSSSSS',
  '....SSSSSSSS',
  '....SSSSSSSS',
  '...OOOSSSSSS',
  '..OOOOOOOOOO',
  '.OOOOOOOOOOO',
  'PPPPPPPPPPPP',
  '.pPpPpPpPpPp',
];
function ganeshaRows() {
  const rows = GANESHA_LEFT.map((l) => (l + l.split('').reverse().join('')).split(''));
  const put = (x, y, c) => (rows[y][x] = c);
  // trunk: runs down the middle and curls to the right
  for (let y = 11; y <= 17; y++) {
    put(10, y, 's');
    put(13, y, y < 17 ? 's' : 'S');
    put(11, y, 'S');
    put(12, y, 'S');
  }
  put(11, 18, 's');
  put(12, 18, 's');
  put(13, 18, 's');
  put(14, 17, 's');
  put(14, 16, 's');
  put(15, 16, 's');
  put(9, 13, 'W'); // tusk
  return rows.map((r) => r.join(''));
}

// ---------------------------------------------------------------- build ----
function paintRows(rows, pal, name) {
  const h = rows.length;
  const w = rows[0].length;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`Sprite ${name}: row ${y} is ${row.length} wide, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = (pal && pal[ch]) || BASE_PAL[ch];
      if (!col) throw new Error(`Sprite ${name}: unknown colour '${ch}'`);
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

function flipCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

function makeSprite(rows, pal, name) {
  const img = paintRows(rows, pal, name);
  return { img, flip: flipCanvas(img), w: img.width, h: img.height };
}

const Sprites = {
  hero: {}, // hero[palette][size][frame]
  s: {}, // everything else by name
  tiles: {}, // tiles[theme][name] (may be arrays for animation)
};

function buildSprites() {
  // hero
  for (const pname in HERO_PALETTES) {
    const pal = HERO_PALETTES[pname];
    const small = {};
    for (const f in HERO_SMALL_BODY) {
      small[f] = makeSprite(HERO_SMALL_HEAD.concat(HERO_SMALL_BODY[f]), pal, 'hero.small.' + f);
    }
    small.die = makeSprite(HERO_SMALL_DIE, pal, 'hero.die');
    const big = {};
    for (const f in HERO_BIG_BODY) {
      big[f] = makeSprite(HERO_BIG_HEAD.concat(HERO_BIG_BODY[f]), pal, 'hero.big.' + f);
    }
    const blank = '................';
    big.crouch = makeSprite(
      Array(10).fill(blank).concat(HERO_BIG_HEAD, HERO_BIG_CROUCH_BODY),
      pal,
      'hero.big.crouch'
    );
    Sprites.hero[pname] = { small, big };
  }

  // enemies, items (a few use palette variants)
  for (const name in SPR_DEFS) Sprites.s[name] = makeSprite(SPR_DEFS[name], null, name);
  const golden = { N: '#e0902a', n: '#9a5a14', T: '#fce0a8' };
  for (const name of ['monkey1', 'monkey2', 'monkeyBall1', 'monkeyBall2']) {
    Sprites.s['gold_' + name] = makeSprite(SPR_DEFS[name], golden, 'gold_' + name);
  }
  Sprites.s.mirchi2 = makeSprite(SPR_DEFS.mirchi, { G: '#7ad03a', L: '#e8ff90', g: '#3e8a20' }, 'mirchi2');
  Sprites.s.dhol2 = makeSprite(SPR_DEFS.dhol, { R: '#f5821f', r: '#b0561a', Y: '#ffffff' }, 'dhol2');
  Sprites.s.fireball2 = makeSprite(
    SPR_DEFS.fireball.map((r) => r.split('').reverse().join('')).reverse(),
    null,
    'fireball2'
  );
  Sprites.s.ganesha = makeSprite(
    ganeshaRows(),
    { S: '#f4a26e', s: '#c0703e', P: '#f07cb0', p: '#b04070', O: '#fcd23c', R: '#d8302a' },
    'ganesha'
  );
  const bossPal = { N: '#6a4a3a', T: '#e8b890' };
  for (const f in BOSS_BOTTOM) {
    Sprites.s['boss_' + f] = makeSprite(BOSS_TOP.concat(BOSS_BOTTOM[f]), bossPal, 'boss.' + f);
  }
  Sprites.s.boss_hurt = makeSprite(
    BOSS_TOP.concat(BOSS_BOTTOM.walk1),
    { ...bossPal, N: '#ffffff', T: '#ffd0d0', R: '#ffffff' },
    'boss.hurt'
  );

  // tiles per theme
  for (const theme in THEME_PALS) {
    const tp = THEME_PALS[theme];
    const t = {};
    t.ground = makeSprite(TILE_DEFS.ground, tp.ground, theme + '.ground').img;
    t.groundTop = tp.ground.L
      ? makeSprite(TILE_DEFS.groundTop, tp.ground, theme + '.groundTop').img
      : t.ground;
    t.brick = makeSprite(TILE_DEFS.brick, tp.brick, theme + '.brick').img;
    t.debris = makeSprite(DEBRIS_DEF, tp.brick, theme + '.debris').img;
    t.qblock = ['#fff4d0', '#ffd890', '#f0a860', '#ffd890'].map(
      (q, i) => makeSprite(TILE_DEFS.qblock, { ...tp.qblock, q }, theme + '.q' + i).img
    );
    t.used = makeSprite(TILE_DEFS.used, tp.used, theme + '.used').img;
    t.hard = makeSprite(TILE_DEFS.hard, tp.hard, theme + '.hard').img;
    t.stone = makeSprite(TILE_DEFS.stone, tp.stone || tp.hard, theme + '.stone').img;
    t.bridge = makeSprite(TILE_DEFS.bridge, tp.bridge || { a: '#b06a30', b: '#5a3010', c: '#e09a58', d: '#c8c8d0' }, theme + '.bridge').img;
    t.ledge = makeSprite(TILE_DEFS.ledge, tp.ledge || tp.ground, theme + '.ledge').img;
    Object.assign(t, buildPipeTiles(tp.pipe));
    Sprites.tiles[theme] = t;
  }
}

// Pipes are painted from a column shading ramp so they stay perfectly symmetric.
function buildPipeTiles(p) {
  const ramp = (w) => {
    // returns an array of colours across the width
    const out = [];
    for (let x = 0; x < w; x++) {
      const f = x / (w - 1);
      if (x === 0 || x === w - 1) out.push(p.K);
      else if (f < 0.08) out.push(p.c);
      else if (f < 0.14) out.push(p.L);
      else if (f < 0.22) out.push(p.c);
      else if (f < 0.62) out.push(p.a);
      else if (f < 0.66) out.push(p.b);
      else if (f < 0.72) out.push(p.a);
      else out.push(p.b);
    }
    return out;
  };
  // vertical pipe: lip is 32 wide x 16 tall, body is 28 wide inset by 2
  const lip = makeCanvas(32, 16);
  let g = lip.getContext('2d');
  const lipRamp = ramp(32);
  for (let x = 0; x < 32; x++) {
    g.fillStyle = lipRamp[x];
    g.fillRect(x, 1, 1, 14);
  }
  g.fillStyle = p.K;
  g.fillRect(0, 0, 32, 1);
  g.fillRect(0, 15, 32, 1);
  const body = makeCanvas(32, 16);
  g = body.getContext('2d');
  const bodyRamp = ramp(28);
  for (let x = 0; x < 28; x++) {
    g.fillStyle = bodyRamp[x];
    g.fillRect(x + 2, 0, 1, 16);
  }
  const cut = (src, sx) => {
    const c = makeCanvas(16, 16);
    c.getContext('2d').drawImage(src, sx, 0, 16, 16, 0, 0, 16, 16);
    return c;
  };
  // sideways pipe (mouth facing left): rotate the vertical art
  const rot = (src) => {
    const c = makeCanvas(16, 32);
    const r = c.getContext('2d');
    r.translate(0, 32);
    r.rotate(-Math.PI / 2);
    r.drawImage(src, 0, 0);
    return c;
  };
  const sideLip = rot(lip);
  const sideBody = rot(body);
  const cutV = (src, sy) => {
    const c = makeCanvas(16, 16);
    c.getContext('2d').drawImage(src, 0, sy, 16, 16, 0, 0, 16, 16);
    return c;
  };
  return {
    pipeTL: cut(lip, 0),
    pipeTR: cut(lip, 16),
    pipeL: cut(body, 0),
    pipeR: cut(body, 16),
    spipeMT: cutV(sideLip, 0),
    spipeMB: cutV(sideLip, 16),
    spipeT: cutV(sideBody, 0),
    spipeB: cutV(sideBody, 16),
  };
}
