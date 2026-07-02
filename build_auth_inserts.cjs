const fs = require('fs');

function parseCopy(filename, tableName, cols) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split(/\r?\n/);
    
    let dataStarted = false;
    const inserts = [];
    
    for (let line of lines) {
        if (line.startsWith('COPY')) {
            dataStarted = true;
            continue;
        }
        if (dataStarted) {
            if (line.startsWith('\\.')) break;
            if (!line.trim()) continue;
            
            const row = line.split('\t');
            const vals = row.map(val => {
                if (val === '\\N') return 'NULL';
                return `'${val.replace(/'/g, "''")}'`;
            });
            inserts.push(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;`);
        }
    }
    return inserts;
}

const userCols = ["instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous"];
const idCols = ["provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id"];

const userInserts = parseCopy('auth_users_data.sql', 'auth.users', userCols);
const idInserts = parseCopy('auth_identities_data.sql', 'auth.identities', idCols);

let out = "BEGIN;\n";
userInserts.forEach(i => out += i + "\n");
idInserts.forEach(i => out += i + "\n");
out += "COMMIT;\n";

fs.writeFileSync('restore_auth_data.sql', out);
