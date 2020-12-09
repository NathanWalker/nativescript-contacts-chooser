package io.nstudio.contactpicker;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class ContactsPickerActivity extends AppCompatActivity {

    private static final String TAG = "ContactsPickerActivity";
    ListView contactsChooser;
    Button btnDone;
    EditText txtFilter;
    TextView txtLoadInfo;
    ContactsListAdapter contactsListAdapter;
    ContactsLoader contactsLoader;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_contacts_picker);

        contactsChooser = findViewById(R.id.lst_contacts_chooser);
        btnDone = findViewById(R.id.btn_done);
        txtFilter = findViewById(R.id.txt_filter);
        txtLoadInfo = findViewById(R.id.txt_load_progress);
        contactsListAdapter = new ContactsListAdapter(this, new ContactsList());
        contactsChooser.setAdapter(contactsListAdapter);

        loadContacts("");

        txtFilter.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                contactsListAdapter.filter(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        btnDone.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (contactsListAdapter.selectedContactsList.contactArrayList.isEmpty()) {
                    setResult(RESULT_CANCELED);
                } else {
                    Intent resultIntent = new Intent();
                    resultIntent.putParcelableArrayListExtra("SelectedContacts", contactsListAdapter.selectedContactsList.contactArrayList);
                    setResult(RESULT_OK, resultIntent);
                }
                finish();
            }
        });
    }


    private void loadContacts(String filter) {
        if (contactsLoader != null && contactsLoader.getStatus() != AsyncTask.Status.FINISHED) {
            try {
                contactsLoader.cancel(true);
            } catch (Exception e) {
                Log.d(TAG, "Unable to load contacts " + e.toString());
            }
        }
        if (filter == null) filter = "";

        try {
            // Running AsyncLoader with adapter and  filter
            contactsLoader = new ContactsLoader(this, contactsListAdapter);
            contactsLoader.txtProgress = txtLoadInfo;
            contactsLoader.execute(filter);
        } catch (Exception e) {
            e.printStackTrace();
            Log.e(TAG, "Error loading ContactsLoader " + e.getMessage());
        }
    }
}
