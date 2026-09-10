import { useState, useCallback, useEffect } from 'react'

const DEFAULT_CATEGORIES = ['work', 'finance', 'email', 'social', 'shopping', 'other']

const CATEGORY_COLORS = {
  social: '#6366f1',
  finance: '#22c55e',
  email: '#3b82f6',
  work: '#f59e0b',
  shopping: '#ec4899',
  other: '#64748b'
}

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#14b8a6', '#06b6d4', '#8b5cf6', '#d946ef',
  '#f43f5e', '#a855f7', '#3b82f6', '#10b981'
]

function loadCustom() {
  try {
    return JSON.parse(localStorage.getItem('customCategories')) || []
  } catch {
    return []
  }
}

function saveCustom(categories) {
  localStorage.setItem('customCategories', JSON.stringify(categories))
}

export function useCategories(version = 0) {
  const [customCategories, setCustomCategories] = useState(loadCustom)

  useEffect(() => {
    setCustomCategories(loadCustom())
  }, [version])

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  const addCategory = useCallback((name) => {
    const value = name.trim().toLowerCase().replace(/\s+/g, '-')
    if (!value || allCategories.includes(value)) return false
    const next = [...customCategories, value]
    setCustomCategories(next)
    saveCustom(next)
    return true
  }, [allCategories, customCategories])

  const removeCategory = useCallback((value) => {
    if (DEFAULT_CATEGORIES.includes(value)) return
    const next = customCategories.filter((c) => c !== value)
    setCustomCategories(next)
    saveCustom(next)
  }, [customCategories])

  const getCategoryColor = useCallback((category) => {
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }
    return PALETTE[Math.abs(hash) % PALETTE.length]
  }, [])

  return {
    allCategories,
    customCategories,
    defaultCategories: DEFAULT_CATEGORIES,
    addCategory,
    removeCategory,
    getCategoryColor,
    CATEGORY_COLORS
  }
}
