import Vuex from 'vuex';
import axios from 'axios';
import { parseBggXmlApi2SearchResponse, parseBggXmlApi2ThingResponse } from '@code-bucket/board-game-geek';
import convert from 'xml-js';

const objectToQuery = (object) => {
  return Object.keys(object).map((key) => [key, object[key]].join("=")).join("&&");
}

const createStore = () => {
  return new Vuex.Store({
    state: {},
    getters: {},
    mutations: {},
    actions: {
      async getBGGUser(vuexContext, username) {
        const query = {
          username: username,
          excludesubtype: 'boardgameexpansion',
          own: 1
        }

        const response = await axios.get(`https://api.geekdo.com/xmlapi2/collection?${objectToQuery(query)}`);

        if (response.status === 202) {
          setTimeout(() => {
            this.dispatch('getBGGUser', username);
          }, 250);
        } else {
          const jsonResponse = convert.xml2json(response.data, {compact: true, spaces: 4});
          return JSON.parse(jsonResponse).items;
        }
      },
      async searchBGG(vuexContext, query) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/search?query=${query}`);
        const bggResponse = parseBggXmlApi2SearchResponse(response.data);

        return bggResponse;
      },
      async getBGGItem(vuexContext, itemId) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/thing?id=${itemId}&versions=1`);
        const bggResponse = parseBggXmlApi2ThingResponse(response.data);

        return bggResponse;
      },
      async getBGGItems(vuexContext, itemIds) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/thing?id=${itemIds.join(',')}&versions=1`);
        const bggResponse = parseBggXmlApi2ThingResponse(response.data);

        return bggResponse;
      }
    },
  });
};

export default createStore;
