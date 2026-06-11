// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJEYBmU2ZbmBIKvQVNZqzNx_IryIP08OA",
  authDomain: "forex9ja-585c3.firebaseapp.com",
  projectId: "forex9ja-585c3",
  storageBucket: "forex9ja-585c3.firebasestorage.app",
  messagingSenderId: "599207635482",
  appId: "1:599207635482:web:cf587e7f057b417044ffa3",
  measurementId: "G-XRK2B7NC65"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
