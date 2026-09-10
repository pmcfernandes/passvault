import { useState } from 'react'
import { X, Copy, RefreshCw } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { generatePassword } from '../utils/generator'

export default function GeneratorModal({ open, onClose }) {
  const { t } = useTranslation()
  const [length, setLength] = useState(20)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState(() => generatePassword(20, true, true, true, true))

  function regenerate() {
    setPassword(generatePassword(length, useUpper, useLower, useDigits, useSymbols))
  }

  async function copyToClipboard() {
    try {
      await window.api.copyText(password)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('generator.title')}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="generator-grid">
          <div className="generator-output">
            <span>{password}</span>
            <button className="icon-button" onClick={copyToClipboard} title={t('common.copy')}>
              <Copy size={18} />
            </button>
            <button className="icon-button" onClick={regenerate} title={t('generator.regenerate')}>
              <RefreshCw size={18} />
            </button>
          </div>

          <label>
            {t('generator.length')}: {length}
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value))
                setPassword(generatePassword(Number(e.target.value), useUpper, useLower, useDigits, useSymbols))
              }}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </label>

          <div className="generator-options">
            <label>
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => {
                  setUseUpper(e.target.checked)
                  setPassword(generatePassword(length, e.target.checked, useLower, useDigits, useSymbols))
                }}
              />
              {t('generator.uppercase')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => {
                  setUseLower(e.target.checked)
                  setPassword(generatePassword(length, useUpper, e.target.checked, useDigits, useSymbols))
                }}
              />
              {t('generator.lowercase')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={useDigits}
                onChange={(e) => {
                  setUseDigits(e.target.checked)
                  setPassword(generatePassword(length, useUpper, useLower, e.target.checked, useSymbols))
                }}
              />
              {t('generator.digits')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => {
                  setUseSymbols(e.target.checked)
                  setPassword(generatePassword(length, useUpper, useLower, useDigits, e.target.checked))
                }}
              />
              {t('generator.symbols')}
            </label>
          </div>

          <div className="generator-actions">
            <button className="primary-button" onClick={copyToClipboard}>
              <Copy size={16} />
              {t('common.copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
