import { useState, useEffect, useCallback } from 'react'

export function usePasswords() {
  const [passwords, setPasswords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPasswords()
  }, [])

  const loadPasswords = useCallback(async () => {
    try {
      const stored = await window.api.getPasswords()
      setPasswords(stored || [])
    } catch (e) {
      console.error('Failed to load passwords:', e)
      setPasswords([])
    } finally {
      setLoading(false)
    }
  }, [])

  const savePasswords = useCallback(async (newPasswords) => {
    try {
      await window.api.savePasswords(newPasswords)
      setPasswords(newPasswords)
    } catch (e) {
      console.error('Failed to save passwords:', e)
    }
  }, [])

  const addPassword = useCallback(async (entry) => {
    const next = await window.api.addPassword(entry)
    setPasswords(next)
  }, [])

  const deletePassword = useCallback(async (id) => {
    const next = await window.api.deletePassword(id)
    setPasswords(next)
  }, [])

  const updatePassword = useCallback(async (id, data) => {
    const next = await window.api.updatePassword(id, data)
    setPasswords(next)
  }, [])

  const reorderPasswords = useCallback(async (ids) => {
    const next = await window.api.reorderPasswords(ids)
    setPasswords(next)
  }, [])

  const importPasswords = useCallback(async (newEntries) => {
    const merged = [...passwords, ...newEntries]
    await savePasswords(merged)
  }, [passwords, savePasswords])

  const filteredPasswords = passwords.filter((entry) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (entry.title || '').toLowerCase().includes(q) ||
      (entry.username || '').toLowerCase().includes(q) ||
      (entry.url || '').toLowerCase().includes(q) ||
      (entry.notes || '').toLowerCase().includes(q)
    )
  })

  return {
    passwords,
    filteredPasswords,
    loading,
    searchQuery,
    setSearchQuery,
    addPassword,
    deletePassword,
    updatePassword,
    importPasswords,
    reorderPasswords,
    savePasswords,
    reload: loadPasswords
  }
}
