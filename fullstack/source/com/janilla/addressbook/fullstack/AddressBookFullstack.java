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
package com.janilla.addressbook.fullstack;

import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;

import com.janilla.addressbook.backend.AddressBookBackend;
import com.janilla.addressbook.frontend.AddressBookFrontend;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.ioc.DiFactory;
import com.janilla.java.Java;
import com.janilla.json.DollarTypeResolver;
import com.janilla.json.TypeResolver;
import com.janilla.net.Net;

public class AddressBookFullstack {

	public static final AtomicReference<AddressBookFullstack> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			AddressBookFullstack a;
			{
				var f = new DiFactory(
						Java.getPackageClasses(AddressBookFullstack.class.getPackageName()).stream()
								.filter(x -> x != CustomDataFetching.class).toList(),
						AddressBookFullstack.INSTANCE::get);
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
				try (var x = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
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
//			IO.println("AddressBookFullstack, " + x.request().getPath());
			var h = switch (Objects.requireNonNullElse(x.exception(), x.request())) {
			case HttpRequest rq -> rq.getPath().startsWith("/api/") ? backend.handler() : frontend.handler();
			case Exception _ -> backend.handler();
			default -> null;
			};
			return h.handle(x);
		};

		backend = diFactory.create(AddressBookBackend.class, Java.hashMap("diFactory", new DiFactory(Stream
				.of("fullstack", "backend")
				.flatMap(x -> Java
						.getPackageClasses(AddressBookBackend.class.getPackageName().replace(".backend", "." + x))
						.stream())
				.toList(), AddressBookBackend.INSTANCE::get), "configurationFile", configurationFile));
		frontend = diFactory.create(AddressBookFrontend.class,
				Java.hashMap("diFactory",
						new DiFactory(
								Stream.of("fullstack", "frontend")
										.flatMap(x -> Java.getPackageClasses(AddressBookFrontend.class.getPackageName()
												.replace(".frontend", "." + x)).stream())
										.toList(),
								AddressBookFrontend.INSTANCE::get),
						"configurationFile", configurationFile));
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
