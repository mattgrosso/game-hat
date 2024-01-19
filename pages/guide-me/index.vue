<template>
  <div class="guide-me">
    <div v-if="!playerCount" class="player-count">
      <h2 class="text-light d-flex align-items-center">How Many Players?</h2>
      <button class="btn btn-light col-5" @click="playerCount = '1'">1</button>
      <button class="btn btn-light col-5" @click="playerCount = '2'">2</button>
      <button class="btn btn-light col-5" @click="playerCount = '3'">3</button>
      <button class="btn btn-light col-5" @click="playerCount = '4'">4</button>
      <button class="btn btn-light col-5" @click="playerCount = '5'">5</button>
      <button class="btn btn-light col-5" @click="playerCount = '6'">6</button>
      <button class="btn btn-light col-5" @click="playerCount = '7'">7</button>
      <button class="btn btn-light col-5" @click="playerCount = '8 or more'">8+</button>
    </div>
    <div v-else-if="loadingCollection" class="collection-loading">
      <div class="button-icon spinner-grow text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="drawnGame" class="drawn-game px-3">
      <img class="my-3" :src="drawnGame.imageUrl" :alt="`${drawnGame.name} Cover`">
      <h2 class="col-12 text-center">{{ drawnGame.name }}</h2>
      <button class="btn btn-secondary" @click="reset">Try again</button>
    </div>
    <div v-else class="two-choices">
      <button
        v-if="categoryOne"
        class="choice choice-one btn p-4"
        @click="splitGamesIntoTwoCategories(categoryOneGamesList)"
      >
        <h2>{{ pluralize(categoryOne.title, 1) }}</h2>
      </button>
      <button
        v-if="categoryTwo"
        class="choice choice-two btn p-4"
        @click="splitGamesIntoTwoCategories(categoryTwoGamesList)"
      >
        <h2>{{ pluralize(categoryTwo.title, 1) }}</h2>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import pluralize from 'pluralize';
import { uniq } from "lodash";

export default {
  name: 'GuideMe',
  data () {
    return {
      collection: [],
      loadingCollection: false,
      categoryOne: null,
      categoryTwo: null,
      excludeWords: [],
      drawnGame: null,
      playerCount: null
    }
  },
  async mounted () {
    const bggUser = JSON.parse(localStorage.getItem('game-hat-bgg-username')) || this.$route.query.username;

    if (!bggUser) {
      this.$router.push('/');
    } else {
      this.$store.commit("setBGGUser", bggUser);

      this.loadingCollection = true;

      const collection = await this.$store.dispatch('getBGGUserCollection', this.$store.state.bggUsername);
      this.collection = collection;

      await this.splitGamesIntoTwoCategories(this.collection.map((game) => game.name).join(','));

      this.loadingCollection = false;
    }
  },
  computed: {
    categoryOneGamesList () {
      if (!this.categoryOne) {
        return '';
      } else {
        return this.categoryOne.games.join(',')
      }
    },
    categoryTwoGamesList () {
      if (!this.categoryTwo) {
        return '';
      } else {
        return this.categoryTwo.games.join(',')
      }
    },
    excludeWordsMinusGame () {
      return this.excludeWords
        .filter((word) => word.toLowerCase() !== 'games')
        .filter((word) => word.toLowerCase() !== 'game')
        .filter((word) => word.length > 3);
    }
  },
  methods: {
    async splitGamesIntoTwoCategories (listOfTitles) {
      console.log('number of titles: ', listOfTitles.split(',').length);
      if (listOfTitles.split(',').length === 1) {
        this.drawGame(listOfTitles);
      } else {
        this.loadingCollection = true;
        const apiKey = process.env.chatGPTAPIKey;
        const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  
        const exclude = this.categoryOne && this.categoryTwo ? `Please do not use categories with any of the following words: ${this.excludeWords.join(', ')}.` : '';
        const playerCount = this.playerCount ? `Please only include games that support ${this.playerCount} players.` : '';
  
        const prompt = `Please find two category buckets that you can sort the following board games into such that the games are divided as equally as possible into the two buckets.
        It is important that only game titles that are listed are included in the buckets.
        Do not add new titles to the list.
        ${exclude}
        ${playerCount}
        I am going to have to parse the string you return so please format your response like this:
        {{Category One Title}}:: comma separated list of games in category one[new line]
        {{Category Two Title}}:: comma separated list of games in category two[new line]
        ${listOfTitles}
  
        You'll need to replace '{{Category One Title}}' and '{{Category Two Title}}' with your own titles.
        Do not include curly braces in the titles.
        Do not name the categories 'Category One' and 'Category Two'.`
  
        const response = await axios.post(
          apiEndpoint,
          {
            model: 'gpt-4',
            messages: [
              { 
                role: "user",
                content: prompt 
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
  
        this.parseChatGPTResponse(response);
        this.loadingCollection = false;
      }
    },
    parseChatGPTResponse (response) {
      const { choices } = response.data;
      const { content } = choices[0].message;

      if (content) {
        const splitText = content.split('\n');
        const filteredText = splitText.filter((line) => line !== '');
        
        if (filteredText && filteredText.length > 1) {
          this.categoryOne = {
            title: filteredText[0].split('::')[0],
            games: filteredText[0].split('::')[1].split(',')
          };
    
          this.categoryTwo = {
            title: filteredText[1].split('::')[0],
            games: filteredText[1].split('::')[1].split(',')
          };
    
          const titleWords = [
            ...this.categoryOne.title.split(' '),
            ...this.categoryTwo.title.split(' ')
          ];
    
          this.excludeWords = uniq([
            ...this.excludeWords,
            ...titleWords
          ]);
        } else {
          return;
        }
      } else {
        return;
      }
    },
    drawGame (title) {
      this.drawnGame = this.collection.find((game) => game.name === title.trim());
    },
    pluralize (word, count) {
      return pluralize(word, count);
    },
    reset () {
      this.categoryOne = null;
      this.categoryTwo = null;
      this.excludeWords = [];
      this.drawnGame = null;
      this.playerCount = null;
    }
  },
};
</script>

<style lang="scss">
.guide-me {
  background: #74b2d3;

  .player-count {
    display: flex;
    height: 100vh;
    padding: 0 24px 50px;
    justify-content: center;
    row-gap: 10px;
    column-gap: 10px;
    flex-wrap: wrap;

    button {
      font-size: 3rem;
    }
  }

  .collection-loading {
    align-items: center;
    display: flex;
    height: 80vh;
    justify-content: center;

    .button-icon {
      height: 50px;
      width: 50px;

      &.filters-visible {
        margin-top: 450px;

        @media screen and (min-width: 768px) {
          margin: 0;
        }
      }
    }
  }

  .drawn-game {
    align-content: center;
    background: #74b2d3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    height: 100vh;

    img {
      max-height: 70vh;
      max-width: 80%;
    }
  }

  .two-choices {
    .choice {
      height: 50vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .choice-one {
      background-color: #1c73ca;
      color: #fff;
    }

    .choice-two {
      background-color: #bd18ba;
      color: #fff;
    }
  }
}
</style>