<template>
  <div class="game-hat p-4">
    <h1 class="title my-5 col-12">Game Hat</h1>
    <h2 class="subtitle h5 col-12">What would you like to do?</h2>
    <div class="options p-4">
      <nuxt-link to="/add-games">
        <button class="btn btn-primary my-3 md-mx-3">Add games to the hat</button>
      </nuxt-link>
      <nuxt-link to="/draw-game">
        <button class="btn btn-success my-3 md-mx-3">Draw a game from the hat</button>
      </nuxt-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "game-hat-index"
}
</script>

<style lang="scss">
.game-hat {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  align-content: center;
  flex-wrap: wrap;

  .title {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: block;
    font-weight: 300;
    color: #35495e;
    letter-spacing: 1px;
  }

  .subtitle {
    font-weight: 300;
    color: #526488;
    word-spacing: 5px;
    padding-bottom: 15px;
  }
}

</style>
