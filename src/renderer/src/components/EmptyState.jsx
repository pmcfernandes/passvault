import { Plus, KeyRound, Download } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export default function EmptyState({ onAdd, onImport }) {
  const { t } = useTranslation()

  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <KeyRound size={56} />
      </div>
      <h2>{t('empty.title')}</h2>
      <p>{t('empty.description')}</p>
      <div className="empty-actions">
        <button className="primary-button" onClick={onAdd}>
          <Plus size={19} />
          {t('common.add')}
        </button>
        <button className="secondary-button" onClick={onImport}>
          <Download size={18} />
          {t('empty.import')}
        </button>
      </div>
    </div>
  )
}
