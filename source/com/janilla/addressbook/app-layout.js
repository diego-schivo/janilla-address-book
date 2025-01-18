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
import { FlexibleElement } from "./flexible-element.js";

export default class AppLayout extends FlexibleElement {

	static get templateName() {
		return "app-layout";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	get state() {
		return this.janillas.state ??= {};
	}

	connectedCallback() {
		// console.log("AppLayout.connectedCallback");
		super.connectedCallback();
		addEventListener("popstate", this.handlePopState);
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("AppLayout.disconnectedCallback");
		removeEventListener("popstate", this.handlePopState);
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("AppLayout.handleClick", event);
		const a = event.composedPath().find(x => x.tagName?.toLowerCase() === "a");
		if (!a?.href)
			return;
		event.preventDefault();
		const u = new URL(a.href);
		history.pushState(this.state, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("AppLayout.handlePopState", event);
		if (event.state)
			this.janillas.state = event.state;
		this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("AppLayout.updateDisplay");
		this.shadowRoot.appendChild(this.interpolateDom({ $template: "shadow" }));
		const lp = location.pathname;
		const s = this.state;
		if (s.contacts)
			s.loaded ??= true;
		const o = {
			sidebarLayout: (() => {
				const a = lp === "/" || lp.startsWith("/contacts/");
				return {
					$template: "sidebar-layout",
					slot: s.loaded && a ? "content" : null,
					loading: a && !s.contacts,
					path: a ? lp : null,
					query: a ? new URLSearchParams(location.search).get("q") : null
				};
			})(),
			aboutPage: {
				$template: "about-page",
				slot: lp === "/about" ? "content" : null
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
