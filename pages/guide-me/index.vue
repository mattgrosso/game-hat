<template>
  <div class="guide-me">
    <div v-if="loadingCollection" class="collection-loading">
      <div class="button-icon spinner-grow text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="drawnGame" class="drawn-game px-3">
      <img class="my-3" :src="drawnGame.imageUrl" :alt="`${drawnGame.name} Cover`">
      <h2 class="col-12 text-center">{{ drawnGame.name }}</h2>
    </div>
    <div class="two-choices" v-else>
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
      drawnGame: null
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
  
        const prompt = `Please find two category buckets that you can sort the following board games into such that the games are divided as equally as possible into the two buckets.
        It is important that only game titles that are listed are included in the buckets.
        Do not add new titles to the list.
        ${exclude}
        I am going to have to parse the string you return so please format your response like this:
        {{Category One Title}}:: comma separated list of games in category one[new line]
        {{Category Two Title}}:: comma separated list of games in category two[new line]
        ${listOfTitles}
  
        You'll need to replace '{{Category One Title}}' and '{{Category Two Title}}' with your own titles.
        Do not include curly braces in the titles.`
  
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
    },
    drawGame (title) {

      this.drawnGame = this.collection.find((game) => game.name === title.trim());
    },
    pluralize (word, count) {
      return pluralize(word, count);
    }
  },
};
</script>

<style lang="scss">
.guide-me {
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
}
</style>