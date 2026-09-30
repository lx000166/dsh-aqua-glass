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
			radius: 14
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
					radius: clamp(Number(candidate.radius), 0, 40, DEFAULT_CONFIG.radius)
				};
			} catch {
				return { ...DEFAULT_CONFIG };
			}
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
		//#region src/client/seam.ts
		const BODY_ATTRIBUTE = "data-dsh-aqua-glass";
		//#endregion
		//#region \0dsh-css:src/client/material.module.css.mjs
		const css = "body[data-dsh-aqua-glass]{--aqua-blur:18px;--aqua-frost:.55;--aqua-radius:14px;--aqua-line:#ffffff80;--aqua-glass:rgb(255 255 255/var(--aqua-frost));--aqua-glass-strong:#ffffffb8;--aqua-shadow:0 8px 32px #0f172a1a;--aqua-filter:blur(var(--aqua-blur)) saturate(1.6)}body[data-dsh-aqua-glass][data-ds-dark-theme]{--aqua-line:#ffffff17;--aqua-glass:rgb(17 21 28/var(--aqua-frost));--aqua-glass-strong:#11151cb8;--aqua-shadow:0 8px 32px #00000073}body[data-dsh-aqua-glass] [id=root],body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]){background:0 0!important}body[data-dsh-aqua-glass] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{-webkit-backdrop-filter:var(--aqua-filter);border-bottom:1px solid var(--aqua-line);background:var(--aqua-glass-strong)!important}body[data-dsh-aqua-glass] :is([data-pane=sidebar],[class*=sidebarCol])>div{-webkit-backdrop-filter:var(--aqua-filter);border-right:1px solid var(--aqua-line);background:var(--aqua-glass)!important}body[data-dsh-aqua-glass] [class*=logoRow]{background:0 0!important}body[data-dsh-aqua-glass] [data-slot=sidebar\\.settings]>:is(button,[role=button]){border-radius:var(--aqua-radius);transition:background .16s}body[data-dsh-aqua-glass] [data-composer-card]{-webkit-backdrop-filter:var(--aqua-filter);border:1px solid var(--aqua-line);border-radius:var(--aqua-radius);box-shadow:var(--aqua-shadow);background:var(--aqua-glass-strong)!important}body[data-dsh-aqua-glass] [data-phase=hero] [data-composer-card]{background:var(--aqua-glass)!important}body[data-dsh-aqua-glass] [data-phase=active] [data-composer-card]{border-radius:calc(var(--aqua-radius) + 4px)}body[data-dsh-aqua-glass] button[class*=newSession]{-webkit-backdrop-filter:blur(calc(var(--aqua-blur) * .6));border:1px solid var(--aqua-line);border-radius:var(--aqua-radius);box-shadow:var(--aqua-shadow);background:var(--aqua-glass)!important}";
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
				const mount = () => {
					if (lease !== null) return;
					const body = document.body;
					if (body === null) return;
					writeTokens(config);
					lease = createAttributeLease(body, BODY_ATTRIBUTE);
					lease.acquire();
				};
				mount();
				const onReady = () => mount();
				if (lease === null) document.addEventListener("DOMContentLoaded", onReady, { once: true });
				return () => {
					document.removeEventListener("DOMContentLoaded", onReady);
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