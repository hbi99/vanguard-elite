
game.core = {
	init: function(root) {
		this.canvas  = doc.getElementById('canvas');
		this.context = this.canvas.getContext('2d');
		this.context.planet = game.planet;
		// selected planets array
		this.selected = [];
		this.target = false;
		// fps log
		this.fps = [];
		// faster vars
		this.canvas.dim    = root.getDim(this.canvas);
		this.context.pi180 = Math.PI / 180;
		this.context.piH   = 180 / Math.PI;
		this.context.pi2   = Math.PI * 2;
		this.context.rotation = 0;
	},
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
			//paint.ship(ships[len], ctx);
		}

		// paint planets
		len = planets.length;
		while (len--) {
			paint.planet(planets[len], ctx);
		}

		// paint strategy
		paint.stategy(this.selected, this.target, ctx);
	},
	render: function() {
		// Update values
		var delta   = this.delta,
			planets = this.planets,
			ships   = this.ships,
			pi180   = this.context.pi180,
			piH     = this.context.piH,
			pi2     = this.context.pi2,
			compute = this.compute_bearing,
			abs     = Math.abs,
			cos     = Math.cos,
			sin     = Math.sin,
			atan    = Math.atan2,
			round   = Math.round,
			sqrt    = Math.sqrt,
			plen    = planets.length,
			slen    = ships.length,
			len,
			o,
			ox,
			oy,
			p,
			dist,
			dx,
			dy,
			course,
			_course,
			diff,
			speed,
			tan,
			tht;

		len = plen;
		while (len--) {
			// planet object
			p = planets[len];
			p.rotation += p.speed * delta;
		}
		while (slen--) {
			// ship object
			o = ships[slen];
			course = o.course;
			speed = o.speed;
			tht = false;

			// get ship target bearing
			/*
			tx = o.x - o.target.x;
			ty = o.target.y - o.y;
			theta = atan(tx, ty);
			if (theta < 0) theta += pi2;
			// compute bearing
			_course = round(theta * piH + 90);
			if (_course > 360) _course %= 360;
			*/
			_course = compute(o.x, o.y, o.target.x, o.target.y);

			// slow down if course difference is to big
			if (abs(_course - course) >= 90) speed *= 0.05;

			// compute propulsion
			ox = o.x + (speed * cos(course * pi180)) * delta;
			oy = o.y + (speed * sin(course * pi180)) * delta;

			// collision detection ::: planets
			len = plen;
			while (len--) {
				p  = planets[len];
				dx = p.x - ox;
				dy = p.y - oy;
				dist = sqrt(dx * dx + dy * dy) - 2;

				if (dist < p.radius) {
					tht = atan(dx, -dy);
					if (tht < 0) tht += pi2;
					tan  = tht * piH - 180;
					diff = round(course - tan) % 360;
					break;
				}
			}
			if (tht) {
				// collision has occured: alter bearing
				course += (diff > 90) ? 7 : -7;
				ox = o.x;
				oy = o.y;
			} else {
				// adjustment bearing if needed
				diff = round(course) - _course;
				if      (diff >  180) { o.course -= 360; break; }
				else if (diff < -180) { o.course += 360; break; }
				course -= diff * 0.15;
			}
			//game.paint.line(o, o.target, this.context);
			// game.paint.line(o, {
			// 	x: o.x + (300 * Math.cos(course * pi180)),
			// 	y: o.y + (300 * Math.sin(course * pi180))
			// }, this.context);

			// set ship position
			o.course = course;
			// set ship position
			o.x = ox;
			o.y = oy;
		}
	},
	compute_bearing: function(ox, oy, tx, ty) {
		var theta = Math.atan2(ox - tx, ty - oy),
			course;
		if (theta < 0) theta += this.context.pi2;
		course = theta * this.context.piH + 90;
		if (course > 360) course %= 360;
		return course;
	}
};