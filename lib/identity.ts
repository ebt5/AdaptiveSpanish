const STORAGE_KEY = 'adaptive-spanish-username'

export function getStoredUsername() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setStoredUsername(username: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, username)
}

export function clearStoredUsername() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
