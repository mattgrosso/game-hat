<template>
  <div class="game-hat p-4">
    <div v-if="!showUsernamePrompt && bggUser" class="content">
      <div class="title my-5 col-12 justify-content-center align-items-center">
        <div v-show="!switchingHats" class="h3 my-2">{{bggUser}}'s</div>
        <div v-show="switchingHats" class="input-group col-8 mx-auto my-2" @keyup="handleKeyup($event, 'bggUserTitleInput')">
          <input type="text" class="form-control" ref="bggUserTitleInput">
          <span class="input-group-append">
            <button class="btn btn-success" type="button" @click="saveBGGUser($event, 'bggUserTitleInput')">
              <font-awesome-icon class="button-icon" icon="check-circle"/>
            </button>
          </span>
        </div>
        <h1>
          Game Hat
        </h1>
      </div>
      <h2 class="subtitle h5 col-12">What would you like to do?</h2>
      <div class="options p-4">
        <nuxt-link to="/add-games">
          <button class="btn btn-primary my-3 md-mx-3">Add games to the hat</button>
        </nuxt-link>
        <nuxt-link to="/draw-game">
          <button class="btn btn-success my-3 md-mx-3">Draw a game from the hat</button>
        </nuxt-link>
        <button v-if="!switchingHats" class="btn btn-secondary my-3 md-mx-3" @click="switchingHats = true">Switch hats</button>
      </div>
    </div>
    <div v-if="showUsernamePrompt" class="username-prompt">
      <h2 class="mb-2">Who's hat do you want to use?</h2>
      <div class="input-group" @keyup="handleKeyup($event, 'bggUserPromptInput')">
        <input type="text" class="form-control" ref="bggUserPromptInput" placeholder="BGG Username">
        <button class="btn btn-primary" @click="saveBGGUser($event, 'bggUserPromptInput')">Go</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "game-hat-index",
  mounted() {
    this.bggUser = JSON.parse(localStorage.getItem('game-hat-bgg-username')) || this.$route.query.username;

    if (this.bggUser) {
      this.$store.commit("setBGGUser", this.bggUser);
    } else {
      this.showUsernamePrompt = true;
    }
  },
  data() {
   return {
     bggUser: null,
     switchingHats: false,
     showUsernamePrompt: false
   }
  },
  watch: {
    bggUser (newVal) {
      if (newVal) {
        this.$store.commit("setBGGUser", newVal);
      }
    },
    switchingHats (newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.$refs.bggUserTitleInput.focus();
        });
      }
    }
  },
  methods: {
    handleKeyup($event, test) {
      const key = $event.key;
      
      if (key == "Enter") {
        this.switchingHats = false;
        this.showUsernamePrompt = false;
        this.saveBGGUser(test);
      } else if (key == "Escape") {
        this.switchingHats = false;
        this.showUsernamePrompt = false;
      }
    },
    saveBGGUser (inputElement) {
      this.bggUser = this.$refs[inputElement].value;
    }
  },
}
</script>

<style lang="scss">
.game-hat {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  align-content: center;
  flex-wrap: wrap;

  .title {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: block;
    font-weight: 300;
    color: #35495e;
    letter-spacing: 1px;
  }

  .subtitle {
    font-weight: 300;
    color: #526488;
    word-spacing: 5px;
    padding-bottom: 15px;
  }
}

</style>
