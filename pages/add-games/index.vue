<template>
  <div v-if="filteredCollection" class="add-games">
    <div class="filters-wrapper bg-dark fixed-top row p-2 d-md-flex" >
      <div class="filter-menu-buttons col-2 d-md-none d-flex justify-content-start align-items-center" :class="showFilters ? 'filters-visible' : 'filters-hidden'">
        <button v-show="showFilters" class="btn btn-info" @click="hideFilters">
          <font-awesome-icon icon="times"/>
        </button>
        <button v-show="!showFilters" class="btn btn-info" @click="revealFilters">
          <font-awesome-icon icon="bars"/>
        </button>
      </div>
      <div class="username-mobile col-8 col-md-2 text-white align-items-center font-weight-bold justify-content-center">
        <p class="m-0">{{ $store.state.bggUsername}}</p>
      </div>
      <nuxt-link class="col-2 col-md-1 d-flex justify-content-end align-items-center" to="/">
        <button class="home btn btn-info">
          <font-awesome-icon icon="home"/>
        </button>
      </nuxt-link>
      <div class="filters bg-dark col-12 col-md-11 pt-4 pt-md-0 d-md-flex" :class="showFilters ? 'filters-visible' : 'filters-hidden'">
        <div class="text-filter text-white col-12 col-md-4">
          <input id="filter-input" class="col-12" v-model="filterText" type="text" placeholder="search"/>
          <span v-if="collection">
            {{ filteredCollection.length }} / {{ collection.length }}
          </span>
        </div>
        <div class="button-group col-12 col-md-6 p-3 py-md-0 d-md-flex justify-content-end">
          <div class="col-12 col-md-3 py-1 px-0 py-md-0 px-md-1">
            <button
              class="shuffle btn btn-info btn-block"
              @click="shuffleOrder"
            >
              Shuffle
            </button>
          </div>
          <div class="col-12 col-md-3 py-1 px-0 py-md-0 px-md-1">
            <button
              class="alphabetize btn btn-info btn-block"
              @click="alphabetizeOrder"
            >
              A-Z
            </button>
          </div>
          <div class="col-12 col-md-3 py-1 px-0 py-md-0 px-md-1">
            <button
              class="chronological btn btn-info btn-block"
              @click="chronologicalOrder"
            >
              Recent
            </button>
          </div>
          <div class="col-12 col-md-3 py-1 px-0 py-md-0 px-md-1">
            <button
              class="random btn btn-info btn-block"
              @click="scrollToRandom"
            >
              Random
            </button>
          </div>
        </div>
        <div class="username-desktop col-md-2 text-white align-items-center font-weight-bold border border-white justify-content-center">
          <p class="m-0">{{ $store.state.bggUsername}}</p>
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
          boundary="viewport"
          boundary-padding="25"
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
          <button v-if="!alert" class="btn btn-primary" :class="buttonClass" @click="addGame(game)">
            <span v-if="!loading && !checked">Add to Hat</span>
            <div v-if="loading" class="button-icon spinner-grow text-white" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <font-awesome-icon v-if="checked" class="button-icon" icon="check-circle"/>
          </button>
          <div v-if="alert" class="alert col-12 mx-auto m-0" :class="alert ? alert.class : ''">
            {{ alert.message }}
          </div>
        </b-popover>
      </li>
    </ul>
  </div>
</template>

<script>
import { shuffle, sortBy, maxBy, reverse } from 'lodash';

