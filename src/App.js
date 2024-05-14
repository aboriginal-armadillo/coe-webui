import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import AccountPage from './components/AccountPage/AccountPage';
import MessagesView from './components/MessagesView/MessagesView';
// import Header from './components/Header/Header';
// import Footer from './components/Footer/Footer';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import ApiKeyMgmt from "./components/ApiKeyMgmt/ApiKeyMgmt";
import BuildABot from "./components/BuildABot/BuildABot";
import './App.css';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons";
import BotZoo from "./components/BotZoo/BotZoo";


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
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsLoggedIn(!!user);
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    if (isLoggedIn === null) {
        return <div>Loading...</div>;  // Display a loading indicator while authentication status is being determined
    }

    const isNotIphone = () => {
        return /iPhone/.test(navigator.userAgent) && !window.MSStream;
    }

    if (!isNotIphone) {
        return (
            <img src='/assets/iphones.jpg' alt="no iPhones" style={{ width: '100%', height: 'auto' }} />
        );
    }
    return (
        <Router>
            <div className="App">

                {isLoggedIn ? (
                    <>
                        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                            <Sidebar user={user} toggleSidebar={toggleSidebar} isOpen={sidebarOpen}/>
                        </div>
                        <div className="content">
                            <FontAwesomeIcon icon={faBars} className="toggle-button" onClick={toggleSidebar} />
                            <Routes>
                                <Route path="/account" element={<AccountPage />} />
                                <Route path="/apikeys" element={<ApiKeyMgmt user={user} />} />
                                <Route path="/buildabot" element={<BuildABot user={user} />} />
                                <Route path="/chat/:chatId" element={<MessagesView user={user} isNew={false}/>} />
                                <Route path="/chat" element={<MessagesView user={user} isNew={true}/>} />
                                <Route path="/bots" element={<BotZoo user={user} />} />
                                {/*<Route path="*" element={<Navigate to="/chat" />} />*/}
                            </Routes>
                        </div>
                    </>
                ) : (
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
