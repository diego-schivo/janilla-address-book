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

export default class AddressBook extends UpdatableElement {

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
		history.pushState({ contacts: history.state?.contacts }, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("AddressBook.handlePopState", event);
		if (history.state?.contacts) {
			this.shadowRoot.querySelector("#loading-splash").style.display = "none";
			this.shadowRoot.querySelector("slot").style.display = "";
		}
		this.updateContent(event.state);
		this.querySelector('sidebar-layout[slot="content"]')?.requestUpdate();
	}

	async updateDisplay() {
		// console.log("AddressBook.updateDisplay");
		if (!this.shadowRoot.firstChild) {
			this.shadowRoot.innerHTML = `<link href="/app.css" rel="stylesheet" />
<div id="loading-splash" style="display: none">
	<div id="loading-splash-spinner"></div>
	<p>Loading, please wait...</p>
</div>
<slot name="content"></slot>`;
			if (this.querySelector(':scope > [slot="content"]'))
				return;
			this.shadowRoot.querySelector("#loading-splash").style.display = "";
			this.shadowRoot.querySelector("slot").style.display = "none";
		}
		this.updateContent();
	}

	updateContent(state) {
		// console.log("AddressBook.updateContent");
		const updateElement = (element, active, more) => {
			if (active && element.slot !== "content") {
				const el = element.state != null
					? Array.prototype.find.call(element.parentNode.childNodes, x => x !== element && x.slot === "content")
					: null;
				el?.removeAttribute("slot");
				element.setAttribute("slot", element.state == null ? "new-content" : "content");
			}
			if (more)
				more(element, active);
		}
		const lp = location.pathname;
		updateElement(this.querySelector("sidebar-layout"), lp === "/" || lp.startsWith("/contacts/"));
		updateElement(this.querySelector("home-page"), lp === "/");
		const m = lp.match(/\/contacts\/(\d+)(\/edit)?/) ?? [];
		updateElement(this.querySelector("contact-page"), m[1] && !m[2], (el, a) => {
			// el.state = a ? state : undefined;
			if (a)
				el.setAttribute("data-id", m[1]);
			else
				el.removeAttribute("data-id");
		});
		updateElement(this.querySelector("edit-contact"), m[1] && m[2], (el, a) => {
			// el.state = a ? state : undefined;
			if (a)
				el.setAttribute("data-id", m[1]);
			else
				el.removeAttribute("data-id");
		});
		updateElement(this.querySelector("about-page"), lp === "/about");
	}
}
