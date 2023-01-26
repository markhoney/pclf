import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";
// import kaboom from "kaboom";
// import kaboom from "../node_modules/kaboom/dist/kaboom.mjs";

const vars = {
	speed: {
		player: 500,
		enemies: 250,
	},
	gravity: 1200,
	floor: 100,
	spacing: 2000,
	cakes: 8,
};

kaboom({
	canvas: document.getElementById('game'),
	// width: 1280,
	// height: 800,
	background: [49, 78, 122],
});

function patrol(speed = vars.speed.enemies, dir = 1) {
	return {
		id: 'patrol',
		require: ['pos', 'area'],
		add() {
			this.on('collide', (obj, col) => {
				if (col.isLeft() || col.isRight()) {
					dir = -dir;
					if (col.isLeft()) this.flipX(false);
					else this.flipX(true);
				}
			})
		},
		update() {
			this.move(speed * dir, 0);
		},
	};
}

function addButton(text, p, f) {
	const btn = add([
		text(text),
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

for (let i = 1; i <= 8; i++) loadSprite('cake' + i, 'sprites/cake_' + i + '.png');

loadSound('music', 'music/background.mp3');
loadSound('vocals', 'music/vocals.mp3');

layers(['game', 'ui'], 'game');

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
		rect(vars.spacing * (vars.cakes + 2), vars.floor + 500),
		pos(-1000, height() - vars.floor),
		area(),
		solid(),
		color(255, 255, 255),
		layer('game'),
	]);

	add([
		'goal',
		sprite('goal'),
		scale(4),
		pos((vars.spacing * 8) - 800, height() - (vars.floor + 1024)),
		layer('game'),
	]);

	for (let i = 1; i <= 8; i++) {
		add([
			'table',
			sprite('table'),
			pos(vars.spacing * i, height() - (vars.floor + 50)),
			scale(4),
			area(),
			solid(),
			layer('game'),
		]);
		add([
			'cake',
			sprite('cake' + i),
			pos((vars.spacing * i) + 32, height() - (vars.floor + 150)),
			area(),
			layer('game'),
		]);
		add([
			'ninja',
			sprite('ninja', {anim: 'run'}),
			pos((vars.spacing * i) + 32, height() - (vars.floor + 150)),
			scale(4),
			area(),
			body(),
			patrol(),
			layer('game'),
		]);
	}

	const player = add([
		sprite('player', {anim: 'idle'}),
		pos(20, height() - 300),
		scale(4),
		area(),
		body(),
		health(3),
		layer('game'),
	]);

	player.onUpdate(() => camPos(player.pos));
	player.onCollide('cake', (cake) => {
		destroy(cake);
		score++;
		if (score >= 8) go('win', {score, lives});
	});
	player.onCollide('ninja', (ninja) => {
		player.hurt(1);
	});
	player.on('death', () => {
		destroy(player);
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
		text(`The People's Cake Liberation Front`),
		pos(width() / 2, height() / 2),
		origin('center'),
		scale(2),
		layer('ui'),
	]);
	add([
		text(`Liberate all the cakes and avoid being caught by ninjas`),
		pos(width() / 2, height() / 2),
		origin('center'),
		layer('ui'),
	]);
	addButton('Play', vec2(width() / 2, height() / 2 + 100), () => go('game'));
	// addButton('Quit', vec2(width() / 2, height() / 2 + 200), () => go('quit'));
});

scene('lose', () => {
	add([
		text('Oh no! The Anti Cake Liberation Reactionaries have killed our hero!'),
	]);
	onKeyPress(() => go('game'));
});

scene('win', () => {
	add([
		text(`Victory! The glorious People's Cake Liberation Front has won the day!`),
	]);
	onKeyPress(() => go('game'));
});

go('game');
