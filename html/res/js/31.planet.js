
game.planet = {
	vpb: {}, // Vertex Position Buffers
	vtb: {}, // Vertex Texture Buffers
	vib: {}, // Vertex Index Buffers
	vnb: {}, // Vertex Normal Buffers
	shader: {}, // Shader Related
	matrix: {},
	texture: {},
	utils: {},
	init: function() {
		this.pih = Math.PI / 180;
		this.cvs = document.createElement('canvas');
		this.wgl = this.cvs.getContext('webgl') || this.cvs.getContext('experimental-webgl');
		this.wgl.viewportWidth  = this.cvs.width  = 150;
		this.wgl.viewportHeight = this.cvs.height = 150;
		this.wgl.ratio = this.wgl.viewportWidth / this.wgl.viewportHeight;
		//document.body.appendChild(this.cvs);

		this.utils.mat3 = mat3;
		this.utils.mat4 = mat4;

		this.texture.maps = ['alien', 'astroid', 'earth', 'gaia',
							'jupiter', 'mars', 'mercury', 'moon',
							'pluto', 'saturn', 'sun', 'venus',
							'gas_giant', 'hoth', 'ixchel', 'mustafar',
							'muunilinst', 'quom', 'tatooine'];
		this.matrix.projection = mat4.create();
		this.matrix.modelview  = mat4.create();
		this.matrix.mvStack    = [];

		this.doEvent('init-shaders');
		this.doEvent('init-buffers');
		this.doEvent('init-texture');
		
		this.wgl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.wgl.enable(this.wgl.DEPTH_TEST);
	},
	doEvent: function(event) {
		var self   = game.planet,
			cvs    = self.cvs,
			wgl    = self.wgl,
			vpb    = self.vpb,
			vtb    = self.vtb,
			vib    = self.vib,
			vnb    = self.vnb,
			shader = self.shader,
			matrix = self.matrix,
			texture = self.texture,
			cmd    = (typeof(event) === 'object') ? event.type : event;

		switch (cmd) {
			// custom events
			case 'init-shaders':
				shader.fragmentShader = self.doEvent('get-shader', 'per-fragment-lighting-fs'),
				shader.vertexShader   = self.doEvent('get-shader', 'per-fragment-lighting-vs');

				shader.program = wgl.createProgram();
				wgl.attachShader(shader.program, shader.vertexShader);
				wgl.attachShader(shader.program, shader.fragmentShader);
				wgl.linkProgram(shader.program);

				if (!wgl.getProgramParameter(shader.program, wgl.LINK_STATUS)) {
					alert("Could not initialise shaders");
				}

				wgl.useProgram(shader.program);

				shader.program.vertexPositionAttribute = wgl.getAttribLocation(shader.program, "aVertexPosition");
				wgl.enableVertexAttribArray(shader.program.vertexPositionAttribute);

				shader.program.vertexNormalAttribute = wgl.getAttribLocation(shader.program, "aVertexNormal");
				wgl.enableVertexAttribArray(shader.program.vertexNormalAttribute);

				shader.program.textureCoordAttribute = wgl.getAttribLocation(shader.program, "aTextureCoord");
				wgl.enableVertexAttribArray(shader.program.textureCoordAttribute);

				shader.program.pMatrixUniform = wgl.getUniformLocation(shader.program, "uPMatrix");
				shader.program.mvMatrixUniform = wgl.getUniformLocation(shader.program, "uMVMatrix");
				shader.program.nMatrixUniform = wgl.getUniformLocation(shader.program, "uNMatrix");
				shader.program.colorMapSamplerUniform = wgl.getUniformLocation(shader.program, "uColorMapSampler");
				shader.program.useLightingUniform = wgl.getUniformLocation(shader.program, "uUseLighting");
				shader.program.ambientColorUniform = wgl.getUniformLocation(shader.program, "uAmbientColor");
				shader.program.pointLightingLocationUniform = wgl.getUniformLocation(shader.program, "uPointLightingLocation");
				shader.program.pointLightingDiffuseColorUniform = wgl.getUniformLocation(shader.program, "uPointLightingDiffuseColor");
				break;
			case 'init-buffers':
				var latitudeBands = 25,
					longitudeBands = 25,
					radius = 13,
					vertexPositionData = [],
					normalData = [],
					textureCoordData = [],
					indexData = [];

				for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
					var theta = latNumber * Math.PI / latitudeBands,
						sinTheta = Math.sin(theta),
						cosTheta = Math.cos(theta);

					for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
						var phi = longNumber * 2 * Math.PI / longitudeBands,
							sinPhi = Math.sin(phi),
							cosPhi = Math.cos(phi),
							x = cosPhi * sinTheta,
							y = cosTheta,
							z = sinPhi * sinTheta,
							u = 1 - (longNumber / longitudeBands),
							v = 1 - (latNumber / latitudeBands);

						normalData.push(x);
						normalData.push(y);
						normalData.push(z);
						textureCoordData.push(u);
						textureCoordData.push(v);
						vertexPositionData.push(radius * x);
						vertexPositionData.push(radius * y);
						vertexPositionData.push(radius * z);
					}
				}

				for (latNumber=0; latNumber < latitudeBands; latNumber++) {
					for (longNumber=0; longNumber < longitudeBands; longNumber++) {
						var first = (latNumber * (longitudeBands + 1)) + longNumber,
							second = first + longitudeBands + 1;
						indexData.push(first);
						indexData.push(second);
						indexData.push(first + 1);

						indexData.push(second);
						indexData.push(second + 1);
						indexData.push(first + 1);
					}
				}

				vnb.sphere = wgl.createBuffer();
				wgl.bindBuffer(wgl.ARRAY_BUFFER, vnb.sphere);
				wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(normalData), wgl.STATIC_DRAW);
				vnb.sphere.itemSize = 3;
				vnb.sphere.numItems = normalData.length / 3;

				vtb.sphere = wgl.createBuffer();
				wgl.bindBuffer(wgl.ARRAY_BUFFER, vtb.sphere);
				wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(textureCoordData), wgl.STATIC_DRAW);
				vtb.sphere.itemSize = 2;
				vtb.sphere.numItems = textureCoordData.length / 2;

				vpb.sphere = wgl.createBuffer();
				wgl.bindBuffer(wgl.ARRAY_BUFFER, vpb.sphere);
				wgl.bufferData(wgl.ARRAY_BUFFER, new Float32Array(vertexPositionData), wgl.STATIC_DRAW);
				vpb.sphere.itemSize = 3;
				vpb.sphere.numItems = vertexPositionData.length / 3;

				vib.sphere = wgl.createBuffer();
				wgl.bindBuffer(wgl.ELEMENT_ARRAY_BUFFER, vib.sphere);
				wgl.bufferData(wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), wgl.STATIC_DRAW);
				vib.sphere.itemSize = 1;
				vib.sphere.numItems = indexData.length;
				break;
			case 'init-texture':
			case 'load-next-texture':
				var maps = texture.maps;
				name = maps.pop();
				texture[name] = wgl.createTexture();
				texture[name].image = new Image();
				texture[name].image.onload = function () {
					self.doEvent('handle-loaded-texture', name);
					if (texture.maps.length) {
						self.doEvent('load-next-texture');
					}
				}
				texture[name].image.src = 'res/img/texture/'+ name +'.jpg';
				break;
			case 'handle-loaded-texture':
				var name = arguments[1],
					texture_image = texture[name];
				wgl.pixelStorei(wgl.UNPACK_FLIP_Y_WEBGL, true);
				wgl.bindTexture(wgl.TEXTURE_2D, texture_image);
				wgl.texImage2D(wgl.TEXTURE_2D, 0, wgl.RGBA, wgl.RGBA, wgl.UNSIGNED_BYTE, texture_image.image);
				wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MAG_FILTER, wgl.LINEAR);
				wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MIN_FILTER, wgl.LINEAR_MIPMAP_NEAREST);
				wgl.generateMipmap(wgl.TEXTURE_2D);

				wgl.bindTexture(wgl.TEXTURE_2D, null);
				break;
			case 'get-shader':
				var script = getEl(arguments[1]),
					method,
					shader;
				// shader method
				switch (script.type) {
					case 'x-shader/x-fragment': method = 'FRAGMENT_SHADER'; break;
					case 'x-shader/x-vertex':   method = 'VERTEX_SHADER';   break;
				}
				shader = wgl.createShader(wgl[method]);
				wgl.shaderSource(shader, script.textContent);
				wgl.compileShader(shader);

				if (!wgl.getShaderParameter(shader, wgl.COMPILE_STATUS)) {
					alert(wgl.getShaderInfoLog(shader));
					return null;
				}
				return shader;
		}
	},
	render: function(planet) {
		var wgl        = this.wgl,
			vpb_sphere = this.vpb.sphere,
			vtb_sphere = this.vtb.sphere,
			vib_sphere = this.vib.sphere,
			vnb_sphere = this.vnb.sphere,
			program    = this.shader.program,
			modelview  = this.matrix.modelview,
			projection = this.matrix.projection,
			texture    = this.texture,
			utils      = this.utils,
			pih        = this.pih,
			mat3       = utils.mat3,
			mat4       = utils.mat4,
			normalMatrix = mat3.create();

		wgl.viewport(0, 0, wgl.viewportWidth, wgl.viewportHeight);
		wgl.clear(wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);
		mat4.perspective(45, wgl.ratio, 0.1, 100.0, projection);

		wgl.uniform1i(program.useColorMapUniform, true);
		wgl.uniform1i(program.useLightingUniform, true);
		// ambient color
		wgl.uniform3f(program.ambientColorUniform, 0.2, 0.15, 0.15);
		// light position
		wgl.uniform3f(program.pointLightingLocationUniform, -11.0, 4.0, -13.0);
		// diffuse color
		wgl.uniform3f(program.pointLightingDiffuseColorUniform, 0.9, 0.9, 0.9);

		mat4.identity(modelview);
		mat4.translate(modelview, [0, 0, -35]);
		mat4.rotate(modelview, planet.tilt * pih, [1, 0, -1]);
		mat4.rotate(modelview, planet.rotation * pih, [0, 1, 0]);

		wgl.activeTexture(wgl.TEXTURE0);
		wgl.bindTexture(wgl.TEXTURE_2D, texture[planet.texture]);
		wgl.uniform1i(program.colorMapSamplerUniform, 0);

		wgl.bindBuffer(wgl.ARRAY_BUFFER, vpb_sphere);
		wgl.vertexAttribPointer(program.vertexPositionAttribute, vpb_sphere.itemSize, wgl.FLOAT, false, 0, 0);
		wgl.bindBuffer(wgl.ARRAY_BUFFER, vtb_sphere);
		wgl.vertexAttribPointer(program.textureCoordAttribute, vtb_sphere.itemSize, wgl.FLOAT, false, 0, 0);
		wgl.bindBuffer(wgl.ARRAY_BUFFER, vnb_sphere);
		wgl.vertexAttribPointer(program.vertexNormalAttribute, vnb_sphere.itemSize, wgl.FLOAT, false, 0, 0);

		// set uniform matrix
		wgl.uniformMatrix4fv(program.pMatrixUniform, false, projection);
		wgl.uniformMatrix4fv(program.mvMatrixUniform, false, modelview);
		mat4.toInverseMat3(modelview, normalMatrix);
		mat3.transpose(normalMatrix);
		wgl.uniformMatrix3fv(program.nMatrixUniform, false, normalMatrix);

		wgl.bindBuffer(wgl.ELEMENT_ARRAY_BUFFER, vib_sphere);
		wgl.drawElements(wgl.TRIANGLES, vib_sphere.numItems, wgl.UNSIGNED_SHORT, 0);
	}
};
