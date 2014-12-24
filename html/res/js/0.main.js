
var game = {
	init: function(win, doc) {
		// initate it all
		for (var name in this) {
			if (typeof(this[name].init) === 'function') {
				this[name].init(this);
			}
		}
		// a few event handlers
		doc.addEventListener('mousedown', game.doEvent, false);
		doc.addEventListener('mousemove', game.doEvent, false);
		doc.addEventListener('dblclick', game.doEvent, false);
		win.addEventListener('blur', game.doEvent, false);

		//game.generate.name(5);

		this.doEvent('play');

		// temp: deploys fleet
		var planets = this.core.planets,
			sel = 0,
			tgt = 0;
		//sel = 1; tgt = 9;
		//sel = 7; tgt = 2;
		//sel = 3; tgt = 5;

		this.core.selected.push(planets[sel]);
		this.core.target = planets[tgt];
		this.doEvent('deploy-fleet', planets[tgt]);
	},
	doEvent: function(event) {
		var self    = game,
			compute = self.compute,
			pi180   = compute.pi180,
			cos     = compute.cos,
			sin     = compute.sin,
			sqrt    = compute.sqrt,
			objects = self.objects,
			core    = self.core,
			ships   = core.ships,
			planets = core.planets,
			cmd     = (typeof(event) === 'object') ? event.type : event,
			mx,
			my,
			ox,
			oy,
			obj,
			len,
			isPlanet,
			index;
		switch (cmd) {
			// native events
			case 'blur':
				self.doEvent('pause');
				break;
			case 'dblclick':
				break;
			case 'mousedown':
			case 'mousemove':
				mx = event.pageX;
				my = event.pageY;
				len = planets.length;
				while (len--) {
					obj = planets[len];
					obj._hover = false;
					ox = obj.x - mx;
					oy = obj.y - my;
					isPlanet = sqrt((ox * ox) + (oy * oy)) <= obj.radius + 7;
					if (isPlanet) {
						if (cmd === 'mousedown') {
							if (core.selected.length) {
								// deploy fleet
								self.doEvent('deploy-fleet', obj);
								return;
							}
							if (obj._selected) {
								obj._selected = false;
								// subtract from selected array
								index = core.selected.indexOf(obj);
								core.selected.splice(index, 1);
							} else {
								obj._selected = isPlanet;
								// add to selected array
								core.selected.push(obj);
							}
						} else {
							obj._hover = isPlanet;
							if (core.selected.length) {
								core.target = obj;
							}
						}
						break;
					}
				}
				if (!isPlanet) {
					if (cmd === 'mousedown') {
						self.doEvent('clear-stategy');
					} else {
						core.target = false;
					}
				}
				break;
			// custom events
			case 'clear-stategy':
				len = planets.length;
				while (len--) {
					obj = planets[len];
					obj._hover =
					obj._selected = false;
					core.target   = false;
					core.selected = [];
				}
				break;
			case 'play':
				self.doEvent('draw-map', 'test');

				core.then = core.performance.now();
				core.frame();
				break;
			case 'pause':
				cancelAnimationFrame(core.animationFrame);
				console.log('finished');
				break;
			case 'load-images':
				var images = getEl('images').children,
					len    = images.length,
					img,
					el;
				while (len--) {
					el  = images[len];
					if (el.nodeType !== 1) continue;
					self.res.image[el.id] = getEl(el.id);
				}
				break;
			case 'draw-map':
				var maps    = level_maps,
					map     = maps[arguments[1]],
					names   = self.generate.name(map.length),
					planet,
					planets = [],
					pLen    = map.length,
					ship,
					ships   = [],
					sLen;
				
				while (pLen--) {
					// insert planet
					planet = Object.create(objects.planet);
					planet = self.extend(planet, map[pLen]);
					planet.rotation = 0;
					//planet.name = names[pLen];
					planets.push(planet);
				}

				core.ships   = ships;
				core.planets = planets;
				break;
			case 'deploy-fleet':
				var source = core.selected[0],
					target = arguments[1],
					len = 31,
					ship,
					course;
				
				ship = Object.create(objects.ship);
				ship.ai = compute.ship_ai;
				ship.x = 350; ship.y = 400;
				ship.course = compute.bearing(ship, target);
				ship.target = target;
				ship.speed = 10;
				ships.push(ship);

				ship = Object.create(objects.ship);
				ship.ai = compute.ship_ai;
				ship.x = 350; ship.y = 470;
				ship.course = compute.bearing(ship, target);
				ship.target = target;
				ships.push(ship);

				/*
				while (len--) {
					ship = Object.create(objects.ship);
					ship.ai = compute.ship_ai;
					ship.x = 340 + ((len % 3) * 20);
					ship.y = 440 + (parseInt(len / 3) * 28);
					ship.course = compute.bearing(ship, target);
					ship.target = target;
					ships.push(ship);
				}
				*/

				/*
				while (len--) {
					source.ships--;
					ship = Object.create(objects.ship);
					ship.ai = compute.ship_ai;
					course = compute.bearing(source, target);

					course += (len * 20 * (len % 2 === 1 ? -1 : 1));
					ship.x = source.x + ((source.radius + 16) * cos(course * pi180));
					ship.y = source.y + ((source.radius + 16) * sin(course * pi180));

					ship.course = compute.bearing(ship, target);
					ship.target = target;
					ships.push(ship);
				}
				*/
				//core.update();
				//core.stop();
				self.doEvent('clear-stategy');
				break;
		}
	},
	getDim: function(el, a, v) {
		a = a || 'nodeName';
		v = v || 'BODY';
		var p = {w:el.offsetWidth, h:el.offsetHeight, t:0, l:0, obj:el};
		while (el && el[a] != v && (el.getAttribute && el.getAttribute(a) != v)) {
			if (el == doc.firstChild) return null;
			p.t += el.offsetTop - el.scrollTop;
			p.l += el.offsetLeft - el.scrollLeft;
			if (el.scrollWidth > el.offsetWidth && el.style.overflow == 'hidden') {
				p.w = Math.min(p.w, p.w-(p.w + p.l - el.offsetWidth - el.scrollLeft));
			}
			el = el.offsetParent;
		}
		return p;
	},
	extend: function(safe, deposit) {
		var content;
		for (content in deposit) {
			if (!safe[content] || typeof(deposit[content]) !== 'object') {
				safe[content] = deposit[content];
			} else {
				this.extend(safe[content], deposit[content]);
			}
		}
		return safe;
	}
};


