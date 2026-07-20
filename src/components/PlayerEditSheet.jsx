import { useRef, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { CameraIcon } from './icons'

export default function PlayerEditSheet({ player, onClose }) {
  const { updatePlayer, uploadPlayerPhoto } = useGolfData()
  const [name, setName] = useState(player.name)
  const [handicap, setHandicap] = useState(player.handicap)
  const [tagline, setTagline] = useState(player.tagline || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const save = () => {
    updatePlayer(player.id, {
      name: name.trim() || player.name,
      handicap: Number(handicap) || 0,
      tagline: tagline.trim(),
    })
    onClose()
  }

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPlayerPhoto(player.id, file)
      updatePlayer(player.id, { photo_url: url })
    } catch (err) {
      console.error('photo upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 8, 5, 0.68)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          background: 'linear-gradient(160deg, var(--surface) 0%, var(--surface-alt) 100%)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)',
          padding: '18px 18px calc(22px + var(--safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="avatar"
            style={{
              width: 64,
              height: 64,
              fontSize: 26,
              border: 'none',
              background: player.photo_url ? 'transparent' : playerColor(player),
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {player.photo_url ? (
              <img src={player.photo_url} alt="" />
            ) : (
              playerEmoji(player)
            )}
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: 'linear-gradient(135deg, var(--brass-light), var(--brass-dark))',
                color: 'var(--ink)',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              <CameraIcon width={12} height={12} strokeWidth={2.2} />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            {uploading ? 'Uploading…' : 'Tap the avatar to change photo'}
          </div>
        </div>

        <label style={fieldLabel}>Name</label>
        <input style={fieldInput} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={fieldLabel}>Handicap</label>
        <input
          style={fieldInput}
          type="number"
          inputMode="numeric"
          value={handicap}
          onChange={(e) => setHandicap(e.target.value)}
        />

        <label style={fieldLabel}>Trash talk tagline</label>
        <input
          style={fieldInput}
          value={tagline}
          maxLength={80}
          placeholder="e.g. Bogeys are for tourists"
          onChange={(e) => setTagline(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-accent" style={{ flex: 2 }} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--brass)',
  margin: '12px 0 6px',
}

const fieldInput = {
  width: '100%',
  background: 'var(--surface-hi)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 14px',
  fontSize: 15,
  color: 'var(--text)',
}
