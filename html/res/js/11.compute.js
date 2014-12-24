
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
	path: function(o1, o2) {
		var theta = this.atan(o2.x - o1.x, o1.y - o2.y),
			delta,
			tangent,
			mod_diff,
			dist,
			clockwise;

		if (theta < 0) theta += this.pi2;

		delta     = ((theta * this.piH) + 90);
		tangent   = delta + 90;
		mod_diff  = (o1.course > tangent ? o1.course - tangent : tangent - o1.course) % 360;
		dist      = mod_diff > 180 ? 360 - mod_diff : mod_diff;
		clockwise = dist < 90;

		return {
			radius    : o2.radius + 8,
			delta     : delta,
			course    : clockwise ? tangent : delta - 90,
			clockwise : clockwise ? -1 : 1
		};
	},
	distance: function(o1, o2) {
		var x = this.abs(o1.x - o2.x),
			y = this.abs(o1.y - o2.y);
		return this.sqrt(x*x + y*y);
	},
	path_around: function(ship, obstacle) {
		// there is an obstacle - rotate ship
		var path = this.path(ship, obstacle),
			course = ship.course;

		course += path.clockwise * 6;

		var c1 = path.clockwise < 0,
			c0 = course - path.course > 180 ? path.course + 360 : path.course,
			c2 = (path.course - course > 180 ? course + 360 : course) < c0,
			c3,
			c4;

		if ((c1 && c2) || (!c1 && !c2)) {
			// start orbiting obstacle
			c3 = (path.delta - (path.clockwise * ship.speed * this.delta)) * this.pi180;
			ship.x = obstacle.x + (path.radius * this.cos(c3));
			ship.y = obstacle.y + (path.radius * this.sin(c3));
			
			course = c0;
			c4 = this.bearing(ship, ship.target);
			c0 = course - c4 > 180 ? c4 + 360 : c4,
			c2 = c0 > course;

			if ((!c1 && c2) || (c1 && !c2)) {
				// break from orbit
				course = c0;
				ship.x = obstacle.x + ((path.radius + 1) * this.cos(c3));
				ship.y = obstacle.y + ((path.radius + 1) * this.sin(c3));
				if (ship.obstacle) delete ship.obstacle;
			}
		}
		ship.course = course;
		ship.vector.x = 0;
		ship.vector.y = 0;
	},
	ship_ai: function(self, ships, planets) {
		var pi180  = self.pi180,
			piH    = self.piH,
			pi2    = self.pi2,
			abs    = self.abs,
			cos    = self.cos,
			sin    = self.sin,
			atan   = self.atan,
			round  = self.round,
			sqrt   = self.sqrt,
			plen   = planets.length,
			slen   = ships.length,
			speed  = this.speed,
			course = this.course,
			planet,
			ship,
			dist,
			path;

		// compute propulsion
		this.vector.x = (speed * cos(course * pi180)) * self.delta;
		this.vector.y = (speed * sin(course * pi180)) * self.delta;
		//this.distance_to_target = self.distance(this, this.target);
		


		// collision detection ::: ships
		while (slen--) {
			ship = ships[slen];
			//delete ship.obstacle;
			ship.distance_to_target = self.distance(ship, ship.target);
		}
		/*
		if (this.obstacle) {
			self.path_around(this, this.obstacle);
		} else {
			this.course = self.bearing(this, this.target);
		}
		
		
		slen = ships.length;
		while (slen--) {
			ship = ships[slen];
			dist = self.distance(this, ship);
			if (dist < 22 && this.distance_to_target > ship.distance_to_target) {
				self.path_around(this, ship);
			}
		}
		*/
		ship = ships[0];
		if (this.speed > 20) {
			dist = self.distance(this, ship);
			if (dist < 20) {
				self.path_around(this, ship);
			} else {
				this.course = self.bearing(this, this.target);
			}
		}
		/*
		if (!this.obstacle) {
			// collision detection ::: planets
			while (plen--) {
				planet = planets[plen];
				dist   = self.distance(this, planet) - 8;
				if (dist < planet.radius) {
					if (planet === this.target) {
						// ship has found home!
						planet.ships++;
						return true;
					}
					this.obstacle = planet;
					break;
				}
			}
		}
		*/
		// set ship position
		//this.course = course;
		// set ship position
		this.x += this.vector.x;
		this.y += this.vector.y;
	}
};
