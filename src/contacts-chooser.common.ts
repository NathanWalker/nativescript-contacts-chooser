export interface ContactsChooserInterface {
  open(pickerDisplayKeys?: Array<string>): Promise<ContactsChooserResult | Array<ContactsChooserResult>>;
  requestPermission(): Promise<Boolean>;
}

export interface IContactChooserResult {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phones?: Array<string>;
  emails?: Array<string>;
  address?: string;
  image?: any;
}

export class ContactsChooserResult implements IContactChooserResult {

  constructor(props?: IContactChooserResult) {
    if (props) {
      for (const key in props) {
        this[key] = props[key];
      }
    }
  }
}

export class Common {
  multiSelection = false;
}
