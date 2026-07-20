import { useRef, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

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
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxWidth: 560, margin: '0 auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: 'none',
              background: player.photo_url ? 'transparent' : playerColor(player),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {player.photo_url ? (
              <img src={player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              playerEmoji(player)
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--accent)',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              📷
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

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
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
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-dim)',
  margin: '10px 0 6px',
}

const fieldInput = {
  width: '100%',
  background: 'var(--surface-alt)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 14px',
  fontSize: 15,
  color: 'var(--text)',
}
