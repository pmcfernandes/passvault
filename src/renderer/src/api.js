import { invoke } from '@tauri-apps/api/core'

export function installApi() {
  window.api = {
    getPasswords: () => invoke('get_passwords'),
    addPassword: (entry) => invoke('add_password', { entry }),
    deletePassword: (id) => invoke('delete_password', { id }),
    updatePassword: (id, data) => invoke('update_password', { id, data }),
    reorderPasswords: (ids) => invoke('reorder_passwords', { ids }),
    savePasswords: (passwords) => invoke('save_passwords', { passwords }),
    exportFile: () => invoke('export_file'),
    importFile: () => invoke('import_file'),
    writeFile: (filePath, content) => invoke('write_file', { filePath, content }),
    exportPasswords: (content) => invoke('export_passwords', { content }),
    importPasswordsFile: () => invoke('import_passwords_file'),
    isSafeStorageAvailable: () => invoke('safe_storage_available'),
    getAppVersion: () => invoke('app_version'),
    copyText: (text) => invoke('copy_text', { text }),
    openUrl: (url) => invoke('open_url', { url }),
    isAppPasswordConfigured: () => invoke('is_app_password_configured'),
    verifyAppPassword: (password) => invoke('verify_app_password', { password }),
    setAppPassword: (password) => invoke('set_app_password', { password })
  }
}
