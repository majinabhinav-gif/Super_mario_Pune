'use strict';
// World 1: Pune. Four levels, each built from the Area helpers in world.js.
// Coordinates are in tiles; row 13 is the usual ground surface, row 9 the
// usual block height and row 5 the high block row.

function level1_1() {
  const A = new Area('main', 244, 'overworld', { music: 'peth' });
  A.ground(0, 66).ground(69, 84).ground(88, 152).ground(155, 243);

  // decor first (drawn behind everything)
  A.deco('lamp', 1).deco('bunting', 2, 3, { w: 12 }).deco('lamp', 14);
  A.sign(3, ['WELCOME TO PUNE!', 'STOMP THE AUTOS.', 'PLEASE DO NOT', 'ASK DIRECTIONS.']);
  A.deco('pandal', 8);
  A.deco('tree', 23, 13, { size: 28 });
  A.deco('stall', 30, 13, { kind: 'chai' });
  A.sign(41, ['SHOP CLOSED', '1 PM TO 4 PM.', 'DO NOT KNOCK.']);
  A.deco('bush', 51, 13, { size: 1 });
  A.sign(53, ['SECRET PIPE?', 'WE WILL NOT', 'TELL YOU.']);
  A.deco('tulsi', 60);
  A.sign(63, ['PIT AHEAD.', 'MANAGEMENT NOT', 'RESPONSIBLE.']);
  A.deco('lamp', 70).deco('bunting', 71, 3, { w: 10 }).deco('lamp', 81);
  A.deco('tree', 93, 13, { size: 24, kind: 'neem' });
  A.deco('stall', 97, 13, { kind: 'vadapav' });
  A.deco('pandal', 104);
  A.deco('tree', 116, 13, { size: 30 });
  A.deco('lamp', 126).deco('tulsi', 132);
  A.deco('stall', 145, 13, { kind: 'misal' });
  A.sign(160, ['NO HONKING.', 'IT WILL NOT', 'HELP YOU JUMP.']);
  A.deco('bunting', 158, 3, { w: 12 });
  A.deco('pandal', 172);
  A.sign(223, ['YES, THIS IS THE', 'RIGHT WAY. DO', 'NOT ASK AGAIN.']);
  A.deco('lamp', 228);

  // first blocks
  A.q(14, 9, 'coin');
  A.brick(18, 9).q(19, 9, 'power').brick(20, 9).q(21, 9, 'coin').brick(22, 9);
  A.q(20, 5, 'coin');
  A.enemy('auto', 22);

  // drain pipes
  A.pipe(27, 11);
  A.enemy('auto', 34);
  A.pipe(37, 10, { cobra: true });
  A.enemy('auto', 44).enemy('auto', 46);
  A.pipe(48, 9);
  A.pipe(56, 9, { warp: { to: 'bonus', tx: 2, ty: 3, exit: 'drop' } });
  A.hidden(62, 9, 'modak');

  // over the first pit
  A.brick(72, 9).q(73, 9, 'power').brick(74, 9);
  A.bricks(75, 82, 5);
  A.enemy('auto', 77, 4).enemy('auto', 79, 4);

  // after the second pit
  A.bricks(89, 91, 5).q(92, 5, 'coin');
  A.brick(92, 9, 'coins');
  A.enemy('monkey', 96);
  A.checkpoint(101);
  A.brick(102, 9).brick(103, 9, 'dhol');
  A.q(108, 9, 'coin').q(111, 9, 'coin').q(114, 9, 'coin');
  A.q(111, 5, 'power');
  A.enemy('auto', 110).enemy('auto', 112);
  A.brick(119, 9);
  A.bricks(122, 124, 5);
  A.enemy('auto', 124).enemy('auto', 126).enemy('monkey', 128);
  A.brick(128, 5).q(129, 5, 'coin').q(130, 5, 'coin').brick(131, 5);
  A.bricks(129, 130, 9);

  // temple steps
  A.stairs(134, 4, 1).stairs(138, 2, 1).column(138, 4).column(139, 4).stairs(140, 4, -1);
  A.enemy('pigeon', 144, 8);
  A.stairs(148, 4, 1).column(152, 4);
  A.stairs(155, 4, -1);

  // last stretch
  A.pipe(163, 11);
  A.brick(168, 9).brick(169, 9).q(170, 9, 'coin').brick(171, 9);
  A.enemy('auto', 172).enemy('auto', 174);
  A.pipe(178, 11, { cobra: true });

  // Pune traffic jam: walk into it and you are stuck; hop along the roofs instead
  A.sign(180, ['TRAFFIC AHEAD!', 'WAIT: 45 MIN.']);
  A.vehicle('auto', 184, 2, 2).vehicle('car', 186, 3, 2).vehicle('bus', 189, 6, 3);
  A.vehicle('scooter', 195, 1, 2).vehicle('cow', 196, 2, 1).vehicle('truck', 198, 4, 3);
  A.vehicle('auto', 202, 2, 2).vehicle('car', 204, 3, 2);
  A.deco('trafficCop', 208);
  A.sign(210, ['SIGNAL BROKEN.', 'PLEASE ADJUST.']);

  A.stairs(213, 8, 1).column(221, 8);
  A.setFlag(230);
  A.setHouse(234);

  // bonus room under the old city
  const B = new Area('bonus', 17, 'underground', { music: 'metro' });
  B.ground(0, 16);
  B.fill(0, 0, 2, 12, T.BRICK);
  B.row(T.BRICK, 1, 12, 2);
  B.fill(3, 9, 11, 12, T.BRICK);
  B.coins(3, 9, 9).coins(3, 9, 7).coins(4, 8, 5);
  B.sidePipe(13, 11, { to: 'main', tx: 163, ty: 11, exit: 'up' });

  return {
    id: '1-1',
    name: 'PETH STREETS',
    time: 400,
    areas: { main: A, bonus: B },
    start: { area: 'main', tx: 3, ty: 12 },
  };
}

