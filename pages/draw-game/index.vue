<template>
  <div class="draw-game p-5">
    <button v-if="!drawnObject" class="btn btn-primary" @click="drawGame">Draw a Game</button>
    <div v-if="drawnObject" class="drawn-game">
      <img :src="drawnGame.imageUrl" :alt="`${drawnGame.name} Cover`">
      <h2 class="col-12 text-center">{{ drawnGame.name }}</h2>
      <p class="col-12 text-center">Added {{ daysAgo }} by {{drawnObject.user.email}}</p>
    </div>
  </div>
</template>

<script>
import { sample } from "lodash";

export default {
  middleware: ['check-auth', 'auth'],
  data() {
    return {
      drawnObject: null
    }
  },
  computed: {
    drawnGame () {
      return this.drawnObject.game;
    },
    daysAgo() {
      return `${Math.floor(
        (Date.now() - this.drawnObject.timeStamp) / 1000 / 60 / 60 / 24
      )} days ago`;
    },
  },
  methods: {
    async drawGame() {
      const games = await this.loadHat();

      if (games.length) {
        const randomGame = sample(games);
        this.drawnObject = randomGame;

        this.removeGameFromHat(randomGame);
      } else {
        this.showMessage('No games in the hat. Which is sad.');
        return 'Error Loading Game Title';
      }
    },
    async removeGameFromHat(game) {
      const gameForHistory = { ...game };
      delete gameForHistory.id;

      const addToHistory = await this.$axios.post(
        `https://game-hat-default-rtdb.firebaseio.com/game-hat-history.json?auth=${this.$store.state.token}`,
        gameForHistory
      );

      if (addToHistory.statusText != 'OK') {
        console.error(
          'Something went wrong with moving to History: ',
          addToHistory
        );
        return;
      }

      const removeFromHat = await this.$axios.delete(
        `https://game-hat-default-rtdb.firebaseio.com/game-hat/${game.id}.json?auth=${this.$store.state.token}`
      );

      if (removeFromHat.statusText != 'OK') {
        console.log('Something went wrong with game delete: ', removeFromHat);
        return;
      }
    },
    async loadHat() {
      const resp = await this.$axios.get(
        `https://game-hat-default-rtdb.firebaseio.com/game-hat.json`
      );

      if (resp.statusText == 'OK') {
        let games = [];

        if (resp.data) {
          games = Object.keys(resp.data).map((key) => {
            const game = { ...resp.data[key], id: key };
            return game;
          });
        }

        return games;
      } else {
        console.log(resp);
        return [];
      }
    },
  },
}
</script>

<style lang="scss">
  .draw-game {
    display: flex;
    justify-content: center;

    .drawn-game {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;

      img {
        max-width: 50%;
      }
    }
  }
</style>