import { useState } from 'react'
import { X, Wand2 } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { generatePassword } from '../utils/generator'

const CATEGORIES = [
  { value: 'work', label: 'Work' },
  { value: 'finance', label: 'Finance' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' }
]

export default function AddModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'other'
  })
  const [error, setError] = useState('')

  function resetForm() {
    setForm({ title: '', username: '', password: '', url: '', notes: '', category: 'other' })
    setError('')
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleGenerate() {
    updateField('password', generatePassword(20, true, true, true, true))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError(t('addModal.titleRequired'))
      return
    }

    await onAdd({
      ...form,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      favorite: false
    })

    resetForm()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => { resetForm(); onClose() }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('addModal.title')}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              {t('addModal.titleLabel')}
              <input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={t('addModal.titlePlaceholder')}
                autoFocus
              />
            </label>

            <label>
              {t('addModal.category')}
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{t(`categories.${cat.value}`)}</option>
                ))}
              </select>
            </label>

            <label>
              {t('addModal.usernameLabel')}
              <input
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder={t('addModal.usernamePlaceholder')}
              />
            </label>

            <label>
              {t('addModal.urlLabel')}
              <input
                value={form.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder={t('addModal.urlPlaceholder')}
              />
            </label>

            <label className="span-two">
              {t('addModal.passwordLabel')}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('addModal.passwordPlaceholder')}
                  style={{ flex: 1 }}
                />
                <button type="button" className="secondary-button" onClick={handleGenerate} style={{ flexShrink: 0 }}>
                  <Wand2 size={16} />
                </button>
              </div>
            </label>

            <label className="span-two">
              {t('addModal.notesLabel')}
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder={t('addModal.notesPlaceholder')}
              />
            </label>

            {error && (
              <div className="form-error span-two">{error}</div>
            )}

            <div className="span-two" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button type="button" className="ghost-button" onClick={onClose}>{t('common.cancel')}</button>
              <button type="submit" className="primary-button">{t('common.save')}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
