
export default class ProjectInfo {

    constructor(projectName, resultsFile, totalComponents,
        sloc, stars, repo, version, commitId, lang
    ){
        this.projectName = projectName
        this.resultsFile = resultsFile
        this.totalComponents = totalComponents
        this.sloc = sloc
        this.stars = stars
        this.repo = repo
        this.version = version
        this.commitId = commitId
        this.lang = lang
        this.propDillings = []
    }

    




}


ProjectInfo.fromJson = function(jsonObj){

    return new ProjectInfo(jsonObj.projectName, jsonObj.resultsFile,
        jsonObj.totalComponents, jsonObj.sloc,
        jsonObj.stars, jsonObj.repo, jsonObj.version,
        jsonObj.commitId, jsonObj.lang
    )

}