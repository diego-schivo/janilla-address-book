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
	}

	disconnectedCallback() {
		// console.log("ContactPage.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		console.log("ContactPage.handleSubmit", event);
		event.preventDefault();
		event.stopPropagation();
		const c = this.state;
		history.pushState(null, "", `/contacts/${c.id}/edit`);
		dispatchEvent(new CustomEvent("popstate"));
	}

	async updateDisplay() {
		// console.log("ContactPage.updateDisplay");
		const c = this.state;
		if (this.dataset.id !== c?.id?.toString())
			this.state = null;
		await super.updateDisplay();
	}

	async computeState() {
		// console.log("ContactPage.computeState");
		const s = await (await fetch(`/api/contacts/${this.dataset.id}`)).json();
		history.replaceState(s, "");
		dispatchEvent(new CustomEvent("popstate"));
		return s;
	}

	renderState() {
		// console.log("ContactPage.renderState");
		const c = this.state;
		if (!c)
			return;
		this.appendChild(this.interpolateDom({
			$template: "",
			...c,
			name: {
				$template: c.first || c.last ? "name" : "no-name",
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
