import { useState, type KeyboardEvent } from 'react'
import './ui.css'

type Props = {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  hint?: string
}

export function TagInput({ label, value, onChange, placeholder, hint }: Props) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const items = draft.split(',').map((item) => item.trim()).filter(Boolean)
    if (!items.length) return
    onChange([...new Set([...value, ...items])])
    setDraft('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add()
    }
    if (event.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return <label className="tag-field">
    <span>{label}</span>
    <div className="tag-input">
      {value.map((tag) => <button type="button" className="tag-chip" key={tag} onClick={() => onChange(value.filter((item) => item !== tag))}>{tag}<b>×</b></button>)}
      <input value={draft} placeholder={value.length ? '' : placeholder} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} onBlur={add} />
    </div>
    {hint && <small>{hint}</small>}
  </label>
}