export default {
  name: 'add-games',
  middleware: ['check-auth', 'auth'],
  async mounted() {
    const bggUser = JSON.parse(localStorage.getItem('game-hat-bgg-username'));

    if (!this.$store.state.bggUsername) {
      console.error('no bggUsername in store');

      this.$router.push('/');
    } else {
      const collection = await this.$store.dispatch('getBGGUserCollection', this.$store.state.bggUsername);
      this.collection = collection;
  
      window.addEventListener('scroll', this.handleScroll);
    }
  },
  destroyed () {
    window.removeEventListener('scroll', this.handleScroll);
  },
  data() {
   return {
     collection: [],
     filterText: "",
     selectedGameId: null,
     selectedGame: null,
     showFilters: true,
     loading: false,
     checked: false,
     alert: null
   }
  },
  watch: {
    selectedGame () {
      this.checked = false;
    }
  },
  computed: {
    filteredCollection () {
      if (this.collection) {
        return this.collection.filter((game) => game.name.toLowerCase().includes(this.filterText.toLowerCase()));
      } else {
        return [];
      }
    },
    buttonClass () {
      if (this.checked) {
        return "btn-success";
      } else if (this.loading) {
        return "btn-secondary";
      } else {
        return "btn-primary";
      }
    }
  },
  methods: {
    hideFilters () {
      this.showFilters = false;
    },
    revealFilters () {
      this.showFilters = true;
    },
    handleScroll ($event) {
      const scrollTop = $event.srcElement.scrollingElement.scrollTop;

      if (scrollTop > 100) {
        this.showFilters = false;
      }
    },
    logout () {
      this.$store.dispatch('logout');
      this.$router.push('/auth');
    },
    async selectGame (gameId) {
      this.hideFilters();
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
      this.hideFilters();
      this.collection = shuffle(this.collection);
    },
    alphabetizeOrder () {
      this.hideFilters();
      this.collection = sortBy(this.collection, [(game) => game.name]);
    },
    chronologicalOrder () {
      this.hideFilters();
      this.collection = reverse(sortBy(this.collection, [(game) => game.status.modified]));
    },
    randomGame () {
      this.hideFilters();
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
    showAlert (message, alertClass, timer) {
      this.alert = {
        message: message,
        class: alertClass
      };

      setTimeout(() => {
        this.alert = null
      }, timer || 3000);
    },
    async addGame(game) {
      this.loading = true;
      const hat = await this.$axios.get(
        `https://game-hat-default-rtdb.firebaseio.com/game-hats/${this.$store.state.bggUsername}.json`
      );

      if (hat.data) {
        const duplicateGame = Object.keys(hat.data).find((entry) => {
          const sameUser = hat.data[entry].user.email == this.$store.state.email;
          const sameGame = hat.data[entry].game.id == game.attributes.objectId;
  
          return sameUser && sameGame;
        });
  
        if (duplicateGame) {
          this.loading = false;
          this.showAlert("Already in hat", "alert-warning", 2000)
          return;
        }        
      }

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
          `https://game-hat-default-rtdb.firebaseio.com/game-hats/${this.$store.state.bggUsername}.json?auth=${this.$store.state.token}`,
          gameForHat
        );        

        if (post.statusText == 'OK') {
          this.loading = false;
          this.checked = true;

          setTimeout(() => {
            this.checked = false;
            this.clearSelection();
          }, 1500);
        } else {
          console.log('post: ', post);
        }
      } catch (e) {
        this.loading = false;

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
  $filters-max-height: 325px; // Total magic numbers. Gross.
  $filters-min-height: 54px;

  .filters-wrapper {
    .username-mobile {
      display: flex;

      @media screen and (min-width: 768px) {
        display: none;
      }
    }

    .username-desktop {
      display: none;

      @media screen and (min-width: 768px) {
        display: flex;
      }
    }

    .filters {
      &.filters-hidden {
        display: none;
        padding: 0;

        @media screen and (min-width: 768px) {
          display: block;
        }
      }

      .text-filter {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        position: relative;

        input {
          padding: 6px 12px;
        }

        span {
          color: grey;
          font-size: 0.5rem;
          position: absolute;
          right: 21px;
          top: 4px;
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
      margin-top: $filters-max-height;
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

.popover {
  .close-popover {
    cursor: pointer;
    font-size: 20px;
    position: absolute;
    right: 12px;
    top: 8px;
  }

  .button-icon,
  .button-icon.svg-inline--fa.fa-check-circle {
    height: 20px;
    margin: 0 21px;
    width: 20px;
  }

  .alert {
    font-size: 16px;
    padding: 6px 12px;
  }
}
</style>