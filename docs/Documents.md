## Firestore Document Structure

### User Document

- **Fields:**
    - `uid: string`
    - `email: string`
    - `displayName: string`
    - `photoURL: string`
    - `createdAt: timestamp`
    - `apiKeys: array`
    - `bots: array`
    - `pineconeIndexes: map`

- **Created by:**
    - `checkUserInFirestore` in `Login.jsx`

- **Edited by:**
    - `AccountPage.jsx` for profile updates
    - Components handling API keys, bots and pinecone index synchronization

- **Location in Firestore:**
    - Collection: `users`
    - Document: `<user_id>`

### Chat Document

- **Fields:**
    - `createdAt: timestamp`
    - `name: string`
    - `root: map`
        - `sender: string`
        - `text: string`
        - `timestamp: timestamp`
        - `children: array`
        - `selectedChild: number`
        - `id: string`
    - `<message_id>: map`
        - `sender: string`
        - `text: string`
        - `timestamp: timestamp`
        - `children: array`
        - `selectedChild: number`
        - `id: string`
    - `bots: array`
    - `shared: boolean`

- **Created by:**
    - `SendMessage.jsx` when a new chat is created

- **Edited by:**
    - `SendMessage.jsx`, `MessagesView.jsx` for adding new messages
    - `Sidebar.jsx`, `ChatList.jsx` for renaming, deleting, and sharing chats

- **Location in Firestore:**
    - Collection: `users/<user_id>/chats`
    - Document: `<chat_id>`

### API Key Document

- **Fields:**
    - `svc: string`
    - `apikey: string | map`
    - `name: string`

- **Created by:**
    - `ApiKeyMgmt.jsx`

- **Edited by:**
    - `ApiKeyMgmt.jsx`

- **Location in Firestore:**
    - Collection: `users/<user_id>`
    - Field: `apiKeys`

### Bot Document

- **Fields:**
    - `uuid: string`
    - `name: string`
    - `service: string`
    - `key: string`
    - `model: string`
    - `temperature: number`
    - `systemPrompt: string`
    - `pineconeKey: string`
    - `pineconeIndex: string`
    - `top_k: number`

- **Created by:**
    - `BuildABot.jsx`

- **Edited by:**
    - `BuildABot.jsx`

- **Location in Firestore:**
    - Collection: `users/<user_id>`
    - Field: `bots`

### Public Chat Document

- **Fields:**
    - `createdAt: timestamp`
    - `name: string`
    - `root: map`
        - `sender: string`
        - `text: string`
        - `timestamp: timestamp`
        - `children: array`
        - `selectedChild: number`
        - `id: string`
    - `<message_id>: map`
        - `sender: string`
        - `text: string`
        - `timestamp: timestamp`
        - `children: array`
        - `selectedChild: number`
        - `id: string`

- **Created by:**
    - `ChatList.jsx` when a chat is shared

- **Edited by:**
    - `ChatList.jsx` for unsharing

- **Location in Firestore:**
    - Collection: `public`
    - Document: `<chat_id>`

### Pinecone Index Document

- **Fields:**
    - Dynamically created fields based on metadata added for each document in the index

- **Created by:**
    - `ManagePinecone.jsx` via interaction with Pinecone database

- **Edited by:**
    - `ManagePinecone.jsx` for removing data based on specific criteria

- **Location in Firestore:**
    - Collection: `users/<user_id>/pineconeIndexes/<index_name>/documents`  