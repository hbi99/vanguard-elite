
game.paint = {
	init: function(root) {
		this.compute      = game.compute;
		this.pi180        = this.compute.pi180;
		this.bg_rotation  = 0;
		this.strategy_rgb = '0,240,240';
		this.init_starfield(64);
	},
	init_starfield: function(len) {
		var stars = [],
			max_depth = 32;
		while (len--) {
			stars.push({
				x: Math.rnd(-25,25),
				y: Math.rnd(-25,25),
				z: Math.rnd(1, max_depth)
			});
		}
		this.stars = stars;
		this.max_depth = 32;
	},
	starfield: function(ctx, width, height) {
		var pi2        = this.compute.pi2,
			halfWidth  = width / 2,
			halfHeight = height / 2,
			max_depth  = this.max_depth,
			stars      = this.stars,
			len        = stars.length,
			shade,
			size,
			px,
			py,
			k;
		while (len--) {
			stars[len].z -= 0.01;

			if (stars[len].z <= 0) {
				stars[len].x = Math.rnd(-25,25);
				stars[len].y = Math.rnd(-25,25);
				stars[len].z = max_depth;
			}
			k  = 128 / stars[len].z,
			px = stars[len].x * k + halfWidth,
			py = stars[len].y * k + halfHeight;

			if (px >= 0 && px <= width && py >= 0 && py <= height) {
				shade = (1 - stars[len].z / 64),
				size = shade * 2;
				ctx.beginPath();
				ctx.fillStyle = "rgba(255,255,255," + shade + ")";
				//ctx.fillRect(px, py, size, size);
				ctx.arc(px, py, size, 0, pi2);
    			ctx.fill();
			}
		}
	},
	bg: function(ctx, width, height) {
		var w2 = 1100,
			w = width / 2,
			h = height / 2;
		this.bg_rotation += 0.005;
		ctx.save();
		ctx.translate(w, h);
		ctx.rotate(this.bg_rotation * this.compute.pi180);
		ctx.translate(-w, -h);
		ctx.drawImage(game.res.image.bg1, -100, -250, w2, w2);
		ctx.restore();
	},
	fps: function(core) {
		var cvs = core.canvas,
			ctx = core.context,
			fps = core.fps,
			i   = 0,
			p,
			bar;
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
		for (; i<96; i++) {
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
		// restore state
		ctx.restore();
	},
	ship: function(o, ctx) {
		var w = 6,
			h = w * 2,
			c = o.course;
		ctx.save();
		// rotate
		ctx.translate(o.x, o.y);
		ctx.rotate((c + 90) * this.pi180); 
		ctx.translate(-o.x, -o.y);
		// ship gui
		ctx.strokeStyle = 'rgba(90,90,255,0.9)';
		ctx.lineJoin    = 'round';
		ctx.lineWidth   = 3;
		// ship outline
		ctx.beginPath();
		//ctx.moveTo(o.x, o.y - h);
		//ctx.lineTo(o.x + w, o.y + w);
		//ctx.lineTo(o.x - w, o.y + w);
		ctx.moveTo(o.x + w, o.y + w);
		ctx.lineTo(o.x, o.y - h);
		ctx.lineTo(o.x - w, o.y + w);
		ctx.lineTo(o.x, o.y + 3.5);
		ctx.closePath();
		ctx.stroke();
		// restore state
		ctx.restore();

		//this.circle(o, ctx);
	},
	stategy: function(selected, target, ctx) {
		var core  = game.core,
			compute = this.compute,
			pi180 = compute.pi180,
			cos   = compute.cos,
			sin   = compute.sin,
			rgb   = this.strategy_rgb,
			len   = selected.length,
			o,
			ox,
			oy,
			or,
			targetx,
			targety,
			targetr = target.radius + 4,
			course;

		ctx.save();
		ctx.lineWidth   = 3;
		ctx.shadowBlur  = 7;
		ctx.strokeStyle = 'rgba('+ rgb +',0.75)';
		ctx.shadowColor = 'rgba('+ rgb +',1)';
		ctx.beginPath();
		while (len--) {
			o = selected[len];
			or = o.radius + 4;

			course = compute.bearing(o, target);
			ox = o.x + (or * cos(course * pi180));
			oy = o.y + (or * sin(course * pi180));

			course = compute.bearing(target, o);
			targetx = target.x + (targetr * cos(course * pi180));
			targety = target.y + (targetr * sin(course * pi180));

			ctx.moveTo(ox, oy);
			ctx.lineTo(targetx, targety);
			//ctx.stroke();
			//ctx.lineTo(ox, oy);
		}
		ctx.stroke();
		ctx.restore();
	},
	planet: function(o, ctx) {
		var rgb = this.strategy_rgb,
			radius = o.radius,
			r2 = radius*2,
			ix = o.x - radius,
			iy = o.y - radius;

		ctx.save();
		ctx.shadowBlur = 5;

		if (o._hover || o._selected) {
			// planet halo
			ctx.beginPath();
			ctx.lineWidth   = 3;
			//ctx.shadowBlur  = 5;
			ctx.strokeStyle = 'rgba('+ rgb +',0.75)';
			ctx.shadowColor = 'rgba('+ rgb +',1)';
			ctx.arc(o.x, o.y, radius + 5, 0, this.compute.pi2);
			ctx.stroke();
			// enhance selection halo
			//ctx.shadowBlur  = 7;
			//ctx.arc(o.x, o.y, radius + 5, 0, this.compute.pi2);
			//ctx.stroke();
		}
		if (o._hover) {
			ctx.font = '18px Lucida Console';
			ctx.lineWidth = 5;
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = 'rgba(0,0,0,0.5)';
			ctx.textAlign = 'center';
			ctx.strokeText(o.texture, o.x, o.y - o.radius - 17);
			// text outline
			ctx.fillText(o.texture, o.x, o.y - o.radius - 17);
		}
		// planet atmosphere
		ctx.shadowColor = 'rgba(255,255,255,0.25)';
		// planet image
		ctx.planet.render(o);
		ctx.drawImage(ctx.planet.cvs, ix, iy, r2, r2);

		ctx.font = '18px Lucida Console';
		ctx.lineWidth = 5;
		ctx.fillStyle = '#fff';
		ctx.strokeStyle = 'rgba(0,0,0,0.5)';
		ctx.textAlign = 'center';
		ctx.strokeText(Math.round(o.ships), o.x, o.y+7);
		// text outline
		ctx.fillText(Math.round(o.ships), o.x, o.y+7);

		ctx.restore();
	},
	circle: function(o, ctx) {
		ctx.beginPath();
		ctx.lineWidth = 0.5;
		ctx.strokeStyle = '#fff';
		ctx.arc(o.x, o.y, o.radius, 0, this.compute.pi2);
		ctx.stroke();
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
};
