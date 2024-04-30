import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import AccountPage from './components/AccountPage/AccountPage';
import MessagesView from './components/MessagesView/MessagesView';
// import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1pru2boBx0-N3NhfWpPXoy_bDGebMUSM",
    authDomain: "council-of-elders-web-ui.firebaseapp.com",
    projectId: "council-of-elders-web-ui",
    storageBucket: "council-of-elders-web-ui.appspot.com",
    messagingSenderId: "274516107404",
    appId: "1:274516107404:web:96933f3fb2f86fd9addba9"
};

// Initialize Firebase
// eslint-disable-next-line
const app = initializeApp(firebaseConfig);

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Add Firebase auth listener here to set isLoggedIn
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsLoggedIn(!!user);
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <Router>
            <div className="App">
                {/*<Header />*/}
                {isLoggedIn ? (
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-md-3">
                                <Sidebar user={user} />
                            </div>
                            <div className="col-md-9">
                                <Routes>
                                    <Route path="/account" element={<AccountPage />} />
                                    <Route path="/chat/:chatId" element={<MessagesView />} />
                                    <Route path="/chat" element={<MessagesView />} />
                                    <Route path="*" element={<Navigate to="/chat" />} />
                                </Routes>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
                <Footer />
            </div>
        </Router>
    );
}

export default App;
