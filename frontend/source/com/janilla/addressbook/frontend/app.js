/*
 * MIT License
 *
 * Copyright (c) React Training LLC 2015-2019
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2023
 * Copyright (c) Diego Schivo 2024-2026
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import WebComponent from "./web-component.js";

export default class App extends WebComponent {

	static get templateNames() {
		return ["app"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		const el = this.children.length === 1 ? this.firstElementChild : null;
		if (el?.matches('[type="application/json"]')) {
			this.popState = JSON.parse(el.text);
			history.replaceState(this.popState, "");
			el.remove();
		}
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		addEventListener("popstate", this.handlePopState);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
		removeEventListener("popstate", this.handlePopState);
	}

	async updateDisplay() {
		const hs = history.state;
		const o = {
			$template: "",
			sidebar: (() => {
				const h = location.pathname === "/";
				const c = location.pathname.match(/\/contacts\/([^/]+)(\/edit)?/);
				const sl = (h || c) ? this.querySelector("sidebar-layout") : null;
				const ce = c && !c[2] ? this.querySelector("contact-element") : null;
				const ec = c && c[2] ? this.querySelector("edit-contact") : null;
				return {
					$template: "sidebar",
					slot: (h || c) ? (hs?.contacts ? "content" : "new-content") : null,
					href: location.pathname + location.search,
					loading: (h || c) && !(sl?.state ?? hs)?.contacts,
					pending: c && c[1] != ((ce ?? ec)?.state?.contact ?? hs?.contact)?.id
				};
			})(),
			about: {
				$template: "about",
				slot: location.pathname === "/about" ? "content" : null
			}
		};
		o.loading = {
			$template: "loading",
			slot: ["sidebar", "about"].every(x => o[x].slot !== "content") ? "content" : null
		};
		const df = this.interpolateDom(o);
		this.shadowRoot.append(...df.querySelectorAll("link, slot"));
		this.appendChild(df);
	}

	handleClick = event => {
		const a = event.composedPath().find(x => x instanceof Element && x.matches("a"));
		if (a?.href) {
			event.preventDefault();
			const u = new URL(a.href);
			const hs = history.state ?? {};
			const h = location.pathname === "/";
			const c = location.pathname.match(/\/contacts\/([^/]+)(\/edit)?/);
			if (!c) {
				delete hs.contact;
				if (!h)
					delete hs.contacts;
			}
			history.pushState(hs, "", u.pathname + u.search);
			dispatchEvent(new CustomEvent("popstate"));
		}
	}

	handlePopState = event => {
		this.popState = event.state;
		this.requestDisplay();
	}
}