function level1_2() {
  const A = new Area('main', 192, 'metro', { music: 'metro' });
  A.ground(0, 57).ground(61, 121).ground(125, 145).ground(164, 191);
  A.fill(0, 0, 3, 12, T.BRICK);
  A.row(T.BRICK, 6, 191, 2);

  // station furniture (all background, nothing here is solid)
  A.deco('gates', 1).deco('routeMap', 12, 11).deco('bench', 20).deco('screen', 26, 5);
  A.deco('bench', 44).deco('exitSign', 58, 5, { text: 'PLATFORM 1' }).deco('bench', 82);
  A.deco('screen', 95, 5, { lines: ['NEXT TRAIN', 'CIVIL COURT'] }).deco('routeMap', 120, 11);
  A.deco('bench', 130).deco('screen', 160, 5, { lines: ['MIND THE GAP'] }).deco('bench', 166);
  A.deco('exitSign', 180, 5, { text: 'EXIT' });
  A.deco('metroSign', 4, 5, { text: 'PCMC' });
  A.sign(6, ['METRO STATION.', 'AUTOS ARE VERY', 'ANGRY ABOUT IT.']);
  A.q(10, 9, 'power');
  for (let x = 11; x <= 14; x++) A.q(x, 9, 'coin');
  A.enemy('auto', 17).enemy('auto', 19);

  // brick pillars with coins on top
  A.fill(24, 24, 11, 12, T.BRICK).coins(24, 24, 10);
  A.fill(28, 28, 10, 12, T.BRICK).coins(28, 28, 9);
  A.fill(32, 32, 9, 12, T.BRICK).coins(32, 32, 8);
  A.enemy('monkey', 30);
  A.deco('metroSign', 34, 5, { text: 'SWARGATE' });

  // brick gallery
  A.bricks(40, 52, 9);
  A.brick(46, 9, 'power').brick(50, 9, 'coins');
  A.coins(42, 50, 7);
  A.enemy('auto', 45).enemy('auto', 47);
  A.enemy('monkey', 49, 8);

  // steps over the pit
  A.stairs(52, 3, 1).fill(55, 57, 10, 12, T.HARD);
  A.stairs(61, 3, -1);
  A.enemy('monkey', 70, 12, { smart: true });
  A.stairs(66, 2, 1).stairs(72, 2, -1);
  A.deco('metroSign', 70, 5, { text: 'CIVIL COURT' });
  A.checkpoint(80);
  A.q(84, 9, 'coin').q(85, 9, 'power').q(86, 9, 'coin');
  A.hidden(91, 9, 'modak');
  A.enemy('auto', 88).enemy('auto', 90).enemy('auto', 92);

  // pipes with cobras
  A.pipe(98, 10, { cobra: true });
  A.enemy('auto', 102);
  A.pipe(106, 9);
  A.enemy('auto', 110);
  A.pipe(114, 11, { cobra: true });
  A.enemy('monkey', 118);
  A.coins(121, 125, 8);
  A.bricks(128, 134, 9);
  A.brick(131, 9, 'dhol').brick(133, 9, 'coins');
  A.enemy('monkey', 132).enemy('auto', 136);
  A.deco('metroSign', 136, 5, { text: 'SHIVAJINAGAR' });

  // metro lifts over the big pit
  A.platform({ kind: 'move', axis: 'y', x: 148, y: 9, w: 3, min: 6, max: 12, speed: 0.6 });
  A.platform({ kind: 'move', axis: 'y', x: 153, y: 11, w: 3, min: 6, max: 12, speed: 0.6, phase: 1 });
  A.platform({ kind: 'move', axis: 'x', x: 158, y: 10, w: 3, min: 157, max: 161, speed: 0.5 });
  A.coins(149, 150, 5).coins(154, 155, 5);

  A.brick(168, 9).q(169, 9, 'coin').brick(170, 9);
  A.enemy('auto', 172).enemy('monkey', 175);
  A.sign(178, ['EXIT TO THE', 'SURFACE ->']);
  A.sidePipe(184, 11, { to: 'exit', tx: 3, ty: 11, exit: 'up' });

  const E = new Area('exit', 36, 'overworld', { music: 'peth' });
  E.ground(0, 35);
  E.pipe(3, 11);
  E.sign(6, ['METRO: 20 MIN.', 'AUTO: 2 HOURS.', 'CHOOSE WISELY.']);
  E.deco('lamp', 10);
  E.stairs(12, 8, 1).column(20, 8);
  E.setFlag(27);
  E.setHouse(30);

  return {
    id: '1-2',
    name: 'METRO STATION',
    time: 400,
    areas: { main: A, exit: E },
    start: { area: 'main', tx: 3, ty: 12 },
  };
}

