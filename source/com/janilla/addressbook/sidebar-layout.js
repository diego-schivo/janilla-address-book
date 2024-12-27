/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
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
import { SlottableElement } from "./slottable-element.js";

export default class SidebarLayout extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "sidebar-layout";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("SidebarLayout.connectedCallback");
		super.connectedCallback();
		this.shadowRoot.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("SidebarLayout.disconnectedCallback");
		this.shadowRoot.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		console.log("SidebarLayout.handleSubmit", event);
		const el = event.target.closest("#sidebar");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		await fetch("/api/contacts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({})
		});
		this.state = null;
		this.requestUpdate();
	}

	async computeState() {
		// console.log("SidebarLayout.computeState");
		const csc = this.computeStateCalled;
		if (!this.computeStateCalled) {
			this.computeStateCalled = true;
		}
		try {
			if (!csc)
				this.dispatchEvent(new CustomEvent("load-start", { bubbles: true }));
			const u = new URL("/api/contacts", location.href);
			const q = this.dataset.query;
			if (q)
				u.searchParams.append("query", q);
			const cc = await (await fetch(u)).json();
			const s = { contacts: cc };
			history.replaceState(s, "");
			return s;
		} finally {
			if (!csc)
				this.dispatchEvent(new CustomEvent("load-end", { bubbles: true }));
		}
	}

	renderState() {
		// console.log("SidebarLayout.renderState");
		const cc = this.state?.contacts;
		if (!cc)
			return;
		this.shadowRoot.appendChild(this.interpolateDom({
			$template: "",
			contacts: {
				$template: cc.length ? "contacts" : "no-contacts",
				items: cc.map(x => ({
					$template: "item",
					...x,
					name: {
						$template: x.first || x.last ? "name" : "no-name",
						...x
					}
				}))
			}
		}));
	}
}
