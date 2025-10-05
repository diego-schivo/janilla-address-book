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
package com.janilla.addressbook.backend;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.java.Java;
import com.janilla.json.DollarTypeResolver;
import com.janilla.json.TypeResolver;
import com.janilla.net.Net;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.ClassAndMethod;
import com.janilla.reflect.Factory;
import com.janilla.web.ApplicationHandlerFactory;
import com.janilla.web.NotFoundException;
import com.janilla.web.RenderableFactory;

public class AddressBookBackend {

	public static final AtomicReference<AddressBookBackend> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			AddressBookBackend a;
			{
				var c = new Properties();
				try (var x = AddressBookBackend.class.getResourceAsStream("configuration.properties")) {
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
				a = new AddressBookBackend(c);
			}

			HttpServer s;
			{
				SSLContext c;
				try (var x = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
				}
				var p = Integer.parseInt(a.configuration.getProperty("address-book.backend.server.port"));
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

	public Persistence persistence;

	public RenderableFactory renderableFactory;

	public TypeResolver typeResolver;

	public List<Class<?>> types;

	public AddressBookBackend(Properties configuration) {
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		this.configuration = configuration;
		types = Java.getPackageClasses(AddressBookBackend.class.getPackageName());
		factory = new Factory(types, INSTANCE::get);
		typeResolver = factory.create(DollarTypeResolver.class);

		{
			var f = configuration.getProperty("address-book.database.file");
			if (f.startsWith("~"))
				f = System.getProperty("user.home") + f.substring(1);
			var b = factory.create(ApplicationPersistenceBuilder.class, Map.of("databaseFile", Path.of(f)));
			persistence = b.build();
		}

		renderableFactory = new RenderableFactory();

		{
			var f = factory.create(ApplicationHandlerFactory.class,
					Map.of("methods", types.stream()
							.flatMap(x -> Arrays.stream(x.getMethods()).map(y -> new ClassAndMethod(x, y))).toList(),
							"files", List.of()));
			handler = x -> {
				var h = f.createHandler(Objects.requireNonNullElse(x.exception(), x.request()));
				if (h == null)
					throw new NotFoundException(x.request().getMethod() + " " + x.request().getTarget());
				return h.handle(x);
			};
		}
	}

	public AddressBookBackend application() {
		return this;
	}
}
