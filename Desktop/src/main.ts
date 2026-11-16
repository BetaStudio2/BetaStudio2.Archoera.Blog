import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// ── WebWord global styles ──
import '@/webword/assets/styles/variables.scss'
import '@/webword/assets/styles/base.scss'
import '@/webword/assets/styles/splash.scss'
import '@/webword/assets/styles/titlebar.scss'
import '@/webword/assets/styles/tabs.scss'
import '@/webword/assets/styles/ribbon.scss'
import '@/webword/assets/styles/content.scss'
import '@/webword/assets/styles/sidebar.scss'
import '@/webword/assets/styles/statusbar.scss'
import '@/webword/assets/styles/modal.scss'
import '@/webword/assets/styles/scrollbar.scss'
import '@/webword/assets/styles/filemenu.scss'
import '@/webword/assets/styles/taskview.scss'
import '@/webword/assets/styles/introduction.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
