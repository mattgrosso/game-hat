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
    </div>
    <ul v-if="filteredCollection" class="game-shelf">
      <li 
        v-for="game in filteredCollection"
        :key="game._attributes.objectid"
        :ref="game._attributes.objectid"
        class="game"
        :class="{'selected-game': game._attributes.objectid === selectedGameId}"
      >
        <img 
          :id="`popover-target-${game._attributes.objectid}`"
          :src="game.thumbnail._text"
          :alt="`${game.name._text} Cover Image`"
          @click="selectGame(game._attributes.objectid)"
        >
        <b-popover
          :target="`popover-target-${game._attributes.objectid}`"
          placement="auto"
          :show="isSelected(game._attributes.objectid)"
        >
          <template #title>{{ game.name._text }}</template>
          <p>Added to collection on {{ game.status._attributes.lastmodified }}</p>
          <p>Played {{ game.numplays._text }} time{{game.numplays._text === '1' ? '' : 's'}}</p>
        </b-popover>
      </li>
    </ul>
  </div>
</template>

<script>
import { shuffle, sortBy } from 'lodash';

export default {
  async fetch() {
    const search = await this.$store.dispatch('getBGGUser', 'mattgrosso');
    this.collection = search.item;
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
      return this.collection.filter((game) => game.name._text.toLowerCase().includes(this.filterText.toLowerCase()));
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
      this.collection = sortBy(this.collection, [(game) => game.name._text]);
    },
    randomGame () {
      const randomIndex = Math.floor(Math.random() * this.filteredCollection.length);
      return this.filteredCollection[randomIndex];
    },
    scrollToRandom () {
      const randomGame = this.randomGame();
      const randomRef = this.$refs[randomGame._attributes.objectid][0];

      const options = {
        easing: 'linear',
        lazy: false,
        offset: -70,
        force: true,
        cancelable: true,
        onDone: (element) => {
          setTimeout(() => {
            this.selectGame(randomGame._attributes.objectid);
          }, 1100);
        },
        x: false,
        y: true
      }

      this.$scrollTo(randomRef, 500, options);
    }
  },
}
</script>

<style lang="scss" scoped>
.add-games {
  $filters-height: 70px;

  .filters {
    display: flex;
    justify-content: space-between;
    height: $filters-height;
    align-items: center;
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
      border-bottom: 32px solid #322d1b;
      padding: 16px 16px 0;
      cursor: pointer;
      position: relative;

      &:hover,
      &.selected-game {
        img {
          transform: scale(1.05) translateY(-5px);
        }
      }

      img {
        box-shadow: 4px -4px 10px 4px #0000005e;
        max-height: 200px;
        transition: transform 0.2s;
      }

      .details {
        position: absolute;
        bottom: 0;
        border: 1px solid #000;
        background-color: white;
      }
    }
  }
}
</style>