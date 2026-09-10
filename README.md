# PassVault

A desktop password manager for Windows, macOS, and Linux, built with Tauri, React, and Vite. Store your passwords securely with local encryption, generate strong passwords, and organize them by category.

## Features

- Store passwords with title, username, password, URL, notes, and category
- Built-in password generator with configurable length and character types
- Search passwords by title, username, URL, or notes
- Copy usernames and passwords to the system clipboard
- Open website URLs directly from the app
- Categories: Work, Finance, Email, Social, Shopping, Other
- Confirm before deleting an entry
- Encrypted import and export using password-protected `.pvault` backup files
- Local encrypted persistence using Tauri commands, AES-GCM, and the operating system keyring
- Light and dark mode with a clean black-and-white design
- Multi-language support: English, French, Spanish, Portuguese, and German
- App lock with password protection

## Tech Stack

- Rust command handlers for local persistence, file dialogs, clipboard access, and URL opening
- Tauri 2
- React 18
- Vanilla CSS and Lucide React icons
- `open` crate for opening URLs in the default browser
- Web Crypto API for backup encryption (PBKDF2 + AES-GCM)
- `scrypt` for master password hashing
- `keyring` for secure key storage

## Development

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Create a desktop app bundle:

```bash
npm run dist
```

The generated bundles are written under:

```text
src-tauri/target/release/bundle
```

Platform-specific bundles must be built on their target platform.

## Requirements

- Node.js and npm
- Rust and Cargo
- Tauri platform prerequisites for your operating system

After changing dependencies, run `npm install` to refresh `package-lock.json`.

## Security Notes

Passwords are stored locally and encrypted with AES-GCM. The encryption key is stored in the operating system keyring. The master password is hashed with scrypt and never stored in plain text.

Exported backups are encrypted with AES-GCM using a key derived from the export password via PBKDF2 (100,000 iterations).

This app does not sync data to a server. Keep your backup password safe, because encrypted backups cannot be restored without it.
