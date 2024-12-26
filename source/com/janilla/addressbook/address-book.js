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
import { FlexibleElement } from "./flexible-element.js";

const updateElement = (element, active, more) => {
	if (active) {
		// console.log("updateElement", element);
		element.setAttribute("slot", "content");
	} else
		element.removeAttribute("slot");
	if (more)
		more(element, active);
}

export default class AddressBook extends FlexibleElement {

	static get templateName() {
		return "address-book";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("AddressBook.connectedCallback");
		super.connectedCallback();
		addEventListener("popstate", this.handlePopState);
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("AddressBook.disconnectedCallback");
		removeEventListener("popstate", this.handlePopState);
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("AddressBook.handleClick", event);
		const a = event.composedPath().find(x => x.tagName?.toLowerCase() === "a");
		if (!a?.href)
			return;
		event.preventDefault();
		const u = new URL(a.href);
		history.pushState({}, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("AddressBook.handlePopState", event);
		this.updateContent(event.state);
	}

	async updateDisplay() {
		// console.log("AddressBook.updateDisplay");
		await super.updateDisplay();
		this.shadowRoot.appendChild(this.interpolateDom());
		this.updateContent();
	}

	updateContent() {
		// console.log("AddressBook.updateContent");
		// Array.prototype.forEach.call(this.querySelectorAll("*"), x => x.removeAttribute("slot"));
		const lp = location.pathname;
		updateElement(this.querySelector("sidebar-layout"), lp === "/" || lp.startsWith("/contacts/"));
		updateElement(this.querySelector("home-page"), lp === "/");
		const m = lp.match(/\/contacts\/(\d+)(\/edit)?/) ?? [];
		updateElement(this.querySelector("contact-page"), m[1] && !m[2], (el, a) => {
			if (a)
				el.setAttribute("data-id", m[1]);
			else
				el.removeAttribute("data-id");
		});
		updateElement(this.querySelector("about-page"), lp === "/about");
	}
}
