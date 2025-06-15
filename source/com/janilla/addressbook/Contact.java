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
package com.janilla.addressbook;

import java.time.Instant;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.persistence.Entity;
import com.janilla.persistence.Index;
import com.janilla.persistence.Store;

@Store
@Index(sort = "last")
public record Contact(Long id, Instant createdAt, String avatar, String first, String last, String twitter,
		Boolean favorite) implements Entity<Long> {

	@Index
	public String full() {
		if (first == null && last == null)
			return null;
		return Stream.of(first, last).filter(x -> x != null && !x.isEmpty()).collect(Collectors.joining(" "));
	}

	public Contact withCreatedAt(Instant createdAt) {
		return new Contact(id, createdAt, avatar, first, last, twitter, favorite);
	}

	public Contact withFavorite(Boolean favorite) {
		return new Contact(id, createdAt, avatar, first, last, twitter, favorite);
	}
}
