
import BrowseLibrary from "../BrowseLibrary";
import {Card, CardHeader} from "react-bootstrap";

const BrowseLibraryView = ({ uid, libraryOption, onClick, buttonIcon }) => {
    return (
        <Card style={{ marginTop: '1rem', marginLeft: '3rem', marginRight: '1rem' }}>
            <CardHeader>
                <h2>{libraryOption}</h2>
                <BrowseLibrary uid={uid} libraryOption={libraryOption} onClick={onClick} buttonIcon={buttonIcon} />
            </CardHeader>
        </Card>
    )
}

export default BrowseLibraryView;