use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use rand::RngCore;
use scrypt::{scrypt, Params};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const KEYRING_SERVICE: &str = "passvault";
const KEYRING_USER: &str = "passwords-key";

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoreData {
  passwords: Vec<Value>,
  app_password_salt: Option<String>,
  app_password_hash: Option<String>,
}

fn storage_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("passwords.json"))
}

fn key_file_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("passwords.key"))
}

fn read_store(app: &AppHandle) -> Result<StoreData, String> {
  let path = storage_path(app)?;
  if !path.exists() {
    return Ok(StoreData::default());
  }

  let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
  serde_json::from_str(&content).map_err(|error| error.to_string())
}

fn write_store(app: &AppHandle, store: &StoreData) -> Result<(), String> {
  let content = serde_json::to_string_pretty(store).map_err(|error| error.to_string())?;
  fs::write(storage_path(app)?, content).map_err(|error| error.to_string())
}

fn decode_key(encoded: &str) -> Result<[u8; 32], String> {
  let bytes = STANDARD.decode(encoded).map_err(|error| error.to_string())?;
  bytes
    .try_into()
    .map_err(|_| "Stored encryption key has an invalid length".to_string())
}

fn encryption_key(app: &AppHandle) -> Result<[u8; 32], String> {
  if let Ok(entry) = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER) {
    if let Ok(encoded) = entry.get_password() {
      return decode_key(&encoded);
    }

    let mut key = [0_u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    if entry.set_password(&STANDARD.encode(key)).is_ok() {
      return Ok(key);
    }
  }

  let path = key_file_path(app)?;
  if path.exists() {
    return decode_key(&fs::read_to_string(path).map_err(|error| error.to_string())?);
  }

  let mut key = [0_u8; 32];
  rand::thread_rng().fill_bytes(&mut key);
  fs::write(path, STANDARD.encode(key)).map_err(|error| error.to_string())?;
  Ok(key)
}

fn encrypt_secret(app: &AppHandle, secret: &str) -> Result<String, String> {
  let key = encryption_key(app)?;
  let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
  let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
  let ciphertext = cipher
    .encrypt(&nonce, secret.as_bytes())
    .map_err(|error| error.to_string())?;

  Ok(format!("{}:{}", STANDARD.encode(nonce), STANDARD.encode(ciphertext)))
}

fn decrypt_secret(app: &AppHandle, value: &str) -> Result<String, String> {
  let (nonce, ciphertext) = value
    .split_once(':')
    .ok_or_else(|| "Encrypted secret is missing a nonce".to_string())?;
  let nonce_bytes = STANDARD.decode(nonce).map_err(|error| error.to_string())?;
  if nonce_bytes.len() != 12 {
    return Err("Encrypted secret has an invalid nonce length".to_string());
  }
  let ciphertext_bytes = STANDARD.decode(ciphertext).map_err(|error| error.to_string())?;
  let key = encryption_key(app)?;
  let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
  let plaintext = cipher
    .decrypt(Nonce::from_slice(&nonce_bytes), ciphertext_bytes.as_ref())
    .map_err(|error| error.to_string())?;

  String::from_utf8(plaintext).map_err(|error| error.to_string())
}

fn normalized_passwords(passwords: Vec<Value>) -> Vec<Value> {
  passwords
    .into_iter()
    .filter(|entry| {
      entry.get("id").and_then(Value::as_str).is_some()
    })
    .collect()
}

fn protect_entry(app: &AppHandle, entry: Value) -> Result<Value, String> {
  let Some(mut object) = entry.as_object().cloned() else {
    return Ok(entry);
  };

  object.remove("passwordProtected");
  let Some(password) = object.get("password").and_then(Value::as_str) else {
    return Ok(Value::Object(object));
  };
  if password.is_empty() {
    return Ok(Value::Object(object));
  }

  let protected = encrypt_secret(app, password)?;
  object.remove("password");
  object.insert("passwordProtected".to_string(), Value::String(protected));
  Ok(Value::Object(object))
}

fn unprotect_entry(app: &AppHandle, entry: Value) -> Value {
  let Some(mut object) = entry.as_object().cloned() else {
    return entry;
  };

  let Some(password_protected) = object.get("passwordProtected").and_then(Value::as_str) else {
    return Value::Object(object);
  };

  let password = decrypt_secret(app, password_protected).unwrap_or_default();
  object.remove("passwordProtected");
  object.insert("password".to_string(), Value::String(password));
  Value::Object(object)
}

fn public_passwords(app: &AppHandle) -> Result<Vec<Value>, String> {
  let store = read_store(app)?;
  Ok(store
    .passwords
    .into_iter()
    .map(|entry| unprotect_entry(app, entry))
    .collect())
}

fn set_passwords(app: &AppHandle, passwords: Vec<Value>) -> Result<Vec<Value>, String> {
  let mut store = read_store(app)?;
  let protected_entries = normalized_passwords(passwords)
    .into_iter()
    .map(|entry| protect_entry(app, entry))
    .collect::<Result<Vec<_>, _>>()?;
  store.passwords = protected_entries;
  write_store(app, &store)?;
  public_passwords(app)
}

fn password_hash(password: &str, salt: &str) -> Result<String, String> {
  let params = Params::new(14, 8, 1, 64).map_err(|error| error.to_string())?;
  let mut output = [0_u8; 64];
  scrypt(password.as_bytes(), salt.as_bytes(), &params, &mut output).map_err(|error| error.to_string())?;
  Ok(hex::encode(output))
}

