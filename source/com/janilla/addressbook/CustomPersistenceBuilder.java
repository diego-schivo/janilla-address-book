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

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.database.BTree;
import com.janilla.database.BTreeMemory;
import com.janilla.database.IdAndReference;
import com.janilla.database.KeyAndData;
import com.janilla.database.Store;
import com.janilla.io.ByteConverter;
import com.janilla.io.TransactionalByteChannel;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Factory;

public class CustomPersistenceBuilder extends ApplicationPersistenceBuilder {

	public CustomPersistenceBuilder(Path databaseFile, Factory factory) {
		super(databaseFile, factory);
	}

	@Override
	public Persistence build() {
		var e = Files.exists(databaseFile);
		var x = super.build();
		if (!e) {
			var d = SeedData.read();
			for (var c : d.contacts()) {
				c = c.withId(Stream.of(c.first(), c.last()).map(y -> y.toLowerCase().replace(' ', '_'))
						.collect(Collectors.joining("-"))).withCreatedAt(Instant.now());
				x.crud(Contact.class).create(c);
			}
		}
		return x;
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	@Override
	protected <ID extends Comparable<ID>> Store<ID, String> newStore(int bTreeOrder, TransactionalByteChannel channel,
			BTreeMemory memory, KeyAndData<String> keyAndData) {
		var x = keyAndData.key().equals("Contact") ? ByteConverter.STRING : ByteConverter.LONG;
		return (Store<ID, String>) new Store<>(new BTree<>(bTreeOrder, channel, memory,
				IdAndReference.byteConverter((ByteConverter) x), keyAndData.bTree()), ByteConverter.STRING);
	}
}
