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

export default class ToggleFavorite extends WebComponent {

	static get observedAttributes() {
		return ["data-checked"];
	}

	static get templateName() {
		return "toggle-favorite";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("FavoriteButton.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("FavoriteButton.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = event => {
		// console.log("FavoriteButton.handleSubmit", event);
		event.preventDefault();
		event.stopPropagation();
		const c = this.dataset.checked !== undefined;
		this.dispatchEvent(new CustomEvent("toggle-favorite", {
			bubbles: true,
			detail: { favorite: !c }
		}));
	}

	async updateDisplay() {
		// console.log("FavoriteButton.updateDisplay");
		const c = this.dataset.checked !== undefined;
		this.appendChild(this.interpolateDom({
			$template: "",
			label: c ? "Remove from favorites" : "Add to favorites",
			value: (!c).toString(),
			text: c ? "★" : "☆"
		}));
	}
}
