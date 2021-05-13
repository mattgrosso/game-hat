import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyDcGNK9jufWQ1DQXBZQ4fCtqz4qA4KUGP4",
  authDomain: "game-hat.firebaseapp.com",
  databaseURL: "https://game-hat-default-rtdb.firebaseio.com",
  projectId: "game-hat",
  storageBucket: "game-hat.appspot.com",
  messagingSenderId: "647464623762",
  appId: "1:647464623762:web:a55368e3397e46dcd1d04b"
};

let app = {};
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
}

export default app;