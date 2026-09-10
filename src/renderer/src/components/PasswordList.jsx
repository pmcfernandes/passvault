import { useState } from 'react'
import { Copy, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

const CATEGORY_COLORS = {
  social: '#6366f1',
  finance: '#22c55e',
  email: '#3b82f6',
  work: '#f59e0b',
  shopping: '#ec4899',
  other: '#64748b'
}

function PasswordCard({ entry, onDelete }) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = entry.category || 'other'
  const accentColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other

  function getInitial(title) {
    return (title || '?')[0].toUpperCase()
  }

  async function copyToClipboard(text) {
    try {
      await window.api.copyText(text)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  function handleDelete() {
    if (confirmDelete) {
      onDelete(entry.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="password-card" style={{ '--card-accent': accentColor }}>
      <div className="card-top-row">
        <div className="card-meta">
          <div className="avatar">{getInitial(entry.title)}</div>
          <div>
            <h3>{entry.title}</h3>
            {entry.username && <p>{entry.username}</p>}
          </div>
        </div>
        <div className="card-actions">
          <button
            onClick={() => entry.url && window.api.openUrl(entry.url)}
            disabled={!entry.url}
            title={t('card.visit')}
            style={!entry.url ? { opacity: 0.3, pointerEvents: 'none' } : {}}
          >
            <ExternalLink size={14} />
          </button>
          <button
            className={`delete-button ${confirmDelete ? 'confirming' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? t('card.confirmDelete') : t('card.delete')}
          >
            {confirmDelete ? '!' : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      <div className="card-fields">
        {entry.username && (
          <div className="card-field">
            <span className="card-field-label">{t('card.username')}</span>
            <span className="card-field-value">{entry.username}</span>
            <div className="card-field-actions">
              <button onClick={() => copyToClipboard(entry.username)} title={t('card.copy')}>
                <Copy size={12} />
              </button>
            </div>
          </div>
        )}

        {entry.password && (
          <div className="card-field">
            <span className="card-field-label">{t('card.password')}</span>
            <span className={`card-field-value ${showPassword ? '' : 'masked'}`}>
              {showPassword ? entry.password : '••••••••'}
            </span>
            <div className="card-field-actions">
              <button onClick={() => setShowPassword(!showPassword)} title={showPassword ? t('card.hide') : t('card.show')}>
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button onClick={() => copyToClipboard(entry.password)} title={t('card.copy')}>
                <Copy size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {entry.notes && (
        <div className="card-notes">{entry.notes}</div>
      )}
    </div>
  )
}

export default function PasswordList({ entries, onDelete }) {
  const { t } = useTranslation()

  const grouped = entries.reduce((acc, entry) => {
    const cat = entry.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entry)
    return acc
  }, {})

  const categoryOrder = ['work', 'finance', 'email', 'social', 'shopping', 'other']
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  return (
    <div className="password-list">
      {sortedCategories.map((category) => (
        <div key={category} className="category-group">
          <div className="group-heading">
            <h2>{t(`categories.${category}`)}</h2>
            <span>{grouped[category].length}</span>
          </div>
          <div className="card-grid">
            {grouped[category].map((entry) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
