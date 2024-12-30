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
		const sr = this.attachShadow({ mode: "open" });
		sr.innerHTML = `<link href="/app.css" rel="stylesheet" />
<slot name="content"></slot>`;
	}

	connectedCallback() {
		// console.log("AddressBook.connectedCallback");
		if (!this.querySelector(':scope > [slot="content"]')) {
			this.querySelector("#loading-splash").setAttribute("slot", "content");
			super.connectedCallback();
		}
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
		this.updateContent(event.state);
	}

	async updateDisplay() {
		// console.log("AddressBook.updateDisplay");
		this.updateContent();
	}

	updateContent(state) {
		// console.log("AddressBook.updateContent");
		const updateElement = (element, active, more) => {
			if (active) {
				if (state)
					element.janillas.state = state;
				if (element.slot === "content") {
					if (state)
						element.requestUpdate();
				} else {
					const el = element.janillas.state
						? Array.prototype.find.call(element.parentNode.childNodes, x => x !== element && x.slot === "content")
						: null;
					el?.removeAttribute("slot");
					element.setAttribute("slot", element.janillas.state ? "content" : "new-content");
				}
			}
			if (more)
				more(element, active);
		}
		const lp = location.pathname;
		updateElement(this.querySelector("sidebar-layout"), lp === "/" || lp.startsWith("/contacts/"));
		updateElement(this.querySelector("home-page"), lp === "/");
		const m = lp.match(/\/contacts\/(\d+)(\/edit)?/) ?? [];
		updateElement(this.querySelector("contact-page"), m[1] && !m[2], (el, a) => {
			if (a)
				el.dataset.id = m[1];
			else
				delete el.dataset.id;
		});
		updateElement(this.querySelector("edit-contact"), m[1] && m[2], (el, a) => {
			if (a)
				el.dataset.id = m[1];
			else
				delete el.dataset.id;
		});
		updateElement(this.querySelector("about-page"), lp === "/about");
	}
}
