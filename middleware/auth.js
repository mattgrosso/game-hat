export default function (context) {
  if (!context.store.getters.isAuthenticated) {
    context.redirect({path: '/auth', query: {path: context.route.path}});
  }
}