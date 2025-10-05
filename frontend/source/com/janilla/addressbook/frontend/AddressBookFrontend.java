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
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpClient;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.java.Java;
import com.janilla.json.DollarTypeResolver;
import com.janilla.json.Json;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.json.TypeResolver;
import com.janilla.net.Net;
import com.janilla.reflect.ClassAndMethod;
import com.janilla.reflect.Factory;
import com.janilla.web.ApplicationHandlerFactory;
import com.janilla.web.Handle;
import com.janilla.web.NotFoundException;
import com.janilla.web.Render;
import com.janilla.web.Renderer;

public class AddressBookFrontend {

	public static final AtomicReference<AddressBookFrontend> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			AddressBookFrontend a;
			{
				var c = new Properties();
				try (var x = AddressBookFrontend.class.getResourceAsStream("configuration.properties")) {
					c.load(x);
				}
				if (args.length > 0) {
					var f = args[0];
					if (f.startsWith("~"))
						f = System.getProperty("user.home") + f.substring(1);
					try (var x = Files.newInputStream(Path.of(f))) {
						c.load(x);
					}
				}
				a = new AddressBookFrontend(c);
			}

			HttpServer s;
			{
				SSLContext c;
				try (var x = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
				}
				var p = Integer.parseInt(a.configuration.getProperty("address-book.frontend.server.port"));
				s = a.factory.create(HttpServer.class,
						Map.of("sslContext", c, "endpoint", new InetSocketAddress(p), "handler", a.handler));
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public HttpHandler handler;

	public HttpClient httpClient;

	public TypeResolver typeResolver;

	public List<Class<?>> types;

	public AddressBookFrontend(Properties configuration) {
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		this.configuration = configuration;
		types = Java.getPackageClasses(AddressBookFrontend.class.getPackageName());
		factory = new Factory(types, INSTANCE::get);
		typeResolver = factory.create(DollarTypeResolver.class);

		{
			var f = factory.create(ApplicationHandlerFactory.class, Map.of("methods",
					types.stream().flatMap(x -> Arrays.stream(x.getMethods()).map(y -> new ClassAndMethod(x, y)))
							.toList(),
					"files", Stream.of("com.janilla.frontend", AddressBookFrontend.class.getPackageName())
							.flatMap(x -> Java.getPackagePaths(x).stream().filter(Files::isRegularFile)).toList()));
			handler = x -> {
				var h = f.createHandler(Objects.requireNonNullElse(x.exception(), x.request()));
				if (h == null)
					throw new NotFoundException(x.request().getMethod() + " " + x.request().getTarget());
				return h.handle(x);
			};
		}

		{
			SSLContext c;
			try (var x = Net.class.getResourceAsStream("testkeys")) {
				c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
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

	protected Object contact(String id) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient.getJson(u + "/contacts/" + Net.urlEncode(id));
	}

	protected Object contacts(String query) {
		var u = configuration.getProperty("address-book.api.url");
		return httpClient
				.getJson(Net.uriString(u + "/contacts", new AbstractMap.SimpleImmutableEntry<>("query", query)));
	}

	public static class StateRenderer<T> extends Renderer<T> {

		@Override
		public String apply(T value) {
			return Json.format(INSTANCE.get().factory.create(ReflectionJsonIterator.class,
					Map.of("object", value, "includeType", false)));
		}
	}
}
