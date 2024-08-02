// src/utils/chatUtils.js

import { getFirestore, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Function to share the chat
export const shareChat = async (userUid, chatId) => {
    const db = getFirestore();
    const chatRef = doc(db, `users/${userUid}/chats`, chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const publicChatRef = doc(db, 'public', chatId);
        await setDoc(publicChatRef, chatData);
        await updateDoc(chatRef, { shared: true });
    } else {
        console.error("No such document!");
    }
};

// Function to unshare the chat
export const unshareChat = async (userUid, chatId) => {
    const db = getFirestore();
    const chatRef = doc(db, `users/${userUid}/chats`, chatId);
    const publicChatRef = doc(db, 'public', chatId);
    await deleteDoc(publicChatRef);
    await updateDoc(chatRef, { shared: false });
};

// Function to delete the chat
export const deleteChat = async (userUid, chatId) => {
    const db = getFirestore();
    await deleteDoc(doc(db, `users/${userUid}/chats`, chatId));
};