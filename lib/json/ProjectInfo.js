
export default class ProjectInfo {

    constructor(projectName, resultsFile, 
        files, totalComponents,
        sloc, stars, repo, version, commitId, lang
    ){
        this.projectName = projectName
        this.resultsFile = resultsFile
        this.files = files + 0
        this.totalComponents = totalComponents + 0
        this.sloc = sloc + 0
        this.stars = stars
        this.repo = repo
        this.version = version
        this.commitId = commitId
        this.lang = lang
        // PropDrillingInfo objects for this project
        this.propDrillings = []
        // Pure Prop Drillings for this project
        this.purePropDrillings = []
    }
}


ProjectInfo.prototype.findPurePropDrillings = function(){
    const purePropDrillings = this.propDrillings.filter(pd => pd.isPure)
    this.purePropDrillings = purePropDrillings
    return purePropDrillings.length
}

ProjectInfo.prototype.getPPDCandidatesContext = function() {
    return this.purePropDrillings.filter(ppd => ppd.canRefactorWithContext).length
}

ProjectInfo.prototype.getPPDCandidatesComposition = function() {
    return this.purePropDrillings.filter(ppd => ppd.canRefactorWithComposition).length
}

ProjectInfo.fromJson = function(jsonObj){

    return new ProjectInfo(jsonObj.projectName, jsonObj.resultsFile,
        jsonObj.files, jsonObj.totalComponents, jsonObj.sloc,
        jsonObj.stars, jsonObj.repo, jsonObj.version,
        jsonObj.commitId, jsonObj.lang
    )

}