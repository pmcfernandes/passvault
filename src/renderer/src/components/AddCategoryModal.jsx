import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useCategories } from '../hooks/useCategories'

export default function AddCategoryModal({ open, onClose, onCategoriesChange }) {
  const { t } = useTranslation()
  const { customCategories, defaultCategories, addCategory, removeCategory, getCategoryColor } = useCategories()
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!newCategory.trim()) return
    const success = addCategory(newCategory)
    if (success) {
      setNewCategory('')
      setError('')
      onCategoriesChange?.()
    } else {
      setError(t('addModal.categoryExists'))
    }
  }

  function handleRemove(cat) {
    removeCategory(cat)
    onCategoriesChange?.()
  }

  function handleClose() {
    setNewCategory('')
    setError('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header" style={{ marginBottom: '25px'}}>
          <h2>{t('addModal.manageCategories')}</h2>
          <button className="icon-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              className="modal-input"
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setError('') }}
              placeholder={t('addModal.newCategoryPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="secondary-button" onClick={handleAdd} style={{ flexShrink: 0 }}>
              <Plus size={16} />
            </button>
          </div>

          {error && <p style={{ color: 'var(--accent)', fontSize: '13px', marginTop: '-8px', marginBottom: '12px' }}>{error}</p>}

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('addModal.defaultCategories')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {defaultCategories.map((cat) => (
              <span key={cat} className="category-tag">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCategoryColor(cat), flexShrink: 0 }} />
                {t(`categories.${cat}`)}
              </span>
            ))}
          </div>

          {customCategories.length > 0 && (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('addModal.customCategories')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {customCategories.map((cat) => (
                  <span key={cat} className="category-tag">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCategoryColor(cat), flexShrink: 0 }} />
                    {cat}
                    <button onClick={() => handleRemove(cat)} className="category-tag-remove">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
