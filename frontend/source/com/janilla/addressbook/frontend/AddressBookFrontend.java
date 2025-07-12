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

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.AbstractMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpClient;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.json.Json;
import com.janilla.json.MapAndType;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.net.Net;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;
import com.janilla.web.Renderer;

public class AddressBookFrontend {

	public static final AtomicReference<AddressBookFrontend> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			var pp = new Properties();
			try (var s1 = AddressBookFrontend.class.getResourceAsStream("configuration.properties")) {
				pp.load(s1);
				if (args.length > 0) {
					var p = args[0];
					if (p.startsWith("~"))
						p = System.getProperty("user.home") + p.substring(1);
					try (var s2 = Files.newInputStream(Path.of(p))) {
						pp.load(s2);
					}
				}
			}
			var x = new AddressBookFrontend(pp);

			HttpServer s;
			{
				SSLContext c;
				try (var is = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
				}
				s = new HttpServer(c, x.handler);
			}
			var p = Integer.parseInt(x.configuration.getProperty("address-book.frontend.server.port"));
			s.serve(new InetSocketAddress(p));
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public HttpHandler handler;

	public HttpClient httpClient;

	public MapAndType.TypeResolver typeResolver;

	public Set<Class<?>> types;

	public AddressBookFrontend(Properties configuration) {
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		this.configuration = configuration;
		types = Util.getPackageClasses(AddressBookFrontend.class.getPackageName()).collect(Collectors.toSet());
		factory = new Factory(types, this);
		typeResolver = factory.create(MapAndType.DollarTypeResolver.class);
		handler = factory.create(ApplicationHandlerBuilder.class).build();

		{
			SSLContext c;
			try (var is = Net.class.getResourceAsStream("testkeys")) {
				c = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
			httpClient = new HttpClient(c);
		}
	}

	public AddressBookFrontend application() {
		return this;
	}

	@Handle(method = "GET", path = "/")
	public Index root(String q) throws IOException {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of("contacts", contacts(q)));
	}

	@Handle(method = "GET", path = "/contacts/([^/]+)(/edit)?")
	public Index contact(String id, String edit, String q) {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of("contacts", contacts(q), "contact", contact(id)));
	}

	@Handle(method = "GET", path = "/about")
	public Index about() {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of());
	}

	@Render(template = "index.html")
	public record Index(String apiUrl, @Render(renderer = StateRenderer.class) Map<String, Object> state) {
	}

	protected Object contacts(String query) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient
				.getJson(Net.uriString(u + "/contacts", new AbstractMap.SimpleImmutableEntry<>("query", query)));
	}

	protected Object contact(String id) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient.getJson(u + "/contacts/" + Net.urlEncode(id));
	}

	public static class StateRenderer<T> extends Renderer<T> {

		@Override
		public String apply(T value) {
			var x = INSTANCE.get().factory.create(ReflectionJsonIterator.class);
			x.setObject(value);
			return Json.format(x);
		}
	}
}
