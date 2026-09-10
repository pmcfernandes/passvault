import en from './en'
import pt from './pt'
import es from './es'
import fr from './fr'
import de from './de'

export const languages = {
  en: { label: 'English', flag: '\u{1F1EC}\u{1F1E7}', translations: en },
  fr: { label: 'Fran\u00e7ais', flag: '\u{1F1EB}\u{1F1F7}', translations: fr },
  es: { label: 'Espa\u00f1ol', flag: '\u{1F1EA}\u{1F1F8}', translations: es },
  pt: { label: 'Portugu\u00eas', flag: '\u{1F1F5}\u{1F1F9}', translations: pt },
  de: { label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}', translations: de },
}

export function translate(lang, key, params) {
  const translations = languages[lang]?.translations || languages.en.translations
  let value = key.split('.').reduce((acc, part) => acc?.[part], translations)
  if (value === undefined) {
    value = key.split('.').reduce((acc, part) => acc?.[part], languages.en.translations)
  }
  if (value === undefined) return key
  if (typeof value !== 'string') return String(value)
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
      value
    )
  }
  return value
}

export default { en, pt, es, fr, de }
