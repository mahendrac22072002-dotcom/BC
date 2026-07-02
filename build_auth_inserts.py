import sys
import csv
from io import StringIO

def parse_copy(filename, table_name, cols):
    inserts = []
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    data_started = False
    for line in lines:
        if line.startswith('COPY'):
            data_started = True
            continue
        if data_started:
            if line.startswith('\\.'):
                break
            
            # TSV parse
            row = line.rstrip('\n').split('\t')
            
            vals = []
            for val in row:
                if val == '\\N':
                    vals.append('NULL')
                else:
                    # escape single quotes
                    escaped = val.replace("'", "''")
                    vals.append(f"'{escaped}'")
            
            inserts.append(f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;")
    return inserts

user_cols = ["instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous"]
identities_cols = ["provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id"]

user_inserts = parse_copy('auth_users_data.sql', 'auth.users', user_cols)
id_inserts = parse_copy('auth_identities_data.sql', 'auth.identities', identities_cols)

with open('restore_auth_data.sql', 'w', encoding='utf-8') as f:
    f.write('BEGIN;\n')
    for stmt in user_inserts:
        f.write(stmt + '\n')
    for stmt in id_inserts:
        f.write(stmt + '\n')
    f.write('COMMIT;\n')
