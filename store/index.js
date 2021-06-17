import Vuex from 'vuex';
import axios from 'axios';
import { parseBggXmlApi2SearchResponse, parseBggXmlApi2ThingResponse } from '@code-bucket/board-game-geek';
import convert from 'xml-js';
import Cookie from 'js-cookie';

const objectToQuery = (object) => {
  return Object.keys(object).map((key) => [key, object[key]].join("=")).join("&&");
}

const parseCollection = (collection) => {
  collection = collection || [];

  return collection.map((game) => {
    return {
      imageUrl: game.image._text,
      name: game.name._text,
      plays: game.numplays._text,
      status: {
        forTrade: game.status._attributes.fortrade,
        modified: game.status._attributes.lastmodified,
        own: game.status._attributes.own,
      },
      thumbnailUrl: game.thumbnail._text,
      yearPublished: game.yearpublished._text,
      attributes: {
        collid: game._attributes.collid,
        objectId: game._attributes.objectid,
        objectType: game._attributes.objecttype,
        subtype: game._attributes.subtype,
      }
    }
  })
};

const parseItem = (item) => {
  const parsedItem = {
    id: item._attributes.id,
    type: item._attributes.type,
    thumbnail: item.thumbnail._text,
    image: item.image._text,
    links: [],
    names: [],
    yearpublished: item.yearpublished._attributes.value,
    description: item.description._text,
    minplayers: item.minplayers._attributes.value,
    maxplayers: item.maxplayers._attributes.value,
    polls: [],
    playingtime: item.playingtime._attributes.value,
    minplaytime: item.minplaytime._attributes.value,
    maxplaytime: item.maxplaytime._attributes.value,
    minage: item.minage._attributes.value,
  }

  item.link.forEach((link) => {
    parsedItem.links.push({
      id: link._attributes.id,
      type: link._attributes.type,
      value: link._attributes.value
    })
  })

  item.name.forEach((name) => {
    parsedItem.names.push({
      value: name._attributes.value,
      type: name._attributes.type,
      sortindex: name._attributes.sortindex
    })
  })

  item.poll.forEach((poll) => {
    parsedItem.polls.push({
      name: poll._attributes.name,
      title: poll._attributes.title,
      totalvotes: poll._attributes.totalvotes,
      results: poll.results
    })
  })

  return parsedItem;
}

const createStore = () => {
  return new Vuex.Store({
    state: {
      token: null,
      email: null,
      tokenExpiration: null,
      bggUsername: null
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
      setEmail (state, email) {
        state.email = email;
      },
      setTokenExpiration (state, tokenExpiration) {
        state.tokenExpiration = tokenExpiration;
      },
      setBGGUser (state, username) {
        localStorage.setItem('game-hat-bgg-username', JSON.stringify(username));
        state.bggUsername = username;
      },
      clearToken (state) {
        state.token = null;
      },
      clearEmail (state) {
        state.email = null;
      },
      clearTokenExpiration (state) {
        state.tokenExpiration = null;
      }
    },
    actions: {
      // Authentication
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
          vuexContext.commit('setEmail', result.email);
          vuexContext.commit('setTokenExpiration', new Date().getTime() + +result.expiresIn * 1000);

          localStorage.setItem('game-hat-token', result.idToken);
          localStorage.setItem('game-hat-email', result.email);
          localStorage.setItem('game-hat-token-expiration', new Date().getTime() + +result.expiresIn * 1000);

          Cookie.set('game-hat-token', result.idToken);
          Cookie.set('game-hat-email', result.email);
          Cookie.set('game-hat-token-expiration', new Date().getTime() + +result.expiresIn * 1000);

          return result;
        } catch (error) {
          return error;
        }
      },
      initAuth (vuexContext, request) {
        let token;
        let email;
        let tokenExpiration;

        if (request) {
          if (!request.headers.cookie) {
            return;
          }

          const tokenCookie = request.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('game-hat-token='));
          const tokenEmail = request.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('game-hat-email='));
          const expirationCookie = request.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('game-hat-token-expiration='));

          if (!tokenCookie) {
            return;
          }
          
          token = tokenCookie.split('=')[1];
          email = tokenEmail.split('=')[1];
          tokenExpiration = expirationCookie.split('=')[1];
        } else if (process.client) {
          token = localStorage.getItem('game-hat-token');
          email = localStorage.getItem('game-hat-email');
          tokenExpiration = localStorage.getItem('game-hat-token-expiration');
        }

        if (new Date().getTime() > +tokenExpiration || !token) {
          this.dispatch('logout');
        } else {
          vuexContext.commit('setToken', token);
          vuexContext.commit('setEmail', email);
          vuexContext.commit('setTokenExpiration', tokenExpiration);
        }
      },
      logout (vuexContext) {
        vuexContext.commit("clearToken");
        vuexContext.commit("clearEmail");
        vuexContext.commit("clearTokenExpiration");

        Cookie.remove("game-hat-token");
        Cookie.remove("game-hat-email");
        Cookie.remove("game-hat-token-expiration");

        if (process.client) {
          localStorage.removeItem("game-hat-token");
          localStorage.removeItem("game-hat-email");
          localStorage.removeItem("game-hat-token-expiration");
        }
      },
      // BGG API
      async getBGGUserCollection(vuexContext, username) {
        const query = {
          username: username,
          excludesubtype: 'boardgameexpansion',
          own: 1
        }

        const response = await axios.get(`https://api.geekdo.com/xmlapi2/collection?${objectToQuery(query)}`);

        if (response.status === 202) {
          setTimeout(() => {
            this.dispatch('getBGGUserCollection', username);
          }, 250);
        } else {
          const jsonResponse = convert.xml2json(response.data, {compact: true, spaces: 4});
          return parseCollection(JSON.parse(jsonResponse).items.item);
        }
      },
      async searchBGG(vuexContext, query) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/search?query=${query}`);
        const bggResponse = parseBggXmlApi2SearchResponse(response.data);

        return bggResponse;
      },
      async getBGGItem(vuexContext, itemId) {
        const response = await axios.get(`https://api.geekdo.com/xmlapi2/thing?id=${itemId}&versions=1`);
        try {
          const bggResponse = parseBggXmlApi2ThingResponse(response.data);
          return bggResponse.items[0];
        } catch (error) {
          const jsonResponse = convert.xml2json(response.data, {compact: true, spaces: 4});
          return parseItem(JSON.parse(jsonResponse).items.item);
        }
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
