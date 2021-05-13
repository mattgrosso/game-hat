<template>
  <div class="add-games">
    <div class="filters-wrapper bg-dark fixed-top row p-2 py-md-0" >
      <div class="filter-menu-buttons col-2 d-md-none align-items-center d-flex" :class="showFilters ? 'filters-visible' : 'filters-hidden'">
        <button v-show="showFilters" class="btn btn-secondary" @click="hideFilters">
          <font-awesome-icon icon="times"/>
        </button>
        <button v-show="!showFilters" class="btn btn-secondary" @click="revealFilters">
          <font-awesome-icon icon="bars"/>
        </button>
      </div>
      <div class="filters bg-dark col-10 col-md-12 p-2" :class="showFilters ? 'filters-visible' : 'filters-hidden'">
        <div class="text-filter text-white col-12 col-md-4">
          <input id="filter-input" v-model="filterText" type="text" placeholder="search"/>
          <span>
            {{this.filteredCollection.length}} / {{ this.collection.length }}
          </span>
        </div>
        <div class="button-group pt-4 pt-sm-0 col-12 col-md-8">
          <button
            class="shuffle btn btn-secondary"
            @click="shuffleOrder"
          >
            Shuffle
          </button>
          <button
            class="alphabetize btn btn-secondary"
            @click="alphabetizeOrder"
          >
            A-Z
          </button>
          <button
            class="chronological btn btn-secondary"
            @click="chronologicalOrder"
          >
            Recent
          </button>
          <button
            class="random btn btn-secondary"
            @click="scrollToRandom"
          >
            Random
          </button>
        </div>
      </div>
    </div>
    <ul v-if="filteredCollection" class="game-shelf" :class="showFilters ? 'filters-visible' : 'filters-hidden'">
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
          <font-awesome-icon @click="clearSelection" class="close-popover" icon="times"/>
          <template #title>
            <span class="pr-4">{{ game.name }}</span>
          </template>
          <div v-if="selectedGame" class="game-details">
            <p v-html="truncatedDescription(selectedGame.description)"></p>
            <p>{{ displayPlayerCount(selectedGame.minplayers, selectedGame.maxplayers) }}</p>
            <div v-show="selectedGame.minplayers != selectedGame.maxplayers">
              <p v-if="goodWith(selectedGame)">Good with {{ goodWith(selectedGame) }}</p>
              <p v-if="bestWith(selectedGame)">Best with {{ bestWith(selectedGame) }}</p>
            </div>
            <p>Added on {{ parsedAddedDate(game) }}</p>
            <p>Played {{ game.plays }} time{{game.plays === '1' ? '' : 's'}}</p>
          </div>
          <button class="btn btn-primary" @click="addGame(game)">Add to Hat</button>
        </b-popover>
      </li>
    </ul>
  </div>
</template>

<script>
import { shuffle, sortBy, maxBy, reverse } from 'lodash';

export default {
  middleware: ['check-auth', 'auth'],
  async fetch() {
    const collection = await this.$store.dispatch('getBGGUserCollection', 'mattgrosso');
    this.collection = collection;
  },
  data() {
   return {
     collection: [],
     filterText: "",
     selectedGameId: null,
     selectedGame: null,
     showFilters: true
   }
  },
  computed: {
    filteredCollection () {
      return this.collection.filter((game) => game.name.toLowerCase().includes(this.filterText.toLowerCase()));
    },
  },
  methods: {
    hideFilters () {
      this.showFilters = false;
    },
    revealFilters () {
      this.showFilters = true;
    },
    logout () {
      this.$store.dispatch('logout');
      this.$router.push('/auth');
    },
    async selectGame (gameId) {
      this.selectedGameId = gameId;
      this.selectedGame = null;
      this.getMoreDetailsForGame(gameId);
    },
    clearSelection () {
      this.selectedGameId = null;
      this.selectedGame = null;
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

      if (!poll.totalvotes) {
        return;
      }

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

      if (!poll) {
        return;
      }

      return poll.results.filter((result) => {
        return (parseInt(result.best) + parseInt(result.recommended)) > parseInt(result.notRecommended)
      }).map((result) => result.numPlayers).join(", ");
    },
    bestWith (game) {
      const poll = this.playerCountPoll(game);

      if (!poll) {
        return;
      }

      return maxBy(poll.results, (result) => parseInt(result.best)).numPlayers;
    },
    parsedAddedDate(game) {
      const date = new Date(game.status.modified);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
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
    chronologicalOrder () {
      this.collection = reverse(sortBy(this.collection, [(game) => game.status.modified]));
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
      const fullGame = await this.$store.dispatch('getBGGItem', game.attributes.objectId);

      const gameForHat = {
        timeStamp: Date.now(),
        game: {
          ...fullGame,
          plays: game.plays,
          status: game.status
        },
        user: {
          email: this.$store.state.email
        }
      };

      try {
        const post = await this.$axios.post(
          `https://game-hat-default-rtdb.firebaseio.com/game-hat.json?auth=${this.$store.state.token}`,
          gameForHat
        );        

        if (post.statusText == 'OK') {
          console.error('Ok');
        } else {
          console.log('post: ', post);
        }
      } catch (e) {
        if (e.response.status === 401) {
          this.$router.push({path: '/auth', query: {path: this.$route.path}});
        }
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

<style lang="scss">
.add-games {
  $filters-max-height: 162px; // Total magic numbers. Gross.
  $filters-medium-height: 116px;
  $filters-min-height: 62px;

  .filters-wrapper {
    .filter-menu-buttons {
      &.filters-visible {
        align-self: flex-start;
        margin-top: 5px;
      }
    }

    .filters {
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      @media screen and (min-width: 576px) {
        align-items: center;
        justify-content: space-between;
      }

      @media screen and (min-width: 768px) {
        flex-direction: row-reverse;
      }

      &.filters-hidden {
        .button-group {
          display: none;
        }
      }

      .text-filter {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        position: relative;

        span {
          color: grey;
          font-size: 0.5rem;
          position: absolute;
          right: 21px;
          top: 4px;
        }
      }

      .button-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;

        .btn {
          margin: 4px 0 4px 8px;
        }
      }
    }
  }

  .game-shelf {
    background-color: #ededed;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    list-style: none;
    margin: $filters-max-height 0 0;
    padding: 0;

    &.filters-hidden {
      margin-top: $filters-min-height;
    }

    @media screen and (min-width: 576px) {
      margin-top: $filters-medium-height;
    }

    @media screen and (min-width: 768px) {
      margin-top: $filters-min-height;
    }

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
        max-height: 120px;
        transition: transform 0.2s;

        @media screen and (min-width: 576px) {
          max-height: 200px;
        }
      }
    }
  }
}

.close-popover {
  cursor: pointer;
  font-size: 20px;
  position: absolute;
  right: 12px;
  top: 8px;
}
</style>