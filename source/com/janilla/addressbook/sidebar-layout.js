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
		return ["data-loading", "data-path", "data-query", "slot"];
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
		const s = this.closest("root-layout").state;
		delete s.contacts
		if (!q1)
			history.pushState(s, "", u.pathname + u.search);
		else
			history.replaceState(s, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
		// this.requestUpdate();
	}

	handleSubmit = async event => {
		// console.log("SidebarLayout.handleSubmit", event);
		const el = event.target.closest("#sidebar");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		const s = this.closest("root-layout").state;
		s.contact = await (await fetch("/api/contacts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({})
		})).json();
		delete s.contacts;
		history.pushState(s, "", `/contacts/${s.contact.id}/edit`);
		dispatchEvent(new CustomEvent("popstate"));
	}

	async updateDisplay() {
		// console.log("SidebarLayout.updateDisplay");
		const s = this.closest("root-layout").state;
		if (this.slot === "content") {
			const m = this.dataset.path.match(/\/contacts\/(\d+)(\/edit)?/) ?? [];
			const o1 = {
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
			const o2 = {
				homePage: {
					$template: "home-page",
					slot: Object.values(o1).some(x => x.slot === "content") ? null : "content"
				},
				...o1
			};
			this.shadowRoot.appendChild(this.interpolateDom({
				$template: "shadow",
				search: {
					input: {
						class: this.dataset.query && this.dataset.loading != null ? "loading" : null,
						value: this.dataset.query
					},
					spinner: { hidden: !this.dataset.query || this.dataset.loading == null }
				},
				contacts: {
					$template: s.contacts?.length ? "contacts" : "no-contacts",
					items: s.contacts?.map(x => ({
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
				detail: { class: Object.values(o2).some(x => x.loading) ? "loading" : null }
			}));
			this.appendChild(this.interpolateDom({
				$template: "",
				...o2
			}));
		}
		if (this.dataset.loading != null) {
			const u = new URL("/api/contacts", location.href);
			if (this.dataset.query)
				u.searchParams.append("query", this.dataset.query);
			s.contacts = await (await fetch(u)).json();
			history.replaceState(s, "");
			dispatchEvent(new CustomEvent("popstate"));
		}
	}
}
