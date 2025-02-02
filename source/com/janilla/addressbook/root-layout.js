/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
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
import { UpdatableHTMLElement } from "./updatable-html-element.js";

export default class RootLayout extends UpdatableHTMLElement {

	static get templateName() {
		return "root-layout";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("RootLayout.connectedCallback");
		addEventListener("popstate", this.handlePopState);
		this.addEventListener("click", this.handleClick);
		dispatchEvent(new CustomEvent("popstate"));
	}

	disconnectedCallback() {
		// console.log("RootLayout.disconnectedCallback");
		removeEventListener("popstate", this.handlePopState);
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("RootLayout.handleClick", event);
		const a = event.composedPath().find(x => x.tagName?.toLowerCase() === "a");
		if (!a?.href)
			return;
		event.preventDefault();
		const u = new URL(a.href);
		history.pushState(this.state, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("RootLayout.handlePopState", event);
		this.state = event.state ?? history.state ?? {};
		this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("RootLayout.updateDisplay");
		this.shadowRoot.appendChild(this.interpolateDom({ $template: "shadow" }));
		const p = location.pathname;
		const s = this.state;
		if (s.contacts)
			s.loaded ??= true;
		const o = {
			sidebarLayout: (() => {
				const a = p === "/" || p.startsWith("/contacts/");
				return {
					$template: "sidebar-layout",
					slot: s.loaded && a ? "content" : null,
					loading: a && !s.contacts,
					path: a ? p : null,
					query: a ? new URLSearchParams(location.search).get("q") : null
				};
			})(),
			aboutPage: {
				$template: "about-page",
				slot: p === "/about" ? "content" : null
			}
		};
		this.appendChild(this.interpolateDom({
			$template: "",
			loadingSplash: {
				$template: "loading-splash",
				slot: s.loaded || Object.values(o).some(x => x.slot === "content") ? null : "content"
			},
			...o
		}));
	}
}
