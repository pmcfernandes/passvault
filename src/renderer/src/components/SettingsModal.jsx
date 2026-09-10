import { useState, useEffect, useMemo } from 'react'
import { X, Shield, HardDrive, Info, Globe, Lock, Download, Upload, User, Mail, ExternalLink, Eye, FileSpreadsheet } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { languages } from '../i18n'
import { encryptBackup, decryptBackup, mergeAccounts } from '../utils/backup'
import { parseEdgeCsv } from '../utils/csv'

export default function SettingsModal({ open, passwords, onClose, onImport }) {
  const { t, language, setLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState('appLock')
  const [isAppLockConfigured, setIsAppLockConfigured] = useState(false)
  const [currentAppPassword, setCurrentAppPassword] = useState('')
  const [newAppPassword, setNewAppPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [exportPassword, setExportPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [appVersion, setAppVersion] = useState('')
  const [csvPreview, setCsvPreview] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const strength = useMemo(() => scorePassword(exportPassword), [exportPassword])

  useEffect(() => {
    if (open) {
      window.api.getAppVersion().then(setAppVersion).catch(() => {})
      window.api.isAppPasswordConfigured().then(setIsAppLockConfigured).catch(() => {})
    } else {
      setPasswordMsg('')
      setMessage('')
      setCurrentAppPassword('')
      setNewAppPassword('')
      setExportPassword('')
      setImportPassword('')
      setPreview(null)
      setCsvPreview(null)
      setCsvFile(null)
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

  async function exportPasswords() {
    if (exportPassword.length < 8) return setMessage(t('settings.minChars'))
    try {
      const encrypted = await encryptBackup(passwords, exportPassword)
      const filePath = await window.api.exportPasswords(encrypted)
      setMessage(filePath ? t('settings.exported', { count: passwords.length }) : t('settings.exportCancelled'))
    } catch (e) {
      console.error('Export failed:', e)
      setMessage('Export failed: ' + (e.message || e))
    }
  }

  async function loadImportPreview() {
    if (!importPassword) return setMessage(t('settings.enterPassword'))
    const content = await window.api.importPasswordsFile()
    if (!content) return setMessage(t('settings.importCancelled'))
    const imported = await decryptBackup(content, importPassword)
    if (!imported) return setMessage(t('settings.wrongPassword'))
    const result = mergeAccounts(passwords, imported)
    setPreview(result)
    setMessage(t('settings.previewSummary', { newCount: result.newAccounts.length, dupCount: result.duplicateCount }))
  }

  async function confirmImport() {
    if (!preview) return
    await onImport(preview.newAccounts)
    setMessage(t('settings.imported', { count: preview.newAccounts.length }))
    setPreview(null)
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const entries = parseEdgeCsv(text)
      const result = mergeAccounts(passwords, entries)
      setCsvPreview(result)
      setMessage(t('settings.csvPreview', { newCount: result.newAccounts.length, dupCount: result.duplicateCount }))
    }
    reader.readAsText(file)
  }

  async function confirmCsvImport() {
    if (!csvPreview) return
    await onImport(csvPreview.newAccounts)
    setMessage(t('settings.csvImported', { count: csvPreview.newAccounts.length }))
    setCsvPreview(null)
    setCsvFile(null)
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
              onClick={() => { setActiveTab('appLock'); setPasswordMsg(''); setMessage('') }}
            >
              <Shield size={18} /> {t('settings.appLock')}
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'backupRestore' ? 'active' : ''}`}
              onClick={() => { setActiveTab('backupRestore'); setPasswordMsg(''); setMessage('') }}
            >
              <HardDrive size={18} /> {t('settings.backupRestore')}
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'imports' ? 'active' : ''}`}
              onClick={() => { setActiveTab('imports'); setPasswordMsg(''); setMessage('') }}
            >
              <FileSpreadsheet size={18} /> {t('settings.imports')}
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => { setActiveTab('about'); setPasswordMsg(''); setMessage('') }}
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
                  <label>
                    <span>{t('common.password')}</span>
                    <input type="password" value={exportPassword} onChange={(e) => setExportPassword(e.target.value)} />
                  </label>
                  <div className="strength">
                    <span style={{ width: `${strength}%` }} />
                  </div>
                  <button className="primary-button" onClick={exportPasswords}>
                    <Lock size={17} />
                    {t('settings.exportButton')}
                  </button>
                </section>

                <section>
                  <h3><Upload size={18} />{t('settings.importAccounts')}</h3>
                  <label>
                    <span>{t('common.password')}</span>
                    <input type="password" value={importPassword} onChange={(e) => setImportPassword(e.target.value)} />
                  </label>
                  <button className="secondary-button" onClick={loadImportPreview}>
                    <Eye size={17} />
                    {t('settings.previewImport')}
                  </button>
                  {preview && (
                    <button className="primary-button" onClick={confirmImport}>
                      {t('settings.importButton', { count: preview.newAccounts.length })}
                    </button>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'imports' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><FileSpreadsheet size={18} />{t('settings.edgeImport')}</h3>
                  <p className="settings-desc">{t('settings.edgeImportDesc')}</p>
                  <label className="csv-upload">
                    <input type="file" accept=".csv" onChange={handleCsvFile} style={{ display: 'none' }} />
                    <Upload size={18} />
                    {csvFile ? csvFile.name : t('settings.selectCsvFile')}
                  </label>
                  {csvPreview && (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {t('settings.csvPreview', { newCount: csvPreview.newAccounts.length, dupCount: csvPreview.duplicateCount })}
                      </p>
                      <button className="primary-button" onClick={confirmCsvImport}>
                        {t('settings.importButton', { count: csvPreview.newAccounts.length })}
                      </button>
                    </>
                  )}
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
          <span>{passwordMsg || message}</span>
        </footer>
      </div>
    </div>
  )
}

function scorePassword(password) {
  let score = 0
  if (password.length >= 8) score += 35
  if (password.length >= 14) score += 25
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 10
  return Math.min(score, 100)
}
