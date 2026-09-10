import { useState, useEffect } from 'react'
import { KeyRound } from 'lucide-react'
import AddModal from './components/AddModal'
import PasswordList from './components/PasswordList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import LockScreen from './components/LockScreen'
import GeneratorModal from './components/GeneratorModal'
import { usePasswords } from './hooks/usePasswords'
import { TranslationProvider, useTranslation } from './hooks/useTranslation'

export default function App() {
  return (
    <TranslationProvider>
      <AppInner />
    </TranslationProvider>
  )
}

function AppInner() {
  const passwords = usePasswords()
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [checkingLock, setCheckingLock] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    window.api.isAppPasswordConfigured().then((configured) => {
      setIsLocked(configured)
      setCheckingLock(false)
    })
  }, [])

  if (checkingLock) {
    return <main className="app-shell"><div className="loading-panel">{t('app.loadingVault')}</div></main>
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />
  }

  return (
    <main className="app-shell">
      <Header
        query={passwords.searchQuery}
        onQueryChange={passwords.setSearchQuery}
        onAdd={() => setAddOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onGenerator={() => setGeneratorOpen(true)}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <section className="content-shell">
        <div className="status-strip">
          <div>
            <span className="eyebrow">{t('app.vault')}</span>
            <strong>{passwords.passwords.length} {passwords.passwords.length === 1 ? t('app.entry') : t('app.entries')}</strong>
          </div>
          <div>
            <span className="eyebrow">{t('app.storage')}</span>
            <strong><KeyRound size={16} /> {t('app.osEncrypted')}</strong>
          </div>
        </div>

        {passwords.loading ? (
          <div className="loading-panel">{t('app.loadingVault')}</div>
        ) : passwords.passwords.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} onImport={() => setSettingsOpen(true)} />
        ) : (
          <PasswordList entries={passwords.filteredPasswords} onDelete={passwords.deletePassword} onDeleteBulk={passwords.deletePasswords} onEdit={(entry) => { setEditingEntry(entry); setAddOpen(true) }} />
        )}
      </section>

      <AddModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditingEntry(null) }}
        onAdd={async (entry) => {
          if (editingEntry) {
            await passwords.updatePassword(entry.id, entry)
          } else {
            await passwords.addPassword(entry)
          }
          setAddOpen(false)
          setEditingEntry(null)
        }}
        editEntry={editingEntry}
      />

      <SettingsModal
        open={settingsOpen}
        passwords={passwords.passwords}
        onClose={() => setSettingsOpen(false)}
        onImport={passwords.importPasswords}
      />

      <GeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
      />
    </main>
  )
}
