<template>
  
</template>

<script>
export default {
  async mounted() {
    const search = await this.$store.dispatch('searchBGG', 'scythe');
    console.log('search: ', search);
  },
}
</script>

<style>

</style>