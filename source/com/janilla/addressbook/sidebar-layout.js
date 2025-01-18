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

export default class SidebarLayout extends FlexibleElement {

	static get observedAttributes() {
		return ["data-loading", "data-path", "slot"];
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
		this.shadowRoot.addEventListener("input", this.handleInput);
	}

	disconnectedCallback() {
		// console.log("SidebarLayout.disconnectedCallback");
		this.shadowRoot.removeEventListener("submit", this.handleSubmit);
		this.shadowRoot.removeEventListener("input", this.handleInput);
	}

	handleInput = async event => {
		// console.log("SidebarLayout.handleInput", event);
		const el = event.target.closest("#q");
		if (!el)
			return;
		const q1 = new URLSearchParams(location.search).get("q");
		const q2 = el.value;
		const u = new URL(location.href);
		u.searchParams.set("q", q2);
		if (!q1)
			history.pushState(null, "", u.pathname + u.search);
		else
			history.replaceState(null, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handleSubmit = async event => {
		// console.log("SidebarLayout.handleSubmit", event);
		const el = event.target.closest("#sidebar");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		const c = await (await fetch("/api/contacts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({})
		})).json();
		history.pushState({ contact: c }, "", `/contacts/${c.id}/edit`);
		dispatchEvent(new CustomEvent("popstate"));
	}

	async updateDisplay() {
		// console.log("SidebarLayout.updateDisplay");
		const s = this.closest("app-layout").state;
		if (this.dataset.loading != null) {
			const u = new URL("/api/contacts", location.href);
			const q = new URLSearchParams(location.search).get("q");
			if (q)
				u.searchParams.append("query", q);
			s.contacts = await (await fetch(u)).json();
			history.replaceState(s, "");
			dispatchEvent(new CustomEvent("popstate"));
			return;
		} else if (this.slot === "content") {
			const lp = location.pathname;
			const m = lp.match(/\/contacts\/(\d+)(\/edit)?/) ?? [];
			const o = {
				homePage: {
					$template: "home-page",
					slot: lp === "/" ? "content" : null
				},
				contactPage: (() => {
					const a = m[1] && !m[2];
					return {
						$template: "contact-page",
						slot: a ? (s.contact ? "content" : "new-content") : null,
						loading: a && m[1] != s.contact?.id,
						id: a ? m[1] : null
					};
				})(),
				editContact: (() => {
					const a = m[1] && m[2];
					return {
						$template: "edit-contact",
						slot: a ? (s.contact ? "content" : "new-content") : null,
						loading: a && m[1] != s.contact?.id,
						id: a ? m[1] : null
					};
				})()
			};
			this.shadowRoot.appendChild(this.interpolateDom({
				$template: "shadow",
				search: {
					input: {
						class: this.dataset.loading != null ? "loading" : null,
						value: new URLSearchParams(location.search).get("q")
					},
					spinner: { hidden: this.dataset.loading == null }
				},
				contacts: {
					$template: s.contacts.length ? "contacts" : "no-contacts",
					items: s.contacts.map(x => ({
						$template: "item",
						...x,
						class: x.id === s.contact?.id ? "active"
							: `${location.pathname}/`.startsWith(`/contacts/${x.id}/`) ? "pending" : null,
						name: {
							$template: x.full ? "name" : "no-name",
							...x
						},
						favorite: x.favorite ? { $template: "favorite" } : null
					}))
				},
				detail: { class: Object.values(o).some(x => x.loading) ? "loading" : null }
			}));
			this.appendChild(this.interpolateDom({
				$template: "",
				...o
			}));
		}
	}
}
