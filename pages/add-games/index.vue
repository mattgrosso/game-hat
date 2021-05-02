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
          <p>Added to collection on {{ game.status.modified }}</p>
          <p>Played {{ game.plays }} time{{game.plays === '1' ? '' : 's'}}</p>
          <button class="btn btn-primary" @click="addGame(game)">Add to Hat</button>
        </b-popover>
      </li>
    </ul>
  </div>
</template>

<script>
import { shuffle, sortBy } from 'lodash';

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
     selectedGameId: null
   }
  },
  computed: {
    filteredCollection () {
      return this.collection.filter((game) => game.name.toLowerCase().includes(this.filterText.toLowerCase()));
    }
  },
  methods: {
    selectGame (gameId) {
      this.selectedGameId = gameId;
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