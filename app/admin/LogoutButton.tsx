'use client'

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin/login', { method: 'DELETE' })
        location.href = '/admin/login'
      }}
      className="px-3 py-2"
      style={{ fontSize: '0.78rem', color: 'var(--rafa-muted)', border: '1px solid var(--rafa-border)', background: 'none', cursor: 'pointer' }}
    >
      Salir
    </button>
  )
}
