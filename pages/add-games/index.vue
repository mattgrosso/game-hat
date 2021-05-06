<template>
  <div class="add-games">
    <div class="filters bg-dark px-2 fixed-top">
      <div class="button-group mx-2">
        <button
          class="shuffle btn btn-secondary"
          @click="shuffleOrder"
        >
          Shuffle
        </button>
        <button
          class="shuffle btn btn-secondary"
          @click="alphabetizeOrder"
        >
          A-Z
        </button>
        <button
          class="shuffle btn btn-secondary"
          @click="scrollToRandom"
        >
          Random
        </button>
      </div>
      <div class="text-filter text-white mx-2">
        <label for="filter-input">Search: </label>
        <input id="filter-input" v-model="filterText" type="text"/>
      </div>
      <button class="btn btn-secondary" @click="$store.dispatch('logout')">Logout</button>
    </div>
    <ul v-if="filteredCollection" class="game-shelf">
      <li 
        v-for="game in filteredCollection"
        :key="game.attributes.objectId"
        :ref="game.attributes.objectId"
        class="game"
        :class="{'selected-game': game.attributes.objectId === selectedGameId}"
      >
        <img 
          :id="`popover-target-${game.attributes.objectId}`"
          :src="game.thumbnailUrl"
          :alt="`${game.name} Cover Image`"
          @click="selectGame(game.attributes.objectId)"
        >
        <b-popover
          :target="`popover-target-${game.attributes.objectId}`"
          placement="auto"
          :show="isSelected(game.attributes.objectId)"
        >
          <template #title>{{ game.name }}</template>
          <div v-if="selectedGame" class="game-details">
            <p v-html="truncatedDescription(selectedGame.description)"></p>
            <p>{{ displayPlayerCount(selectedGame.minplayers, selectedGame.maxplayers) }}</p>
            <div v-show="selectedGame.minplayers != selectedGame.maxplayers">
              <p>Good with {{ goodWith(selectedGame) }}</p>
              <p>Best with {{ bestWith(selectedGame) }}</p>
            </div>
            <p>Played {{ game.plays }} time{{game.plays === '1' ? '' : 's'}}</p>
          </div>
          <button class="btn btn-primary" @click="addGame(game)">Add to Hat</button>
        </b-popover>
      </li>
    </ul>
  </div>
</template>

<script>
import { shuffle, sortBy, maxBy } from 'lodash';

export default {
  middleware: ['check-auth', 'auth'],
  async fetch() {
    const search = await this.$store.dispatch('getBGGUserCollection', 'mattgrosso');
    this.collection = search;
  },
  data() {
   return {
     collection: [],
     filterText: "",
     selectedGameId: null,
     selectedGame: null
   }
  },
  computed: {
    filteredCollection () {
      return this.collection.filter((game) => game.name.toLowerCase().includes(this.filterText.toLowerCase()));
    }
  },
  methods: {
    async selectGame (gameId) {
      this.selectedGameId = gameId;
      this.selectedGame = null;
      this.getMoreDetailsForGame(gameId);
    },
    async getMoreDetailsForGame(gameId) {
      const game = await this.$store.dispatch('getBGGItem', gameId);
      this.selectedGame = game;
    },
    truncatedDescription (description) {
      const truncated = `${description.replace(/\.\.\./g,", ").replace(/\!/g,".").split(".").slice(0,2).join(". ")}.`
      return truncated;
    },
    playerCountPoll (game) {
      const poll = game.polls.find((poll) => poll.name === "suggested_numplayers");
      return {
        totalVotes: poll.totalvotes,
        results: poll.results.map((result) => {
          return {
            numPlayers: result._attributes.numplayers,
            best: result.result.find((r) => r._attributes.value == "Best")._attributes.numvotes,
            recommended: result.result.find((r) => r._attributes.value == "Recommended")._attributes.numvotes,
            notRecommended: result.result.find((r) => r._attributes.value == "Not Recommended")._attributes.numvotes,
          }
        })
      }
    },
    goodWith (game) {
      const poll = this.playerCountPoll(game);
      return poll.results.filter((result) => {
        return (parseInt(result.best) + parseInt(result.recommended)) > parseInt(result.notRecommended)
      }).map((result) => result.numPlayers).join(", ");
    },
    bestWith (game) {
      const poll = this.playerCountPoll(game);
      return maxBy(poll.results, (result) => parseInt(result.best)).numPlayers;
    },
    isSelected (gameId) {
      return this.selectedGameId === gameId;
    },
    shuffleOrder () {
      this.collection = shuffle(this.collection);
    },
    alphabetizeOrder () {
      this.collection = sortBy(this.collection, [(game) => game.name]);
    },
    randomGame () {
      const randomIndex = Math.floor(Math.random() * this.filteredCollection.length);
      return this.filteredCollection[randomIndex];
    },
    scrollToRandom () {
      const randomGame = this.randomGame();
      const randomRef = this.$refs[randomGame.attributes.objectId][0];

      const options = {
        easing: 'linear',
        lazy: false,
        offset: -70,
        force: true,
        cancelable: true,
        onDone: (element) => {
          setTimeout(() => {
            this.selectGame(randomGame.attributes.objectId);
          }, 1100);
        },
        x: false,
        y: true
      }

      this.$scrollTo(randomRef, 500, options);
    },
    async addGame(game) {
      const gameForHat = {
        timeStamp: Date.now(),
        game: game,
        user: {
          email: this.$store.state.email
        }
      };

      const post = await this.$axios.post(
        `https://game-hat-default-rtdb.firebaseio.com/game-hat.json?auth=${this.$store.state.token}`,
        gameForHat
      );

      if (post.statusText == 'OK') {
        console.error('Ok');
      } else {
        console.log('post: ', post);
      }
    },
    displayPlayerCount (min, max) {
      let count = `${min} - ${max}`;
      let players = "players";

      if (min === max) {
        count = `${min}`;
      }

      if (count === '1') {
        players = "player";
      }
      
      return `${count} ${players}`
    }
  },
}
</script>

<style lang="scss" scoped>
.add-games {
  $filters-height: 70px;

  .filters {
    align-items: center;
    display: flex;
    height: $filters-height;
    justify-content: space-between;
  }

  .game-shelf {
    background-color: #ededed;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    list-style: none;
    margin: $filters-height 0 0;
    padding: 0;

    .game {
      background-color: #ededed;
      border-bottom: 24px solid #322d1b;
      cursor: pointer;
      margin-bottom: 16px;
      padding: 16px 16px 0;
      position: relative;

      &:hover,
      &.selected-game {
        img {
          transform: scale(1.05) translateY(-3px);
        }
      }

      img {
        box-shadow: 4px -4px 10px 4px #0000005e;
        max-height: 200px;
        transition: transform 0.2s;
      }

      .details {
        background-color: white;
        border: 1px solid #000;
        bottom: 0;
        position: absolute;
      }
    }
  }
}
</style>