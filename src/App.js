import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import AccountPage from './components/AccountPage/AccountPage';
import MessagesView from './components/MessagesView/MessagesView';
// import Header from './components/Header/Header';
// import Footer from './components/Footer/Footer';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import ApiKeyMgmt from "./components/ApiKeyMgmt/ApiKeyMgmt";

import './App.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import BotZoo from "./components/Bots/BotZoo/BotZoo";
import ManagePinecone from "./components/rag/ManagePinecone/ManagePinecone";
import ShareMessagesView from "./components/MessagesView/ShareMessagesView/ShareMessagesView";
import BrowseLibraryView from "./components/BrowseLibrary/BrowseLibraryView/BrowseLibraryView";
import BuildABotPage from "./components/Bots/BuildABotPage/BuildABotPage";
import WorkflowsView from "./components/WorkflowsView/WorkflowView/WorkflowsView";
import RunView from "./components/WorkflowsView/Runs/RunView";

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
                <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
                <Routes>
                    <Route path="/share/:chatId" element={<ShareMessagesView isShare={true} />} />
                </Routes>
                {isLoggedIn ? (
                    <>
                        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                            <Sidebar user={user} toggleSidebar={toggleSidebar} isOpen={sidebarOpen} />
                        </div>
                        <div className={`content ${sidebarOpen ? 'pushed' : ''}`}>
                            <FontAwesomeIcon icon={faBars} className="toggle-button" onClick={toggleSidebar} />
                            <Routes>
                                <Route path="/account" element={<AccountPage />} />
                                <Route path="/apikeys" element={<ApiKeyMgmt user={user} />} />
                                <Route path="/buildabot" element={<BuildABotPage user={user} />} />
                                <Route path="/chat/:chatId" element={<MessagesView user={user} isNew={false} isShare={false} />} />
                                <Route path="/chat" element={<MessagesView user={user} isNew={true} isShare={false} />} />
                                <Route path="/bots" element={<BotZoo user={user} />} />
                                <Route path="/manage-pinecone" element={<ManagePinecone user={user} />} />
                                <Route path="/browse-my-library" element={<BrowseLibraryView uid={user.uid} libraryOption={'Personal Library'}/>} />
                                <Route path="/browse-public-library" element={<BrowseLibraryView uid={user.uid} libraryOption={'Public Library'} />} />
                                {/*<Route path="*" element={<Navigate to="/chat" />} />*/}
                                <Route path="/workflows" element={<WorkflowsView user={user} isNew={false} />} />
                                <Route path="/workflows/:workflowId" element={<WorkflowsView user={user} isNew={false} />} />
                                <Route path="/workflows/:workflowId/runs/:runId" element={<RunView user={user} />} />
                            </Routes>
                        </div>
                    </>
                ) : (
                    <Routes>
                        <Route path="/" element={<Login />} />

                        {/*<Route path="*" element={<Navigate to="/" />} />*/}
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
