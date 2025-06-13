
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Asegúrate de que esta configuración sea la de TU proyecto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAnTyfRT6aWOOM06mVwnTLWh6rMSgrLu5s",
  authDomain: "chattyrental-l9d7m.firebaseapp.com",
  projectId: "chattyrental-l9d7m",
  storageBucket: "chattyrental-l9d7m.appspot.com",
  messagingSenderId: "1093674867640",
  appId: "1:1093674867640:web:c7f023e6a13340ca994d4d"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, db };
