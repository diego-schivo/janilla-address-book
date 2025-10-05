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
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;

import javax.net.ssl.SSLContext;

import com.janilla.addressbook.backend.AddressBookBackend;
import com.janilla.addressbook.frontend.AddressBookFrontend;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.java.Java;
import com.janilla.json.DollarTypeResolver;
import com.janilla.json.TypeResolver;
import com.janilla.net.Net;
import com.janilla.reflect.Factory;

public class AddressBookFullstack {

	public static final AtomicReference<AddressBookFullstack> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			AddressBookFullstack a;
			{
				var c = new Properties();
				try (var x = AddressBookFullstack.class.getResourceAsStream("configuration.properties")) {
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
				a = new AddressBookFullstack(c);
			}

			HttpServer s;
			{
				SSLContext c;
				try (var x = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
				}
				var p = Integer.parseInt(a.configuration.getProperty("address-book.fullstack.server.port"));
				s = a.factory.create(HttpServer.class,
						Map.of("sslContext", c, "endpoint", new InetSocketAddress(p), "handler", a.handler));
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public AddressBookBackend backend;

	public Properties configuration;

	public Factory factory;

	public AddressBookFrontend frontend;

	public HttpHandler handler;

	public TypeResolver typeResolver;

	public List<Class<?>> types;

	public AddressBookFullstack(Properties configuration) {
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		this.configuration = configuration;
		types = Java.getPackageClasses(AddressBookFullstack.class.getPackageName());
		factory = new Factory(types, INSTANCE::get);
		typeResolver = factory.create(DollarTypeResolver.class);

		handler = x -> {
//			IO.println("AddressBookFullstack, " + x.request().getPath());
			var h = switch (Objects.requireNonNullElse(x.exception(), x.request())) {
			case HttpRequest rq -> rq.getPath().startsWith("/api/") ? backend.handler : frontend.handler;
			case Exception _ -> backend.handler;
			default -> null;
			};
			return h.handle(x);
		};

		backend = new AddressBookBackend(configuration);
		frontend = new CustomFrontend(configuration);
	}

	public AddressBookFullstack application() {
		return this;
	}
}
