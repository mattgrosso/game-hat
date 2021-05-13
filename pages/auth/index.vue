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
          placeholder="Password"
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
      <button type="submit" class="btn btn-primary my-2">Submit</button>
      <button
        class="btn btn-secondary btn-secondary my-2"
        @click.prevent="isLogin = !isLogin"
      >
        {{ isLogin ? "Create account" : "Sign in" }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
   return {
     isLogin: true,
     name: "",
     email: "",
     password: ""
   }
  },
  methods: {
    async onSubmit() {
      const config = {
        isLogin: this.isLogin,
        email: this.email,
        password: this.password
      };

      await this.$store.dispatch('authenticateUser', config);

      if (this.$store.getters.isAuthenticated) {
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