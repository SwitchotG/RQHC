<template>
    <br />
    <br/>
    <h1 class="w-100" style="text-align: center;">Bienvenue sur le site officiel du RQHC !</h1>
    <br />
    <br />
    <h2 class="w-100 m-5">
        Nous sommes un pays représentant les valeurs du Québec et de la baie d'Hudson dans le serveur Minecraft de WorldEra ! 
        Vous pouvez voir notre map dynamique ou nous rejoindre !
        Ce site est encore en dévellopement et des photos du RQHC, ainsi que d'autres informations seront régulièrement ajouté !
    </h2>
    <br/>
    <h2 class="w-100 m-5">Si vous voulez ajouter quelque chose à la map venez sur le discord ou envoyez moi un message : Switchot</h2>
    <br/>
    <div class="w-100 d-flex align-content-center justify-content-center gap-5">
        <a type="button" class="btn btn-success w-25" href="https://discord.gg/UdE4kADuvB" target="_blank"><h4>🌎WorldEra🌎</h4></a>
        <a type="button" class="btn btn-danger w-25" href="https://discord.gg/6cYtpVj98V" target="_blank"><h4>▶️Nous rejoindre !◀️</h4></a>
        <router-link :to="{name:'Map'}" type="button" class="btn btn-primary w-25"><h4>🗺️Map🗺️</h4></router-link>
    </div>
    <br/>
    <div class="w-100 d-flex align-content-center justify-content-center gap-5">
        <a type="button" class="btn btn-light w-25" href="https://github.com/SwitchotG/RQHC/issues"><h4>🐜Bug report🐜</h4></a>
    </div>
    <br />
    <div>
    <br/>
    <div class="bg-info">
        <br/>
        <div class="w-100 mode text-dark" style="text-align: center;"><h3>{{ isFuture ? "⏳ Compte à rebours jusqu'au lancement de WorldEra" : '⏱ Temps écoulé depuis la sortie de WorldEra' }}</h3></div>
        <br/>
        <div class="w-100 d-flex align-content-center justify-content-center gap-5">
            <div v-for="unit in units" :key="unit.label">
                <span class="value text-dark"><h3>{{ unit.value }}</h3></span>
                <span class="label text-dark"><h3>{{ unit.label }}</h3></span>
            </div>
        </div>
        <br/>
    </div>
  </div>
    <br />
    <br/>
    <h2 class="w-100" style="text-align: center;">Membres important politiquement: </h2>
    <br/>
    <h2 class="w-100" style="text-align: center;"><b>Snax III : Roi</b></h2>
    <h3 class="w-100" style="text-align: center;">Nuggets : Première Ministre</h3>
    <h4 class="w-100" style="text-align: center;">Moustipro : Ministre des ressources</h4>
    <h4 class="w-100" style="text-align: center;">powerfinsh : Chef des armées</h4>
    <h4 class="w-100" style="text-align: center;">Soul : Ministre de l'économie</h4>
    <br />
    <p class="w-100" style="text-align: center;">Si vous contactez qui que ce soit soyez respectueux !</p>
</template>

<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue'

    const targetDate = ref(new Date(2026, 4, 30, 14, 0) )
    const now = ref(new Date())
    let timer = null

    const isFuture = computed(() => new Date(targetDate.value) > now.value)

    const diff = computed(() => {
    const target = new Date(targetDate.value)
    if (isNaN(target)) return 0
    return Math.abs(target - now.value)
    })

    const pad = n => String(n).padStart(2, '0')

    const units = computed(() => {
    const totalSec = Math.floor(diff.value / 1000)
    return [
        { label: 'Jours',    value: Math.floor(totalSec / 86400) },
        { label: 'Heures',   value: pad(Math.floor((totalSec % 86400) / 3600)) },
        { label: 'Minutes',  value: pad(Math.floor((totalSec % 3600) / 60)) },
        { label: 'Secondes', value: pad(totalSec % 60) },
    ]
    })

    onMounted(() => {
    timer = setInterval(() => { now.value = new Date() }, 1000)
    })

    onUnmounted(() => clearInterval(timer))
</script>