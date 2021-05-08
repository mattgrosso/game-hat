<template>
  <div class="draw-game p-5">
    <div class="draw-filters bg-dark p-2 fixed-top">
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
    <div class="content">
      <button class="btn btn-primary" @click="drawGame">Draw a Game</button>
      <div v-if="drawnObject" class="drawn-game">
        <img :src="drawnGame.imageUrl" :alt="`${drawnGame.name} Cover`">
        <h2 class="col-12 text-center">{{ drawnGame.name }}</h2>
        <p class="col-12 text-center">Added {{ daysAgo }} by {{drawnObject.user.email}}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { sample } from "lodash";

export default {
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
    }
  },
  methods: {
    async drawGame() {
      const games = await this.loadHat();
      const filteredGames = this.filteredGames(games);

      if (filteredGames.length) {
        const randomGame = sample(filteredGames);
        this.drawnObject = randomGame;

        this.removeGameFromHat(randomGame);
      } else {
        console.log("No games in the hat matching filters");
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
    filteredGames (games) {
      return games.filter((game) => this.userSelectedIndex(game.user) !== false);
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
    }
  },
}
</script>

<style lang="scss">
  $filters-height: 70px;
  
  .draw-game {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;

    .draw-filters {
      .users {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin: 0;

        li {
          cursor: pointer;
        }
      }
    }

    .content {
      margin: $filters-height 0 0;

      .drawn-game {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;

        img {
          max-width: 50%;
        }
      }
    }

  }
</style>