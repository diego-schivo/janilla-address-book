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
import WebComponent from "./web-component.js";

export default class ContactPage extends WebComponent {

	static get observedAttributes() {
		return ["data-id", "data-loading", "slot"];
	}

	static get templateNames() {
		return ["contact-page"];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ContactPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	disconnectedCallback() {
		// console.log("ContactPage.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	handleSubmit = async event => {
		// console.log("ContactPage.handleSubmit", event);
		event.preventDefault();
		event.stopPropagation();
		const s = this.closest("root-layout").state;
		switch (event.target.method) {
			case "get":
				history.pushState(s, "", `/contacts/${s.contact.id}/edit`);
				dispatchEvent(new CustomEvent("popstate"));
				break;
			case "post":
				if (!confirm("Please confirm you want to delete this record."))
					return;
				await (await fetch(`/api/contacts/${s.contact.id}`, { method: "DELETE" })).json();
				delete s.contact;
				delete s.contacts;
				history.pushState(s, "", "/");
				dispatchEvent(new CustomEvent("popstate"));
				break;
		}
	}

	handleToggleFavorite = async event => {
		// console.log("ContactPage.handleToggleFavorite", event);
		const s = this.closest("root-layout").state;
		s.contact.favorite = event.detail.favorite;
		this.requestDisplay();
		s.contact = await (await fetch(`/api/contacts/${s.contact.id}/favorite`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(s.contact.favorite)
		})).json();
		delete s.contacts;
		history.pushState(s, "", "/");
		dispatchEvent(new CustomEvent("popstate"));
	}

	async updateDisplay() {
		// console.log("ContactPage.updateDisplay");
		const s = this.closest("root-layout").state;
		if (this.dataset.loading != null) {
			s.contact = await (await fetch(`/api/contacts/${this.dataset.id}`)).json();
			history.replaceState(s, "");
			// dispatchEvent(new CustomEvent("popstate"));
			this.closest("sidebar-layout").requestDisplay();
		} else if (this.slot === "content")
			this.appendChild(this.interpolateDom({
				$template: "",
				...s.contact,
				name: {
					$template: s.contact.full ? "name" : "no-name",
					...s.contact
				},
				twitter: s.contact.twitter ? {
					$template: "twitter",
					...s.contact
				} : null,
				notes: s.contact.notes ? {
					$template: "notes",
					...s.contact
				} : null
			}));
	}
}
