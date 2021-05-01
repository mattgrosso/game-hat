<template>
  <div class="sign-in-form">
    <form @submit.prevent="onSubmit" class="col-6 mx-auto my-4">
      <div class="form-group">
        <label for="exampleInputEmail1">Email address</label>
        <input 
          type="email"
          v-model="email"
          class="form-control"
          id="exampleInputEmail1"
          aria-describedby="emailHelp"
          placeholder="Enter email"
        >
      </div>
      <div class="form-group">
        <label for="exampleInputPassword1">Password</label>
        <input
          type="password"
          v-model="password"
          class="form-control"
          id="exampleInputPassword1"
          placeholder="Password"
        >
      </div>
      <button type="submit" class="btn btn-primary my-2">Submit</button>
      <button
        class="btn btn-secondary btn-secondary my-2"
        @click.prevent="isLogin = !isLogin"
      >
        Click here to {{ isLogin ? "create an account" : "sign in" }} instead
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
     email: "",
     password: ""
   }
  },
  methods: {
    async onSubmit() {
      let authUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDcGNK9jufWQ1DQXBZQ4fCtqz4qA4KUGP4";

      if (!this.isLogin) {
        authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDcGNK9jufWQ1DQXBZQ4fCtqz4qA4KUGP4'
      }

      try {
        const result = await this.$axios.$post(
          authUrl,
          {
            email: this.email,
            password: this.password,
            returnSecureToken: true
          }
        )

        // Right here people will get back a token that we will need to submit when they are posting
        // to the database. Probably there should be some sort of user object that we keep in vuex.
        // Also, maybe there's a way to store someone's token in local storage so they don't have to
        // log in all the time.
        console.log('result: ', result);
      } catch (error) {
        // One likely error here is that an email is already in use (the person already has an account)
        console.log('error: ', error);
      }
    }
  },
}
</script>

<style>

</style>