/**
 * Parse Edge CSV export format
 * Header: name,url,username,password,note
 */
export function parseEdgeCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0])
  const nameIdx = header.indexOf('name')
  const urlIdx = header.indexOf('url')
  const userIdx = header.indexOf('username')
  const passIdx = header.indexOf('password')
  const noteIdx = header.indexOf('note')

  const entries = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const title = cols[nameIdx]?.trim() || ''
    if (!title) continue

    entries.push({
      id: crypto.randomUUID(),
      title,
      url: cols[urlIdx]?.trim() || '',
      username: cols[userIdx]?.trim() || '',
      password: cols[passIdx]?.trim() || '',
      notes: cols[noteIdx]?.trim() || '',
      category: 'other',
      createdAt: Date.now()
    })
  }
  return entries
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
