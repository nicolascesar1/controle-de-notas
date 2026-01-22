import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Substitua pelo objeto de configuração do seu projeto Firebase
// Você pode encontrar essas informações no console do Firebase > Project Settings
const firebaseConfig = {
  apiKey: "API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
