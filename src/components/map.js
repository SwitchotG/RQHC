import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import L from 'leaflet'
import defaultTerritories from '@/data/mapData.json'
import 'leaflet/dist/leaflet.css'

export const IMAGE_HEIGHT = 6214
const IMAGE_WIDTH = 8248

const STORAGE_KEY = 'rqhc-territories-v1'

function loadTerritories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return JSON.parse(JSON.stringify(defaultTerritories))
}

export function saveTerritoriesToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function buildPopupContent(territory) {
  const d = territory.data

  const chef       = d.Owner?.trim()      || 'Indéterminé'
  const alliances  = d.Alliances?.length  ? d.Alliances.join(', ') : 'Aucune'
  const joueurs    = d.MembersCount != null ? d.MembersCount : 'Indéterminé'

  return `
    <div class="map-popup">
      <div class="mp-header">
        <span class="mp-color-dot" style="background:${territory.color}"></span>
        <div class="mp-header-text">
          <h2 class="mp-title">${d.LongName}</h2>
          <span class="mp-subtitle">Territoire WorldEra</span>
        </div>
      </div>
      <div class="mp-divider"></div>
      <div class="mp-rows">
        <div class="mp-row">
          <span class="mp-label">👑 Chef</span>
          <span class="mp-value ${chef === 'Indéterminé' ? 'mp-value-unknown' : ''}">${chef}</span>
        </div>
        <div class="mp-row">
          <span class="mp-label">🏛 Alliances</span>
          <span class="mp-value ${alliances === 'Aucune' ? 'mp-value-unknown' : ''}">${alliances}</span>
        </div>
        <div class="mp-row">
          <span class="mp-label">👥 Joueurs</span>
          <span class="mp-value mp-value-pill">${joueurs}</span>
        </div>
      </div>
      <div class="mp-footer">
        <a class="mp-discord-btn" href="https://discord.gg/bWC4CVSfwv" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Discord
        </a>
        <button class="mp-details-btn" data-id="${territory.id}">+ Détails</button>
      </div>
    </div>`
}

export function useMap() {
  const mapRef           = shallowRef(null)
  const cursorCoords     = ref(null)
  const detailsModal     = ref({ open: false, territory: null })
  const territoriesState = ref(loadTerritories())

  let territoryPolygons = []

  function renderTerritories() {
    territoryPolygons.forEach(p => p.remove())
    territoryPolygons = []

    const map = mapRef.value
    if (!map) return

    territoriesState.value.forEach(territory => {
      const points = territory.points.map(p => [IMAGE_HEIGHT - p[0], p[1]])

      const polygon = L.polygon(points, {
        color: 'transparent',
        fillColor: territory.color,
        fillOpacity: 0,
      }).addTo(map)

      polygon.bindPopup(buildPopupContent(territory), {
        maxWidth: 320,
        className: 'map-popup-wrapper',
      })

      polygon.on('popupopen', () => {
        const btn = document.querySelector(`.mp-details-btn[data-id="${territory.id}"]`)
        if (btn) {
          btn.onclick = () => {
            detailsModal.value = { open: true, territory }
          }
        }
      })

      polygon.bindTooltip(
        `<span class="mp-tt-dot" style="background:${territory.color}"></span>${territory.data.LongName}`,
        { className: 'mp-hover-tooltip', sticky: true, direction: 'top', offset: [0, -8] }
      )

      polygon.on('mouseover', () => polygon.setStyle({ fillOpacity: 0.4 }))
      polygon.on('mouseout',  () => polygon.setStyle({ fillOpacity: 0 }))

      territoryPolygons.push(polygon)
    })
  }

  onMounted(() => {
    if (mapRef.value) {
      mapRef.value.off()
      mapRef.value._container._leaflet_id = null
      mapRef.value.remove()
      mapRef.value = null
    }

    const map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -2,
    })
    mapRef.value = map

    const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]
    L.imageOverlay('/carte_worldera.png', bounds).addTo(map)
    map.fitBounds(bounds)

    map.on('mousemove', e => {
      cursorCoords.value = {
        x: Math.round(e.latlng.lng),
        y: Math.round(IMAGE_HEIGHT - e.latlng.lat),
      }
    })

    map.on('mouseout', () => {
      cursorCoords.value = null
    })

    renderTerritories()
  })

  onUnmounted(() => {
    if (mapRef.value) {
      mapRef.value.off()
      mapRef.value.remove()
      mapRef.value = null
    }
  })

  return { mapRef, cursorCoords, detailsModal, territoriesState, renderTerritories }
}
