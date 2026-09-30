window.__ModuleLoader__.load({
	id: "dsh-aqua-glass",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/ambient-scene.ts
		const FISH_PATH = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z";
		function svg(critter, viewBox, width, style, body) {
			return `<svg data-aqua-critter="${critter}" viewBox="${viewBox}" width="${width}" style="${style}" aria-hidden="true">${body}</svg>`;
		}
		function fish(style, width) {
			return svg("fish", "0 0 23.16 17.04", width, style, `<path d="${FISH_PATH}" fill="currentColor"/>`);
		}
		function fishLeft(style, width) {
			return svg("fish-left", "0 0 23.16 17.04", width, style, `<path d="${FISH_PATH}" fill="currentColor"/>`);
		}
		function bubble(style, size) {
			return svg("bubble", "0 0 8 8", size, style, "<circle cx=\"4\" cy=\"4\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\"/>");
		}
		function plankton(style) {
			return svg("plankton", "0 0 3 3", 3, style, "<circle cx=\"1.5\" cy=\"1.5\" r=\"1.5\" fill=\"currentColor\"/>");
		}
		const AMBIENT_SCENE = [
			"<canvas data-dsh-aqua-fluid-canvas></canvas>",
			fish("top:22%;left:58%;animation-duration:9s", 30),
			fishLeft("top:36%;left:10%;animation-duration:14s;animation-delay:-4s", 20),
			fish("top:64%;left:76%;animation-duration:19s;animation-delay:-9s;opacity:0.55", 14),
			bubble("bottom:8%;left:9%;animation-duration:8s", 7),
			bubble("bottom:5%;left:13%;animation-duration:10s;animation-delay:2.5s", 5),
			bubble("bottom:10%;left:17%;animation-duration:9s;animation-delay:5s", 6),
			bubble("bottom:9%;left:82%;animation-duration:11s;animation-delay:1.5s", 8),
			bubble("bottom:6%;left:87%;animation-duration:8s;animation-delay:4s", 5),
			plankton("top:14%;left:42%;animation-delay:-1s"),
			plankton("top:32%;left:70%;animation-delay:-3s"),
			plankton("top:72%;left:18%;animation-delay:-2s"),
			plankton("top:56%;left:86%;animation-delay:-4s")
		].join("");
		function ensureAmbientScene() {
			const existing = document.querySelector("[data-dsh-aqua-ambient]");
			if (existing !== null) return existing;
			const holder = document.createElement("div");
			holder.innerHTML = `<div data-dsh-aqua-ambient aria-hidden="true">${AMBIENT_SCENE}</div>`;
			const node = holder.firstElementChild;
			if (!(node instanceof HTMLElement)) throw new Error("ui-aqua: ambient scene markup failed to parse");
			document.body.prepend(node);
			if (document.querySelector("[data-dsh-aqua-wallpaper-layer]") === null) {
				const wallpaper = document.createElement("div");
				wallpaper.setAttribute("data-dsh-aqua-wallpaper", "");
				wallpaper.setAttribute("data-dsh-aqua-wallpaper-layer", "");
				wallpaper.setAttribute("aria-hidden", "true");
				wallpaper.innerHTML = "<img data-dsh-aqua-wallpaper-img alt=\"\">";
				document.body.prepend(wallpaper);
			}
			return node;
		}
		function removeAmbientScene() {
			for (const node of document.querySelectorAll("[data-dsh-aqua-ambient]")) node.remove();
			for (const node of document.querySelectorAll("[data-dsh-aqua-wallpaper-layer]")) node.remove();
		}
		//#endregion
		//#region src/client/fluid-interactions.ts
		function uv(canvas, clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: rect.width <= 0 ? .5 : (clientX - rect.left) / rect.width,
				y: rect.height <= 0 ? .5 : 1 - (clientY - rect.top) / rect.height
			};
		}
		function attachFluidInteractions(targets) {
			const { main, mainCanvas } = targets;
			const lastStir = new WeakMap();
			const ripples = new Set();
			const stirButton = (button, strength) => {
				const now = performance.now();
				if (now - (lastStir.get(button) ?? 0) < 160) return;
				lastStir.set(button, now);
				const rect = button.getBoundingClientRect();
				const point = uv(mainCanvas, rect.left + rect.width / 2, rect.top + rect.height / 2);
				main.stir(point.x, point.y, 0, -strength);
			};
			const ripple = (cx, cy) => {
				const rect = mainCanvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;
				const ux = (cx - rect.left) / rect.width;
				const uy = 1 - (cy - rect.top) / rect.height;
				const start = performance.now();
				const duration = 1500;
				const maxRadius = 120;
				const count = 8;
				const step = () => {
					const t = performance.now() - start;
					if (t > duration) return;
					const k = t / duration;
					const radius = maxRadius * k * k;
					const strength = .05 * (1 - k);
					const spin = .4 * k;
					for (let i = 0; i < count; i += 1) {
						const angle = i / count * Math.PI * 2 + spin;
						const px = ux + radius * Math.cos(angle) / rect.width;
						const py = uy + radius * Math.sin(angle) / rect.height;
						main.stir(px, py, Math.cos(angle) * strength, -Math.sin(angle) * strength);
					}
					const id = requestAnimationFrame(step);
					ripples.add(id);
				};
				const id = requestAnimationFrame(step);
				ripples.add(id);
			};
			const onPointerOver = (event) => {
				const button = event.target?.closest?.("button");
				if (button !== void 0 && button !== null) stirButton(button, .04);
			};
			const onClick = (event) => {
				const button = event.target?.closest?.("button");
				if (button === void 0 || button === null) return;
				const now = performance.now();
				if (now - (lastStir.get(button) ?? 0) < 500) return;
				lastStir.set(button, now);
				const rect = button.getBoundingClientRect();
				ripple(rect.left + rect.width / 2, rect.top + rect.height / 2);
			};
			document.addEventListener("pointerover", onPointerOver, { capture: true });
			document.addEventListener("click", onClick, { capture: true });
			return () => {
				for (const id of ripples) cancelAnimationFrame(id);
				ripples.clear();
				document.removeEventListener("pointerover", onPointerOver, { capture: true });
				document.removeEventListener("click", onClick, { capture: true });
			};
		}
		//#endregion
		//#region src/client/fluid-shader.ts
		const SITE_FLUID_PARAMS = {
			mouseRadius: .22,
			mouseStrength: 1.1,
			decay: .96,
			distortBoost: 1.35,
			noiseBoost: 0,
			swirlBoost: .45,
			speed: 14,
			distortion: 20,
			swirl: 12,
			swirlIterations: 8,
			scale: .5,
			rotation: -5,
			proportion: 50,
			softness: 100,
			shapeScale: 10,
			offsetX: 0,
			offsetY: 65,
			color1: "#8AA3D6",
			color2: "#FFFFFF",
			color3: "#FFFFFF"
		};
		const VERTEX_SHADER = `#version 300 es
in vec4 a_position;
out vec2 vUv;
void main() {
  vUv = a_position.xy * 0.5 + 0.5;
  gl_Position = a_position;
}
`;
		const FLOW_SHADER = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D u_prev;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_brushRadius;
uniform float u_brushStrength;
uniform float u_decay;
out vec4 fragColor;

void main() {
  vec4 prev = texture(u_prev, vUv);

  prev.r *= u_decay;
  prev.gb = mix(vec2(0.5), prev.gb, u_decay);

  float dist = distance(vUv, u_mouse);

  float influence = exp(-dist * dist / (u_brushRadius * u_brushRadius * 0.5));
  influence = max(0.0, influence - 0.01);

  float speed = length(u_velocity);
  float presenceStrength = u_brushStrength * 0.3;
  float velBonus = min(speed * 3.0, 0.7) * u_brushStrength;
  float totalStrength = presenceStrength + velBonus;

  prev.r = max(prev.r, influence * totalStrength);
  float blendAmt = influence * min(totalStrength, 0.4) * 0.3;
  prev.g = mix(prev.g, clamp(u_velocity.x * 2.0 + 0.5, 0.0, 1.0), blendAmt);
  prev.b = mix(prev.b, clamp(u_velocity.y * 2.0 + 0.5, 0.0, 1.0), blendAmt);

  fragColor = prev;
}
`;
		const DISPLAY_SHADER = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1, u_color2, u_color3;
uniform float u_colorCount;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
uniform vec2 u_offset;
uniform sampler2D u_flowmap;
uniform float u_distortBoost;
uniform float u_noiseBoost;
uniform float u_swirlBoost;
out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) { return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }
float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
float noise(vec2 st) {
  vec2 i = floor(st); vec2 f = fract(st);
  float a = random(i), b = random(i + vec2(1,0)), c = random(i + vec2(0,1)), d = random(i + vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

vec3 blend_multi(float mixer, float softness) {
  float edge = 1.0 - softness;
  vec3 col = u_color1.rgb;
  if (u_colorCount > 1.5) { col = mix(col, u_color2.rgb, smoothstep(0.0 + 0.35*edge, 0.7 - 0.35*edge, mixer)); }
  if (u_colorCount > 2.5) { col = mix(col, u_color3.rgb, smoothstep(0.3 + 0.35*edge, 1.0 - 0.35*edge, mixer)); }
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float ns = .0005 + .006 * u_scale;
  uv -= .5; uv *= (ns * u_resolution); uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio; uv += .5; uv += u_offset;

  vec2 fragUV = gl_FragCoord.xy / u_resolution.xy;
  vec4 flow = texture(u_flowmap, fragUV);
  float influence = flow.r;
  vec2 flowDir = (flow.gb - 0.5) * 2.0;

  float n1 = noise(uv + t), n2 = noise(uv*2. - t);
  float angle = n1 * TWO_PI;

  float totalDistortion = u_distortion + influence * u_distortBoost;
  uv.x += 4. * totalDistortion * n2 * cos(angle);
  uv.y += 4. * totalDistortion * n2 * sin(angle);

  uv += flowDir * influence * 0.15;

  if (influence > 0.001) {
    float localNoise = noise(uv * 2.0 + t * 1.5);
    uv += influence * u_noiseBoost * vec2(cos(localNoise * TWO_PI), sin(localNoise * TWO_PI));
  }

  float iters = ceil(clamp(u_swirlIterations, 1., 30.));
  float swirlAmt = clamp(u_swirl, 0., 2.) + influence * u_swirlBoost;
  for (float i = 1.; i <= 30.0; i++) {
    if (i > iters) break;
    uv.x += swirlAmt / i * cos(t + i*1.5*uv.y);
    uv.y += swirlAmt / i * cos(t + i*1.*uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  vec2 cuv = uv * (.5 + 3.5 * u_shapeScale);
  float shape = .5 + .5 * sin(cuv.x) * cos(cuv.y);
  float mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  vec3 col = blend_multi(mixer, clamp(u_softness, 0., 1.));
  fragColor = vec4(col, 1.0);
}
`;
		function hexToRgb(value) {
			const hex = value.replace("#", "");
			return [
				parseInt(hex.slice(0, 2), 16) / 255,
				parseInt(hex.slice(2, 4), 16) / 255,
				parseInt(hex.slice(4, 6), 16) / 255
			];
		}
		function attachFluidShader(canvas, params) {
			const gl = canvas.getContext("webgl2", {
				alpha: true,
				premultipliedAlpha: false,
				powerPreference: "low-power"
			});
			if (gl === null) return {
				setParams: () => {},
				stir: () => {},
				dispose: () => {}
			};
			const compile = (type, source) => {
				const shader = gl.createShader(type);
				if (shader === null) return null;
				gl.shaderSource(shader, source);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					console.error("ui-aqua fluid shader:", gl.getShaderInfoLog(shader));
					return null;
				}
				return shader;
			};
			const link = (fragment) => {
				const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
				const frag = compile(gl.FRAGMENT_SHADER, fragment);
				if (vertex === null || frag === null) return null;
				const program = gl.createProgram();
				if (program === null) return null;
				gl.attachShader(program, vertex);
				gl.attachShader(program, frag);
				gl.linkProgram(program);
				if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
					console.error("ui-aqua fluid link:", gl.getProgramInfoLog(program));
					return null;
				}
				return program;
			};
			const flowProgram = link(FLOW_SHADER);
			const displayProgram = link(DISPLAY_SHADER);
			if (flowProgram === null || displayProgram === null) return {
				setParams: () => {},
				stir: () => {},
				dispose: () => {}
			};
			const flow = {
				prev: gl.getUniformLocation(flowProgram, "u_prev"),
				mouse: gl.getUniformLocation(flowProgram, "u_mouse"),
				velocity: gl.getUniformLocation(flowProgram, "u_velocity"),
				brushRadius: gl.getUniformLocation(flowProgram, "u_brushRadius"),
				brushStrength: gl.getUniformLocation(flowProgram, "u_brushStrength"),
				decay: gl.getUniformLocation(flowProgram, "u_decay")
			};
			const display = {
				time: gl.getUniformLocation(displayProgram, "u_time"),
				pixelRatio: gl.getUniformLocation(displayProgram, "u_pixelRatio"),
				resolution: gl.getUniformLocation(displayProgram, "u_resolution"),
				scale: gl.getUniformLocation(displayProgram, "u_scale"),
				rotation: gl.getUniformLocation(displayProgram, "u_rotation"),
				offset: gl.getUniformLocation(displayProgram, "u_offset"),
				color1: gl.getUniformLocation(displayProgram, "u_color1"),
				color2: gl.getUniformLocation(displayProgram, "u_color2"),
				color3: gl.getUniformLocation(displayProgram, "u_color3"),
				colorCount: gl.getUniformLocation(displayProgram, "u_colorCount"),
				proportion: gl.getUniformLocation(displayProgram, "u_proportion"),
				softness: gl.getUniformLocation(displayProgram, "u_softness"),
				shape: gl.getUniformLocation(displayProgram, "u_shape"),
				shapeScale: gl.getUniformLocation(displayProgram, "u_shapeScale"),
				distortion: gl.getUniformLocation(displayProgram, "u_distortion"),
				swirl: gl.getUniformLocation(displayProgram, "u_swirl"),
				swirlIterations: gl.getUniformLocation(displayProgram, "u_swirlIterations"),
				flowmap: gl.getUniformLocation(displayProgram, "u_flowmap"),
				distortBoost: gl.getUniformLocation(displayProgram, "u_distortBoost"),
				noiseBoost: gl.getUniformLocation(displayProgram, "u_noiseBoost"),
				swirlBoost: gl.getUniformLocation(displayProgram, "u_swirlBoost")
			};
			const quadBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				-1,
				-1,
				1,
				-1,
				-1,
				1,
				1,
				1
			]), gl.STATIC_DRAW);
			const bindQuad = (program) => {
				const position = gl.getAttribLocation(program, "a_position");
				gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
				gl.enableVertexAttribArray(position);
				gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
			};
			const makeTarget = (width, height, initial) => {
				const tex = gl.createTexture();
				if (tex === null) throw new Error("ui-aqua fluid: texture allocation failed");
				gl.bindTexture(gl.TEXTURE_2D, tex);
				if (initial !== void 0) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, initial);
				else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				const fbo = gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				return {
					fbo,
					tex
				};
			};
			let width = 0;
			let height = 0;
			let flowWidth = 0;
			let flowHeight = 0;
			let flip = false;
			let current = { ...params };
			const pointer = {
				x: .5,
				y: .5,
				smoothX: .5,
				smoothY: .5,
				vx: 0,
				vy: 0,
				svx: 0,
				svy: 0
			};
			const dprCap = Math.min(window.devicePixelRatio || 1, 1.5);
			width = Math.round(canvas.clientWidth * dprCap);
			height = Math.round(canvas.clientHeight * dprCap);
			canvas.width = width;
			canvas.height = height;
			flowWidth = Math.round(width / 4);
			flowHeight = Math.round(height / 4);
			const initial = new Uint8Array(flowWidth * flowHeight * 4);
			for (let i = 0; i < flowWidth * flowHeight; i += 1) {
				initial[4 * i] = 0;
				initial[4 * i + 1] = 128;
				initial[4 * i + 2] = 128;
				initial[4 * i + 3] = 255;
			}
			let targetA = makeTarget(flowWidth, flowHeight, initial);
			let targetB = makeTarget(flowWidth, flowHeight, initial);
			const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
			const ua = navigator;
			const windows = ua.userAgentData ? ua.userAgentData.platform === "Windows" : navigator.userAgent.includes("Windows");
			const onMouseMove = (event) => {
				const rect = canvas.getBoundingClientRect();
				pointer.x = (event.clientX - rect.left) / rect.width;
				pointer.y = 1 - (event.clientY - rect.top) / rect.height;
			};
			if (!coarse && !windows) window.addEventListener("mousemove", onMouseMove);
			const start = performance.now();
			let raf = 0;
			let previous = 0;
			const step = 1e3 / 30;
			const frame = (now) => {
				raf = requestAnimationFrame(frame);
				if (now - previous < step) return;
				previous = now - (now - previous) % step;
				const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
				const nextWidth = Math.round(canvas.clientWidth * ratio);
				const nextHeight = Math.round(canvas.clientHeight * ratio);
				if (nextWidth !== width || nextHeight !== height) {
					width = nextWidth;
					height = nextHeight;
					canvas.width = width;
					canvas.height = height;
				}
				const p = current;
				const s = pointer;
				s.svx *= .94;
				s.svy *= .94;
				s.smoothX += (s.x - s.smoothX) * .12;
				s.smoothY += (s.y - s.smoothY) * .12;
				s.svx += ((s.x - s.smoothX) * .5 - s.svx) * .15;
				s.svy += ((s.y - s.smoothY) * .5 - s.svy) * .15;
				const read = flip ? targetA : targetB;
				const write = flip ? targetB : targetA;
				flip = !flip;
				gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
				gl.viewport(0, 0, flowWidth, flowHeight);
				gl.useProgram(flowProgram);
				bindQuad(flowProgram);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, read.tex);
				gl.uniform1i(flow.prev, 0);
				gl.uniform2f(flow.mouse, s.smoothX, s.smoothY);
				gl.uniform2f(flow.velocity, s.svx, s.svy);
				gl.uniform1f(flow.brushRadius, p.mouseRadius);
				gl.uniform1f(flow.brushStrength, p.mouseStrength);
				gl.uniform1f(flow.decay, p.decay);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.viewport(0, 0, width, height);
				gl.useProgram(displayProgram);
				bindQuad(displayProgram);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, write.tex);
				gl.uniform1i(display.flowmap, 0);
				const time = (performance.now() - start) * .001 * (p.speed / 100);
				gl.uniform1f(display.time, time);
				gl.uniform1f(display.pixelRatio, window.devicePixelRatio || 1);
				gl.uniform2f(display.resolution, width, height);
				gl.uniform1f(display.scale, p.scale);
				gl.uniform1f(display.rotation, p.rotation / 90);
				gl.uniform2f(display.offset, p.offsetX / 100, p.offsetY / 100);
				const c1 = hexToRgb(p.color1 || "#2E58A4");
				const c2 = hexToRgb(p.color2 || "#D2E2EE");
				const c3 = hexToRgb(p.color3 || "#FFFFFF");
				gl.uniform4f(display.color1, c1[0], c1[1], c1[2], 1);
				gl.uniform4f(display.color2, c2[0], c2[1], c2[2], 1);
				gl.uniform4f(display.color3, c3[0], c3[1], c3[2], 1);
				gl.uniform1f(display.colorCount, 3);
				gl.uniform1f(display.proportion, p.proportion / 100);
				gl.uniform1f(display.softness, p.softness / 100);
				gl.uniform1f(display.shape, 0);
				gl.uniform1f(display.shapeScale, p.shapeScale / 100);
				gl.uniform1f(display.distortion, p.distortion / 100);
				gl.uniform1f(display.swirl, p.swirl / 50);
				gl.uniform1f(display.swirlIterations, p.swirlIterations);
				gl.uniform1f(display.distortBoost, p.distortBoost);
				gl.uniform1f(display.noiseBoost, p.noiseBoost);
				gl.uniform1f(display.swirlBoost, p.swirlBoost);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			};
			const handle = {
				setParams: (next) => {
					current = { ...next };
				},
				stir: (x, y, vx, vy) => {
					pointer.x += (x - pointer.x) * .35;
					pointer.y += (y - pointer.y) * .35;
					pointer.svx += (vx - pointer.svx) * .3;
					pointer.svy += (vy - pointer.svy) * .3;
				},
				dispose: () => {
					cancelAnimationFrame(raf);
					window.removeEventListener("mousemove", onMouseMove);
				}
			};
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				frame(performance.now());
				cancelAnimationFrame(raf);
				return handle;
			}
			raf = requestAnimationFrame(frame);
			return handle;
		}
		//#endregion
		//#region src/client/fluid-tones.ts
		function hsl(h, s, l) {
			const c = (1 - Math.abs(2 * l - 1)) * s;
			const x = c * (1 - Math.abs(h / 60 % 2 - 1));
			const m = l - c / 2;
			let r = 0;
			let g = 0;
			let b = 0;
			if (h < 60) {
				r = c;
				g = x;
			} else if (h < 120) {
				r = x;
				g = c;
			} else if (h < 180) {
				g = c;
				b = x;
			} else if (h < 240) {
				g = x;
				b = c;
			} else if (h < 300) {
				r = x;
				b = c;
			} else {
				r = c;
				b = x;
			}
			const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
			return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
		}
		function fluidToneColors(dark, hue, depth) {
			const h = ((hue + 217) % 360 + 360) % 360;
			const d = Math.min(1, Math.max(0, depth / 100));
			const ramp = (deep, mid, pale) => d < .5 ? deep + (mid - deep) * d / .5 : mid + (pale - mid) * (d - .5) / .5;
			if (dark) return {
				color1: hsl(h, .85, ramp(0, .46, .62)),
				color2: hsl(h, .9, ramp(0, .305, .45)),
				color3: hsl(h, .5, ramp(0, .075, .1))
			};
			return {
				color1: hsl(h, 1, ramp(.27, .45, .9)),
				color2: hsl(h, .55, .86),
				color3: hsl(h, .25, .955)
			};
		}
		//#endregion
		//#region src/client/ambient.ts
		function isDark() {
			return document.body.hasAttribute("data-ds-dark-theme");
		}
		function mountAmbient(options) {
			const disposers = [];
			try {
				ensureAmbientScene();
				const canvas = document.querySelector("[data-dsh-aqua-fluid-canvas]");
				const params = () => ({
					...SITE_FLUID_PARAMS,
					...fluidToneColors(isDark(), options.hue, options.depth)
				});
				let shader = null;
				if (canvas !== null) {
					shader = attachFluidShader(canvas, params());
					disposers.push(() => shader?.dispose());
					disposers.push(attachFluidInteractions({
						main: shader,
						mainCanvas: canvas
					}));
				}
				const live = shader;
				const observer = new MutationObserver(() => live?.setParams(params()));
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				disposers.push(() => observer.disconnect());
			} catch (error) {
				console.warn("aqua: 流体背景层挂载失败，已退化为无背景", error);
				for (const dispose of disposers.reverse()) dispose();
				removeAmbientScene();
				return () => {};
			}
			return () => {
				for (const dispose of disposers.reverse()) dispose();
				removeAmbientScene();
			};
		}
		//#endregion
		//#region src/client/config.ts
		const STORAGE_KEY = "dsh-aqua-glass";
		const DEFAULT_CONFIG = {
			enabled: true,
			blur: 14,
			frost: 1,
			radius: 14,
			hue: 320,
			depth: 25,
			debug: true
		};
		function clamp(value, min, max, fallback) {
			return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
		}
		function readConfig() {
			let raw = null;
			try {
				raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
			} catch {
				return { ...DEFAULT_CONFIG };
			}
			if (raw === null) return { ...DEFAULT_CONFIG };
			try {
				const parsed = JSON.parse(raw);
				if (parsed === null || typeof parsed !== "object") return { ...DEFAULT_CONFIG };
				const candidate = parsed;
				return {
					enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : DEFAULT_CONFIG.enabled,
					blur: clamp(Number(candidate.blur), 0, 60, DEFAULT_CONFIG.blur),
					frost: clamp(Number(candidate.frost), 0, 2, DEFAULT_CONFIG.frost),
					radius: clamp(Number(candidate.radius), 0, 40, DEFAULT_CONFIG.radius),
					hue: clamp(Number(candidate.hue), 0, 360, DEFAULT_CONFIG.hue),
					depth: clamp(Number(candidate.depth), 0, 100, DEFAULT_CONFIG.depth),
					debug: typeof candidate.debug === "boolean" ? candidate.debug : DEFAULT_CONFIG.debug
				};
			} catch {
				return { ...DEFAULT_CONFIG };
			}
		}
		//#endregion
		//#region src/client/seam-stamper.ts
		const STAMP = {
			FRAME: "data-aqua-frame",
			SIDEBAR_ROOT: "data-aqua-sidebar-root",
			SURFACE: "data-aqua-surface",
			TRAJECTORY: "data-aqua-trajectory",
			DETAILS: "data-aqua-details",
			INPUTBAR: "data-aqua-inputbar",
			ADD: "data-aqua-add",
			STATS: "data-aqua-stats",
			WORDMARK: "data-aqua-wordmark"
		};
		const SEAMS = [
			{
				attribute: STAMP.FRAME,
				selector: ":has(> [class*=\"sidebarCol\"])"
			},
			{
				attribute: STAMP.SIDEBAR_ROOT,
				selector: "[class*=\"sidebarCol\"] [class*=\"root\"]",
				first: true
			},
			{
				attribute: STAMP.SURFACE,
				selector: "button[class*=\"newSession\"]"
			},
			{
				attribute: STAMP.TRAJECTORY,
				selector: "[data-conversation-composer-overlay]"
			},
			{
				attribute: STAMP.DETAILS,
				selector: "[class*=\"detailsCol\"] [class*=\"root\"]",
				first: true
			},
			{
				attribute: STAMP.INPUTBAR,
				selector: ":has(> [data-composer-card])"
			},
			{
				attribute: STAMP.ADD,
				selector: "[data-composer-card] [class*=\"add\"]"
			},
			{
				attribute: STAMP.STATS,
				selector: "[data-slot=\"conversation.composer.dock\"] [class*=\"root\"]"
			},
			{
				attribute: STAMP.WORDMARK,
				selector: "[class*=\"sidebarCol\"] [class*=\"brand\"]",
				first: true
			}
		];
		function stamp(seam) {
			if (seam.first === true) {
				const element = document.querySelector(seam.selector);
				if (element !== null && !element.hasAttribute(seam.attribute)) element.setAttribute(seam.attribute, "");
				return;
			}
			for (const element of document.querySelectorAll(seam.selector)) if (!element.hasAttribute(seam.attribute)) element.setAttribute(seam.attribute, "");
		}
		function stampAll() {
			for (const seam of SEAMS) stamp(seam);
		}
		function startSeamStamper() {
			stampAll();
			let frame = 0;
			const observer = new MutationObserver(() => {
				if (frame !== 0) return;
				frame = requestAnimationFrame(() => {
					frame = 0;
					stampAll();
				});
			});
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				if (frame !== 0) cancelAnimationFrame(frame);
			};
		}
		//#endregion
		//#region src/client/seam.ts
		const BODY_ATTRIBUTE = "data-dsh-aqua-glass";
		const SIDEBAR = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
		const CONVERSATION = ":is([data-pane='conversation'], [class*='centerCol'])";
		const SIDEBAR_ROOT = `[${STAMP.SIDEBAR_ROOT}]`;
		const FRAME = `[${STAMP.FRAME}]`;
		const INPUTBAR = `[${STAMP.INPUTBAR}]`;
		const STATS = `[${STAMP.STATS}]`;
		`${STAMP.ADD}`;
		`${STAMP.TRAJECTORY}`;
		const TOPBAR = `${CONVERSATION} header[class*='header']`;
		const COMPOSER_CARD = "[data-composer-card]";
		const NEW_SESSION = `button[class*='newSession']`;
		`${STAMP.WORDMARK}`;
		//#endregion
		//#region src/client/diagnostic.ts
		const PROBES = [
			["框架层", FRAME],
			["侧栏", SIDEBAR],
			["侧栏根", SIDEBAR_ROOT],
			["顶栏", TOPBAR],
			["发送栏", COMPOSER_CARD],
			["输入栏", INPUTBAR],
			["数据行", STATS],
			["新建", NEW_SESSION],
			["流体板", "[data-dsh-aqua-fluid-canvas]"]
		];
		const BADGE_ID = "dsh-aqua-glass-diagnostic";
		function mountDiagnostic(version) {
			const badge = document.createElement("div");
			badge.id = BADGE_ID;
			badge.setAttribute("role", "status");
			Object.assign(badge.style, {
				position: "fixed",
				right: "10px",
				bottom: "10px",
				zIndex: "2147483647",
				pointerEvents: "none",
				padding: "6px 10px",
				borderRadius: "8px",
				font: "12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
				color: "#fff",
				background: "rgb(17 24 39 / 0.92)",
				boxShadow: "0 4px 16px rgb(0 0 0 / 0.35)",
				whiteSpace: "pre"
			});
			const runtimeLines = () => {
				const lines = [];
				const canvas = document.querySelector("[data-dsh-aqua-fluid-canvas]");
				if (canvas !== null) {
					let gl = "n/a";
					try {
						gl = canvas.getContext("webgl2") === null ? "no-gl" : "gl-ok";
					} catch {
						gl = "gl-throw";
					}
					lines.push(`canvas ${canvas.clientWidth}x${canvas.clientHeight} buf ${canvas.width}x${canvas.height} ${gl}`);
				}
				const ambient = document.querySelector("[data-dsh-aqua-ambient]");
				if (ambient !== null) try {
					const style = getComputedStyle(ambient);
					lines.push(`amb z=${style.zIndex} pos=${style.position} op=${style.opacity}`);
				} catch {
					lines.push("amb style n/a");
				}
				try {
					const bodyBg = getComputedStyle(document.body).backgroundColor;
					const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
					lines.push(`body-bg ${bodyBg} html-bg ${htmlBg}`);
				} catch {
					lines.push("bg n/a");
				}
				try {
					const fill = getComputedStyle(document.body).getPropertyValue("--dsw-specific-sidebar-fill").trim();
					lines.push(`标题栏色 ${fill || "(未覆盖)"}`);
				} catch {
					lines.push("标题栏色 n/a");
				}
				if (typeof document.elementFromPoint === "function") try {
					const probe = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
					if (probe !== null) lines.push(`mid <${probe.tagName.toLowerCase()}> bg ${getComputedStyle(probe).backgroundColor}`);
				} catch {
					lines.push("mid n/a");
				}
				else lines.push("mid n/a (no elementFromPoint)");
				return lines;
			};
			const render = () => {
				const probes = PROBES.map(([label, selector]) => {
					const count = document.querySelectorAll(selector).length;
					return {
						label,
						count,
						ok: count > 0
					};
				});
				const runtime = runtimeLines();
				if (probes.every((probe) => probe.ok) && !runtime.some((line) => line.includes("no-gl") || line.includes("gl-throw") || /buf 0x/.test(line))) {
					badge.textContent = `Aqua ${version} ✓`;
					return;
				}
				const lines = probes.map((probe) => `${probe.ok ? "✓" : "✗"} ${probe.label} ${probe.count}`);
				badge.textContent = `Aqua ${version} — 有异常\n${lines.join("\n")}\n${runtime.join("\n")}`;
			};
			render();
			document.body.appendChild(badge);
			const timer = setInterval(render, 1e3);
			return () => {
				clearInterval(timer);
				badge.remove();
			};
		}
		//#endregion
		//#region src/client/dom-lease.ts
		const registry = new WeakMap();
		function createAttributeLease(element, attribute, value = "") {
			const owner = Symbol(attribute);
			let active = false;
			return {
				acquire() {
					if (active) return;
					let attributes = registry.get(element);
					if (attributes === void 0) {
						attributes = new Map();
						registry.set(element, attributes);
					}
					let state = attributes.get(attribute);
					if (state === void 0) {
						state = {
							originalValue: element.getAttribute(attribute),
							owners: new Set(),
							value
						};
						attributes.set(attribute, state);
					}
					state.owners.add(owner);
					active = true;
					element.setAttribute(attribute, state.value);
				},
				release() {
					if (!active) return;
					active = false;
					const state = registry.get(element)?.get(attribute);
					if (state === void 0 || !state.owners.delete(owner)) return;
					if (state.owners.size > 0) {
						element.setAttribute(attribute, state.value);
						return;
					}
					if (element.getAttribute(attribute) === state.value) {
						if (state.originalValue === null) element.removeAttribute(attribute);
						else element.setAttribute(attribute, state.originalValue);
					}
					registry.get(element)?.delete(attribute);
				}
			};
		}
		//#endregion
		//#region \0dsh-css:src/client/material.module.css.mjs
		const css$1 = "body[data-dsh-aqua-glass]{--aqua-blur:14px;--aqua-frost:1;--aqua-radius:14px;--aqua-glass:color-mix(in srgb, #fff calc(42% * var(--aqua-frost)), transparent);--aqua-surface:color-mix(in srgb, #fff calc(62% * var(--aqua-frost)), transparent);--aqua-surface-hover:color-mix(in srgb, #fff calc(74% * var(--aqua-frost)), transparent);--aqua-line:#132d5342;--aqua-line-dark:#94b4dc52;--aqua-shadow:0 10px 34px #132d5329;--aqua-shadow-dark:0 8px 30px #02060e52;--aqua-inset:inset 0 1px 0 #ffffff80;--aqua-inset-dark:inset 0 1px 0 #ffffff12;--aqua-filter:blur(var(--aqua-blur))}body[data-dsh-aqua-glass][data-ds-dark-theme]{--aqua-glass:color-mix(in srgb, #22262f calc(50% * var(--aqua-frost)), transparent);--aqua-surface:color-mix(in srgb, #2a2e38 calc(62% * var(--aqua-frost)), transparent);--aqua-surface-hover:color-mix(in srgb, #363a46 calc(70% * var(--aqua-frost)), transparent);--aqua-line:var(--aqua-line-dark);--aqua-shadow:var(--aqua-shadow-dark);--aqua-inset:var(--aqua-inset-dark)}body[data-dsh-aqua-glass]{--dsw-specific-sidebar-fill:#cfe6e2}body[data-dsh-aqua-glass][data-ds-dark-theme]{--dsw-specific-sidebar-fill:#0f1c1f}body[data-dsh-aqua-glass]{background:var(--dsw-alias-bg-base)}body[data-dsh-aqua-glass] [data-aqua-frame],body[data-dsh-aqua-glass] [id=root],body[data-dsh-aqua-glass] [data-phase],body[data-dsh-aqua-glass] [data-aqua-details],body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]){background:0 0!important}body[data-dsh-aqua-glass] [data-phase] [class*=composerSeat][class*=composerSeat]{background:0 0}body[data-dsh-aqua-glass] :is([data-pane=sidebar],[class*=sidebarCol]){z-index:9;box-shadow:var(--aqua-inset), var(--aqua-shadow);background:0 0;border-radius:20px;margin:12px;padding:10px 12px 14px;position:relative;overflow:hidden}body[data-dsh-aqua-glass] :is([data-pane=sidebar],[class*=sidebarCol]):before{content:\"\";z-index:-1;border:1px solid var(--aqua-line);border-radius:inherit;background:var(--aqua-glass);backdrop-filter:var(--aqua-filter);pointer-events:none;border-right:1px solid #96bef5a6;position:absolute;inset:0}body[data-dsh-aqua-glass] [data-aqua-sidebar-root]{background:0 0}body[data-dsh-aqua-glass] [data-aqua-frame]:not([data-sidebar-collapsed]) [data-aqua-sidebar-root]{width:100%!important}body[data-dsh-aqua-glass] [data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]){border-radius:16px;margin:12px -12px 12px 12px;padding:0;transition:margin .15s ease-in-out,border-radius .15s ease-in-out}body[data-dsh-aqua-glass] [data-sidebar-collapsed] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{margin-left:28px}body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{border:1px solid var(--aqua-line);background:var(--aqua-glass);box-shadow:var(--aqua-inset), var(--aqua-shadow);backdrop-filter:var(--aqua-filter);border-bottom-color:#0000;border-radius:20px;margin:12px 16px 0;padding:10px 16px 8px}body[data-dsh-aqua-glass][data-ds-dark-theme] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{border-color:var(--aqua-line-dark);box-shadow:var(--aqua-inset-dark), var(--aqua-shadow-dark);border-bottom-color:#0000}body[data-dsh-aqua-glass] [data-composer-card]{z-index:8;background:var(--aqua-glass);border:1px solid var(--aqua-line);box-shadow:var(--aqua-inset), 0 10px 36px #132d5329;backdrop-filter:var(--aqua-filter);border-radius:24px;position:relative}body[data-dsh-aqua-glass][data-ds-dark-theme] [data-composer-card]{border-color:var(--aqua-line-dark);box-shadow:var(--aqua-inset-dark), var(--aqua-shadow-dark)}body[data-dsh-aqua-glass] [data-aqua-stats]{background:0 0}body[data-dsh-aqua-glass] [data-phase=hero] [data-composer-card]{box-shadow:var(--aqua-inset), 0 18px 52px #132d532e}body[data-dsh-aqua-glass] [data-phase=active] [data-composer-card]{box-shadow:var(--aqua-inset), 0 8px 28px #132d5324}body[data-dsh-aqua-glass] button[class*=newSession]{background:var(--aqua-surface);border-radius:var(--aqua-radius);backdrop-filter:blur(var(--aqua-blur));border:1px solid #132d5329;box-shadow:inset 0 1px #ffffff73}body[data-dsh-aqua-glass] button[class*=newSession]:hover:not(:disabled){background:var(--aqua-surface-hover)}body[data-dsh-aqua-glass][data-ds-dark-theme] button[class*=newSession]{border-color:#94b4dc33;box-shadow:inset 0 1px #ffffff14}body[data-dsh-aqua-glass] [data-aqua-wordmark]{background:0 0}body[data-dsh-aqua-glass] [data-slot=sidebar\\.settings]>:is(button,[role=button]){border-radius:10px;transition:background .16s}body[data-dsh-aqua-glass] [data-aqua-trajectory]{border:1px solid var(--aqua-line);background:var(--aqua-glass);box-shadow:var(--aqua-inset), var(--aqua-shadow);backdrop-filter:var(--aqua-filter);border-radius:20px;margin:8px 16px 12px;overflow:hidden}body[data-dsh-aqua-glass] [data-aqua-trajectory] [role=toolbar],body[data-dsh-aqua-glass] [data-aqua-trajectory] section[aria-label=Trajectory\\ timeline]{background:0 0}";
		const tagId$1 = "dsh-aqua-glass/material.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-aqua-glass";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region \0dsh-css:src/client/ambient.module.css.mjs
		const css = "body[data-dsh-aqua-glass] [data-dsh-aqua-ambient]{z-index:-1;pointer-events:none;background:radial-gradient(760px 420px at 50% -8%,#a0c8ff42,#0000 70%),linear-gradient(#9cc1e738 0%,#9cc1e700 38%),radial-gradient(900px 420px at 50% 108%,#9cc1e724,#0000 70%);position:fixed;inset:0;overflow:hidden}body[data-dsh-aqua-glass][data-ds-dark-theme] [data-dsh-aqua-ambient]{background:radial-gradient(760px 420px at 50% -8%,#6ea5ff21,#0000 70%),linear-gradient(#5e8fe021 0%,#5e8fe000 46%),radial-gradient(900px 420px at 50% 108%,#5e8fe017,#0000 70%)}body[data-dsh-aqua-glass] [data-dsh-aqua-ambient]:after{content:\"\";background-image:linear-gradient(rgb(255 255 255/var(--aqua-brightness-white,0)), rgb(255 255 255/var(--aqua-brightness-white,0))), linear-gradient(rgb(0 0 0/var(--aqua-brightness-black,0)), rgb(0 0 0/var(--aqua-brightness-black,0)));position:absolute;inset:0}@media (prefers-reduced-motion:no-preference){body[data-dsh-aqua-glass] [data-dsh-aqua-ambient]{animation:9s ease-in-out infinite alternate _7KkV2W_dsh-aqua-breathe}}@keyframes _7KkV2W_dsh-aqua-breathe{0%{opacity:.86}to{opacity:1}}body[data-dsh-aqua-glass] [data-dsh-aqua-fluid-canvas]{width:100%;height:100%;position:absolute;inset:0}body[data-dsh-aqua-glass] [data-dsh-aqua-wallpaper]{z-index:-1;position:fixed;inset:0;overflow:hidden}body[data-dsh-aqua-glass] [data-dsh-aqua-wallpaper-img]{object-fit:cover;width:100%;height:100%;filter:blur(var(--aqua-wallpaper-blur,0px))}body[data-dsh-aqua-glass] [data-dsh-aqua-wallpaper]:after{content:\"\";background:rgb(255 255 255/var(--aqua-wallpaper-frost,0));pointer-events:none;position:absolute;inset:0}body[data-dsh-aqua-glass][data-ds-dark-theme] [data-dsh-aqua-wallpaper]:after{background:rgb(12 18 27/var(--aqua-wallpaper-frost,0))}body[data-dsh-aqua-glass] [data-dsh-aqua-ambient][data-background=wallpaper] [data-dsh-aqua-fluid-canvas],body[data-dsh-aqua-glass] [data-dsh-aqua-wallpaper][data-background=fluid]{display:none}body[data-dsh-aqua-glass] [data-aqua-critter]{color:#7ea4df;opacity:.22;position:absolute}body[data-dsh-aqua-glass] [data-aqua-critter=fish]{animation:12s ease-in-out infinite _7KkV2W_dsh-aqua-fish-swim}body[data-dsh-aqua-glass] [data-aqua-critter=fish-left]{animation:16s ease-in-out infinite _7KkV2W_dsh-aqua-fish-swim-left}body[data-dsh-aqua-glass] [data-aqua-critter=bubble]{color:#a9c6ef;opacity:0;animation:9s ease-in infinite _7KkV2W_dsh-aqua-bubble-rise}body[data-dsh-aqua-glass] [data-aqua-critter=plankton]{color:#7ea4df;animation:5s ease-in-out infinite _7KkV2W_dsh-aqua-plankton}@keyframes _7KkV2W_dsh-aqua-fish-swim{0%{transform:translate(0,0)rotate(-5deg)}30%{transform:translate(40px,-15px)rotate(4deg)}70%{transform:translate(52px,-18px)rotate(3deg)}to{transform:translate(0,0)rotate(-5deg)}}@keyframes _7KkV2W_dsh-aqua-fish-swim-left{0%{transform:translate(0,0)scaleX(-1)rotate(-5deg)}30%{transform:translate(-34px,-12px)scaleX(-1)rotate(4deg)}70%{transform:translate(-44px,-15px)scaleX(-1)rotate(3deg)}to{transform:translate(0,0)scaleX(-1)rotate(-5deg)}}@keyframes _7KkV2W_dsh-aqua-bubble-rise{0%{opacity:0;transform:translate(0,0)}10%{opacity:.5}to{opacity:0;transform:translate(8px,-150px)}}@keyframes _7KkV2W_dsh-aqua-plankton{0%,to{opacity:.1}50%{opacity:.38}}";
		const tagId = "dsh-aqua-glass/ambient.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-aqua-glass";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		const VERSION = "0.1.0";
		const TOKEN = {
			blur: "--aqua-blur",
			frost: "--aqua-frost",
			radius: "--aqua-radius"
		};
		function writeTokens(config) {
			const style = document.documentElement.style;
			style.setProperty(TOKEN.blur, `${config.blur}px`);
			style.setProperty(TOKEN.frost, String(config.frost));
			style.setProperty(TOKEN.radius, `${config.radius}px`);
		}
		function clearTokens() {
			const style = document.documentElement.style;
			for (const name of Object.values(TOKEN)) style.removeProperty(name);
		}
		function apply(ctx) {
			ctx.effect(() => {
				const config = readConfig();
				if (!config.enabled) return () => {};
				let lease = null;
				let unmountDiagnostic = null;
				let unmountAmbient = null;
				let stopStamper = null;
				const mount = () => {
					if (lease !== null) return;
					const body = document.body;
					if (body === null) return;
					writeTokens(config);
					lease = createAttributeLease(body, BODY_ATTRIBUTE);
					lease.acquire();
					stopStamper = startSeamStamper();
					unmountAmbient = mountAmbient({
						hue: config.hue,
						depth: config.depth
					});
					if (config.debug) try {
						unmountDiagnostic = mountDiagnostic(VERSION);
					} catch (error) {
						console.warn("aqua: 诊断角标挂载失败，已跳过", error);
					}
				};
				mount();
				const onReady = () => mount();
				if (lease === null) document.addEventListener("DOMContentLoaded", onReady, { once: true });
				return () => {
					document.removeEventListener("DOMContentLoaded", onReady);
					unmountDiagnostic?.();
					unmountDiagnostic = null;
					unmountAmbient?.();
					unmountAmbient = null;
					stopStamper?.();
					stopStamper = null;
					lease?.release();
					lease = null;
					clearTokens();
				};
			}, "aqua: glass material");
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map