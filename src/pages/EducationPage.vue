<template>
  <q-page class="module-page education-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">APRENDE A TU RITMO</div>
          <h1>Contenido educativo</h1>
          <p
            >Información general para acompañar tus registros y conversaciones
            con tu equipo de salud.</p
          >
        </div>
        <div class="education-mark" aria-hidden="true">
          <q-icon name="school" />
        </div>
      </div>

      <q-banner rounded class="education-disclaimer q-mb-lg">
        <template #avatar><q-icon name="medical_services" /></template>
        Este contenido es educativo y general. No diagnostica, no indica cambios
        de tratamiento y no sustituye una consulta profesional.
      </q-banner>

      <div class="topic-grid">
        <q-card v-for="topic in topics" :key="topic.title" class="topic-card">
          <q-card-section>
            <div class="topic-icon" :class="topic.tone" aria-hidden="true">
              <q-icon :name="topic.icon" />
            </div>
            <div class="topic-title">{{ topic.title }}</div>
            <div class="topic-intro">{{ topic.intro }}</div>
            <q-expansion-item
              dense
              expand-separator
              label="Leer más"
              header-class="read-more"
              class="topic-expansion"
            >
              <div class="topic-body">{{ topic.content }}</div>
              <div v-if="topic.to" class="q-pa-md q-pt-none">
                <q-btn
                  flat
                  dense
                  no-caps
                  class="btn-topic-action"
                  icon-right="arrow_forward"
                  :label="topic.action"
                  :to="topic.to"
                />
              </div>
            </q-expansion-item>
          </q-card-section>
        </q-card>
      </div>

      <div class="support-card">
        <div class="support-icon" aria-hidden="true">
          <q-icon name="forum" />
        </div>
        <div class="support-copy">
          <div class="support-title">Lleva tus preguntas a tu consulta</div>
          <div class="support-text"
            >Tus registros pueden ayudar a iniciar una conversación informada
            con el equipo que te acompaña.</div
          >
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-support"
          label="Ver mis reportes"
          to="/reports"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth.js'

const $q = useQuasar()
const auth = useAuthStore()

const topics = [
  {
    title: 'Tus mediciones',
    intro: 'Un registro claro y consistente puede facilitar el seguimiento.',
    content:
      'Anota el valor, la fecha y el contexto tal como ocurrió. Si una lectura te preocupa, coméntala con un profesional de salud en lugar de tomar decisiones basadas únicamente en la aplicación.',
    icon: 'opacity',
    tone: 'topic-rose',
    action: 'Ir a mis mediciones',
    to: '/glucose'
  },
  {
    title: 'Presión arterial',
    intro: 'Guarda las cifras que aparecen en tu tensiómetro.',
    content:
      'Registrar ambas cifras y, si está disponible, el pulso permite consultar el historial más adelante. Sigue las instrucciones del fabricante del dispositivo y las indicaciones que te haya dado tu equipo de salud.',
    icon: 'favorite_border',
    tone: 'topic-soft-rose',
    action: 'Abrir presión arterial',
    to: '/pressure'
  },
  {
    title: 'Medicamentos',
    intro: 'Mantén la información de tu tratamiento en un lugar accesible.',
    content:
      'Puedes guardar el nombre, la dosis y la frecuencia indicada. No cambies, suspendas ni inicies un medicamento usando solo la información de Vitalia; consulta con quien te lo prescribió.',
    icon: 'medication',
    tone: 'topic-lilac',
    action: 'Ver medicamentos',
    to: '/medications'
  },
  {
    title: 'Diario de alimentación',
    intro: 'Las notas personales pueden ayudarte a recordar tu rutina.',
    content:
      'El diario permite guardar comidas y observaciones propias. No evalúa alimentos ni crea planes nutricionales; las necesidades pueden variar entre personas y se revisan mejor con un profesional.',
    icon: 'restaurant',
    tone: 'topic-peach',
    action: 'Abrir mi diario',
    to: '/nutrition'
  },
  {
    title: 'Recordatorios',
    intro: 'Ajusta avisos sencillos para apoyar tu organización.',
    content:
      'Los avisos de Vitalia dependen de los permisos del navegador y se muestran mientras la aplicación está abierta en este dispositivo. No equivalen a alarmas médicas ni a un sistema de emergencia.',
    icon: 'notifications',
    tone: 'topic-amber',
    action: 'Configurar avisos',
    to: '/reminders'
  },
  {
    title: 'Tu información',
    intro: 'Consulta tus datos y mantén protegida tu cuenta.',
    content:
      'Las lecturas se guardan en la cuenta con la que iniciaste sesión. Cierra la sesión si compartes el dispositivo y utiliza la opción de recuperación de contraseña si no puedes acceder.',
    icon: 'lock',
    tone: 'topic-blue',
    action: 'Ver mi perfil',
    to: '/profile'
  }
]

