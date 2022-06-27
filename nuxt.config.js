export default {
  server: {
    port: 8000,
  },
  target: 'static',
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'Game Hat',
    meta: [
      { charset: 'utf-8' },
      {
        name: 'viewport',
        content:
          'minimal-ui, width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href:
          'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css',
        integrity:
          'sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1',
        crossorigin: 'anonymous',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
      },
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Roboto+Slab&display=swap',
      },
    ],
  },

  env: {
    fbAPIKey: process.env.fbAPIKey
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: ['~/plugins/firebase.js'],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/dotenv',
    'vue-scrollto/nuxt',
    'bootstrap-vue/nuxt'
  ],

  bootstrapVue: {
    icons: false  
  },

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {
    proxy: false,
  },

  // proxy: {
  //   'apis.justwatch.com': 'https://fast-refuge-34363.herokuapp.com/',
  // },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    transpile: [/@code-bucket.*/], // transpile ESM modules within all fullcalendar packages
    babel: {
      plugins: [
        ['@babel/plugin-proposal-private-methods', { loose: true }]
      ],
      compact: true
    }
  },
};
