window.__ModuleLoader__.load({
	id: "dsh-aqua-glass",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/config.ts
		const STORAGE_KEY = "dsh-aqua-glass";
		const DEFAULT_CONFIG = {
			enabled: true,
			blur: 18,
			frost: .55,
			radius: 14,
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
					frost: clamp(Number(candidate.frost), 0, 1, DEFAULT_CONFIG.frost),
					radius: clamp(Number(candidate.radius), 0, 40, DEFAULT_CONFIG.radius),
					debug: typeof candidate.debug === "boolean" ? candidate.debug : DEFAULT_CONFIG.debug
				};
			} catch {
				return { ...DEFAULT_CONFIG };
			}
		}
		//#endregion
		//#region src/client/seam.ts
		const BODY_ATTRIBUTE = "data-dsh-aqua-glass";
		const SIDEBAR = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
		//#endregion
		//#region src/client/diagnostic.ts
		const PROBES = [
			["侧栏", SIDEBAR],
			["侧栏面", `${SIDEBAR} > div`],
			["顶栏", `:is([data-pane='conversation'], [class*='centerCol']) header[class*='header']`],
			["发送栏", "[data-composer-card]"],
			["新建", `button[class*='newSession']`]
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
			const render = () => {
				const lines = PROBES.map(([label, selector]) => {
					const count = document.querySelectorAll(selector).length;
					return `${count > 0 ? "✓" : "✗"} ${label} ${count}`;
				});
				badge.textContent = `Aqua ${version}\n${lines.join("\n")}`;
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
		const css = "body[data-dsh-aqua-glass]{--aqua-blur:18px;--aqua-frost:.55;--aqua-radius:14px;--aqua-line:#40609647;--aqua-glass:rgb(214 231 255/var(--aqua-frost));--aqua-glass-strong:#e2efffc7;--aqua-shadow:0 8px 32px #18305c29;--aqua-filter:blur(var(--aqua-blur)) saturate(1.6);--aqua-backdrop:radial-gradient(120% 80% at 8% 4%, #b2d4ffd9 0%, #b2d4ff00 58%), radial-gradient(110% 75% at 94% 96%, #cec4ffcc 0%, #cec4ff00 62%), linear-gradient(155deg, #eef4fd 0%, #e6eefb 48%, #eceaf9 100%)}body[data-dsh-aqua-glass][data-ds-dark-theme]{--aqua-line:#96b6eb38;--aqua-glass:rgb(22 30 46/var(--aqua-frost));--aqua-glass-strong:#1c263ad1;--aqua-shadow:0 8px 32px #00000080;--aqua-backdrop:radial-gradient(120% 80% at 8% 4%, #264074e6 0%, #26407400 58%), radial-gradient(110% 75% at 94% 96%, #3a2c60d9 0%, #3a2c6000 62%), linear-gradient(155deg, #0d1420 0%, #111a2b 48%, #161428 100%)}body[data-dsh-aqua-glass]{background:var(--aqua-backdrop)!important;background-attachment:fixed!important}body[data-dsh-aqua-glass] [id=root],body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]){background:0 0!important}body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{-webkit-backdrop-filter:var(--aqua-filter);border-bottom:1px solid var(--aqua-line);background:var(--aqua-glass-strong)!important}body[data-dsh-aqua-glass] :is([data-pane=sidebar],[class*=sidebarCol])>div{-webkit-backdrop-filter:var(--aqua-filter);border-right:1px solid var(--aqua-line);background:var(--aqua-glass)!important}body[data-dsh-aqua-glass] [class*=logoRow]{background:0 0!important}body[data-dsh-aqua-glass] [data-slot=sidebar\\.settings]>:is(button,[role=button]){border-radius:var(--aqua-radius);transition:background .16s}body[data-dsh-aqua-glass] [data-composer-card]{-webkit-backdrop-filter:var(--aqua-filter);border:1px solid var(--aqua-line);border-radius:var(--aqua-radius);box-shadow:var(--aqua-shadow);background:var(--aqua-glass-strong)!important}body[data-dsh-aqua-glass] [data-phase=hero] [data-composer-card]{background:var(--aqua-glass)!important}body[data-dsh-aqua-glass] [data-phase=active] [data-composer-card]{border-radius:calc(var(--aqua-radius) + 4px)}body[data-dsh-aqua-glass] button[class*=newSession]{-webkit-backdrop-filter:blur(calc(var(--aqua-blur) * .6));border:1px solid var(--aqua-line);border-radius:var(--aqua-radius);box-shadow:var(--aqua-shadow);background:var(--aqua-glass)!important}";
		const tagId = "dsh-aqua-glass/material.module.css";
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
				const mount = () => {
					if (lease !== null) return;
					const body = document.body;
					if (body === null) return;
					writeTokens(config);
					lease = createAttributeLease(body, BODY_ATTRIBUTE);
					lease.acquire();
					if (config.debug) unmountDiagnostic = mountDiagnostic(VERSION);
				};
				mount();
				const onReady = () => mount();
				if (lease === null) document.addEventListener("DOMContentLoaded", onReady, { once: true });
				return () => {
					document.removeEventListener("DOMContentLoaded", onReady);
					unmountDiagnostic?.();
					unmountDiagnostic = null;
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