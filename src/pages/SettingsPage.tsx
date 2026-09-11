import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../lib/userGames'
import {
  usePreferences,
  type CatalogSort,
  type GridDensity,
  type ListSort,
  type ThemeMode,
  type ViewMode,
} from '../context/PreferencesContext'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '../lib/pagination'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="panel space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span>
        <span className="block font-medium text-ink">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--mgl-accent)]"
      />
    </label>
  )
}

export function SettingsPage() {
  const { user, profile, loading, configured, refreshProfile } = useAuth()
  const { prefs, setPref, setPrefs, resetPrefs } = usePreferences()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileErr, setProfileErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? profile.username)
      setAvatarPreview(profile.avatar_url)
    }
  }, [profile])

  if (loading) return <p className="text-muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileErr(null)
    setProfileMsg(null)
    const name = displayName.trim()
    if (!name) {
      setProfileErr('Display name cannot be empty.')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile(user!.id, { display_name: name })
      await refreshProfile()
      setProfileMsg('Profile updated')
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function onAvatarChange(file: File | undefined) {
    if (!file || !user) return
    setProfileErr(null)
    setProfileMsg(null)
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarPreview(url)
      await refreshProfile()
      setProfileMsg('Profile image updated')
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Settings</h1>
        <p className="mt-1 text-muted">Appearance, browsing preferences, and your profile.</p>
      </div>

      <Section title="Appearance" description="Theme follows your choice across the whole app.">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">Theme</p>
          <div className="seg">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={prefs.theme === mode}
                onClick={() => setPref('theme', mode)}
                className="capitalize"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow
          label="Reduce motion"
          hint="Disable short entrance animations"
          checked={prefs.reduceMotion}
          onChange={(v) => setPref('reduceMotion', v)}
        />
      </Section>

      <Section title="Library display" description="Defaults used on Games, Users, and list popups.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">Games page view</span>
            <select
              className="field"
              value={prefs.catalogView}
              onChange={(e) => setPref('catalogView', e.target.value as ViewMode)}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">My List view</span>
            <select
              className="field"
              value={prefs.listView}
              onChange={(e) => setPref('listView', e.target.value as ViewMode)}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">Items per page</span>
            <select
              className="field"
              value={prefs.pageSize}
              onChange={(e) => setPref('pageSize', Number(e.target.value) as PageSizeOption)}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">Grid density</span>
            <select
              className="field"
              value={prefs.gridDensity}
              onChange={(e) => setPref('gridDensity', e.target.value as GridDensity)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="dense">Dense</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">Catalog sort</span>
            <select
              className="field"
              value={prefs.catalogSort}
              onChange={(e) => setPref('catalogSort', e.target.value as CatalogSort)}
            >
              <option value="default">Default (API order)</option>
              <option value="name">Name A–Z</option>
              <option value="year">Release year</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-muted">My List sort</span>
            <select
              className="field"
              value={prefs.listSort}
              onChange={(e) => setPref('listSort', e.target.value as ListSort)}
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name A–Z</option>
              <option value="score">Score (high → low)</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
        <div className="border-t border-line pt-1">
          <ToggleRow
            label="Show genres"
            checked={prefs.showGenres}
            onChange={(v) => setPref('showGenres', v)}
          />
          <ToggleRow
            label="Show platforms"
            checked={prefs.showPlatforms}
            onChange={(v) => setPref('showPlatforms', v)}
          />
        </div>
        <button type="button" className="btn btn-ghost" onClick={resetPrefs}>
          Reset display preferences
        </button>
      </Section>

      <Section title="Profile" description="Display name and profile image shown in the header and on your list.">
        {!configured ? (
          <p className="text-sm text-warn">Supabase is not configured.</p>
        ) : (
          <form onSubmit={(e) => void onSaveProfile(e)} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-line bg-surface-2">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl font-bold text-muted">
                    {(profile?.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void onAvatarChange(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={uploadingAvatar}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingAvatar ? 'Uploading…' : 'Upload image'}
                </button>
                <p className="text-xs text-muted">JPG, PNG, WebP, or GIF · max 2MB</p>
              </div>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-muted">Username</span>
              <input className="field bg-surface-2" value={profile?.username ?? ''} disabled readOnly />
              <span className="text-xs text-muted">Username is set at signup and cannot be changed.</span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-muted">Display name</span>
              <input
                className="field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How your name appears"
              />
            </label>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
            {profileErr && <p className="text-sm text-danger">{profileErr}</p>}
            {profileMsg && <p className="text-sm text-accent">{profileMsg}</p>}
            <button type="submit" disabled={savingProfile} className="btn btn-primary">
              {savingProfile ? 'Saving…' : 'Save display name'}
            </button>
          </form>
        )}
      </Section>

      <div className="flex flex-wrap gap-2">
        <Link to="/profile" className="btn btn-ghost">
          Back to My List
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/games')}>
          Browse games
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setPrefs({
              catalogView: 'grid',
              listView: 'list',
              gridDensity: 'comfortable',
            })
          }
        >
          Apply recommended layout
        </button>
      </div>
    </div>
  )
}
