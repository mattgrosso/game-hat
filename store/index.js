import Vuex from 'vuex';
import axios from 'axios';
import { parseBggXmlApi2SearchResponse, parseBggXmlApi2ThingResponse } from '@code-bucket/board-game-geek';
import convert from 'xml-js';
import Cookie from 'js-cookie';

const objectToQuery = (object) => {
  return Object.keys(object).map((key) => [key, object[key]].join("=")).join("&&");
}

const createStore = () => {
  return new Vuex.Store({
    state: {
      token: null
    },
    getters: {
      isAuthenticated(state) {
        return state.token != null;
      }
    },
    mutations: {
      setToken (state, token) {
        state.token = token;
      },
      clearToken (state) {
        state.token = null;
      }
    },
    actions: {
      async authenticateUser (vuexContext, config) {
        let authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.fbAPIKey}`;

        if (!config.isLogin) {
          authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.fbAPIKey}`;
        }

        try {
          const result = await this.$axios.$post(
            authUrl,
            {
              email: config.email,
              password: config.password,
              returnSecureToken: true
            }
          )

          vuexContext.commit('setToken', result.idToken);
          localStorage.setItem('token', result.idToken);
          localStorage.setItem('tokenExpiration', new Date().getTime() + +result.expiresIn * 1000);
          Cookie.set('jwt', result.idToken);
          Cookie.set('tokenExpiration', new Date().getTime() + +result.expiresIn * 1000);
          return result;
        } catch (error) {
          return error;
        }
      },
      initAuth (vuexContext, request) {
        let token;
        let tokenExpiration;

        if (request) {
          if (!request.headers.cookie) {
            return;
          }

          const jwtCookie = request.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('jwt='));
          const expirationCookie = request.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('tokenExpiration='));

          if (!jwtCookie) {
            return;
          }
          
          token = jwtCookie.split('=')[1];
          tokenExpiration = expirationCookie.split('=')[1];
        } else {
          token = localStorage.getItem('token');
          tokenExpiration = localStorage.getItem('tokenExpiration');
        }

        if (new Date().getTime() > +tokenExpiration || !token) {
          vuexContext.commit('clearToken');
        }

        vuexContext.commit('setToken', token);
      },
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
