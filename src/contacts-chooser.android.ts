import {
  AndroidActivityResultEventData,
  AndroidApplication,
  Application,
  Dialogs,
  Utils
} from "@nativescript/core";
import { hasPermission, requestPermission } from "nativescript-permissions";
import {
  Common,
  ContactsChooserInterface,
  ContactsChooserResult
} from "./contacts-chooser.common";

declare const io: any;

export class ContactsChooser
  extends Common
  implements ContactsChooserInterface {
  constructor(multiSelection?: boolean) {
    super();
    this.multiSelection = multiSelection;
  }

  private permission = android.Manifest.permission.READ_CONTACTS;

  requestPermission(): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      requestPermission(this.permission)
        .then(() => {
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
        return reject("Permission not granted");
      }

      const CommonDataKinds = android.provider.ContactsContract.CommonDataKinds;
      const SELECT_PHONE_NUMBER = 19990;
      const MULTI_CONTACT_PICKER_CODE = 38383;

      const activity: android.app.Activity =
        Application.android.startActivity ||
        Application.android.foregroundActivity;

      let intent: android.content.Intent;
      if (this.multiSelection === true) {
        intent = new android.content.Intent(
          activity,
          io.nstudio.contactpicker.ContactsPickerActivity.class
        );
        activity.startActivityForResult(intent, MULTI_CONTACT_PICKER_CODE);

        Application.android.on(
          AndroidApplication.activityResultEvent,
          (args: AndroidActivityResultEventData) => {
            Application.android.off(AndroidApplication.activityResultEvent);

            if (
              args.requestCode === MULTI_CONTACT_PICKER_CODE &&
              args.resultCode === android.app.Activity.RESULT_OK
            ) {
              const selectedContacts = args.intent.getParcelableArrayListExtra(
                "SelectedContacts"
              ) as java.util.ArrayList<any>;

              let count = 0;
              const contacts = [];
              while (selectedContacts.size() > count) {
                const x = selectedContacts.get(count);
                contacts.push({
                  id: x.id,
                  name: x.name,
                  phone: x.phone,
                  label: x.label,
                });
                count++;
              }

              return resolve(contacts);
            }
          }
        );

        return;
      } else {
        intent = new android.content.Intent(android.content.Intent.ACTION_PICK);
        intent.setType(android.provider.ContactsContract.Contacts.CONTENT_TYPE);
        try {
          activity.startActivityForResult(intent, SELECT_PHONE_NUMBER);
        } catch (err) {
          return reject();
        }

        Application.android.on(
          AndroidApplication.activityResultEvent,
          (args: AndroidActivityResultEventData) => {
            Application.android.off(AndroidApplication.activityResultEvent);

            const { requestCode, intent } = args;

            if (requestCode !== SELECT_PHONE_NUMBER) {
              return reject();
            }

            if (!intent) {
              return reject();
            }

            const uri = intent.getData();
            const resolver = <android.content.ContentResolver>(
              Utils.ad.getApplicationContext().getContentResolver()
            );

            const cursor = resolver.query(uri, null, null, null, null);
            if (cursor.moveToFirst()) {
              const contactId = cursor.getString(
                cursor.getColumnIndex(
                  (android.provider.ContactsContract.Contacts as any)._ID
                )
              );
              const phones = resolver.query(
                CommonDataKinds.Phone.CONTENT_URI,
                null,
                (CommonDataKinds.Phone as any).CONTACT_ID + "=" + contactId,
                null,
                null
              );

              const phonesList = [];
              const phoneNumbers = [];

              while (phones.moveToNext()) {
                const phoneNumber = phones
                  .getString(
                    phones.getColumnIndex(CommonDataKinds.Phone.NUMBER)
                  )
                  .replace(/\s+/g, "");
                phonesList.push(phoneNumber);
              }

              const nameIndex = cursor.getColumnIndex(
                (CommonDataKinds.Phone as any).DISPLAY_NAME
              );
              const name = cursor.getString(nameIndex);

              phonesList.map((phone) => {
                const exists = phoneNumbers.find((phn) => {
                  return phn.includes(phone.substr(-10, 10));
                });

                if (!exists) {
                  phoneNumbers.push(phone);
                }
              });

              console.log(phoneNumbers);

              if (phoneNumbers.length < 2) {
                return resolve(
                  new ContactsChooserResult({ name, phone: phoneNumbers[0] })
                );
              }

              const cancelButtonText = "Cancel";

              Dialogs.action({
                title: "Select A Number",
                actions: phoneNumbers,
                cancelButtonText,
              }).then((res) => {
                if (res === cancelButtonText) {
                  return reject();
                }

                return resolve(new ContactsChooserResult({ name, phone: res }));
              });
            }
          }
        );
      }
    });
  }
}
