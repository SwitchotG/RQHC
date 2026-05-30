import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export function useHome() {

  /* ─── COUNTDOWN ──────────────────────────────────────────── */
  const targetDate = ref(new Date('2026-05-30T16:30:00Z')) // 12h30 EDT (Montréal, UTC-4)
  const now        = ref(new Date())
  let   ticker     = null

  const isFuture = computed(() => targetDate.value > now.value)
  const diff     = computed(() => Math.abs(targetDate.value - now.value))

  const pad = n => String(n).padStart(2, '0')

  const units = computed(() => {
    const s = Math.floor(diff.value / 1000)
    return [
      { label: 'Jours',    value: Math.floor(s / 86400) },
      { label: 'Heures',   value: pad(Math.floor((s % 86400) / 3600)) },
      { label: 'Minutes',  value: pad(Math.floor((s % 3600) / 60)) },
      { label: 'Secondes', value: pad(s % 60) },
    ]
  })

  /* ─── ABOUT CARDS ────────────────────────────────────────── */
  const aboutCards = [
    {
      icon: 'bi-flag-fill',
      title: 'Notre Nation',
      body: "Le RQHC représente les valeurs du Québec et de la Baie d'Hudson dans le monde de WorldEra, avec une gouvernance structurée et une identité culturelle forte.",
    },
    {
      icon: 'bi-globe2',
      title: 'WorldEra',
      body: "Un serveur Minecraft unique où des nations se forment, s'allient et s'affrontent pour dominer un monde en constante évolution. L'aventure vous attend !",
    },
    {
      icon: 'bi-people-fill',
      title: 'Notre Communauté',
      body: "Une communauté soudée de joueurs passionnés, ouverte à tous ceux qui souhaitent contribuer à la grandeur du RQHC. Rejoignez-nous sur Discord !",
    },
  ]

  /* ─── TEAM CAROUSEL ──────────────────────────────────────── */
  const teamMembers = [
    {
      name: 'Snax III',
      title: 'Roi',
      icon: 'bi-crown-fill',
      isKing: true,
      desc: "Chef d'État souverain du Royaume du Québec et de la Baie d'Hudson.",
    },
    {
      name: 'Nuggets',
      title: 'Première Ministre',
      icon: 'bi-briefcase-fill',
      isKing: false,
      desc: 'Chef du gouvernement royal, coordinatrice des politiques du Royaume.',
    },
    {
      name: 'Moustipro',
      title: 'Ministre des Ressources',
      icon: 'bi-gem',
      isKing: false,
      desc: "Responsable de la gestion et de l'exploitation des ressources naturelles.",
    },
    {
      name: 'powerfinsh',
      title: 'Chef des Armées',
      icon: 'bi-shield-fill',
      isKing: false,
      desc: 'Commandant suprême des forces royales et défenseur du territoire.',
    },
    {
      name: 'Soul',
      title: "Ministre de l'Économie",
      icon: 'bi-coin',
      isKing: false,
      desc: 'Gestionnaire des finances et du commerce du Royaume.',
    },
  ]

  const slide = ref(0)
  let carouselTicker = null

  function nextSlide() {
    slide.value = (slide.value + 1) % teamMembers.length
  }

  function prevSlide() {
    slide.value = (slide.value - 1 + teamMembers.length) % teamMembers.length
  }

  function goTo(i) {
    slide.value = i
    clearInterval(carouselTicker)
    carouselTicker = setInterval(nextSlide, 5000)
  }

  /* ─── STARS CANVAS ───────────────────────────────────────── */
  const starsCanvas = ref(null)
  let   rafId       = null

  function initStars() {
    const canvas = starsCanvas.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let stars  = []

    function resize() {
      const r      = canvas.getBoundingClientRect()
      canvas.width  = r.width
      canvas.height = r.height
      stars = Array.from({ length: 200 }, () => {
        const rand = Math.random()
        return {
          x:    Math.random() * canvas.width,
          y:    Math.random() * canvas.height,
          r:    Math.random() * 1.3 + 0.15,
          o:    Math.random() * 0.65 + 0.1,
          spd:  Math.random() * 0.012 + 0.003,
          dir:  Math.random() > 0.5 ? 1 : -1,
          /* ~35% bleues, ~25% rouges, ~40% blanches */
          blue: rand > 0.65,
          red:  rand < 0.25,
        }
      })
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.o += s.spd * s.dir
        if (s.o > 0.88 || s.o < 0.06) s.dir *= -1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.red
          ? `rgba(252, 165, 165, ${s.o * 0.50})`   /* rouge pâle */
          : s.blue
          ? `rgba(147, 197, 253, ${s.o * 0.58})`   /* bleu clair */
          : `rgba(226, 232, 240, ${s.o * 0.45})`   /* blanc neutre */
        ctx.fill()
      })
      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => window.removeEventListener('resize', resize)
  }

  /* ─── SCROLL REVEAL ──────────────────────────────────────── */
  let observer = null

  function initReveal() {
    observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
  }

  /* ─── LIFECYCLE ──────────────────────────────────────────── */
  onMounted(async () => {
    ticker         = setInterval(() => { now.value = new Date() }, 1000)
    carouselTicker = setInterval(nextSlide, 5000)
    await nextTick()
    initStars()
    initReveal()
  })

  onUnmounted(() => {
    clearInterval(ticker)
    clearInterval(carouselTicker)
    cancelAnimationFrame(rafId)
    observer?.disconnect()
  })

  return {
    isFuture,
    units,
    aboutCards,
    teamMembers,
    slide,
    starsCanvas,
    nextSlide,
    prevSlide,
    goTo,
  }
}
