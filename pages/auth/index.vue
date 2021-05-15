<template>
  <div class="sign-in-form">
    <form @submit.prevent="onSubmit" class="col-12 col-md-6 mx-auto my-4">
      <div v-show="!isLogin" class="form-group">
        <label for="input-name">Name</label>
        <input
          type="text"
          v-model="name"
          class="form-control"
          id="input-name"
          placeholder="Name"
        >
      </div>
      <div class="form-group">
        <label for="input-email">Email address</label>
        <input 
          type="email"
          v-model="email"
          class="form-control"
          id="input-email"
          aria-describedby="emailHelp"
          placeholder="Enter email"
        >
      </div>
      <div class="form-group">
        <label for="input-password">Password</label>
        <input
          type="password"
          v-model="password"
          class="form-control"
          id="input-password"
          placeholder="Password"
        >
      </div>
      <button type="submit" class="btn btn-primary btn-block my-2">
        <span v-if="isLogin">Login</span>
        <span v-if="!isLogin">Sign Up</span>
      </button>
      <button
        class="btn btn-link my-2"
        @click.prevent="isLogin = !isLogin"
      >
        {{ isLogin ? "Create an account instead" : "Log in instead" }}
      </button>
    </form>
    <!-- <button class="btn btn-danger" @click="googleSignIn">
      Click Here
    </button> -->
  </div>
</template>

<script>
// import firebase from 'firebase';
// import Cookie from 'js-cookie';

export default {
  name: "Login",
  data() {
   return {
     isLogin: true,
     name: "",
     email: "",
     password: "",
    //  provider: null
   }
  },
  methods: {
    // async googleSignIn () {
    //   this.provider = new firebase.auth.GoogleAuthProvider();
    //   try {
    //     const auth = await firebase.auth().signInWithPopup(this.provider);
    //     console.log('auth: ', auth);
    //     this.$store.commit('setToken', auth.credential.accessToken);
    //     this.$store.commit('setEmail', auth.additionalUserInfo.profile.email);
    //     this.$store.commit('setTokenExpiration', new Date().getTime() + 1000000000000);

    //     localStorage.setItem('game-hat-token', auth.credential.accessToken);
    //     localStorage.setItem('game-hat-email', auth.additionalUserInfo.profile.email);
    //     localStorage.setItem('game-hat-token-expiration', new Date().getTime() + 1000000000000);

    //     Cookie.set('game-hat-token', auth.credential.accessToken);
    //     Cookie.set('game-hat-email', auth.additionalUserInfo.profile.email);
    //     Cookie.set('game-hat-token-expiration', new Date().getTime() + 1000000000000);

    //     await this.addUser({
    //       name: auth.additionalUserInfo.profile.given_name,
    //       email: auth.additionalUserInfo.profile.email
    //     });

    //     const path = this.$route.query.path || '/'
    //     this.$router.push(path);
    //   } catch (error) {
    //     console.log('error: ', error);
    //     // One likely error here is that an email is already in use (the person already has an account)
    //   }
      
    // },
    async onSubmit() {
      const config = {
        isLogin: this.isLogin,
        email: this.email,
        password: this.password
      };

      await this.$store.dispatch('authenticateUser', config);
      const localStorageUsername = JSON.parse(localStorage.getItem('game-hat-bgg-username'));

      if (localStorageUsername) {
        await this.addUser({ name: this.name, email: this.email });

        const path = this.$route.query.path || '/'
        this.$router.push(path);
      } else {
        // One likely error here is that an email is already in use (the person already has an account)
      }
    },
    async addUser(user) {
      const post = await this.$axios.post(
        `https://game-hat-default-rtdb.firebaseio.com/users.json?auth=${this.$store.state.token}`,
        user
      );

      if (post.statusText == 'OK') {
        console.error('Logged In');
      } else {
        console.log('post: ', post);
      }
    },
  },
}
</script>

<style>

</style>