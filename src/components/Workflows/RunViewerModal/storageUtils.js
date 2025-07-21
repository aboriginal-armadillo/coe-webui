// src/components/Workflows/RunViewerModal/storageUtils.js
import { getStorage, ref, getDownloadURL } from "firebase/storage";

export const getStorageData = async (path) => {
    try {
        const storage = getStorage();

        // Ensure the path is properly formatted
        if (!path) {
            throw new Error('No storage path provided');
        }

        // Split the path into components
        const pathParts = path.split('/');

        // Ensure we have the correct number of path components
        if (pathParts.length < 7) {
            throw new Error(`Invalid storage path format: ${path}`);
        }

        // Construct the proper storage reference
        const storageRef = ref(storage, path);

        // Get the download URL
        const url = await getDownloadURL(storageRef);

        // Fetch the data
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from path: ${path}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching storage data:', error);
        throw error;
    }
};  