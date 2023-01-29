import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";
// import kaboom from "kaboom";
// import kaboom from "../node_modules/kaboom/dist/kaboom.mjs";

const vars = {
	speed: {
		player: 500,
		enemies: 250,
	},
	lives: 3,
	gravity: 1200,
	floor: 100,
	spacing: 2000,
	cakes: 8,
};

kaboom({
	canvas: document.getElementById('game'),
	// width: 1280,
	// height: 800,
	width: Math.floor(document.documentElement.clientWidth * 0.8),
	height: Math.floor(document.documentElement.clientHeight * 0.9),
	background: [49, 78, 122],
});

function patrol(speed = vars.speed.enemies, dir = 1) {
	return {
		id: 'patrol',
		require: ['pos', 'area'],
		add() {
			this.onCollide('table', (obj, col) => {
				if (col.isLeft() || col.isRight()) {
					dir = -dir;
					if (col.isLeft()) this.flipX(false);
					else this.flipX(true);
				}
			});
		},
		update() {
			this.move(speed * dir, 0);
		},
	};
}

function addButton(buttonText, p, f) {
	const btn = add([
		text(buttonText),
		pos(p),
		area({ cursor: 'pointer'}),
		scale(1),
		origin('center'),
		layer('ui'),
	])
	btn.onClick(f);
	btn.onUpdate(() => {
		if (btn.isHovering()) {
			const t = time() * 10
			btn.color = rgb(
				wave(0, 255, t),
				wave(0, 255, t + 2),
				wave(0, 255, t + 4),
			)
			btn.scale = vec2(1.2)
		} else {
			btn.scale = vec2(1)
			btn.color = rgb()
		}
	})
}

loadSprite('goal', 'sprites/cake.png');
loadSprite('table', 'sprites/table.png');
loadSprite('heart', 'sprites/heart.png');
loadSprite('ninja', 'sprites/ninja.png', {
	sliceX: 2,
	sliceY: 1,
	anims: {
		idle: 0,
		run: {from: 0, to: 1},
	},
});
loadSprite('player', 'sprites/commando.png', {
	sliceX: 3,
	sliceY: 2,
	anims: {
		idle: 0,
		run: {from: 0, to: 3},
		jump: 3,
	},
});

for (let i = 1; i <= vars.cakes; i++) loadSprite('cake' + i, 'sprites/cake_' + i + '.png');

loadSound('music', 'music/background.mp3');
loadSound('vocals', 'music/vocals.mp3');

layers(['bg', 'game', 'ui'], 'game');

scene('game', ({score, lives} = {score: 0, lives: 3}) => {
	const music = play('music', {loop: true});
	gravity(vars.gravity);

	function jump() {
		if (player.isGrounded()) {
			player.jump();
			player.play('jump');
		}
	}

	function left() {
		// if (toScreen(player.pos).x > 20)
		player.move(-vars.speed.player, 0);
		player.flipX(true);
		if (player.isGrounded() && player.curAnim() !== 'run') player.play('run');
	}

	function right() {
		player.move(vars.speed.player, 0);
		player.flipX(false);
		if (player.isGrounded() && player.curAnim() !== 'run') player.play('run');
	}

	onKeyPress('space', () => jump());
	onKeyDown('up', () => jump());
	onKeyDown('w', () => jump());
	onKeyDown('left', () => left());
	onKeyDown('right', () => right());
	onKeyDown('a', () => left);
	onKeyDown('d', () => right());
	onKeyPress('f', () => fullscreen(!fullscreen()));
	onKeyPress('m', () => music.isPaused() ? music.play() : music.pause());
	onKeyPress('+', () => music.volume(music.volume() + 0.1));
	onKeyPress('-', () => music.volume(music.volume() - 0.1));
	onKeyPress('escape', () => go('menu'));

	add([
		'floor',
		origin('botleft'),
		rect(vars.spacing * (vars.cakes + 2), vars.floor),
		pos(-width(), height()),
		area(),
		solid(),
		color(255, 255, 255),
	]);

	add([
		'goal',
		sprite('goal'),
		scale(4),
		pos((vars.spacing * 8) - 800, height() - (vars.floor + 1024)),
		layer('bg'),
	]);

	for (let i = 1; i <= vars.lives; i++) {
		add([
			'heart_' + i,
			sprite('heart'),
			pos(50 * i, 10),
			scale(0.3),
			// area(),
			// solid(),
			fixed(),
			layer('ui'),
		]);
	}
	for (let i = 1; i <= vars.cakes; i++) {
		add([
			'table',
			sprite('table'),
			pos(vars.spacing * i, height() - (vars.floor + 50)),
			scale(4),
			area(),
			solid(),
		]);
		add([
			'cake',
			sprite('cake' + i),
			pos((vars.spacing * i) + 32, height() - (vars.floor + 150)),
			area(),
		]);
		const ninja = add([
			'ninja',
			sprite('ninja', {anim: 'run'}),
			pos((vars.spacing * i) + 32, height() - (vars.floor + 150)),
			scale(4),
			area(),
			body(),
			patrol(),
		]);
		ninja.onGround(function() {
		// ninja.onUpdate(function() {
			// this.play('run');
			every('ninja', (n) => {
				n.play('run');
			});
		});
	}

	const player = add([
		'player',
		sprite('player', {anim: 'idle'}),
		pos(20, height() - 300),
		scale(4),
		area(),
		body(),
		health(vars.lives),
	]);

	player.onUpdate(() => {
		camPos(player.pos.x, camPos().y);
		if (player.pos.y > height()) player.hurt(1);
	});
	player.onCollide('cake', (cake) => {
		destroy(cake);
		score++;
		if (score >= vars.cakes) go('win', {score, lives});
	});
	player.onCollide('ninja', () => {
		player.hurt(1);
	});
	player.on("hurt", () => {
		// destroy(get('heart_' + (player.hp() + 1)));
		// destroy('heart_' + (player.hp() + 1));
		every('heart_' + (player.hp() + 1), destroy);
		player.flipX(false);
		player.moveTo(20, height() - 300);
	})
	player.on('death', () => {
		destroy(player);
		// player.freeze();
		go('lose');
	});
	player.onGround(() => {
		if (!isKeyDown('left') && !isKeyDown('right')) {
			player.play('idle');
		} else {
			player.play('run');
		}
	});
});

scene('menu', () => {
	add([
		text(`The\nPeople's Cake\nLiberation Front`),
		pos(width() / 2, height() / 2 - 100),
		origin('center'),
		// scale(2),
	]);
	/* add([
		text(`Liberate all the cakes and avoid being caught by ninjas`),
		pos(width() / 2, height() / 2),
		origin('center'),
	]); */
	addButton('Play', vec2(width() / 2, height() / 2 + 100), () => go('game'));
	// addButton('Quit', vec2(width() / 2, height() / 2 + 200), () => go('quit'));
});

scene('lose', () => {
	add([
		text('Oh no!\nThe Anti Cake\nLiberation Reactionaries\nhave killed our hero!'),
		pos(width() / 2, height() / 2),
		origin('center'),
	]);
	onKeyPress(() => go('game'));
});

scene('win', () => {
	add([
		text(`Victory!\nThe glorious\nPeople's Cake Liberation Front\nhas won the day!`),
		pos(width() / 2, height() / 2),
		origin('center'),
	]);
	onKeyPress(() => go('game'));
});

go('menu');
