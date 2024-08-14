import { getFirestore, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Function to share the workflow
export const shareWorkflow = async (userUid, workflowId) => {
    const db = getFirestore();
    const workflowRef = doc(db, `users/${userUid}/workflows`, workflowId);
    const workflowSnap = await getDoc(workflowRef);
    if (workflowSnap.exists()) {
        const workflowData = workflowSnap.data();
        const publicWorkflowRef = doc(db, 'public', workflowId);
        await setDoc(publicWorkflowRef, workflowData);
        await updateDoc(workflowRef, { shared: true });
    } else {
        console.error("No such document!");
    }
};

// Function to unshare the workflow
export const unshareWorkflow = async (userUid, workflowId) => {
    const db = getFirestore();
    const workflowRef = doc(db, `users/${userUid}/workflows`, workflowId);
    const publicWorkflowRef = doc(db, 'public', workflowId);
    await deleteDoc(publicWorkflowRef);
    await updateDoc(workflowRef, { shared: false });
};

// Function to delete the workflow
export const deleteWorkflow = async (userUid, workflowId) => {
    const db = getFirestore();
    await deleteDoc(doc(db, `users/${userUid}/workflows`, workflowId));
};