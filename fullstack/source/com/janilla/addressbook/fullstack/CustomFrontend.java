package com.janilla.addressbook.fullstack;

import java.util.Properties;

import com.janilla.addressbook.backend.ContactApi;
import com.janilla.addressbook.frontend.AddressBookFrontend;

public class CustomFrontend extends AddressBookFrontend {

	public CustomFrontend(Properties configuration) {
		super(configuration);
	}

	@Override
	protected Object contacts(String query) {
		return ContactApi.INSTANCE.get().list(query);
	}

	@Override
	protected Object contact(String id) {
		return ContactApi.INSTANCE.get().read(id);
	}
}