#[tauri::command]
fn get_passwords(app: AppHandle) -> Result<Vec<Value>, String> {
  public_passwords(&app)
}

#[tauri::command]
fn save_passwords(app: AppHandle, passwords: Vec<Value>) -> Result<Vec<Value>, String> {
  set_passwords(&app, passwords)
}

#[tauri::command]
fn add_password(app: AppHandle, entry: Value) -> Result<Vec<Value>, String> {
  let mut passwords = public_passwords(&app)?;
  passwords.push(entry);
  set_passwords(&app, passwords)
}

#[tauri::command]
fn update_password(app: AppHandle, id: String, data: Map<String, Value>) -> Result<Vec<Value>, String> {
  let passwords = public_passwords(&app)?
    .into_iter()
    .map(|entry| {
      let Some(mut object) = entry.as_object().cloned() else {
        return entry;
      };
      if object.get("id").and_then(Value::as_str) == Some(id.as_str()) {
        for (key, value) in data.iter() {
          object.insert(key.clone(), value.clone());
        }
        object.insert("id".to_string(), Value::String(id.clone()));
      }
      Value::Object(object)
    })
    .collect();
  set_passwords(&app, passwords)
}

#[tauri::command]
fn delete_password(app: AppHandle, id: String) -> Result<Vec<Value>, String> {
  let passwords = public_passwords(&app)?
    .into_iter()
    .filter(|entry| entry.get("id").and_then(Value::as_str) != Some(id.as_str()))
    .collect();
  set_passwords(&app, passwords)
}

#[tauri::command]
fn reorder_passwords(app: AppHandle, ids: Vec<String>) -> Result<Vec<Value>, String> {
  let mut passwords = public_passwords(&app)?;
  passwords.sort_by_key(|entry| {
    let id = entry.get("id").and_then(Value::as_str).unwrap_or_default();
    ids.iter().position(|current| current == id).unwrap_or(usize::MAX)
  });
  set_passwords(&app, passwords)
}

#[tauri::command]
fn export_file() -> Option<String> {
  rfd::FileDialog::new()
    .set_title("Export encrypted backup")
    .set_file_name("passwords.pvault")
    .add_filter("PassVault Backup", &["pvault"])
    .save_file()
    .map(|path| path.to_string_lossy().into_owned())
}

#[tauri::command]
fn import_file() -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("Import encrypted backup")
    .add_filter("PassVault Backup", &["pvault", "json"])
    .pick_file()
  else {
    return Ok(None);
  };

  fs::read_to_string(path).map(Some).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_file(file_path: String, content: String) -> Result<bool, String> {
  fs::write(file_path, content).map_err(|error| error.to_string())?;
  Ok(true)
}

#[tauri::command]
fn export_passwords(content: String) -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("Export encrypted backup")
    .set_file_name("passwords.pvault")
    .add_filter("PassVault Backup", &["pvault"])
    .save_file()
  else {
    return Ok(None);
  };

  fs::write(&path, content).map_err(|error| error.to_string())?;
  Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
fn import_passwords_file() -> Result<Option<String>, String> {
  import_file()
}

#[tauri::command]
fn safe_storage_available(app: AppHandle) -> bool {
  encryption_key(&app).is_ok()
}

#[tauri::command]
fn app_version(app: AppHandle) -> String {
  app.package_info().version.to_string()
}

#[tauri::command]
fn copy_text(text: String) -> Result<bool, String> {
  let mut clipboard = arboard::Clipboard::new().map_err(|error| error.to_string())?;
  clipboard.set_text(text).map_err(|error| error.to_string())?;
  Ok(true)
}

#[tauri::command]
fn open_url(url: String) -> Result<bool, String> {
  open::that(&url).map_err(|error| error.to_string())?;
  Ok(true)
}

#[tauri::command]
fn is_app_password_configured(app: AppHandle) -> Result<bool, String> {
  Ok(read_store(&app)?.app_password_hash.is_some())
}

#[tauri::command]
fn verify_app_password(app: AppHandle, password: String) -> Result<bool, String> {
  let store = read_store(&app)?;
  let Some(hash) = store.app_password_hash else {
    return Ok(true);
  };
  let Some(salt) = store.app_password_salt else {
    return Ok(true);
  };

  Ok(password_hash(&password, &salt)? == hash)
}

#[tauri::command]
fn set_app_password(app: AppHandle, password: String) -> Result<bool, String> {
  let mut store = read_store(&app)?;
  if password.is_empty() {
    store.app_password_hash = None;
    store.app_password_salt = None;
  } else {
    let mut salt_bytes = [0_u8; 16];
    rand::thread_rng().fill_bytes(&mut salt_bytes);
    let salt = hex::encode(salt_bytes);
    store.app_password_hash = Some(password_hash(&password, &salt)?);
    store.app_password_salt = Some(salt);
  }

  write_store(&app, &store)?;
  Ok(true)
}

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      get_passwords,
      save_passwords,
      add_password,
      update_password,
      delete_password,
      reorder_passwords,
      export_file,
      import_file,
      write_file,
      export_passwords,
      import_passwords_file,
      safe_storage_available,
      app_version,
      copy_text,
      open_url,
      is_app_password_configured,
      verify_app_password,
      set_app_password
    ])
    .run(tauri::generate_context!())
    .expect("error while running Tauri application");
}
