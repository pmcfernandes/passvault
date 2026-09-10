import { createContext, useContext, useState, useCallback } from 'react'
import { languages, translate } from '../i18n'

const TranslationContext = createContext()

export function TranslationProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('language') || 'en'
  )

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }, [])

  const t = useCallback((key, params) => {
    return translate(language, key, params)
  }, [language])

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}
