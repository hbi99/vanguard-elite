
game.compute = {
	init: function() {
		this.atan  = Math.atan2;
		this.abs   = Math.abs;
		this.sqrt  = Math.sqrt;
		this.round = Math.round;
		this.cos   = Math.cos,
		this.sin   = Math.sin,
		this.pi2   = Math.PI * 2;
		this.pi180 = Math.PI / 180;
		this.piH   = 180 / Math.PI;
	},
	bearing: function(o, t) {
		var theta = this.atan(o.x - t.x, t.y - o.y),
			course;
		if (theta < 0) theta += this.pi2;
		course = theta * this.piH + 90;
		if (course > 360) course %= 360;
		return course;
	},
	path: function(o1, o2, course) {
		var theta = this.atan(o2.x - o1.x, o1.y - o2.y),
			tangent,
			diff;
		if (theta < 0) theta += this.pi2;
		tangent = theta * this.piH - 180;
		diff = (course - tangent) % 360;

		return {
			tangent: tangent - 90,
			diff: diff,
			course: (diff > 90 ? 180 + tangent : 360 + tangent) % 360,
			cw: diff > 90? -1 : 1
		};
	},
	distance: function(o1, o2) {
		var x = this.abs(o1.x - o2.x),
			y = this.abs(o1.y - o2.y);
		return this.sqrt(x*x + y*y);
	},
	vector_add: function(v1, v2) {
		return {x: v1.x + v2.x, y: v1.y + v2.y};
	},
	ship_ai: function(self, ships, planets, delta) {
		var pi180   = self.pi180,
			piH     = self.piH,
			pi2     = self.pi2,
			abs     = self.abs,
			cos     = self.cos,
			sin     = self.sin,
			atan    = self.atan,
			round   = self.round,
			sqrt    = self.sqrt,
			plen    = planets.length,
			slen    = ships.length,
			orbit   = this.orbit,
			speed   = this.speed,
			course  = this.course,
			_course,
			planet,
			ship,
			dist,
			path,
			diff,
			cw,
			c1,
			c2,
			c3;

		// get ship target bearing
		//if (!this.couse) course = self.bearing(this, this.target);
		// slow down if course difference is to big
		//if (abs(_course - course) >= 90) speed *= 0.05;

		// compute propulsion
		this.vector.x = (speed * cos(course * pi180)) * delta;
		this.vector.y = (speed * sin(course * pi180)) * delta;
		
		// collision detection ::: ships
		while (slen--) {
			ship = ships[slen];
			ship.distance_to_target = self.distance(ship, ship.target);
		}
		slen = ships.length;
		while (slen--) {
			ship = ships[slen];
			if (!ship || ship === this) continue;

			dist = self.distance(this, ship);
			if (dist < 24 && this.distance_to_target > ship.distance_to_target) {
				this.vector.x = 0;
				this.vector.y = 0;
			}
		}

		if (this.vector.x !== 0 && this.vector.y !== 0) {
			switch (true) {
				// orbit slide
				case (orbit && orbit.slide):
					path   = orbit.path;
					planet = orbit.planet;
					cw     = path.cw;
					path.tangent += cw * this.speed * delta;

					course = path.tangent + (cw * 90);
					if (course < 0) course += 360;
					_course = self.bearing(this, this.target);

					diff = _course - course;
					if (diff > 180) course += 360;
					else if (diff < -180) course -= 360;

					c1 = orbit.prad;
					c2 = path.tangent;
					c2 = course > _course;
					if ((cw > 0 && c2) || (cw < 0 && !c2)) {
						// break from orbit
						this.orbit = undefined;
						c1 += 1;
						//game.core.stop();
					}

					c2 = path.tangent;
					c3 = c2 * pi180;

					course = c2 + (cw * 90);
					this.x = planet.x + (c1 * cos(c3));
					this.y = planet.y + (c1 * sin(c3));
					this.vector.x = 0;
					this.vector.y = 0;
					break;
				// collision with planet - adjust path
				case (orbit !== undefined):
					path    = orbit.path;
					cw      = path.cw;
					course -= cw * 8;

					diff = path.course - course;
					if (diff > 180) course += 360;
					else if (diff < -180) course -= 360;
					c1 = cw > 0;
					c2 = course < path.course;

					if ((c1 && c2) || (!c1 && !c2)) {
						// start tangent slide
						orbit.slide = true;
						//game.core.stop();
					}
					this.vector.x = 0;
					this.vector.y = 0;
					break;
				default:
					// collision   detection ::: planets
					while (plen--) {
						planet = planets[plen];
						dist   = self.distance(this, planet) - 8;

						if (dist < planet.radius) {
							if (planet === this.target) {
								// ship has found home!
								planet.ships++;
								return true;
							}
							this.orbit = {
								planet : planet,
								prad   : planet.radius + 8,
								path   : self.path(this, planet, course)
							};
							this.vector.x = 0;
							this.vector.y = 0;
							break;
						}
					}
			}
		}
		if (course < 0) course += 360;

		// set ship position
		this.course = course;
		// set ship position
		this.x += this.vector.x;
		this.y += this.vector.y;
	}
};
