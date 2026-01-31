/*
 * MIT License
 *
 * Copyright (c) React Training LLC 2015-2019
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2023
 * Copyright (c) Diego Schivo 2024-2026
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
package com.janilla.addressbook.fullstack;

import java.net.InetSocketAddress;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;

import com.janilla.addressbook.backend.AddressBookBackend;
import com.janilla.addressbook.backend.BackendExchange;
import com.janilla.addressbook.frontend.AddressBookFrontend;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.ioc.DiFactory;
import com.janilla.java.DollarTypeResolver;
import com.janilla.java.Java;
import com.janilla.java.TypeResolver;
import com.janilla.net.SecureServer;

public class AddressBookFullstack {

	public static final AtomicReference<AddressBookFullstack> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			AddressBookFullstack a;
			{
				var f = new DiFactory(Java.getPackageClasses(AddressBookFullstack.class.getPackageName(), true), "fullstack");
				a = f.create(AddressBookFullstack.class,
						Java.hashMap("diFactory", f, "configurationFile",
								args.length > 0 ? Path.of(
										args[0].startsWith("~") ? System.getProperty("user.home") + args[0].substring(1)
												: args[0])
										: null));
			}

			HttpServer s;
			{
				SSLContext c;
				try (var x = SecureServer.class.getResourceAsStream("localhost")) {
					c = Java.sslContext(x, "passphrase".toCharArray());
				}
				var p = Integer.parseInt(a.configuration.getProperty("address-book.fullstack.server.port"));
				s = a.diFactory.create(HttpServer.class,
						Map.of("sslContext", c, "endpoint", new InetSocketAddress(p), "handler", a.handler));
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	protected AddressBookBackend backend;

	protected final Properties configuration;

	protected final DiFactory diFactory;

	protected AddressBookFrontend frontend;

	protected final HttpHandler handler;

	protected final TypeResolver typeResolver;

	public AddressBookFullstack(DiFactory diFactory, Path configurationFile) {
		this.diFactory = diFactory;
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		configuration = diFactory.create(Properties.class, Collections.singletonMap("file", configurationFile));
		typeResolver = diFactory.create(DollarTypeResolver.class);

		handler = x -> {
			var h = x instanceof BackendExchange ? backend.handler() : frontend.handler();
			return h.handle(x);
		};

		var cf = Optional.ofNullable(configurationFile).orElseGet(() -> {
			try {
				return Path.of(AddressBookFullstack.class.getResource("configuration.properties").toURI());
			} catch (URISyntaxException e) {
				throw new RuntimeException(e);
			}
		});
		backend = diFactory
				.create(AddressBookBackend.class,
						Java.hashMap("diFactory",
								new DiFactory(Stream
										.concat(Stream.of("com.janilla.web"),
												Stream.of("backend", "fullstack")
														.map(x -> AddressBookBackend.class.getPackageName()
																.replace(".backend", "." + x)))
										.flatMap(x -> Java.getPackageClasses(x, true).stream()).toList(), "backend"),
								"configurationFile", cf));
		frontend = diFactory
				.create(AddressBookFrontend.class,
						Java.hashMap("diFactory",
								new DiFactory(Stream
										.concat(Stream.of("com.janilla.web"),
												Stream.of("frontend", "fullstack")
														.map(x -> AddressBookFrontend.class.getPackageName()
																.replace(".frontend", "." + x)))
										.flatMap(x -> Java.getPackageClasses(x, true).stream()).toList(), "frontend"),
								"configurationFile", cf));
	}

	public AddressBookFullstack application() {
		return this;
	}

	public AddressBookBackend backend() {
		return backend;
	}

	public Properties configuration() {
		return configuration;
	}

	public DiFactory diFactory() {
		return diFactory;
	}

	public AddressBookFrontend frontend() {
		return frontend;
	}

	public HttpHandler handler() {
		return handler;
	}

	public TypeResolver typeResolver() {
		return typeResolver;
	}

	public Collection<Class<?>> types() {
		return diFactory.types();
	}
}
