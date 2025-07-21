// src/firebase.js
import { initializeApp } from 'firebase/app';
// import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyA1pru2boBx0-N3NhfWpPXoy_bDGebMUSM",
    authDomain: "council-of-elders-web-ui.firebaseapp.com",
    projectId: "council-of-elders-web-ui",
    storageBucket: "council-of-elders-web-ui.appspot.com",
    messagingSenderId: "274516107404",
    appId: "1:274516107404:web:96933f3fb2f86fd9addba9"
};

const app = initializeApp(firebaseConfig);
// const storage = getStorage(app);

export default app;