function level1_3() {
  const A = new Area('main', 186, 'sky', { music: 'sinhagad' });
  A.ground(0, 12);
  A.deco('fortWall', 0, 13, { w: 3, h: 2 });
  A.sign(4, ['SINHAGAD FORT.', 'DO NOT FEED', 'THE MONKEYS.']);
  A.deco('stall', 7, 13, { kind: 'bhaji' });

  A.ledge(15, 18, 11);
  A.ledge(21, 25, 9);
  A.enemy('monkey', 23, 8, { smart: true });
  A.ledge(28, 30, 10);
  A.q(29, 6, 'power');
  A.ledge(33, 38, 8);
  A.coins(34, 37, 5);
  A.enemy('monkey', 36, 7, { smart: true });
  A.platform({ kind: 'move', axis: 'x', x: 41, y: 9, w: 3, min: 40, max: 46, speed: 0.6 });
  A.ledge(50, 54, 10);
  A.enemy('pigeon', 53, 6);
  A.ledge(57, 59, 8);
  A.ledge(62, 68, 11);
  A.enemy('lady', 68, 10);
  A.coins(63, 67, 8);
  A.enemy('monkey', 66, 10, { smart: true });
  A.platform({ kind: 'fall', x: 71, y: 10, w: 2 });
  A.platform({ kind: 'fall', x: 75, y: 9, w: 2 });
  A.ledge(79, 85, 10);
  A.checkpoint(81, 9);
  A.platform({ kind: 'move', axis: 'y', x: 88, y: 8, w: 3, min: 5, max: 11, speed: 0.55 });
  A.ledge(93, 96, 8);
  A.q(94, 4, 'coin').q(95, 4, 'dhol');
  A.ledge(99, 101, 11);
  A.ledge(104, 106, 9);
  A.enemy('pigeon', 106, 5);
  A.ledge(109, 111, 7);
  A.platform({ kind: 'move', axis: 'x', x: 114, y: 8, w: 3, min: 113, max: 120, speed: 0.6 });
  A.ledge(124, 131, 10);
  A.coins(125, 130, 7);
  A.enemy('monkey', 128, 9, { smart: true });
  A.ledge(134, 136, 12);
  A.ledge(139, 141, 10);
  A.hidden(140, 6, 'modak');
  A.enemy('pigeon', 143, 6);
  A.platform({ kind: 'fall', x: 144, y: 10, w: 2 });
  A.platform({ kind: 'fall', x: 147, y: 11, w: 2 });
  A.platform({ kind: 'fall', x: 150, y: 10, w: 2 });
  A.ledge(153, 156, 9);
  A.sign(159, ['PITHLA BHAKRI', 'AHEAD. KEEP', 'JUMPING.']);
  A.ground(158, 185);
  A.stairs(163, 5, 1).column(168, 5);
  A.setFlag(175);
  A.setHouse(178);

  return {
    id: '1-3',
    name: 'SINHAGAD CLIMB',
    time: 300,
    areas: { main: A },
    start: { area: 'main', tx: 2, ty: 12 },
  };
}

