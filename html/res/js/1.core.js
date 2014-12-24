
game.core = {
	init: function(root) {
		this.compute = game.compute;
		this.canvas  = doc.getElementById('canvas');
		this.context = this.canvas.getContext('2d');
		this.context.planet = game.planet;
		// selected planets array
		this.selected = [];
		this.target = false;
		// fps log
		this.fps = [];
		// faster vars
		//this.canvas.dim = root.getDim(this.canvas);

		this.setDelta();
	},
	performance: (window.performance || {
		then: Date.now(),
		now: function() {
			return Date.now() - this.then;
		}
	}),
	stop: function() {
		setTimeout(function() { game.doEvent('pause'); });
	},
	frame: function() {
		var root = game,
			self = root.core;
		self.setDelta();
		self.update();
		self.render();
		// paints fps box
		root.paint.fps(self);
		//self.animationFrame = setTimeout(self.frame, 100);
		self.animationFrame = requestAnimationFrame(self.frame);
	},
	setDelta: function() {
		this.now   = this.performance.now();
		this.delta = (this.now - this.then) / 1000;
		this.then  = this.now;
	},
	update: function() {
		// Render updates to browser (draw to canvas, update css, etc)
		var paint    = game.paint,
			ctx      = this.context,
			width    = this.canvas.width,
			height   = this.canvas.height,
			ships    = this.ships,
			planets  = this.planets,
			len,
			obj;
		
		//this.canvas.width = this.canvas.width;
		ctx.clearRect(0, 0, width, height);

		paint.bg(ctx, width, height);
		paint.starfield(ctx, width, height);

		// paint ships
		len = ships.length;
		while (len--) {
			paint.ship(ships[len], ctx);
		}

		// paint planets
		len = planets.length;
		while (len--) {
			paint.planet(planets[len], ctx);
		}

		// paint strategy
		if (this.selected.length && this.target) {
			paint.stategy(this.selected, this.target, ctx);
		}
	},
	render: function() {
		// Update values
		var delta   = this.delta,
			ships   = this.ships,
			planets = this.planets,
			compute = this.compute,
			plen    = planets.length,
			slen    = ships.length,
			is_target,
			p;

		compute.delta = delta;

		while (plen--) {
			// planet object
			p = planets[plen];
			p.rotation += p.speed * delta;
			p.ships += p.radius * delta * 0.01;
		}
		while (slen--) {
			// ship object
			is_target = ships[slen].ai(compute, ships, planets);
			if (is_target) {
				ships.splice(slen, 1);
			}
		}
	}
};