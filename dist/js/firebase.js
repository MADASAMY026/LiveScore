// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, orderBy, limit, getDocs, onSnapshot, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUws3Ter92GVQPe5b-U4JUUcbOxXYK8cI",
  authDomain: "ipl-pro-dccb5.firebaseapp.com",
  projectId: "ipl-pro-dccb5",
  storageBucket: "ipl-pro-dccb5.firebasestorage.app",
  messagingSenderId: "795875131955",
  appId: "1:795875131955:web:ee87c47ee73069c1391946",
  measurementId: "G-9N3VGVXLCP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export to window so other non-module scripts can use them
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseProviders = { google: googleProvider };
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.arrayUnion = arrayUnion;
window.collection = collection;
window.query = query;
window.orderBy = orderBy;
window.limit = limit;
window.getDocs = getDocs;
window.onSnapshot = onSnapshot;
window.serverTimestamp = serverTimestamp;
window.addDoc = addDoc;

// Re-export for module imports
export { app, auth, db, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, orderBy, limit, getDocs, onSnapshot, serverTimestamp, addDoc };
