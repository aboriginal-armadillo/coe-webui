// src/components/Bots/BuildABotPage/BuildABotPage.jsx
import React, {useState} from 'react';

import BuildABotModal from "../BuildABot/BuildABot";

const BuildABotPage = ({ user }) => {
    const [showBuildModal, setShowBuildModal] = useState(true);



    return (
        <div style={{ margin: '20px' }}>
            <h2>Create a new Bot</h2>
            <BuildABotModal
                show={showBuildModal}
                onHide={() => setShowBuildModal(false)}
                user={user}
                // botData={{name: '', model: '', service: '', temperature: 0, systemPrompt: '', key: ''}}


            />
        </div>
    );
};

export default BuildABotPage;
