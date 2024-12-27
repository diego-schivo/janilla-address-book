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
package com.janilla.addressbook;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Stream;

import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;
import com.janilla.web.Bind;
import com.janilla.web.Handle;

public class ContactApi {

	public Persistence persistence;

	@Handle(method = "GET", path = "/api/contacts")
	public Stream<Contact> list(@Bind("query") String query) {
		var cc = persistence.crud(Contact.class);
		return cc.read(query == null || query.isEmpty() ? cc.list()
				: cc.filter("last", x -> ((String) x).toLowerCase().contains(query.toLowerCase())));
	}

	@Handle(method = "POST", path = "/api/contacts")
	public Contact create(Contact contact) {
		return persistence.crud(Contact.class).create(contact.withCreatedAt(Instant.now()));
	}

	@Handle(method = "GET", path = "/api/contacts/(\\d+)")
	public Contact read(long id) {
		return persistence.crud(Contact.class).read(id);
	}

	@Handle(method = "PUT", path = "/api/contacts/(\\d+)")
	public Contact update(long id, Contact contact) {
		return persistence.crud(Contact.class).update(id,
				x -> Reflection.copy(contact, x, y -> !Set.of("id", "createdAt").contains(y)));
	}
}
