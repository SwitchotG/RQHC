<script setup>
import { ref } from 'vue'
import { useMap }       from './map.js'
import { useMapEditor } from './mapEditor.js'

const { mapRef, cursorCoords, detailsModal, territoriesState, renderTerritories } = useMap()
const {
  isLoggedIn, loginPassword, loginError,
  tryLogin, logout,
  isDrawing, drawPoints,
  startDraw, finishDraw, cancelAll, removeLastPoint,
  showForm, editingId, form,
  startEdit, saveTerritory, deleteTerritory, exportJSON,
} = useMapEditor({ mapRef, territoriesState, renderTerritories })

const showLoginModal = ref(false)

function handleLogin() {
  tryLogin()
  if (isLoggedIn.value) showLoginModal.value = false
}
</script>

<template>
  <div class="map-root">

    <!-- Carte Leaflet -->
    <div id="map"></div>

    <!-- Coordonnées curseur -->
    <div class="map-coords" v-if="cursorCoords">
      <span class="coords-label">pixel</span>
      <span class="coords-value">{{ cursorCoords.x }}, {{ cursorCoords.y }}</span>
    </div>

    <!-- Barre de dessin -->
    <Transition name="hint-fade">
      <div class="draw-hint" v-if="isDrawing">
        <span class="hint-count">
          <i class="bi bi-pentagon"></i> {{ drawPoints.length }} point(s)
        </span>
        <div class="hint-sep"></div>
        <button class="hint-btn" @click="removeLastPoint" :disabled="!drawPoints.length">
          <i class="bi bi-arrow-counterclockwise"></i> Annuler dernier
        </button>
        <button class="hint-btn hint-btn-primary" @click="finishDraw" :disabled="drawPoints.length < 3">
          <i class="bi bi-check-lg"></i> Terminer
        </button>
        <button class="hint-btn hint-btn-danger" @click="cancelAll">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </Transition>

    <!-- Bouton admin (visible quand non connecté) -->
    <button
      class="admin-btn"
      @click="showLoginModal = true"
      v-if="!isLoggedIn"
      title="Administration"
    >
      <i class="bi bi-shield-lock-fill"></i>
    </button>

    <!-- Panneau éditeur -->
    <Transition name="panel-slide">
      <div class="editor-panel" v-if="isLoggedIn">

        <div class="ep-header">
          <span class="ep-title">
            <i class="bi bi-pencil-square"></i> Éditeur
          </span>
          <button class="ep-icon-btn ep-logout" @click="logout" title="Déconnexion">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>

        <div class="ep-toolbar">
          <button class="ep-btn ep-btn-primary" @click="startDraw" :disabled="isDrawing">
            <i class="bi bi-pentagon"></i> Dessiner
          </button>
          <button class="ep-btn ep-btn-ghost" @click="exportJSON" title="Télécharger mapData.json">
            <i class="bi bi-download"></i> Export
          </button>
        </div>

        <!-- Formulaire territoire -->
        <Transition name="form-slide">
          <div class="ep-form" v-if="showForm">
            <h3 class="ep-form-title">
              {{ editingId ? 'Modifier territoire' : 'Nouveau territoire' }}
            </h3>

            <div class="ep-field">
              <label>Nom complet</label>
              <input v-model="form.LongName" placeholder="ex: Royaume de France" />
            </div>

            <div class="ep-field">
              <label>Chef (pseudo)</label>
              <input v-model="form.Owner" placeholder="Pseudo Minecraft" />
            </div>

            <div class="ep-field-row">
              <div class="ep-field ep-field-color">
                <label>Couleur</label>
                <input type="color" v-model="form.color" class="ep-color-input" />
              </div>
              <div class="ep-field" style="flex:1">
                <label>Nb. joueurs</label>
                <input type="number" v-model.number="form.MembersCount" min="0" placeholder="0" />
              </div>
            </div>

            <div class="ep-field">
              <label>
                Alliances
                <span class="ep-hint-label">virgules</span>
              </label>
              <input v-model="form.Alliances" placeholder="ONU, OTAN, ..." />
            </div>

            <div class="ep-form-actions">
              <button class="ep-btn ep-btn-ghost" @click="cancelAll">Annuler</button>
              <button
                class="ep-btn ep-btn-primary"
                @click="saveTerritory"
                :disabled="!form.LongName || drawPoints.length < 3"
              >
                <i class="bi bi-floppy"></i> Sauvegarder
              </button>
            </div>
          </div>
        </Transition>

        <!-- Liste des territoires -->
        <div class="ep-section">
          <span class="ep-section-label">
            Territoires <em>({{ territoriesState.length }})</em>
          </span>

          <div class="ep-list">
            <div
              class="ep-item"
              v-for="t in territoriesState"
              :key="t.id"
              :class="{ active: editingId === t.id }"
            >
              <span class="ep-item-dot" :style="{ background: t.color }"></span>
              <span class="ep-item-name">{{ t.data.LongName }}</span>
              <div class="ep-item-actions">
                <button class="ep-icon-btn" @click="startEdit(t)" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="ep-icon-btn ep-icon-btn-danger" @click="deleteTerritory(t)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="ep-empty" v-if="!territoriesState.length">
              Aucun territoire
            </div>
          </div>
        </div>

        <div class="ep-footer">
          Éditeur RQHC · Données sauvegardées localement
        </div>

      </div>
    </Transition>

    <!-- Modal connexion admin -->
    <Transition name="modal-fade">
      <div class="dm-overlay" v-if="showLoginModal" @click.self="showLoginModal = false">
        <div class="dm-modal">
          <div class="dm-header">
            <div class="dm-header-left">
              <h2 class="dm-title">🔐 Administration</h2>
            </div>
            <button class="dm-close" @click="showLoginModal = false">✕</button>
          </div>
          <div class="dm-body">
            <div class="ep-field">
              <label>Mot de passe</label>
              <input
                type="password"
                v-model="loginPassword"
                placeholder="••••••••"
                :class="{ 'ep-input-error': loginError }"
                @keyup.enter="handleLogin"
                autofocus
              />
              <span class="ep-field-error" v-if="loginError">
                <i class="bi bi-exclamation-circle"></i> Mot de passe incorrect
              </span>
            </div>
            <div class="ep-form-actions" style="justify-content:flex-end; margin-top:0.5rem">
              <button class="ep-btn ep-btn-primary" @click="handleLogin">
                <i class="bi bi-box-arrow-in-right"></i> Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal détails territoire (existant) -->
    <Transition name="modal-fade">
      <div
        v-if="detailsModal.open"
        class="dm-overlay"
        @click.self="detailsModal.open = false"
      >
        <div class="dm-modal">
          <div class="dm-header">
            <div class="dm-header-left">
              <span class="dm-color-dot" :style="{ background: detailsModal.territory?.color }"></span>
              <h2 class="dm-title">{{ detailsModal.territory?.data.LongName }}</h2>
            </div>
            <button class="dm-close" @click="detailsModal.open = false">✕</button>
          </div>
          <div class="dm-body">
            <div class="dm-info-grid">
              <div class="dm-info-item">
                <span class="dm-info-label">👑 Chef</span>
                <span class="dm-info-val">{{ detailsModal.territory?.data.Owner || 'Indéterminé' }}</span>
              </div>
              <div class="dm-info-item">
                <span class="dm-info-label">👥 Joueurs</span>
                <span class="dm-info-val">{{ detailsModal.territory?.data.MembersCount ?? 'Indéterminé' }}</span>
              </div>
              <div class="dm-info-item" v-if="detailsModal.territory?.data.Alliances?.length">
                <span class="dm-info-label">🏛 Alliances</span>
                <span class="dm-info-val">{{ detailsModal.territory?.data.Alliances.join(', ') }}</span>
              </div>
            </div>
            <div class="dm-content-area">
              <i class="bi bi-file-earmark-text dm-content-icon"></i>
              <p class="dm-content-title">Aucun détail disponible</p>
              <p class="dm-content-sub">
                Une information manquante ou incorrecte ?<br>
                Rejoins notre Discord et crée un ticket <strong>« Carte »</strong>.
              </p>
              <a
                class="dm-content-discord"
                href="https://discord.gg/bWC4CVSfwv"
                target="_blank"
                rel="noopener"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Rejoindre le Discord RQHC
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style>
@import './map.css';
</style>
