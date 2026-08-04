import { useRef, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { CameraIcon, FlagIcon, TargetIcon } from '../components/icons'
import { ROUND_FORMAT_LABELS } from '../utils/roundFormats'

const CATEGORIES = [
  { key: 'longest_drive', label: 'Longest Drive', Icon: FlagIcon },
  { key: 'nearest_pin', label: 'Nearest the Pin', Icon: TargetIcon },
]

export default function Claims() {
  const { players, claims, claimCategory, unclaimCategory, uploadClaimPhoto, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const me = players.find((p) => p.id === myId)
  const [editing, setEditing] = useState(null) // { category, round, label } | null

  return (
    <div>
      <h1 className="page-title">Claims</h1>
      <p className="page-subtitle">Glory is temporary. Steal it if you can back it up.</p>

      {CATEGORIES.map((cat) => (
        <div key={cat.key} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
            <cat.Icon width={17} height={17} style={{ color: 'var(--brass)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{cat.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2].map((round) => {
              const claim = claims[`${cat.key}:${round}`]
              const holder = players.find((p) => p.id === claim?.player_id)
              const key = `claim:${cat.key}:${round}`
              const pending = isPending(key)
              const isMine = holder && holder.id === myId

              return (
                <div key={round} className="card" style={{ padding: 14, textAlign: 'center' }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>
                    Round {round} · {ROUND_FORMAT_LABELS[round]}
                  </div>
                  {holder ? (
                    <>
                      <span
                        className="avatar"
                        style={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 8px',
                          fontSize: 20,
                          background: holder.photo_url ? 'transparent' : playerColor(holder),
                          boxShadow: isMine
                            ? '0 0 0 2px var(--brass), 0 4px 10px -3px rgba(201,162,39,0.5)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
                        }}
                      >
                        {holder.photo_url ? <img src={holder.photo_url} alt="" /> : playerEmoji(holder)}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{holder.name}</div>
                      <div style={{ fontSize: 11, color: isMine ? 'var(--brass-ink)' : 'var(--text-faint)', margin: '2px 0 10px' }}>
                        {isMine ? 'You hold this' : 'holds it'}
                      </div>
                      {claim.photo_url && (
                        <img
                          src={claim.photo_url}
                          alt="Proof"
                          style={{
                            width: '100%',
                            height: 90,
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 10,
                            border: '1px solid var(--border)',
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn"
                          style={{ flex: 1, fontSize: 12, padding: '10px 8px', opacity: pending ? 0.6 : 1 }}
                          disabled={!me || pending}
                          onClick={() => setEditing({ category: cat.key, round, label: cat.label })}
                        >
                          Reclaim
                        </button>
                        <button
                          className="btn"
                          style={{ flex: 1, fontSize: 12, padding: '10px 8px', color: 'var(--danger)', opacity: pending ? 0.6 : 1 }}
                          disabled={pending}
                          onClick={() => unclaimCategory(cat.key, round)}
                        >
                          Unclaim
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: '16px 0', color: 'var(--text-faint)', fontSize: 13 }}>Unclaimed</div>
                      <button
                        className="btn btn-block"
                        style={{ fontSize: 12.5, opacity: pending ? 0.6 : 1 }}
                        disabled={!me || pending}
                        onClick={() => setEditing({ category: cat.key, round, label: cat.label })}
                      >
                        I've got this
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {editing && (
        <ClaimSheet
          players={players}
          myId={myId}
          category={editing.category}
          round={editing.round}
          label={editing.label}
          existing={claims[`${editing.category}:${editing.round}`]}
          uploadClaimPhoto={uploadClaimPhoto}
          onSave={(playerId, photoUrl) => {
            claimCategory(editing.category, editing.round, playerId, photoUrl)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ClaimSheet({ players, myId, category, round, label, existing, uploadClaimPhoto, onSave, onClose }) {
  const [selected, setSelected] = useState(existing?.player_id ?? myId ?? null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(existing?.photo_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!selected) return
    setUploading(true)
    try {
      let photoUrl = existing?.photo_url ?? null
      if (photoFile) photoUrl = await uploadClaimPhoto(category, round, photoFile)
      onSave(selected, photoUrl)
    } catch (err) {
      console.error('claim photo upload failed', err)
      onSave(selected, existing?.photo_url ?? null)
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
          maxHeight: '85vh',
          overflowY: 'auto',
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
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 16px' }} />

        <div className="eyebrow">
          {label} · Round {round}
        </div>
        <h2 className="page-title" style={{ fontSize: 19, margin: '6px 0 16px' }}>
          Who hit the shot?
        </h2>

        <div className="chip-grid" style={{ marginBottom: 18 }}>
          {players.map((p) => (
            <button key={p.id} className={`chip ${selected === p.id ? 'selected' : ''}`} onClick={() => setSelected(p.id)}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Photo proof (optional)
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 110,
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-strong)',
            background: photoPreview ? 'transparent' : 'var(--surface-hi)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            overflow: 'hidden',
            marginBottom: 20,
            padding: 0,
          }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
              <CameraIcon width={20} height={20} />
              Tap to attach a photo
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.bmp,.svg"
          hidden
          onChange={onPhoto}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-accent" style={{ flex: 2 }} disabled={!selected || uploading} onClick={save}>
            {uploading ? 'Saving…' : 'Log Claim'}
          </button>
        </div>
      </div>
    </div>
  )
}
