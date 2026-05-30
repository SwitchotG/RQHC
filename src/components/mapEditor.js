// Mot de passe lu depuis .env (variable VITE_ADMIN_PASSWORD)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

import { ref, watch } from 'vue'
import L from 'leaflet'
import { IMAGE_HEIGHT, saveTerritoriesToStorage } from './map.js'

function defaultForm() {
  return {
    color: '#ef4444',
    LongName: '',
    Owner: '',
    Alliances: '',
    MembersCount: 0,
  }
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useMapEditor({ mapRef, territoriesState, renderTerritories }) {
  // ─── Auth ─────────────────────────────────────────────────
  const isLoggedIn    = ref(false)
  const loginPassword = ref('')
  const loginError    = ref(false)

  function tryLogin() {
    if (loginPassword.value === ADMIN_PASSWORD) {
      isLoggedIn.value    = true
      loginError.value    = false
      loginPassword.value = ''
    } else {
      loginError.value = true
    }
  }

  function logout() {
    isLoggedIn.value = false
    cancelAll()
  }

  // ─── Dessin ───────────────────────────────────────────────
  const isDrawing  = ref(false)
  const drawPoints = ref([])

  let markers      = []
  let previewLine  = null
  let previewPoly  = null

  function clearPreview() {
    markers.forEach(m => m.remove())
    markers = []
    if (previewLine) { previewLine.remove(); previewLine = null }
    if (previewPoly) { previewPoly.remove(); previewPoly = null }
  }

  function updatePreview() {
    const map = mapRef.value
    if (!map) return
    clearPreview()

    const pts = drawPoints.value
    pts.forEach(pt => {
      markers.push(
        L.circleMarker(pt, {
          radius: 5, color: '#06b6d4',
          fillColor: '#06b6d4', fillOpacity: 1, weight: 2,
        }).addTo(map)
      )
    })

    if (pts.length >= 2) {
      previewLine = L.polyline(pts, {
        color: '#06b6d4', weight: 2, dashArray: '6 4', opacity: 0.9,
      }).addTo(map)
    }

    if (pts.length >= 3) {
      previewPoly = L.polygon(pts, {
        color: '#06b6d4', fillColor: form.value.color,
        fillOpacity: 0.25, weight: 2, dashArray: '6 4',
      }).addTo(map)
    }
  }

  function addPoint(latlng) {
    drawPoints.value = [...drawPoints.value, latlng]
    updatePreview()
  }

  function removeLastPoint() {
    if (!drawPoints.value.length) return
    drawPoints.value = drawPoints.value.slice(0, -1)
    updatePreview()
  }

  // ─── Formulaire ───────────────────────────────────────────
  const showForm   = ref(false)
  const editingId  = ref(null)
  const form       = ref(defaultForm())

  watch(() => form.value.color, () => {
    if (drawPoints.value.length >= 3) updatePreview()
  })

  function startDraw() {
    cancelAll()
    isDrawing.value = true
    form.value = defaultForm()
    if (mapRef.value) mapRef.value.getContainer().style.cursor = 'crosshair'
  }

  function finishDraw() {
    if (drawPoints.value.length < 3) return
    isDrawing.value = false
    showForm.value  = true
    if (mapRef.value) mapRef.value.getContainer().style.cursor = ''
  }

  function cancelAll() {
    isDrawing.value  = false
    showForm.value   = false
    editingId.value  = null
    drawPoints.value = []
    clearPreview()
    if (mapRef.value) mapRef.value.getContainer().style.cursor = ''
  }

  // ─── CRUD ─────────────────────────────────────────────────
  function startEdit(territory) {
    cancelAll()
    editingId.value = territory.id
    form.value = {
      color:        territory.color,
      LongName:     territory.data.LongName,
      Owner:        territory.data.Owner,
      Alliances:    territory.data.Alliances.join(', '),
      MembersCount: territory.data.MembersCount,
    }
    drawPoints.value = territory.points.map(p =>
      L.latLng(IMAGE_HEIGHT - p[0], p[1])
    )
    updatePreview()
    showForm.value = true
  }

  function saveTerritory() {
    const f  = form.value
    const id = editingId.value || slugify(f.LongName) || `territoire-${Date.now()}`

    const points = drawPoints.value.map(latlng => [
      Math.round(IMAGE_HEIGHT - latlng.lat),
      Math.round(latlng.lng),
    ])

    const territory = {
      id,
      color: f.color,
      points,
      data: {
        LongName:     f.LongName,
        Owner:        f.Owner,
        Allies:       [],
        Enemis:       [],
        Alliances:    f.Alliances.split(',').map(s => s.trim()).filter(Boolean),
        Members:      [],
        MembersCount: Number(f.MembersCount) || 0,
      },
    }

    const list = [...territoriesState.value]
    const idx  = list.findIndex(t => t.id === editingId.value)

    if (idx !== -1) {
      list[idx] = territory
    } else {
      list.push(territory)
    }

    territoriesState.value = list
    saveTerritoriesToStorage(list)
    renderTerritories()
    cancelAll()
  }

  function deleteTerritory(territory) {
    if (!confirm(`Supprimer "${territory.data.LongName}" ?`)) return
    const list = territoriesState.value.filter(t => t.id !== territory.id)
    territoriesState.value = list
    saveTerritoriesToStorage(list)
    renderTerritories()
    if (editingId.value === territory.id) cancelAll()
  }

  function exportJSON() {
    const json = JSON.stringify(territoriesState.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'mapData.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Écoute carte ─────────────────────────────────────────
  watch(mapRef, map => {
    if (!map) return
    map.on('click', e => {
      if (isDrawing.value) addPoint(e.latlng)
    })
  }, { immediate: true })

  return {
    // Auth
    isLoggedIn, loginPassword, loginError,
    tryLogin, logout,
    // Dessin
    isDrawing, drawPoints,
    startDraw, finishDraw, cancelAll, removeLastPoint,
    // Formulaire
    showForm, editingId, form,
    // CRUD
    startEdit, saveTerritory, deleteTerritory, exportJSON,
  }
}
