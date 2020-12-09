import { Dialogs, Utils } from "@nativescript/core";
import {
  Common,
  ContactsChooserInterface,
  ContactsChooserResult,
} from "./contacts-chooser.common";

export class ContactsChooser
  extends Common
  implements ContactsChooserInterface {
  private _delegate: NSObject;

  constructor(multiSelection?: boolean) {
    super();
    this.multiSelection = multiSelection;
  }

  requestPermission(): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  open(
    pickerDisplayKeys?: Array<string>
  ): Promise<ContactsChooserResult | Array<ContactsChooserResult>> {
    return new Promise((resolve, reject) => {
      const contact_picker = CNContactPickerViewController.alloc().init();
      const appWindow = UIApplication.sharedApplication.keyWindow;

      contact_picker.displayedPropertyKeys = NSArray.arrayWithArray(
        pickerDisplayKeys || [
          CNContactPhoneNumbersKey,
          CNContactEmailAddressesKey,
          CNContactFamilyNameKey,
          CNContactGivenNameKey,
          CNContactOrganizationNameKey,
          CNContactDepartmentNameKey,
        ]
      );
      if (this.multiSelection) {
        this._delegate = DelegatorMulti.initWithOwner(this, resolve, reject);
      } else {
        this._delegate = Delegator.initWithOwner(this, resolve, reject);
      }
      contact_picker.delegate = this._delegate;
      appWindow.rootViewController.presentViewControllerAnimatedCompletion(
        contact_picker,
        true,
        null
      );
    });
  }
}

@NativeClass()
class Delegator extends NSObject implements CNContactPickerDelegate {
  static ObjCProtocols = [CNContactPickerDelegate];
  owner: WeakRef<ContactsChooser>;
  resolve: any;
  reject: any;

  static initWithOwner(owner: ContactsChooser, resolve, reject) {
    const delegate = <Delegator>Delegator.new();
    delegate.owner = new WeakRef(owner);
    delegate.resolve = resolve;
    delegate.reject = reject;
    return delegate;
  }

  contactPickerDidSelectContact(ctrl, contact: CNContact) {
    console.log("contactPickerDidSelectContact", contact);

    const jsContacts = extractFields(
      Utils.ios.collections.jsArrayToNSArray(<any>[contact])
    );
    const singleContact = jsContacts[0];
    if (contact.phoneNumbers.count === 1) {
      this.resolve(
        new ContactsChooserResult({
          name: singleContact.name,
          firstName: singleContact.firstName,
          lastName: singleContact.lastName,
          phone: contact.phoneNumbers
            .objectAtIndex(0)
            .value.stringValue.replace(/s+/g, ""),
          emails: singleContact.emails,
        })
      );
    } else {
      const cancelButtonText = "Cancel";

      setTimeout(() => {
        Dialogs.action({
          title: "Select A Number",
          actions: singleContact.phones,
          cancelButtonText,
        }).then((res) => {
          if (res === cancelButtonText) {
            return this.reject(null);
          }

          return this.resolve(
            new ContactsChooserResult({
              name,
              phone: res,
              phones: singleContact.phones,
              emails: singleContact.emails,
            })
          );
        });
      }, 570);
    }
  }

  contactPickerDidCancel(ctrl) {
    this.reject(null);
  }
}

@NativeClass()
class DelegatorMulti extends NSObject implements CNContactPickerDelegate {
  static ObjCProtocols = [CNContactPickerDelegate];
  owner: WeakRef<ContactsChooser>;
  resolve: any;
  reject: any;

  static initWithOwner(owner: ContactsChooser, resolve, reject) {
    const delegate = <DelegatorMulti>DelegatorMulti.new();
    delegate.owner = new WeakRef(owner);
    delegate.resolve = resolve;
    delegate.reject = reject;
    return delegate;
  }

  contactPickerDidSelectContacts(
    ctrl: CNContactPickerViewController,
    contacts: NSArray<CNContact>
  ) {
    console.log("contactPickerDidSelectContacts", contacts);
    const jsContacts = extractFields(contacts);
    const chooserResults = [];
    for (const jsContact of jsContacts) {
      chooserResults.push(new ContactsChooserResult(jsContact));
    }
    this.resolve(chooserResults);
  }

  contactPickerDidCancel(ctrl) {
    this.reject(null);
  }
}

const extractFields = function (
  contacts: NSArray<CNContact>
): Array<{
  name: string;
  firstName: string;
  lastName: string;
  emails: Array<string>;
  phones: Array<string>;
}> {
  const jsContacts = [];
  for (let i = 0; i < contacts.count; i++) {
    const contact: CNContact = contacts.objectAtIndex(i);
    // CNContactFormatter.descriptorForRequiredKeysForStyle(CNContactFormatterStyle.FullName),
    const name = CNContactFormatter.stringFromContactStyle(
      contact,
      CNContactFormatterStyle.FullName
    );

    // may want this back:
    // Determine if fullName above gives back same or better
    // let composedName = `${contact.givenName} ${contact.familyName}`;

    const emails = [];
    for (let i = 0; i < contact.emailAddresses.count; i++) {
      emails.push(contact.emailAddresses.objectAtIndex(i).value);
    }

    const phones = [];
    for (let i = 0; i < contact.phoneNumbers.count; i++) {
      phones.push(contact.phoneNumbers.objectAtIndex(i).value.stringValue);
    }
    jsContacts.push({
      name,
      firstName: contact.givenName,
      lastName: contact.familyName,
      emails,
      phones,
    });
  }
  return jsContacts;
};
