import { Sidebar } from '../Sidebar'
import { Project } from './Project'

const ProjectPage: React.FC = () => {
    return(
        <div>
            <Sidebar />
            <div className="ml-48 bg-[#121212]">
                <Project />
            </div>
        </div>
    )
}

export default ProjectPage