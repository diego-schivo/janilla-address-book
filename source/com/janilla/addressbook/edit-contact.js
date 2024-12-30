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

export default class EditContact extends SlottableElement {

	static get observedAttributes() {
		return ["data-id", "slot"];
	}

	static get templateName() {
		return "edit-contact";
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
		const c = this.janillas.state.contact;
		const c2 = await (await fetch(`/api/contacts/${c.id}`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(Object.fromEntries(new FormData(event.target)))
		})).json();
		this.dispatchEvent(new CustomEvent("update-contact", {
			bubbles: true,
			detail: { contact: c2 }
		}));
		history.pushState({ contacts: history.state.contacts }, "", `/contacts/${c.id}`);
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
		if (!this.dataset.id)
			return;
		const c = this.janillas.state?.contact;
		if (this.dataset.id !== c?.id?.toString())
			this.janillas.state = undefined;
		await super.updateDisplay();
	}

	async computeState() {
		// console.log("EditContact.computeState");
		const c = await (await fetch(`/api/contacts/${this.dataset.id}`)).json();
		this.janillas.state = { contact: c };
		history.replaceState({
			contacts: history.state?.contacts,
			...this.janillas.state
		}, "");
		dispatchEvent(new CustomEvent("popstate"));
	}

	renderState() {
		// console.log("EditContact.renderState");
		const c = this.janillas.state?.contact;
		if (!c)
			return;
		this.appendChild(this.interpolateDom({
			$template: "",
			...c
		}));
	}
}
