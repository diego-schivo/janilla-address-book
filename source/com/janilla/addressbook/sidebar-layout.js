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

export default class SidebarLayout extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "sidebar-layout";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("SidebarLayout.connectedCallback");
		super.connectedCallback();
		addEventListener("popstate", this.handlePopState);
		this.shadowRoot.addEventListener("submit", this.handleSubmit);
		this.shadowRoot.addEventListener("update-contact", this.handleUpdateContact);
		this.shadowRoot.addEventListener("delete-contact", this.handleDeleteContact);
		this.shadowRoot.addEventListener("input", this.handleInput);
	}

	disconnectedCallback() {
		// console.log("SidebarLayout.disconnectedCallback");
		removeEventListener("popstate", this.handlePopState);
		this.shadowRoot.removeEventListener("submit", this.handleSubmit);
		this.shadowRoot.removeEventListener("update-contact", this.handleUpdateContact);
		this.shadowRoot.removeEventListener("delete-contact", this.handleDeleteContact);
		this.shadowRoot.removeEventListener("input", this.handleInput);
	}

	handlePopState = event => {
		// console.log("SidebarLayout.handlePopState", event);
		this.requestUpdate();
	}

	handleSubmit = async event => {
		// console.log("SidebarLayout.handleSubmit", event);
		const el = event.target.closest("#sidebar");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		const c = await (await fetch("/api/contacts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({})
		})).json();
		this.janillas.state = undefined;
		history.pushState(null, "", `/contacts/${c.id}/edit`);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handleUpdateContact = async event => {
		// console.log("SidebarLayout.handleUpdateContact", event);
		this.janillas.state = undefined;
		this.requestUpdate();
	}

	handleDeleteContact = async event => {
		// console.log("SidebarLayout.handleDeleteContact", event);
		this.janillas.state = undefined;
		this.requestUpdate();
	}

	handleInput = async event => {
		// console.log("SidebarLayout.handleInput", event);
		const el = event.target.closest("#sidebar");
		if (!el)
			return;
		const q1 = new URLSearchParams(location.search).get("q");
		const q2 = event.target.value;
		this.janillas.state = undefined;
		const u = new URL(location.href);
		u.searchParams.set("q", q2);
		if (!q1)
			history.pushState(null, "", u.pathname + u.search);
		else
			history.replaceState(null, "", u.pathname + u.search);
		dispatchEvent(new CustomEvent("popstate"));
	}

	async computeState() {
		// console.log("SidebarLayout.computeState");
		const u = new URL("/api/contacts", location.href);
		const q = new URLSearchParams(location.search).get("q");
		if (q)
			u.searchParams.append("query", q);
		this.contacts = await (await fetch(u)).json();
		this.janillas.state = { contacts: this.contacts };
		history.replaceState({
			...history.state,
			...this.janillas.state
		}, "");
		dispatchEvent(new CustomEvent("popstate"));
	}

	renderState() {
		// console.log("SidebarLayout.renderState");
		this.shadowRoot.appendChild(this.interpolateDom({
			$template: "",
			search: {
				input: {
					class: !history.state ? "loading" : null,
					value: new URLSearchParams(location.search).get("q")
				},
				spinner: {
					hidden: !!history.state
				}
			},
			contacts: {
				$template: this.contacts?.length ? "contacts" : "no-contacts",
				items: this.contacts?.map(x => ({
					$template: "item",
					...x,
					class: x.id === history.state?.contact?.id ? "active"
						: `${location.pathname}/`.startsWith(`/contacts/${x.id}/`) ? "pending" : null,
					name: {
						$template: x.full ? "name" : "no-name",
						...x
					},
					favorite: x.favorite ? { $template: "favorite" } : null
				}))
			},
			detail: {
				class: this.querySelector(":scope > [data-compute-state]") ? "loading" : null
			}
		}));
	}
}
