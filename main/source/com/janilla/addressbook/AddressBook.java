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

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.json.Json;
import com.janilla.json.MapAndType;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.net.Net;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;
import com.janilla.web.RenderableFactory;
import com.janilla.web.Renderer;

public class AddressBook {

	public static final AtomicReference<AddressBook> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			var pp = new Properties();
			try (var s1 = AddressBook.class.getResourceAsStream("configuration.properties")) {
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
			var ab = new AddressBook(pp);

			HttpServer s;
			{
				SSLContext c;
				try (var is = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
				}
				s = new HttpServer(c, ab.handler);
			}
			var p = Integer.parseInt(ab.configuration.getProperty("address-book.server.port"));
			s.serve(new InetSocketAddress(p));
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public Persistence persistence;

	public RenderableFactory renderableFactory;

	public HttpHandler handler;

	public MapAndType.TypeResolver typeResolver;

	public Iterable<Class<?>> types;

	public AddressBook(Properties configuration) {
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		this.configuration = configuration;

		types = Util.getPackageClasses(getClass().getPackageName()).filter(x -> !x.getPackageName().endsWith(".test"))
				.toList();
		factory = new Factory(types, this);
		typeResolver = factory.create(MapAndType.DollarTypeResolver.class);

		{
			var f = configuration.getProperty("address-book.database.file");
			if (f.startsWith("~"))
				f = System.getProperty("user.home") + f.substring(1);
			var b = factory.create(ApplicationPersistenceBuilder.class, Map.of("databaseFile", Path.of(f)));
			persistence = b.build();
		}

		renderableFactory = new RenderableFactory();
		handler = factory.create(ApplicationHandlerBuilder.class).build();
	}

	public AddressBook application() {
		return this;
	}

	@Handle(method = "GET", path = "/")
	public Index root(String q) {
		var a = ContactApi.INSTANCE.get();
		return new Index(Map.of("contacts", a.list(q)));
	}

	@Handle(method = "GET", path = "/contacts/([^/]+)(/edit)?")
	public Index contact(String id, String edit, String q) {
		var a = ContactApi.INSTANCE.get();
		return new Index(Map.of("contacts", a.list(q), "contact", a.read(id)));
	}

	@Handle(method = "GET", path = "/about")
	public Index about() {
		return new Index(Map.of());
	}

	@Render(template = "index.html")
	public record Index(@Render(renderer = StateRenderer.class) Map<String, Object> state) {
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
