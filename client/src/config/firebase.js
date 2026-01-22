import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCoxuWpjaOQ7uVfWje3WI7ARNWTp6nub1Y",
  authDomain: "aroma-mart.firebaseapp.com",
  projectId: "aroma-mart",
  storageBucket: "aroma-mart.firebasestorage.app",
  messagingSenderId: "617056548224",
  appId: "1:617056548224:web:64ba34ce9f369744d1fd65",
  measurementId: "G-5YVMTP2V9P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
