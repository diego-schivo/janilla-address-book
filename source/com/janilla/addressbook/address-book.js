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
import { UpdatableElement } from "./updatable-element.js";

const updateElement = (element, active, more) => {
	if (active) {
		// console.log("updateElement", element);
		element.setAttribute("slot", "content");
	} else
		element.removeAttribute("slot");
	if (more)
		more(element, active);
}

export default class AddressBook extends UpdatableElement {

	loadCount = 0;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("AddressBook.connectedCallback");
		super.connectedCallback();
		addEventListener("popstate", this.handlePopState);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("load-start", this.handleLoadStart);
		this.addEventListener("load-end", this.handleLoadEnd);
	}

	disconnectedCallback() {
		// console.log("AddressBook.disconnectedCallback");
		removeEventListener("popstate", this.handlePopState);
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("load-start", this.handleLoadStart);
		this.removeEventListener("load-end", this.handleLoadEnd);
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

	handleLoadStart = () => {
		console.log("AddressBook.handleLoadStart");
		this.loadCount++;
		this.shadowRoot.querySelector("#loading-splash").style.display = "";
		this.shadowRoot.querySelector("slot").style.display = "none";
	}

	handleLoadEnd = () => {
		console.log("AddressBook.handleLoadEnd");
		if (--this.loadCount === 0) {
			this.shadowRoot.querySelector("#loading-splash").style.display = "none";
			this.shadowRoot.querySelector("slot").style.display = "";
		}
	}

	handlePopState = event => {
		// console.log("AddressBook.handlePopState", event);
		this.updateContent(event.state);
	}

	async updateDisplay() {
		// console.log("AddressBook.updateDisplay");
		this.shadowRoot.innerHTML = `<link href="/app.css" rel="stylesheet" />
<div id="loading-splash" style="display: none">
	<div id="loading-splash-spinner"></div>
	<p>Loading, please wait...</p>
</div>
<slot name="content"></slot>`;
		if (!this.updateDisplayCalled) {
			this.updateDisplayCalled = true;
			if (this.querySelector("[slot]"))
				return;
		}
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
		updateElement(this.querySelector("edit-contact"), m[1] && m[2], (el, a) => {
			if (a)
				el.setAttribute("data-id", m[1]);
			else
				el.removeAttribute("data-id");
		});
		updateElement(this.querySelector("about-page"), lp === "/about");
	}
}
