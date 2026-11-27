import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvvRkN9VxROOc193USLrg27wIuWBZJa3A",
  authDomain: "controle-notas-pai-1337.firebaseapp.com",
  projectId: "controle-notas-pai-1337",
  messagingSenderId: "202193609511",
  appId: "1:202193609511:web:666ecc9b10e9972ae5ff02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
