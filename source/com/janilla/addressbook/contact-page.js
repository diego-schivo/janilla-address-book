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

export default class ContactPage extends SlottableElement {

	static get observedAttributes() {
		return ["data-id", "slot"];
	}

	static get templateName() {
		return "contact-page";
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
		const c = this.state.contact;
		switch (event.target.method) {
			case "get":
				history.pushState(null, "", `/contacts/${c.id}/edit`);
				dispatchEvent(new CustomEvent("popstate"));
				break;
			case "post":
				if (!confirm("Please confirm you want to delete this record."))
					return;
				await fetch(`/api/contacts/${c.id}`, { method: "DELETE" });
				this.dispatchEvent(new CustomEvent("delete-contact", { bubbles: true }));
				history.pushState(null, "", "/");
				dispatchEvent(new CustomEvent("popstate"));
				break;
		}
	}

	handleToggleFavorite = async event => {
		// console.log("ContactPage.handleToggleFavorite", event);
		const c = this.state.contact;
		c.favorite = event.detail.favorite;
		this.requestUpdate();
		await fetch(`/api/contacts/${c.id}/favorite`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(c.favorite)
		});
		this.dispatchEvent(new CustomEvent("update-contact", { bubbles: true }));
	}

	async updateDisplay() {
		// console.log("ContactPage.updateDisplay");
		if (!this.dataset.id)
			return;
		const c = this.state?.contact;
		if (this.dataset.id !== c?.id?.toString())
			this.state = null;
		await super.updateDisplay();
	}

	async computeState() {
		// console.log("ContactPage.computeState");
		const c = await (await fetch(`/api/contacts/${this.dataset.id}`)).json();
		const s = { contact: c };
		history.replaceState(s, "");
		dispatchEvent(new CustomEvent("popstate"));
		return s;
	}

	renderState() {
		// console.log("ContactPage.renderState");
		const c = this.state?.contact;
		if (!c)
			return;
		this.appendChild(this.interpolateDom({
			$template: "",
			...c,
			name: {
				$template: c.full ? "name" : "no-name",
				...c
			},
			twitter: c.twitter ? {
				$template: "twitter",
				...c
			} : null,
			notes: c.notes ? {
				$template: "notes",
				...c
			} : null
		}));
	}
}
