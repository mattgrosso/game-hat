<template>
  <div class="draw-game">
    <div v-if="!drawnObject" class="draw-filters bg-dark p-2 col-12">
      <div class="users-wrapper text-light border border-light p-2 my-2 rounded">
        <p>Who's playing?</p>
        <ul class="users list-unstyled">
          <li
            v-for="user in users"
            :key="user.id"
            class="m-1"
            @click="toggleUser(user)"
          >
            <h4>
              <span
                class="badge badge-pill"
                :class="userSelectedIndex(user) !== false ? 'badge-success' : 'badge-secondary'"
                >{{ user.name }}</span>
            </h4>
          </li>
        </ul>
      </div>
      <div class="player-counts-wrapper text-light border border-light p-2 my-2 rounded">
        <p>How many players?</p>
        <ul class="player-counts list-unstyled">
          <li
            v-for="(playerCount, index) in playerCounts"
            :key="index"
            class="m-1"
            @click="setPlayerCount(playerCount)"
          >
            <h4>
              <span
                class="badge badge-pill"
                :class="selectedPlayerCount.value === playerCount.value ? 'badge-success' : 'badge-secondary'"
              >
                {{ playerCount.display }}
              </span>
            </h4>
          </li>
        </ul>  
      </div>
      <div class="playtimes-wrapper text-light border border-light p-2 my-2 rounded">
        <p>How long can you play?</p>
        <ul class="playtimes list-unstyled">
          <li
            v-for="(playTime, index) in playTimes"
            :key="index"
            class="m-1"
            @click="setMaxPlayTime(playTime)"
          >
            <h4>
              <span
                class="badge badge-pill"
                :class="maxPlayTime.value === playTime.value ? 'badge-success' : 'badge-secondary'"
              >
                {{ playTime.display }}
              </span>
            </h4>
          </li>
        </ul>  
      </div>
      <div v-if="!alert" class="draw-game-button-wrapper col-12 d-flex p-3">
        <button class="btn btn-primary mx-auto" @click="drawGame">Draw a Game</button>
      </div>
      <div v-if="alert" class="alert col-10 col-md-6 p-3 mx-auto" :class="alert ? alert.class : ''">
        {{ alert.message }}
      </div>
    </div>
    <div class="content p-2">
      <div v-if="drawnObject" class="drawn-game px-3">
        <img class="my-3" :src="drawnGame.image" :alt="`${drawnGame.names[0].value} Cover`">
        <h2 class="col-12 text-center">{{ drawnGame.names[0].value }}</h2>
        <p class="col-12 text-center">Added {{ daysAgo }} by {{drawnObject.user.email}}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { sample } from "lodash";

export default {
  name: "draw-game",
  middleware: ['check-auth', 'auth'],
  async fetch() {
    const users = await this.loadUsers();
    this.users = users;
    this.selectedUsers.push({ email: this.$store.state.email });
  },
  data() {
    return {
      users: [],
      selectedUsers: [],
      playerCounts: [
        {display: "1", value: 1},
        {display: "2", value: 2},
        {display: "3", value: 3},
        {display: "4", value: 4},
        {display: "5", value: 5},
        {display: "6", value: 6},
        {display: "7", value: 7},
        {display: "8", value: 8},
        {display: "9", value: 9},
        {display: "10", value: 10}
      ],
      selectedPlayerCount: {display: "1", value: 1},
      playTimes: [
        {display: "30'", value: 30},
        {display: "60'", value: 60},
        {display: "90'", value: 90},
        {display: "120'", value: 120},
        {display: "No Max", value: 100000},
      ],
      maxPlayTime: {display: "No Max", value: 100000},
      drawnObject: null,
      alert: null
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
    }
  },
  methods: {
    showAlert (message, alertClass, timer) {
      this.alert = {
        message: message,
        class: alertClass
      };

      setTimeout(() => {
        this.alert = null
      }, timer || 3000);
    },
    async drawGame() {
      const games = await this.loadHat();
      const filteredGames = this.filteredGames(games);

      if (filteredGames.length) {
        const randomGame = sample(filteredGames);
        this.drawnObject = randomGame;

        this.removeGameFromHat(randomGame);
      } else {
        this.showAlert("No games in the hat matching filters", "alert-danger");
        return 'Error Loading Game Title';
      }
    },
    async removeGameFromHat(game) {
      const gameForHistory = { ...game };
      delete gameForHistory.id;

      try {
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
      } catch (e) {
        if (e.response.status === 401) {
          this.$router.push({path: '/auth', query: {path: this.$route.path}});
        }
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
    async loadUsers() {
      const resp = await this.$axios.get(
        `https://game-hat-default-rtdb.firebaseio.com/users.json`
      );

      if (resp.statusText == 'OK') {
        let users = [];

        if (resp.data) {
          users = Object.keys(resp.data).map((key) => {
            const user = { ...resp.data[key], id: key };
            return user;
          });
        }

        return users;
      } else {
        console.log(resp);
        return [];
      }
    },
    inPlayerCountRange (game, count) {
      return count >= game.minplayers && count <= game.maxplayers;
    },
    averagePlayTime (game) {
      return (game.maxplaytime + game.minplaytime) / 2;
    },
    filteredGames (games) {
      const userFiltered = games.filter((gameObj) => this.userSelectedIndex(gameObj.user) !== false);
      const playerCountFiltered = userFiltered.filter((gameObj) => this.inPlayerCountRange(gameObj.game, this.selectedPlayerCount.value));
      const lengthFiltered = playerCountFiltered.filter((gameObj) => this.averagePlayTime(gameObj.game) <= this.maxPlayTime.value);

      return lengthFiltered;
    },
    userSelectedIndex (user) {
      const userSelectedIndex = this.selectedUsers.findIndex((u) => u.email == user.email);
      
      if (userSelectedIndex > -1) {
        return userSelectedIndex;
      } else {
        return false;
      }
    },
    toggleUser (user) {
      if (this.userSelectedIndex(user) !== false) {
        this.selectedUsers.splice(this.userSelectedIndex(user), 1);
      } else {
        this.selectedUsers.push(user);
      }

      this.selectedPlayerCount = this.playerCounts.find((playerCount) => playerCount.value == this.selectedUsers.length);
    },
    setPlayerCount (playerCount) {
      this.selectedPlayerCount = playerCount;
    },
    setMaxPlayTime (playTime) {
      this.maxPlayTime = playTime;
    }
  },
}
</script>

<style lang="scss">
  .draw-game {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;

    .draw-filters {
      .users,
      .player-counts,
      .playtimes {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        margin: 0;

        li {
          cursor: pointer;
        }
      }
    }

    .content {
      .drawn-game {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;

        img {
          max-height: 70vh;
          max-width: 80%;
        }
      }
    }

  }
</style>