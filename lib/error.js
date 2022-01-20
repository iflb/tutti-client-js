class TuttiServerEventError extends Error {
    constructor(content){
        super(content.stacktrace[content.stacktrace.length-1]);
        this.name = 'TuttiServerEventError'
        this.code = content.error_code;
        this.details = content;
    }
}

module.exports = {
        TuttiServerEventError
    };
