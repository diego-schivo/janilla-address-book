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
import AboutPage from "./about-page.js";
import AddressBook from "./address-book.js";
import ContactPage from "./contact-page.js";
import EditContact from "./edit-contact.js";
import HomePage from "./home-page.js";
import SidebarLayout from "./sidebar-layout.js";
import ToggleFavorite from "./toggle-favorite.js";

customElements.define("about-page", AboutPage);
customElements.define("address-book", AddressBook);
customElements.define("contact-page", ContactPage);
customElements.define("edit-contact", EditContact);
customElements.define("home-page", HomePage);
customElements.define("sidebar-layout", SidebarLayout);
customElements.define("toggle-favorite", ToggleFavorite);
