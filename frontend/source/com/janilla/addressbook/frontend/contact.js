/*
 * MIT License
 *
 * Copyright (c) React Training LLC 2015-2019
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2023
 * Copyright (c) Diego Schivo 2024-2025
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

export default class ContactPage extends WebComponent {

	static get observedAttributes() {
		return ["data-id", "data-loading", "slot"];
	}

	static get templateNames() {
		return ["contact"];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener("submit", this.handleSubmit);
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	async updateDisplay() {
		const s = this.state;
		if (this.slot) {
			const a = this.closest("app-element");
			const ps = a.popState;
			if (ps)
				s.contact = ps.contact;

			const hs = history.state;
			this.appendChild(this.interpolateDom(hs.contact ? {
				$template: "",
				...hs.contact,
				name: {
					$template: hs.contact.full ? "name" : "no-name",
					...hs.contact
				},
				twitter: hs.contact.twitter ? {
					$template: "twitter",
					...hs.contact
				} : null,
				notes: hs.contact.notes ? {
					$template: "notes",
					...hs.contact
				} : null
			} : { $template: "" }));

			if (!s.contact || this.dataset.id != hs.contact?.id) {
				s.contact = await (await fetch(`${a.dataset.apiUrl}/contacts/${this.dataset.id}`)).json();
				history.replaceState({
					...history.state,
					contact: s.contact
				}, "");
				dispatchEvent(new CustomEvent("popstate"));
			}
		} else
			delete s.contact;
	}

	handleSubmit = async event => {
		event.preventDefault();
		event.stopPropagation();
		const s = this.state;
		switch (event.target.method) {
			case "get":
				const u = new URL(`/contacts/${s.contact.id}/edit`, location.href);
				const q = new URLSearchParams(location.search).get("q");
				if (q)
					u.searchParams.append("q", q);
				history.pushState(history.state, "", u.pathname + u.search);
				dispatchEvent(new CustomEvent("popstate"));
				break;
			case "post":
				if (confirm("Please confirm you want to delete this record.")) {
					const a = this.closest("app-element");
					const r = await fetch(`${a.dataset.apiUrl}/contacts/${s.contact.id}`, { method: "DELETE" });
					if (r.ok) {
						delete s.contact;
						delete this.closest("sidebar-layout").state.contacts;
						history.pushState(history.state, "", "/");
						dispatchEvent(new CustomEvent("popstate"));
					} else
						alert(await r.text());
				}
				break;
		}
	}

	handleToggleFavorite = async event => {
		const s = this.state;
		s.contact.favorite = event.detail.favorite;
		this.requestDisplay();
		const a = this.closest("app-element");
		const r = await fetch(`${a.dataset.apiUrl}/contacts/${s.contact.id}/favorite`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(s.contact.favorite)
		});
		if (r.ok) {
			s.contact = await r.json();
			delete this.closest("sidebar-layout").state.contacts;
			history.pushState(history.state, "", "/");
			dispatchEvent(new CustomEvent("popstate"));
		} else
			alert(await r.text());
	}
}
