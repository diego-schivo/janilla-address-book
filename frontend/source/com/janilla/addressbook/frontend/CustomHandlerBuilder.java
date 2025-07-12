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

import java.util.Map;

import com.janilla.reflect.Factory;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.ResourceHandlerFactory;
import com.janilla.web.WebHandlerFactory;

public class CustomHandlerBuilder extends ApplicationHandlerBuilder {

	public CustomHandlerBuilder(Factory factory) {
		super(factory);
	}

	@Override
	protected WebHandlerFactory buildResourceHandlerFactory() {
		return factory.create(ResourceHandlerFactory.class, Map.of("packages",
				new String[] { "com.janilla.frontend", AddressBookFrontend.class.getPackageName() }));
	}
}
