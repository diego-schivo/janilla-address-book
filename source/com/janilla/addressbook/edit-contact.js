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

export default class EditContact extends WebComponent {

	static get observedAttributes() {
		return ["data-id", "data-loading", "slot"];
	}

	static get templateNames() {
		return ["edit-contact"];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("EditContact.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("EditContact.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
		this.removeEventListener("click", this.handleClick);
	}

	handleSubmit = async event => {
		// console.log("EditContact.handleSubmit", event);
		event.preventDefault();
		event.stopPropagation();
		const s = this.closest("root-layout").state;
		s.contact = await (await fetch(`/api/contacts/${s.contact.id}`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(Object.fromEntries(new FormData(event.target)))
		})).json();
		delete s.contacts;
		history.pushState(s, "", `/contacts/${s.contact.id}`);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handleClick = async event => {
		// console.log("EditContact.handleClick", event);
		if (!event.target.matches('[type="button"]'))
			return;
		event.stopPropagation();
		history.back();
	}

	async updateDisplay() {
		// console.log("EditContact.updateDisplay");
		const s = this.closest("root-layout").state;
		if (this.dataset.loading != null) {
			s.contact = await (await fetch(`/api/contacts/${this.dataset.id}`)).json();
			history.replaceState(s, "");
			dispatchEvent(new CustomEvent("popstate"));
		} else if (this.slot === "content")
			this.appendChild(this.interpolateDom({
				$template: "",
				...s.contact
			}));
	}
}
