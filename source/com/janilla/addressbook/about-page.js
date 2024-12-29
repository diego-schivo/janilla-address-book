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
import { removeAllChildren } from "./dom-utils.js";

export default class AboutPage extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "about-page";
	}

	constructor() {
		super();
	}

	async updateDisplay() {
		// console.log("AboutPage.updateDisplay");
		if (!this.updateDisplayCalled) {
			this.updateDisplayCalled = true;
			if (this.matches("[slot]"))
				return;
		}
		await super.updateDisplay();
	}

	async computeState() {
		// console.log("AboutPage.computeState");
		// await new Promise(r => setTimeout(r, 500));
		this.state = {};
		history.replaceState({
			contacts: history.state?.contacts,
			...this.state
		}, "");
		dispatchEvent(new CustomEvent("popstate"));
	}

	renderState() {
		// console.log("AboutPage.renderState");
		if (!this.renderStateCalled) {
			this.renderStateCalled = true;
			removeAllChildren(this);
		}
		this.appendChild(this.interpolateDom());
	}
}
