
(function(root, document) {
'use strict';

var game = {
	init: function() {
		game.core.canvas  = document.getElementById('canvas');
		game.core.context = game.core.canvas.getContext('2d');
		// fps log
		game.core.fps = [];
		// faster vars
		game.core.canvas.dim    = game.getDim(game.core.canvas);
		game.core.context.bg    = document.getElementById('bg');
		game.core.context.pi180 = Math.PI / 180;
		game.core.context.piH   = 180 / Math.PI;
		game.core.context.pi2   = Math.PI * 2;

		document.addEventListener('click', game.doEvent, false);
		window.addEventListener('blur', game.doEvent, false);

		game.play();
	},
	play: function() {
		var objects = this.objects,
			ships   = [],
			planets = [],
			planet,
			ship;
		// insert planet 1
		planet = Object.create(objects.planet);
		planet.x = 500;
		planet.y = 90;
		planets.push(planet);

		// insert planet 2
		planet = Object.create(objects.planet);
		planet.x = 420;
		planet.y = 250;
		planet.radius = 80;
		planets.push(planet);

		// insert ships
		for (var i=0; i<1; i++) {
			ship = Object.create(objects.ship);
			ship.x = 250; //Math.round(Math.random() * 70) * 10;
			ship.y = 400; //Math.round(Math.random() * 40) * 10;
			ship.speed = 90;
			ship.course = 90;
			ship.target = planets[0];
			ships.push(ship);
		}

		this.core.ships = ships;
		this.core.planets = planets;

		this.core.then = this.core.performance.now();
		this.core.frame();
		//this.core.update();
	},
	pause: function() {
		cancelAnimationFrame(game.core.animationFrame);
		game.core.animationFrame = false;
		console.log('finished');
	},
	doEvent: function(event) {
		var self = game,
			core = self.core,
			mx,
			my;
		switch (event.type) {
			case 'blur':
				self.pause();
				break;
			case 'click':
				mx = event.clientX - core.canvas.dim.l;
				my = event.clientY - core.canvas.dim.t;
				
				core.planets[0].x = mx;
				core.planets[0].y = my;

				//var o = core.ships[0],
				//	theta = Math.atan(o.target.x - o.x, o.y - o.target.y);
				//if (theta < 0) theta += core.context.pi2;
				//console.log( Math.floor(theta * core.context.piH ) );
				break;
		}
	},
	core: {
		stop: function() {
			setTimeout(function() { game.pause(); });
		},
		frame: function() {
			var root = game,
				self = root.core;
			self.setDelta();
			self.update();
			self.render();
			// paints fps box
			root.paint.fps(self);
			self.animationFrame = requestAnimationFrame(self.frame);
		},
		setDelta: function() {
			this.now   = this.performance.now();
			this.delta = (this.now - this.then) / 1000;
			this.then  = this.now;
		},
		showDeg: function(deg, ctx) {
			ctx.fillStyle = 'rgba(255,255,255,0.5)';
			ctx.font = '50px Arial';
			ctx.fillText(deg, 300, 60);
		},
		update: function() {
			// Render updates to browser (draw to canvas, update css, etc)
			var paint    = game.paint,
				ctx      = this.context,
				planets  = this.planets,
				ships    = this.ships,
				len      = ships.length,
				p_ship   = paint.ship,
				p_planet = paint.planet;
			
			//this.canvas.width = this.canvas.width;
			//ctx.drawImage(ctx.bg, 0, -100, 800, 800);
			ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

			// paint ships
			while (len--) {
				p_ship(ships[len], ctx);
			}
			// paint planets
			len = planets.length;
			while (len--) {
				p_planet(planets[len], ctx);
			}
		},
		render: function() {
			// Update values
			var delta   = this.delta,
				planets = this.planets,
				ships   = this.ships,
				pi180   = this.context.pi180,
				piH     = this.context.piH,
				pi2     = this.context.pi2,
				abs     = Math.abs,
				cos     = Math.cos,
				sin     = Math.sin,
				atan    = Math.atan2,
				round   = Math.round,
				sqrt    = Math.sqrt,
				plen    = planets.length,
				slen    = ships.length,
				len,
				course,
				_course,
				diff,
				p,
				o,
				dx,
				dy,
				tx,
				ty,
				distance,
				theta;

			while (slen--) {
				o = ships[slen];
				course = o.course;
				o._course = false;

				// collision detection
				len = plen;
				while (len--) {
					p  = planets[len];
					dx = p.x - o.x;
					dy = p.y - o.y;
					distance = sqrt(dx * dx + dy * dy);

					if (distance < p.radius) {
						if (p === o.target) {
							ships[0].x = 40;
							ships[0].y = 40;
							//game.pause();
						} else {
							// calculate x, y, bearing
							var tht = atan(dx, -dy),
								ang,
								cw;

							if (tht < 0) tht += pi2;
							ang  = round(tht * piH - 180);
							diff = o.course - ang;
							cw   = diff % 360 > 90;

							if (cw) diff = 180 - diff;
							//if (diff < 0) diff = (diff + 360) % 360;

							/* target bearing */
							game.paint.line(o, o.target, this.context);
							// tangent
							var bang = ang;
							game.paint.line(o, {
								x: o.x + (300 * Math.cos(bang * pi180)),
								y: o.y + (300 * Math.sin(bang * pi180))
							}, this.context);
							

							if (diff > 6) {
								// set ship bearing
								o.course = round(course) - (cw ? -4 : 4);
								return;
							} else {
								//this.stop();
								
								o._course = o.course;
								ang = (tht * piH) + 90 + (o.speed * 0.0005);
								o.x = p.radius * Math.cos(ang * pi180) + p.x;
								o.y = p.radius * Math.sin(ang * pi180) + p.y;
							}
						}
					}
				}

				// get ship target course
				tx = o.x - o.target.x;
				ty = o.target.y - o.y;
				theta = atan(tx, ty);
				if (theta < 0) theta += pi2;

				_course = round(theta * piH + 90);
				if (_course > 360) _course %= 360;
				diff = course - _course;

				// adjustment course if needed
				if (abs(diff) > 1) {
					if      (diff >  180) { o.course -= 360; break; }
					else if (diff < -180) { o.course += 360; break; }
					course -= diff * 0.15;
				}

				// set ship position
				o.course = course;
				// set ship position
				o.x += (o.speed * cos(o.course * pi180)) * delta;
				o.y += (o.speed * sin(o.course * pi180)) * delta;
				//this.showDeg(o.course, this.context);
			}
		}
	},
	objects: {
		ship: {
			x: 240,
			y: 240,
			course: 210,
			target: false,
			speed: 80
		},
		planet: {
			x: 0,
			y: 0,
			radius: 30,
			texture: '04'
		}
	},
	paint: {
		fps: function(core) {
			var cvs = core.canvas,
				ctx = core.context,
				fps = core.fps;
			// log fps
			fps.unshift(Math.round(1/core.delta));

			ctx.save();
			ctx.translate(cvs.width-107, cvs.height-47);
			// draw box
			ctx.fillStyle = 'rgba(0,200,100,0.5)';
			ctx.fillRect(5,5,100,40);
			ctx.fillStyle = 'rgba(80,255,80,0.5)';
			ctx.fillRect(7,7,96,11);
			ctx.fillStyle = 'rgba(255,255,255,0.6)';
			// loop log
			for (var i=0, bar, p; i<96; i++) {
				bar = fps[i];
				if (!bar) break;
				p = bar/90;
				if (p > 1) p = 1;
				ctx.fillRect(102-i,43,1,-(24*p));
			}
			// trim log
			fps.splice(100,1);
			// write fps
			ctx.fillStyle = '#000';
			ctx.font = '9px Arial';
			ctx.textAlign = 'left';
			ctx.fillText('FPS: '+ core.fps[0], 8, 16);

			ctx.restore();
		},
		ship: function(o, ctx) {
			var h = 9,
				w = 6,
				c = o._course || o.course;
			ctx.save();

			// rotate
			ctx.translate(o.x, o.y);
			ctx.rotate((c + 90) * ctx.pi180); 
			ctx.translate(-o.x, -o.y);
			// ship gui
			ctx.strokeStyle = 'rgba(255,150,255,0.65)';
			ctx.lineJoin    = 'round';
			ctx.lineWidth   = 3.5;
			// ship outline
			ctx.beginPath();
			ctx.moveTo(o.x, o.y - h);
			ctx.lineTo(o.x + w, o.y + h);
			ctx.lineTo(o.x - w, o.y + h);
			ctx.closePath();
			ctx.stroke();

			ctx.restore();
		},
		planet: function(o, ctx) {
			ctx.save();
			// planet gui
			//ctx.shadowColor = o.color || '#0f0';
			ctx.strokeStyle = o.color || '#393';
			ctx.fillStyle = o.color || 'rgba(0,220,0,0.1)';
			//ctx.shadowBlur = 2;
			ctx.lineWidth = 3;
			// planet outline
			ctx.beginPath();
			ctx.arc(o.x, o.y, o.radius - 10, 0, ctx.pi2);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
		},
		line: function(o, t, ctx) {
			ctx.save();
			ctx.strokeStyle = 'rgba(255,255,255,0.5)';
			ctx.lineWidth = 1;

			ctx.beginPath();
			ctx.moveTo(o.x, o.y);
			ctx.lineTo(t.x, t.y);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
	},
	getDim: function(el, a, v) {
		a = a || 'nodeName';
		v = v || 'BODY';
		var p = {w:el.offsetWidth, h:el.offsetHeight, t:0, l:0, obj:el};
		while (el && el[a] != v && (el.getAttribute && el.getAttribute(a) != v)) {
			if (el == document.firstChild) return null;
			p.t += el.offsetTop - el.scrollTop;
			p.l += el.offsetLeft - el.scrollLeft;
			if (el.scrollWidth > el.offsetWidth && el.style.overflow == 'hidden') {
				p.w = Math.min(p.w, p.w-(p.w + p.l - el.offsetWidth - el.scrollLeft));
			}
			el = el.offsetParent;
		}
		return p;
	}
};



window.game = game;

game.core.performance = window.performance || {};
performance.now = (function() {
	return performance.now       ||
		   performance.mozNow    ||
		   performance.msNow     ||
		   performance.oNow      ||
		   performance.webkitNow ||
		   Date.now  /*none found - fallback to browser default */
})();

window.onload = game.init;

})(window, document);

