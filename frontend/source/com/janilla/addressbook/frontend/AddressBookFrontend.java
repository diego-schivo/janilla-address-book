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
import java.lang.reflect.Modifier;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
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
				var f = new Factory(Java.getPackageClasses(AddressBookFrontend.class.getPackageName()),
						AddressBookFrontend.INSTANCE::get);
				a = f.create(AddressBookFrontend.class,
						Java.hashMap("factory", f, "configurationFile", args.length > 0 ? args[0] : null));
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

	protected final Properties configuration;

	protected final Factory factory;

	protected final HttpHandler handler;

	protected final HttpClient httpClient;

	protected final TypeResolver typeResolver;

	protected final DataFetching dataFetching;

	public AddressBookFrontend(Factory factory, Path configurationFile) {
		this.factory = factory;
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		configuration = factory.create(Properties.class, Collections.singletonMap("file", configurationFile));
		typeResolver = factory.create(DollarTypeResolver.class);

		{
			var f = factory.create(ApplicationHandlerFactory.class, Map.of("methods", types().stream()
					.flatMap(x -> Arrays.stream(x.getMethods()).filter(y -> !Modifier.isStatic(y.getModifiers()))
							.map(y -> new ClassAndMethod(x, y)))
					.toList(), "files",
					Stream.of("com.janilla.frontend", AddressBookFrontend.class.getPackageName())
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

		dataFetching = factory.create(DataFetching.class);
	}

	public AddressBookFrontend application() {
		return this;
	}

	public Properties configuration() {
		return configuration;
	}

	public Factory factory() {
		return factory;
	}

	public HttpHandler handler() {
		return handler;
	}

	public HttpClient httpClient() {
		return httpClient;
	}

	public TypeResolver typeResolver() {
		return typeResolver;
	}

	public Collection<Class<?>> types() {
		return factory.types();
	}

	@Handle(method = "GET", path = "/")
	public Index root(String q) throws IOException {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of("contacts", dataFetching.contacts(q)));
	}

	@Handle(method = "GET", path = "/contacts/([^/]+)(/edit)?")
	public Index contact(String id, String edit, String q) {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of("contacts", dataFetching.contacts(q), "contact", dataFetching.contact(id)));
	}

	@Handle(method = "GET", path = "/about")
	public Index about() {
		var u = configuration.getProperty("address-book.api.url");
		return new Index(u, Map.of());
	}

	@Render(template = "index.html")
	public record Index(String apiUrl, @Render(renderer = StateRenderer.class) Map<String, Object> state) {
	}

	public static class StateRenderer<T> extends Renderer<T> {

		@Override
		public String apply(T value) {
			return Json.format(INSTANCE.get().factory.create(ReflectionJsonIterator.class,
					Map.of("object", value, "includeType", false)));
		}
	}
}
