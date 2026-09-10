import { useState } from 'react'
import { Copy, Trash2, ExternalLink, Eye, EyeOff, Check } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useCategories } from '../hooks/useCategories'

function PasswordCard({ entry, onDelete, onEdit, selected, onSelect }) {
  const { t } = useTranslation()
  const { getCategoryColor } = useCategories()
  const [showPassword, setShowPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = entry.category || 'other'
  const accentColor = getCategoryColor(category)

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
    <div
      className={`password-card ${selected ? 'selected' : ''}`}
      style={{ '--card-accent': accentColor }}
      onDoubleClick={() => !selected && onEdit(entry)}
    >
      <div className="card-checkbox" onClick={(e) => { e.stopPropagation(); onSelect(entry.id) }}>
        <div className={`checkbox ${selected ? 'checked' : ''}`}>
          {selected && <Check size={12} />}
        </div>
      </div>
      <div className="card-top-row">
        <div className="card-meta">
          <div className="avatar">{getInitial(entry.title)}</div>
          <div>
            <h3 title={entry.title.length > 15 ? entry.title : undefined}>{entry.title.length > 15 ? entry.title.slice(0, 15) + '…' : entry.title}</h3>
            {entry.username && <p>{entry.username}</p>}
          </div>
        </div>
        <div className="card-actions">
          <button
            onClick={(e) => { e.stopPropagation(); entry.url && window.api.openUrl(entry.url) }}
            disabled={!entry.url}
            title={t('card.visit')}
            style={!entry.url ? { opacity: 0.3, pointerEvents: 'none' } : {}}
          >
            <ExternalLink size={14} />
          </button>
          {!selected && (
            <button
              className={`delete-button ${confirmDelete ? 'confirming' : ''}`}
              onClick={handleDelete}
              title={confirmDelete ? t('card.confirmDelete') : t('card.delete')}
            >
              {confirmDelete ? '!' : <Trash2 size={14} />}
            </button>
          )}
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

export default function PasswordList({ entries, onDelete, onDeleteBulk, onEdit }) {
  const { t } = useTranslation()
  const { defaultCategories } = useCategories()
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const selectMode = selectedIds.size > 0

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(entries.map((e) => e.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
  }

  function handleBulkDelete() {
    if (confirmBulkDelete) {
      onDeleteBulk([...selectedIds])
      clearSelection()
    } else {
      setConfirmBulkDelete(true)
      setTimeout(() => setConfirmBulkDelete(false), 3000)
    }
  }

  const grouped = entries.reduce((acc, entry) => {
    const cat = entry.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entry)
    return acc
  }, {})

  const categoryOrder = [...defaultCategories]
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a)
    const bi = categoryOrder.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })

  function getCategoryLabel(cat) {
    if (defaultCategories.includes(cat)) return t(`categories.${cat}`)
    return cat
  }

  return (
    <div className="password-list">
      {sortedCategories.map((category) => (
        <div key={category} className="category-group">
          <div className="group-heading">
            <h2>{getCategoryLabel(category)}</h2>
            <span>{grouped[category].length}</span>
          </div>
          <div className="card-grid">
            {grouped[category].map((entry) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                onDelete={onDelete}
                onEdit={onEdit}
                selected={selectedIds.has(entry.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        </div>
      ))}
      {selectMode && (
        <div className="bulk-toast">
          <span>{selectedIds.size} {t('bulk.selected')}</span>
          <div className="bulk-toast-actions">
            <button className="ghost-button" onClick={selectAll}>{t('bulk.selectAll')}</button>
            <button className="ghost-button" onClick={clearSelection}>{t('bulk.cancel')}</button>
            <button className={`delete-button ${confirmBulkDelete ? 'confirming' : ''}`} onClick={handleBulkDelete}>
              <Trash2 size={14} /> {confirmBulkDelete ? t('bulk.confirmDelete') : t('bulk.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
