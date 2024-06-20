import { getFirestore, Timestamp, doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const sendMessage = async ({ action, user, chatId, newMessage, messages, botsAvail, navigate, setLoading }) => {
    const db = getFirestore();
    const functions = getFunctions();

    if (action === 'Me') {
        if (!chatId) {
            const newChatData = {
                createdAt: Timestamp.now(),
                name: "New Chat",
                root: {
                    sender: user.displayName || "Anonymous",
                    text: newMessage,
                    timestamp: Timestamp.now(),
                    children: [],
                    selectedChild: null,
                    id: "root"
                }
            };

            try {
                const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
                navigate(`/chat/${newChatRef.id}`);
            } catch (error) {
                console.error("Error creating new chat: ", error);
            }
        } else {
            const newMsgId = `msg_${Date.now()}`;
            const messageData = {
                sender: user.displayName || "CurrentUser",
                text: newMessage,
                timestamp: Timestamp.now(),
                children: [],
                selectedChild: null,
                id: newMsgId
            };

            const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
            const chatSnap = await getDoc(chatRef);
            const chatData = chatSnap.data();
            const lastMessageId = messages[messages.length - 1]?.id;
            console.log("chatData", chatData, "lastMessageId", lastMessageId);
            if (lastMessageId) {
                chatData[lastMessageId].children.push(newMsgId);
            }
            chatData[newMsgId] = messageData;

            await setDoc(chatRef, chatData);
        }
    } else if (action === "Upload File") {
        // The file upload logic is handled in the FileUpload component
    } else {
        setLoading(true);
        const bot = botsAvail.find(bot => bot.name === action);
        const newMsgId = `msg_${Date.now()}`;
        const callNextMessage = httpsCallable(functions, 'call_next_msg');
        const callData = {
            service: bot.service,
            userid: user.uid,
            chatid: chatId,
            model: bot.model,
            system_prompt: bot.systemPrompt,
            temperature: bot.temperature,
            name: bot.name,
            new_msg_id: newMsgId,
            api_key: bot.key,
            top_k: bot.top_k ? bot.top_k : 1,
            last_message_id: messages[messages.length - 1]?.id
        };

        if (bot.service === "RAG: OpenAI+Pinecone") {
            callData.pinecone_api_key = bot.pineconeKey;
            callData.pinecone_index_name = bot.pineconeIndex;
        }

        try {
            await callNextMessage(callData);
        } catch (error) {
            console.error("Error calling function:", error);
        } finally {
            setLoading(false);
        }
    }
};

export default sendMessage;
