import { Common, ContactsChooserInterface, ContactsChooserResult } from './contacts-chooser.common';
import {
    AndroidActivityResultEventData,
    AndroidApplication,
    Application,
    Dialogs,
    Utils
} from '@nativescript/core';
import { requestPermission, hasPermission } from 'nativescript-permissions';

export class ContactsChooser extends Common implements ContactsChooserInterface {

  constructor(multiSelection?: boolean) {
    super();
    this.multiSelection = multiSelection;
  }

    private permission = android.Manifest.permission.READ_CONTACTS;

    requestPermission(): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            requestPermission(this.permission).then(() => {
                resolve(true);
            })
            .catch(() => {
                reject(false);
            });
        });
    }

    open(): Promise<ContactsChooserResult> {
        return new Promise((resolve, reject) => {

            if (!hasPermission(this.permission)) {
                return reject('Permission not granted');
            }

            const CommonDataKinds = android.provider.ContactsContract.CommonDataKinds;
            const SELECT_PHONE_NUMBER = 19990;

            let intent = new android.content.Intent(android.content.Intent.ACTION_PICK);
            intent.setType(android.provider.ContactsContract.Contacts.CONTENT_TYPE);
            let activity = Application.android.startActivity;

            try {
                activity.startActivityForResult(intent, SELECT_PHONE_NUMBER);
            } catch (err) {
                return reject();
            }

            Application.android.on(AndroidApplication.activityResultEvent, (args: AndroidActivityResultEventData) => {
                Application.android.off(AndroidApplication.activityResultEvent);

                let {requestCode, intent} = args;

                if (requestCode !== SELECT_PHONE_NUMBER) {
                    return reject();
                }

                if (!intent) {
                    return reject();
                }

                let uri = intent.getData();
                let resolver = <android.content.ContentResolver>Utils.ad.getApplicationContext().getContentResolver();

                let cursor = resolver.query(uri, null, null, null, null);
                if (cursor.moveToFirst()) {

                    // @ts-ignore
                    let contactId = cursor.getString(cursor.getColumnIndex(android.provider.ContactsContract.Contacts._ID));
                    let phones = resolver.query(
                        CommonDataKinds.Phone.CONTENT_URI, null,
                        // @ts-ignore
                        CommonDataKinds.Phone.CONTACT_ID + "=" + contactId,
                        null, null);

                    let phonesList = [];
                    let phoneNumbers = [];

                    while (phones.moveToNext()) {
                        let phoneNumber = phones.getString(phones.getColumnIndex(CommonDataKinds.Phone.NUMBER)).replace(/\s+/g, '');
                        phonesList.push(phoneNumber);
                    }

                    // @ts-ignore
                    let nameIndex = cursor.getColumnIndex(CommonDataKinds.Phone.DISPLAY_NAME);
                    let name = cursor.getString(nameIndex);

                    phonesList.map(phone => {
                        let exists = phoneNumbers.find(phn => {
                            return phn.includes(phone.substr(-10, 10));
                        });

                        if (!exists) {
                            phoneNumbers.push(phone);
                        }
                    });

                    if (phoneNumbers.length < 2) {
                        return resolve(new ContactsChooserResult({ name, phone: phoneNumbers[0]}));
                    }

                    let cancelButtonText = 'Cancel';

                    Dialogs.action({
                        title: 'Select A Number',
                        actions: phoneNumbers,
                        cancelButtonText
                    })
                    .then(res => {
                        if (res === cancelButtonText) {
                            return reject();
                        }

                        return resolve(new ContactsChooserResult({name, phone: res}));
                    });
                }
            });
        });
    }
}