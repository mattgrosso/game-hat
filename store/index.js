import Vuex from 'vuex';
import axios from 'axios';
import { parseBggXmlApi2SearchResponse } from '@code-bucket/board-game-geek';

const createStore = () => {
  return new Vuex.Store({
    state: {},
    getters: {},
    mutations: {},
    actions: {
      async searchBGG(vuexContext, query) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/search?query=${query}`);
        const bggResponse = parseBggXmlApi2SearchResponse(response.data);

        return bggResponse;
      }
    },
  });
};

export default createStore;