function level1_4() {
  const A = new Area('main', 162, 'castle', { music: 'castle' });
  const S = T.STONE;
  // the Dilli Darwaza you walk out of, a lotus fountain and a guide board
  A.deco('gate', 0, 10);
  A.sign(11, ['SHANIWAR WADA.', 'BUILT IN 1732.', 'PLEASE DO NOT', 'BREAK ANYTHING.'], { y: 10 });
  A.deco('fountain', 20);
  A.deco('fountain', 80);
  A.deco('fountain', 110);

  // entrance hall
  A.fill(0, 14, 10, 14, S);
  A.q(10, 6, 'power');
  A.lavaPit(15, 17);
  A.fill(18, 30, 13, 14, S);
  A.set(24, 9, T.USED);
  A.enemy('firebar', 24, 9, { len: 4, speed: 0.025 });

  // lava and pillars
  A.lavaPit(31, 33);
  A.enemy('flame', 32, 13, { delay: 0 });
  A.fill(34, 35, 10, 14, S);
  A.lavaPit(36, 38);
  A.fill(39, 40, 9, 14, S);
  A.lavaPit(41, 43);
  A.enemy('flame', 42, 13, { delay: 70 });
  A.fill(44, 60, 13, 14, S);
  A.fill(47, 55, 3, 6, S); // low ceiling corridor
  A.set(51, 7, T.USED);
  A.enemy('firebar', 51, 7, { len: 3, speed: -0.03 });
  A.checkpoint(58);

  // moving platform over the long lava moat
  A.q(62, 9, 'power');
  A.fill(61, 65, 13, 14, S);
  A.lavaPit(66, 76);
  A.platform({ kind: 'move', axis: 'x', x: 67, y: 10, w: 3, min: 66, max: 73, speed: 0.6 });
  A.fill(77, 92, 13, 14, S);
  A.set(83, 9, T.USED);
  A.enemy('firebar', 83, 9, { len: 5, speed: 0.022 });
  A.enemy('monkey', 88);
  A.lavaPit(93, 95);
  A.enemy('flame', 94, 13, { delay: 40 });
  A.fill(96, 104, 11, 14, S);
  A.lavaPit(105, 107);
  A.enemy('flame', 106, 13, { delay: 10 });
  A.fill(108, 131, 13, 14, S);
  A.row(S, 111, 116, 9);
  A.coins(111, 116, 8);
  A.set(118, 9, T.USED);
  A.enemy('firebar', 118, 9, { len: 4, speed: -0.025 });
  A.sign(122, ["MAKAD RAJA'S", 'PALACE. NO', 'VISITORS.']);
  A.enemy('monkey', 126);

  // boss bridge over the lava
  A.lavaPit(132, 144);
  A.row(T.BRIDGE, 132, 144, 12);
  A.fill(145, 161, 12, 14, S);
  A.boss = { x: 141, y: 10, bridge: { x0: 132, x1: 144, y: 12 }, bell: { x: 145, y: 10 } };
  A.sign(149, ['RING BELL ONCE.', 'WE ARE NOT DEAF.'], { y: 12 });
  A.deco('basket', 155, 12);

  for (const x of [28, 46, 64, 100, 128, 150]) A.deco('torch', x, 8, { anim: true });
  for (const [x, y] of [[12, 3], [24, 2], [36, 4], [58, 2], [70, 3], [88, 2], [100, 4], [116, 3], [134, 2], [146, 3], [156, 2]]) {
    A.deco('kandil', x, y, { anim: true });
  }

  return {
    id: '1-4',
    name: 'SHANIWAR WADA',
    time: 300,
    areas: { main: A },
    start: { area: 'main', tx: 2, ty: 9 },
    castle: true,
  };
}

const LEVELS = [level1_1, level1_2, level1_3, level1_4];
