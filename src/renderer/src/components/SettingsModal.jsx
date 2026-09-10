import { useState, useEffect } from 'react'
import { X, Shield, HardDrive, Info, Globe, Lock, Download, Upload, User, Mail, ExternalLink } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { languages } from '../i18n'
import { encryptBackup, decryptBackup } from '../utils/backup'

export default function SettingsModal({ open, passwords, onClose, onImport }) {
  const { t, language, setLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState('appLock')
  const [isAppLockConfigured, setIsAppLockConfigured] = useState(false)
  const [currentAppPassword, setCurrentAppPassword] = useState('')
  const [newAppPassword, setNewAppPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [exportMsg, setExportMsg] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (open) {
      window.api.getAppVersion().then(setAppVersion).catch(() => {})
      window.api.isAppPasswordConfigured().then(setIsAppLockConfigured).catch(() => {})
    } else {
      setPasswordMsg('')
      setExportMsg('')
      setImportMsg('')
      setCurrentAppPassword('')
      setNewAppPassword('')
    }
  }, [open])

  async function handleAppLockSave() {
    setPasswordMsg('')
    if (isAppLockConfigured) {
      const isValid = await window.api.verifyAppPassword(currentAppPassword)
      if (!isValid) return setPasswordMsg(t('settings.incorrectCurrent'))
    }

    await window.api.setAppPassword(newAppPassword)
    setIsAppLockConfigured(!!newAppPassword)
    setCurrentAppPassword('')
    setNewAppPassword('')
    setPasswordMsg(newAppPassword ? t('settings.lockEnabled') : t('settings.lockDisabled'))
  }

  async function handleExport() {
    setExportMsg('')
    try {
      const path = await window.api.exportFile()
      if (!path) return

      const password = prompt(t('settings.exportPasswordPrompt'))
      if (!password) return

      const encrypted = await encryptBackup(passwords, password)
      await window.api.writeFile(path, encrypted)
      setExportMsg(t('settings.exportSuccess'))
    } catch (e) {
      setExportMsg(t('settings.exportError'))
    }
  }

  async function handleImport() {
    setImportMsg('')
    try {
      const content = await window.api.importPasswordsFile()
      if (!content) return

      const password = prompt(t('settings.importPasswordPrompt'))
      if (!password) return

      const decrypted = await decryptBackup(content, password)
      if (!decrypted) {
        setImportMsg(t('settings.importDecryptFailed'))
        return
      }

      await onImport(decrypted)
      setImportMsg(t('settings.importSuccess', { count: decrypted.length }))
    } catch (e) {
      setImportMsg(t('settings.importError'))
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t('settings.eyebrow')}</span>
            <h2>{t('settings.title')}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          <aside className="settings-sidebar">
            <button
              className={`sidebar-tab ${activeTab === 'appLock' ? 'active' : ''}`}
              onClick={() => { setActiveTab('appLock'); setPasswordMsg(''); setExportMsg(''); setImportMsg('') }}
            >
              <Shield size={18} /> {t('settings.appLock')}
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'backupRestore' ? 'active' : ''}`}
              onClick={() => { setActiveTab('backupRestore'); setPasswordMsg(''); setExportMsg(''); setImportMsg('') }}
            >
              <HardDrive size={18} /> {t('settings.backupRestore')}
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => { setActiveTab('about'); setPasswordMsg(''); setExportMsg(''); setImportMsg('') }}
            >
              <Info size={18} /> {t('settings.about')}
            </button>
          </aside>

          <main className="settings-content">
            {activeTab === 'appLock' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Lock size={18} />{t('settings.appLock')}</h3>
                  <p className="settings-desc">{t('settings.lockDescription')}</p>
                  {isAppLockConfigured && (
                    <label>
                      <span>{t('settings.currentPassword')}</span>
                      <input type="password" value={currentAppPassword} onChange={(e) => setCurrentAppPassword(e.target.value)} />
                    </label>
                  )}
                  <label>
                    <span>{isAppLockConfigured ? t('settings.newPassword') : t('settings.setPassword')}</span>
                    <input type="password" value={newAppPassword} onChange={(e) => setNewAppPassword(e.target.value)} />
                  </label>
                  {passwordMsg && <p style={{ color: 'var(--accent)', fontSize: '13px' }}>{passwordMsg}</p>}
                  <button className="primary-button" onClick={handleAppLockSave}>
                    {isAppLockConfigured ? (newAppPassword ? t('settings.updateLock') : t('settings.disableLock')) : t('settings.enableLock')}
                  </button>
                </section>
              </div>
            )}

            {activeTab === 'backupRestore' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Download size={18} />{t('settings.exportAccounts')}</h3>
                  <p className="settings-desc">{t('settings.exportDesc')}</p>
                  <button className="primary-button" onClick={handleExport}>
                    <Download size={16} />
                    {t('settings.exportButton')}
                  </button>
                  {exportMsg && <p style={{ color: 'var(--accent)', fontSize: '13px' }}>{exportMsg}</p>}
                </section>

                <section>
                  <h3><Upload size={18} />{t('settings.importAccounts')}</h3>
                  <p className="settings-desc">{t('settings.importDesc')}</p>
                  <button className="secondary-button" onClick={handleImport}>
                    <Upload size={16} />
                    {t('settings.importButton')}
                  </button>
                  {importMsg && <p style={{ color: 'var(--accent)', fontSize: '13px' }}>{importMsg}</p>}
                </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="settings-tab-pane">
                <section className="about-section-card">
                  <div className="about-icon">
                    <Shield size={48} />
                  </div>
                  <h2>{t('common.appName')}</h2>
                  <p className="about-version">{t('common.version', { version: appVersion || '1.0.0' })}</p>
                  <div className="about-info-list">
                    <div className="about-row">
                      <User size={18} />
                      <div>
                        <span className="about-label">{t('settings.author')}</span>
                        <strong>Pedro Fernandes</strong>
                      </div>
                    </div>
                    <div className="about-row">
                      <Mail size={18} />
                      <div>
                        <span className="about-label">{t('settings.email')}</span>
                        <a href="mailto:hello@impedro.com">hello@impedro.com</a>
                      </div>
                    </div>
                    <div className="about-row">
                      <ExternalLink size={18} />
                      <div>
                        <span className="about-label">{t('settings.website')}</span>
                        <a href="https://impedro.com" target="_blank" rel="noreferrer">impedro.com</a>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>

        <footer className="settings-footer">
          <label className="language-select">
            <Globe size={14} />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>{lang.flag} {lang.label}</option>
              ))}
            </select>
          </label>
          <span>{passwordMsg || exportMsg || importMsg}</span>
        </footer>
      </div>
    </div>
  )
}
