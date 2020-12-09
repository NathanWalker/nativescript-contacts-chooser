/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

declare var io: any;


import { NavigatedData, Page } from "@nativescript/core";
import {
    ContactsChooser,
    ContactsChooserResult
} from "nativescript-contacts-chooser";
import { HomeViewModel } from "./home-view-model";

const chooser = new ContactsChooser(true);

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;

    page.bindingContext = new HomeViewModel();
    chooser.requestPermission();
}

export function openContact() {
    chooser.open().then((res: ContactsChooserResult) => {
        console.log(res);
    });
}
