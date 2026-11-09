<template>
  <main class="welcome-page">
    <q-card class="welcome-card">
      <div class="welcome-copy">
        <div class="welcome-brand">
          <q-icon name="spa" />
          <span>VITALIA</span>
        </div>
        <div class="welcome-kicker">CUIDADO QUE TE ACOMPAÑA</div>
        <h1>Tu salud también cuenta</h1>
        <p>
          Un espacio cercano para llevar tu bienestar con calma, claridad y
          confianza.
        </p>
        <div class="welcome-actions">
          <q-btn
            unelevated
            rounded
            no-caps
            color="primary"
            label="Comenzar"
            icon-right="arrow_forward"
            :to="registerRoute"
          />
          <q-btn
            flat
            rounded
            no-caps
            color="dark"
            label="Ya tengo una cuenta"
            :to="loginRoute"
          />
        </div>
        <div class="welcome-caption">
          <q-icon name="verified_user" />
          <span>Tu información, protegida en tu cuenta personal</span>
        </div>
      </div>
      <div class="welcome-art" aria-hidden="true">
        <div class="art-sun" />
        <div class="art-leaf leaf-one" />
        <div class="art-leaf leaf-two" />
        <div class="art-heart">💗</div>
        <div class="art-couple">
          <span>👵🏼</span>
          <span>👴🏼</span>
        </div>
        <div class="art-caption">Cuidarnos también es querernos 💚</div>
      </div>
    </q-card>
    <div class="welcome-footer">VITALIA · BIENESTAR EN EQUILIBRIO</div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string'
    ? { redirect: route.query.redirect }
    : {}
)
const registerRoute = computed(() => ({
  path: '/login',
  query: { ...redirectQuery.value, mode: 'register' }
}))
const loginRoute = computed(() => ({
  path: '/login',
  query: redirectQuery.value
}))
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(
      ellipse at 9% 12%,
      rgba(196, 168, 120, 0.16),
      transparent 34%
    ),
    radial-gradient(
      ellipse at 90% 92%,
      rgba(121, 149, 138, 0.16),
      transparent 36%
    ),
    #f4f5f1;
}

.welcome-card {
  width: min(100%, 1000px);
  min-height: 550px;
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  overflow: hidden;
  border: 1px solid #e6ebe6;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(38, 54, 47, 0.12);
}

.welcome-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 64px clamp(32px, 7vw, 82px);
}

.welcome-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #476b63;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.welcome-brand .q-icon {
  color: #c4a878;
  font-size: 28px;
}

.welcome-kicker {
  margin-top: 54px;
  color: #79958a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  max-width: 430px;
  margin: 13px 0 10px;
  color: #293a34;
  font-size: clamp(34px, 5vw, 48px);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1.08;
}

.welcome-copy p {
  max-width: 390px;
  margin: 0;
  color: #74827b;
  font-size: 15px;
  line-height: 1.75;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
}

.welcome-actions .q-btn:first-child {
  min-height: 46px;
  padding: 0 22px;
  box-shadow: 0 9px 22px rgba(71, 107, 99, 0.2);
}

.welcome-caption {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 44px;
  color: #7d8c84;
  font-size: 11px;
}

.welcome-caption .q-icon {
  color: #79958a;
}

.welcome-art {
  position: relative;
  min-height: 450px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 35%,
      rgba(255, 255, 255, 0.58),
      transparent 40%
    ),
    linear-gradient(155deg, #f8ddd5 0%, #e8eee1 55%, #cfe4d2 100%);
}

.art-sun {
  position: absolute;
  top: 65px;
  left: 50%;
  width: 235px;
  height: 235px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: #f7cfc2;
}

.art-heart {
  position: absolute;
  z-index: 4;
  top: 74px;
  right: 20%;
  font-size: 38px;
  transform: rotate(12deg);
}

.art-couple {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 42px;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 4px;
  font-size: clamp(88px, 13vw, 150px);
  line-height: 1;
}

.art-caption {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: 18px;
  left: 0;
  color: #52775d;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.art-leaf {
  position: absolute;
  z-index: 1;
  bottom: 60px;
  width: 150px;
  height: 270px;
  border-radius: 100% 0 100% 0;
  background: #79b58d;
  transform-origin: bottom;
}

.leaf-one {
  left: 12%;
  transform: rotate(-24deg);
}

.leaf-two {
  right: 12%;
  background: #a7cf9f;
  transform: rotate(25deg) scaleX(-1);
}

@media (max-width: 700px) {
  .welcome-page {
    padding: 16px;
  }

  .welcome-card {
    max-width: 480px;
    grid-template-columns: 1fr;
    border-radius: 24px;
  }

  .welcome-copy {
    padding: 34px 28px 30px;
  }

  .welcome-kicker {
    margin-top: 30px;
  }

  .welcome-caption {
    margin-top: 26px;
  }

  .welcome-art {
    min-height: 290px;
  }

  .art-sun {
    top: 35px;
    width: 170px;
    height: 170px;
  }

  .art-couple {
    bottom: 38px;
    font-size: 104px;
  }

  .art-leaf {
    bottom: 25px;
    height: 200px;
  }

  .welcome-footer {
    display: none;
  }
}

.welcome-footer {
  position: absolute;
  bottom: 16px;
  color: #9aa59f;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.17em;
}
</style>
