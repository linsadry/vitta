// src/components/ProgressPhotos.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Camera, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BUCKET = 'vitta-media'

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: '2-digit' })
}

async function signedUrl(path) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

/* ─── UPLOAD MODAL ───────────────────────────────────────────────── */
function UploadModal({ userId, onClose, onSave }) {
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone]       = useState(false)
  const inputRef = useRef()

  const pickFile = e => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const upload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop().toLowerCase()
      const path = `${userId}/progress/${date}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type, upsert: false,
      })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('progress_photos').insert({
        user_id: userId, date, storage_path: path, caption: caption || null,
      })
      if (dbErr) throw dbErr
      setDone(true)
      setTimeout(() => { onSave?.(); onClose() }, 800)
    } catch (err) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>Foto de progresso</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <Camera size={32} style={{ color: 'var(--c-sage)' }} />
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Foto salva!</p>
          </div>
        ) : (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '3/4', borderRadius: 'var(--r-md)', overflow: 'hidden',
                background: preview ? 'none' : 'var(--c-base-2)',
                border: preview ? 'none' : '2px dashed var(--c-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', marginBottom: 16,
              }}
            >
              {preview
                ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: 'var(--c-text-300)' }}>
                    <Camera size={32} style={{ marginBottom: 8 }} />
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13 }}>Toque para escolher</p>
                  </div>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={pickFile} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="input-label">Data</label>
                <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Nota (opcional)</label>
                <input className="input-field" type="text" placeholder="Ex: 8 semanas"
                  value={caption} onChange={e => setCaption(e.target.value)} />
              </div>
            </div>

            <button className="btn-primary" onClick={upload} disabled={!file || uploading}>
              {uploading ? 'Enviando...' : 'Salvar foto'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── VIEWER / COMPARE MODAL ─────────────────────────────────────── */
function ViewerModal({ photos, initialIndex, onClose, onDelete }) {
  const [idx, setIdx]           = useState(initialIndex)
  const [compareIdx, setCompareIdx] = useState(null)
  const [urls, setUrls]         = useState({})
  const [deleting, setDeleting] = useState(false)

  const loadUrl = async ph => {
    if (!ph || urls[ph.id]) return
    const url = await signedUrl(ph.storage_path)
    if (url) setUrls(prev => ({ ...prev, [ph.id]: url }))
  }

  useEffect(() => { loadUrl(photos[idx]) }, [idx])
  useEffect(() => { if (compareIdx !== null) loadUrl(photos[compareIdx]) }, [compareIdx])

  const current = photos[idx]
  const compare = compareIdx !== null ? photos[compareIdx] : null

  const handleDelete = async () => {
    if (!current) return
    setDeleting(true)
    await supabase.storage.from(BUCKET).remove([current.storage_path])
    await supabase.from('progress_photos').delete().eq('id', current.id)
    onDelete?.(); onClose()
  }

  const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' }

  return (
    <div className="sheet-overlay" onClick={onClose}
      style={{ alignItems: 'stretch', padding: 0, background: 'rgba(0,0,0,0.92)' }}>
      <div onClick={e => e.stopPropagation()} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <X size={20} color="white" />
          </button>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {current && fmtDate(current.date)}{current?.caption && ` · ${current.caption}`}
          </span>
          <button onClick={handleDelete} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <Trash2 size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Images */}
        <div style={{ flex: 1, display: 'flex', gap: 3, padding: '0 3px', minHeight: 0 }}>
          {/* Main image */}
          <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#111' }}>
            {current && urls[current.id]
              ? <img src={urls[current.id]} alt="" style={imgStyle} />
              : <div style={{ ...imgStyle, background: '#222' }} />
            }
            {idx > 0 && (
              <button onClick={() => setIdx(i => i - 1)} style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 6, cursor: 'pointer',
              }}><ChevronLeft size={16} color="white" /></button>
            )}
            {idx < photos.length - 1 && (
              <button onClick={() => setIdx(i => i + 1)} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 6, cursor: 'pointer',
              }}><ChevronRight size={16} color="white" /></button>
            )}
          </div>

          {/* Compare image */}
          {compare && (
            <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#111' }}>
              {urls[compare.id]
                ? <img src={urls[compare.id]} alt="" style={imgStyle} />
                : <div style={{ ...imgStyle, background: '#222' }} />
              }
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '3px 8px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'white' }}>{fmtDate(compare.date)}</span>
              </div>
              <button onClick={() => setCompareIdx(null)} style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer',
              }}><X size={12} color="white" /></button>
            </div>
          )}
        </div>

        {/* Compare selector */}
        {!compare && photos.length > 1 && (
          <div style={{ padding: '12px 16px 0' }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              Comparar com
            </p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {photos.map((ph, i) => i !== idx && (
                <button key={ph.id} onClick={() => setCompareIdx(i)} style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.25)', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 12, color: 'rgba(255,255,255,0.7)',
                }}>
                  {fmtDate(ph.date)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── EXPORTED SECTION ───────────────────────────────────────────── */
export default function ProgressPhotos({ userId }) {
  const [photos, setPhotos]     = useState([])
  const [thumbs, setThumbs]     = useState({})
  const [loading, setLoading]   = useState(true)
  const [uploadModal, setUploadModal] = useState(false)
  const [viewIdx, setViewIdx]   = useState(null)
  const [key, setKey]           = useState(0)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase.from('progress_photos').select('*').eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data }) => {
        const list = data || []
        setPhotos(list)
        setLoading(false)
        list.forEach(async ph => {
          const url = await signedUrl(ph.storage_path)
          if (url) setThumbs(prev => ({ ...prev, [ph.id]: url }))
        })
      })
  }, [userId, key])

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Fotos de progresso</h2>
        <button onClick={() => setUploadModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
          borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
          background: 'var(--c-text-900)', color: 'var(--c-base-0)',
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
        }}>
          <Camera size={13} /> Foto
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ aspectRatio: '3/4', borderRadius: 'var(--r-sm)' }} className="loading-shimmer" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <Camera size={28} style={{ color: 'var(--c-text-100)' }} />
          <p className="empty-state-text" style={{ fontSize: 13 }}>
            Adicione a primeira foto para acompanhar a evolução visual
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {photos.map((ph, i) => (
            <button key={ph.id} onClick={() => setViewIdx(i)} style={{
              aspectRatio: '3/4', border: 'none', borderRadius: 'var(--r-sm)',
              overflow: 'hidden', cursor: 'pointer', background: 'var(--c-base-2)',
              position: 'relative', padding: 0,
            }}>
              {thumbs[ph.id]
                ? <img src={thumbs[ph.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%' }} className="loading-shimmer" />
              }
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                padding: '16px 6px 5px',
              }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'white' }}>
                  {fmtDate(ph.date)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {uploadModal && (
        <UploadModal userId={userId} onClose={() => setUploadModal(false)} onSave={() => setKey(k => k + 1)} />
      )}
      {viewIdx !== null && (
        <ViewerModal
          photos={photos} initialIndex={viewIdx}
          onClose={() => setViewIdx(null)}
          onDelete={() => { setViewIdx(null); setKey(k => k + 1) }}
        />
      )}
    </section>
  )
}
