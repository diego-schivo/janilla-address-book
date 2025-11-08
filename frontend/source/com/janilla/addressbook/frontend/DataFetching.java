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
package com.janilla.addressbook.frontend;

import java.net.URI;
import java.util.Arrays;
import java.util.Objects;
import java.util.Properties;
import java.util.stream.Collectors;

import com.janilla.http.HttpClient;
import com.janilla.net.Net;

public class DataFetching {

	protected final Properties configuration;

	protected final HttpClient httpClient;

	public DataFetching(Properties configuration, HttpClient httpClient) {
		this.configuration = configuration;
		this.httpClient = httpClient;
	}

	public Object contact(String id) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient.getJson(uri("/contacts/" + Net.urlEncode(id)));
	}

	public Object contacts(String query) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient.getJson(uri("/contacts", "query", query));
	}

	protected URI uri(String path) {
		return uri(path, (String[][]) null);
	}

	protected URI uri(String path, String name, Object value) {
		return uri(path, new String[] { name, Objects.toString(value, null) });
	}

	protected URI uri(String path, String name1, Object value1, String name2, Object value2) {
		return uri(path, new String[] { name1, Objects.toString(value1, null) },
				new String[] { name2, Objects.toString(value2, null) });
	}

	protected URI uri(String path, String[]... pairs) {
		var s = pairs != null
				? Arrays.stream(pairs).filter(x -> x[1] != null)
						.map(x -> Net.urlEncode(x[0]) + "=" + Net.urlEncode(x[1])).collect(Collectors.joining("&"))
				: null;
		var b = new StringBuilder().append(URI.create(configuration.getProperty("website-template.api.url")))
				.append(path);
		if (s != null && !s.isEmpty())
			b.append('?').append(s);
		return URI.create(b.toString());
	}
}