onMounted(async () => {
  try {
    await auth.initialize()
  } catch (error) {
    console.error('No se pudo restaurar la sesión:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo validar tu sesión.',
      position: 'top'
    })
  }
})
</script>

<style scoped>
.module-page {
  min-height: calc(100vh - 116px);
  padding: 28px 24px 48px;
  background-color: #fdf8f8;
}

.module-content {
  width: min(1050px, 100%);
  margin: 0 auto;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.page-eyebrow {
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.page-heading h1 {
  margin: 6px 0 5px;
  color: #3a2226;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
}

.page-heading p {
  max-width: 650px;
  margin: 0;
  color: #8c6e73;
  font-size: 12px;
  line-height: 1.65;
}

.education-mark {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border-radius: 17px;
  color: #d86b7a;
  background: #fbe6e9;
  font-size: 27px;
}

.education-disclaimer {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 12px;
  line-height: 1.6;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.topic-card {
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(216, 107, 122, 0.04);
}

.topic-icon {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  margin-bottom: 13px;
  border-radius: 12px;
  font-size: 20px;
}

/* Paleta armonizada con toques pasteles */
.topic-rose {
  color: #c05867;
  background: #fbe3e6;
}
.topic-soft-rose {
  color: #d86b7a;
  background: #fdf0f2;
}
.topic-lilac {
  color: #8173a0;
  background: #efebf7;
}
.topic-peach {
  color: #ac785e;
  background: #f8ece4;
}
.topic-amber {
  color: #a68148;
  background: #f7f0df;
}
.topic-blue {
  color: #63839a;
  background: #e9f1f5;
}

.topic-title {
  color: #3a2226;
  font-size: 14px;
  font-weight: 700;
}

.topic-intro {
  min-height: 38px;
  margin-top: 6px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.55;
}

.topic-expansion {
  margin: 11px -16px -9px;
  border-top: 1px solid #faeaec;
}

.topic-body {
  padding: 11px 16px 9px;
  color: #6e585c;
  font-size: 11px;
  line-height: 1.7;
}

.read-more {
  color: #c05867;
  font-size: 11px;
  font-weight: 600;
}

.btn-topic-action {
  color: #c05867;
  font-weight: 600;
}

.support-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding: 17px 19px;
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: linear-gradient(100deg, #fdf2f4, #faf0e6);
}

.support-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  color: #c05867;
  background: #fbe3e6;
  font-size: 21px;
}

.support-copy {
  flex: 1;
}

.support-title {
  color: #3a2226;
  font-size: 12px;
  font-weight: 700;
}

.support-text {
  margin-top: 4px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.5;
}

.btn-support {
  background-color: #d86b7a;
  color: #ffffff;
  font-weight: 600;
}

.btn-support:hover {
  background-color: #c05867;
}

@media (max-width: 800px) {
  .topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .module-page {
    padding: 19px 14px 32px;
  }

  .topic-grid {
    grid-template-columns: 1fr;
  }

  .support-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .support-copy {
    min-width: calc(100% - 65px);
  }

  .support-card .q-btn {
    margin-left: 55px;
  }
}
</style>
