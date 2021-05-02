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
      const config = {
        isLogin: this.isLogin,
        email: this.email,
        password: this.password
      };

      await this.$store.dispatch('authenticateUser', config);
      if (this.$store.getters.isAuthenticated) {
        const path = this.$route.query.path || '/'
        this.$router.push(path);
      } else {
        // One likely error here is that an email is already in use (the person already has an account)
      }
    }
  },
}
</script>

<style>

</style>