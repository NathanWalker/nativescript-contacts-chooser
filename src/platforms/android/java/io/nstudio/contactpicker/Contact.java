package io.nstudio.contactpicker;

import android.os.Parcel;
import android.os.Parcelable;

public class Contact implements Parcelable {

    public String id, name, phone, label, email;

    Contact(String id, String name, String phone, String label, String email) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.label = label;
        this.email = email;
    }

    protected Contact(Parcel in) {
        id = in.readString();
        name = in.readString();
        phone = in.readString();
        label = in.readString();
        email = in.readString();
    }

    public static final Creator<Contact> CREATOR = new Creator<Contact>() {
        @Override
        public Contact createFromParcel(Parcel in) {
            return new Contact(in);
        }

        @Override
        public Contact[] newArray(int size) {
            return new Contact[size];
        }
    };

    @Override
    public String toString() {
        return name + " | " + label + " : " + phone;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(id);
        dest.writeString(name);
        dest.writeString(phone);
        dest.writeString(label);
        dest.writeString(email);
    }
}
