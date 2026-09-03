import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBcE_whC37Bv8oF6-MUL2bdlB_5pneDxxQ',
  authDomain: 'rompiendo-paradigmas-app.firebaseapp.com',
  projectId: 'rompiendo-paradigmas-app',
  storageBucket: 'rompiendo-paradigmas-app.firebasestorage.app',
  messagingSenderId: '1081114291157',
  appId: '1:1081114291157:web:3d43ffde83cb4607ba2b5c',
  measurementId: 'G-MX9JP786DN'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
