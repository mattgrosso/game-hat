<template>
  <div class="container">
    <div>
      <h1 class="title">Welcome to the Game Hat</h1>
      <h2 class="subtitle">What would you like to do?</h2>
      <div class="options p-4">
        <nuxt-link to="/add-games">
          <button class="btn btn-primary mx-3">Add games to the hat</button>
        </nuxt-link>
        <nuxt-link to="/draw-game">
          <button class="btn btn-success mx-3">Draw a game from the hat</button>
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
