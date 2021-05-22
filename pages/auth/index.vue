<template>
  <div class="auth-form">
    <form @submit.prevent="onSubmit" class="col-12 col-md-6 mx-auto my-4">
      <div v-show="!isLogin" class="form-group">
        <label for="input-name">Name</label>
        <input
          type="text"
          v-model="name"
          class="form-control"
          :class="!nameIsUnique ? 'not-unique' : 'unique'"
          id="input-name"
          placeholder="Name"
          required
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
          required
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
          required
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
    <div v-if="alert" class="alert col-12 mx-auto m-0" :class="alert ? alert.class : ''">
      {{ alert.message }}
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  async mounted() {
    await this.loadUsers();
  },
  data() {
   return {
     isLogin: true,
     name: "",
     email: "",
     password: "",
     alert: null,
     users: []
   }
  },
  computed: {
    nameIsUnique () {
      const names = this.users.map((user) => user.name);

      return !names.includes(this.name);
    }
  },
  methods: {
    async loadUsers() {
      const resp = await this.$axios.get(
        `https://game-hat-default-rtdb.firebaseio.com/users.json`
      );

      if (resp.statusText == 'OK') {
        let users = [];

        if (resp.data) {
          users = Object.keys(resp.data).map((key) => {
            const user = { ...resp.data[key], id: key };
            return user;
          });
        }

        this.users = users;
        return users;
      } else {
        console.log(resp);
        return [];
      }
    },
    async onSubmit() {
      if (!isLogin && !this.nameIsUnique) {
        this.showAlert("That name is in use. Please choose a unique name. (Maybe add a second initial)", "alert-warning", 8000);

        return;
      }

      const config = {
        isLogin: this.isLogin,
        email: this.email,
        password: this.password
      };

      const authUser = await this.$store.dispatch('authenticateUser', config);

      if (authUser.email) {
        const userEmails = this.users.map((user) => user.email);

        if (!userEmails.includes(authUser.email)) {
          await this.addUser({ name: this.name, email: this.email });
        }
  
        const path = this.$route.query.path || '/'
        this.$router.push(path);
      } else {
        try {
          if (authUser.response.data.error.message == "EMAIL_EXISTS") {
            this.showAlert("Email already has account", "alert-danger");
          } else {
            this.showAlert(`${authUser.response.status} - ${authUser.response.data.error.message}`, "alert-danger", 10000);
          }
        } catch (error) {
          this.showAlert(`There was an error we didn't handle: ${error}`, "alert-danger")
          console.log('error.response: ', error.response);
        }
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
        console.error('post.statusText is not OK');
        console.log('post: ', post);
      }
    },
    showAlert (message, alertClass, timer) {
      this.alert = {
        message: message,
        class: alertClass
      };

      setTimeout(() => {
        this.alert = null
      }, timer || 3000);
    },
  },
}
</script>

<style lang="scss">
.auth-form {
  #input-name.not-unique {
    border-color: red;
  }
}
</style>