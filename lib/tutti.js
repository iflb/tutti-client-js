const ducts = require("@iflb/ducts");
const Buffer = require('buffer').Buffer;

class Duct extends ducts.Duct {

    constructor() {
        super();

        this.onOpenHandlers = [];

        this.controllers = {
            resource: new ResourceController(this),
            mturk: new MTurkController(this)
        };
        this.eventListeners = {
            resource: new ResourceEventListener(),
            mturk: new MTurkEventListener()
        };

        this.send = 
            (rid, eid, data) => {
                if(this.logger) this.logger.addSent(rid, eid, data);
                return super._send(this, rid, eid, data);
            }

        this.addOnOpenHandler = (handler) => { this.onOpenHandlers.push(handler); };
    }

    _onopen(self, event) {
        super._onopen( self, event );
        self.setEventHandler( self.EVENT.APP_WSD, (rid, eid, data) => { self.APP_WSD = data } );
        self.send( self.next_rid(), self.EVENT.APP_WSD, null );

        this.setupHandlers(this);
        for(const handler of this.onOpenHandlers)  handler();
    }

    _onmessage(self, event) {
        const [rid, eid, data] = self.decode(Buffer.from(event.source.data));
        if(self.logger) self.logger.addReceived(rid, eid, data);
        super._onmessage( self, event );
    }

    invokeOrWaitForOpen(f) {
        if(this.state==ducts.State.OPEN_CONNECTED) f();
        else this.addOnOpenHandler(f);
    }
 
    // FIXME:: needs a protocol
    _handleMTurk(self, name, data) {
        try {
            if(data["Status"]=="Success") {
                for(const func of self.eventListeners.mturk[name].success)  func(data["Contents"]);
            } else {
                for(const func of self.eventListeners.mturk[name].error)  func(data);
            }
            for(const func of self.eventListeners.mturk[name].complete)  func();
        } catch(e) {
            console.error(e);
        }
    }

    _handleResource(self, name, data) {
        try {
            if(data["Status"]=="Success") {
                for(const func of self.eventListeners.resource[name].success)  func(data["Contents"]);
            } else {
                for(const func of self.eventListeners.resource[name].error)  func(data);
            }
            for(const func of self.eventListeners.resource[name].complete)  func();
        } catch(e) {
            console.error(e);
        }
    }

    setupHandlers(self) {
        self.setEventHandler( self.EVENT.EVENT_HISTORY,
                              (rid, eid, data) => {
                                  // FIXME
                                  if("AllHistory" in data["Contents"])  self._handleResource(self, "getEventHistory", data);
                                  else if("History" in data["Contents"])  self._handleResource(self, "setEventHistory", data);
                              });
        self.setEventHandler( self.EVENT.LIST_PROJECTS,
                              (rid, eid, data) => { self._handleResource(self, "listProjects", data); } );
        self.setEventHandler( self.EVENT.CREATE_PROJECT,
                              (rid, eid, data) => { self._handleResource(self, "createProject", data); } );
        self.setEventHandler( self.EVENT.GET_PROJECT_SCHEME,
                              (rid, eid, data) => { self._handleResource(self, "getProjectScheme", data); } );
        self.setEventHandler( self.EVENT.CREATE_TEMPLATES,
                              (rid, eid, data) => { self._handleResource(self, "createTemplates", data); } );
        self.setEventHandler( self.EVENT.LIST_TEMPLATE_PRESETS,
                              (rid, eid, data) => { self._handleResource(self, "listTemplatePresets", data); } );
        self.setEventHandler( self.EVENT.LIST_TEMPLATES,
                              (rid, eid, data) => { self._handleResource(self, "listTemplates", data); } );
        self.setEventHandler( self.EVENT.GET_RESPONSES_FOR_TEMPLATE,
                              (rid, eid, data) => { self._handleResource(self, "getResponsesForTemplate", data); } );
        self.setEventHandler( self.EVENT.GET_RESPONSES_FOR_NANOTASK,
                              (rid, eid, data) => { self._handleResource(self, "getResponsesForNanotask", data); } );
        self.setEventHandler( self.EVENT.GET_NANOTASKS,
                              (rid, eid, data) => { self._handleResource(self, "getNanotasks", data); } );
        self.setEventHandler( self.EVENT.UPLOAD_NANOTASKS,
                              (rid, eid, data) => { self._handleResource(self, "uploadNanotasks", data); } );
        self.setEventHandler( self.EVENT.DELETE_NANOTASKS,
                              (rid, eid, data) => { self._handleResource(self, "deleteNanotasks", data); } );
        self.setEventHandler( self.EVENT.UPDATE_NANOTASK_NUM_ASSIGNABLE,
                              (rid, eid, data) => { self._handleResource(self, "updateNanotaskNumAssignable", data); } );
        self.setEventHandler( self.EVENT.SESSION,
                              (rid, eid, data) => {
                                  if(data["Contents"]["Command"]=="Create") self._handleResource(self, "createSession", data);
                                  else if(data["Contents"]["Command"]=="Get") self._handleResource(self, "getTemplateNode", data);
                                  else if(data["Contents"]["Command"]=="SetResponse") self._handleResource(self, "setResponse", data);
                              } );
        self.setEventHandler( self.EVENT.CHECK_PLATFORM_WORKER_ID_EXISTENCE_FOR_PROJECT,
                              (rid, eid, data) => { self._handleResource(self, "checkPlatformWorkerIdExistenceForProject", data); } );


        self.setEventHandler( self.EVENT.MTURK_GET_CREDENTIALS,
                              (rid, eid, data) => { self._handleMTurk(self, "getCredentials", data); } );

        self.setEventHandler( self.EVENT.MTURK_SET_CREDENTIALS,
                              (rid, eid, data) => { self._handleMTurk(self, "setCredentials", data); } );

        self.setEventHandler( self.EVENT.MTURK_CLEAR_CREDENTIALS,
                              (rid, eid, data) => { self._handleMTurk(self, "clearCredentials", data); } );

        self.setEventHandler( self.EVENT.MTURK_SET_SANDBOX,
                              (rid, eid, data) => { self._handleMTurk(self, "setSandbox", data); } );

        self.setEventHandler( self.EVENT.MTURK_GET_HIT_TYPES,
                              (rid, eid, data) => { self._handleMTurk(self, "getHITTypes", data); } );

        self.setEventHandler( self.EVENT.MTURK_CREATE_HIT_TYPE,
                              (rid, eid, data) => { self._handleMTurk(self, "createHITType", data); } );

        self.setEventHandler( self.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE,
                              (rid, eid, data) => { self._handleMTurk(self, "createHITsWithHITType", data); } );

        self.setEventHandler( self.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH,
                              (rid, eid, data) => { self._handleMTurk(self, "createTuttiHITBatch", data); } );

        self.setEventHandler( self.EVENT.MTURK_LIST_QUALIFICATIONS,
                              (rid, eid, data) => { self._handleMTurk(self, "listQualifications", data); } );

        self.setEventHandler( self.EVENT.MTURK_LIST_HITS,
                              (rid, eid, data) => { self._handleMTurk(self, "listHITs", data); } );

        self.setEventHandler( self.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE,
                              (rid, eid, data) => { self._handleMTurk(self, "listHITsForHITType", data); } );

        self.setEventHandler( self.EVENT.MTURK_EXPIRE_HITS,
                              (rid, eid, data) => { self._handleMTurk(self, "expireHITs", data); } );

        self.setEventHandler( self.EVENT.MTURK_DELETE_HITS,
                              (rid, eid, data) => { self._handleMTurk(self, "deleteHITs", data); } );

        self.setEventHandler( self.EVENT.MTURK_CREATE_QUALIFICATION,
                              (rid, eid, data) => { self._handleMTurk(self, "createQualification", data); } );

        self.setEventHandler( self.EVENT.LIST_WORKERS,
                              (rid, eid, data) => {
                                  // FIXME
                                  if(data["Contents"]["Platform"]=="MTurk") self._handleMTurk(self, "listWorkers", data);
                                  else self._handleResource(self, "listWorkers", data);
                              });

        self.setEventHandler( self.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE,
                              (rid, eid, data) => { self._handleMTurk(self, "listWorkersWithQualificationType", data); } );

        self.setEventHandler( self.EVENT.MTURK_DELETE_QUALIFICATIONS,
                              (rid, eid, data) => { self._handleMTurk(self, "deleteQualifications", data); } );

        self.setEventHandler( self.EVENT.MTURK_NOTIFY_WORKERS,
                              (rid, eid, data) => { self._handleMTurk(self, "notifyWorkers", data); } );
        self.setEventHandler( self.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS,
                              (rid, eid, data) => { self._handleMTurk(self, "associateQualificationsWithWorkers", data); } );

        self.setEventHandler( self.EVENT.MTURK_LIST_ASSIGNMENTS,
                              (rid, eid, data) => { self._handleMTurk(self, "listAssignments", data); } );
        self.setEventHandler( self.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS,
                              (rid, eid, data) => { self._handleMTurk(self, "listAssignmentsForHITs", data); } );
        self.setEventHandler( self.EVENT.MTURK_APPROVE_ASSIGNMENTS,
                              (rid, eid, data) => { self._handleMTurk(self, "approveAssignments", data); } );
        self.setEventHandler( self.EVENT.MTURK_REJECT_ASSIGNMENTS,
                              (rid, eid, data) => { self._handleMTurk(self, "rejectAssignments", data); } );
        self.setEventHandler( self.EVENT.MTURK_GET_ASSIGNMENTS,
                              (rid, eid, data) => { self._handleMTurk(self, "getAssignments", data); } );
    }
}

class DuctEventLogger {
    constructor(duct, dataSizeLimit) {
        this._duct = duct;
        this.log = [];
        this.dataSizeLimit = dataSizeLimit || 3000;
    }

    addSent(rid, eid, data) {
        this.log[rid] = { eid, sent: this._skipLargeData(data), received: [] };
    }

    addReceived(rid, eid, data) {
        if(!(rid in this.log))  throw new ReferenceError(`request id ${rid} (eid: ${eid}) is not found in the log`);
        if(this.log[rid].eid != eid)  throw new ReferenceError(`event id ${eid} does not correspond to the log`);

        data["Contents"] = this._skipLargeData(data["Contents"]);
        this.log[rid].received.push(data);
    }

    _skipLargeData(data) {
        var newData = {}
        for(const key in data) {
            if(typeof data[key] === 'object')
                newData[key] = (JSON.stringify(data[key]).length <= this.dataSizeLimit) ? data[key] : "[log skipped]";
        }
        return newData;
    }
}

class DuctEventListener extends ducts.DuctEventListener {
    constructor() {
        super();
        this.on =
            (names, { success, error, complete }) => {
                for(let name of (names instanceof Array) ? names : [names]) {
                    if (!(name in this)) {
                        throw new ReferenceError('['+name+'] is not defined');
                    } 

                    // if the listener is an empty object (= no handler is registered yet), then initialize it
                    if(this[name] && Object.keys(this[name]).length === 0 && this[name].constructor === Object)  this[name] = { success: [], error: [], complete: [] };
                    
                    if(success)  this[name].success.push(success);
                    if(error)    this[name].error.push(error);
                    if(complete) this[name].complete.push(complete);
                }
            }
    }
}

class ResourceEventListener extends DuctEventListener {
    constructor() {
        super();

        this.getEventHistory = {};
        this.setEventHistory = {};
        this.listProjects = {};
        this.createProject = {};
        this.getProjectScheme = {};
        this.createTemplates = {};
        this.listTemplatePresets = {};
        this.listTemplates = {};
        this.getResponsesForTemplate = {};
        this.getResponsesForNanotask = {};
        this.getNanotasks = {};
        this.uploadNanotasks = {};
        this.deleteNanotasks = {};
        this.updateNanotaskNumAssignable = {};

        this.getTemplateNode = {};
        this.setResponse = {};
        this.createSession = {};
        this.checkPlatformWorkerIdExistenceForProject = {};
    }
}

class MTurkEventListener extends DuctEventListener {
    constructor() {
        super();

        this.getCredentials = {};
        this.setCredentials = {};
        this.clearCredentials = {};
        this.setSandbox = {};
        this.getHITTypes = {};
        this.createHITType = {};
        this.createHITsWithHITType = {};
        this.createTuttiHITBatch = {};
        this.listQualifications = {};
        this.listHITs = {};
        this.listHITsForHITType = {};
        this.expireHITs = {};
        this.deleteHITs = {};
        this.createQualification = {};
        this.listWorkers = {};
        this.listWorkersWithQualificationType = {};
        this.notifyWorkers = {};
        this.associateQualificationsWithWorkers = {};
        this.deleteQualifications = {};
        this.listAssignments = {};
        this.listAssignmentsForHITs = {};
        this.approveAssignments = {};
        this.rejectAssignments = {};
        this.getAssignments = {};
    }
}

class TuttiController {
    constructor( duct ){
        this._duct = duct;
    }

    _data( data ) {
        for(const d of Object.entries(data)) if(d[1]===undefined) delete data[d[0]];
        return data;
    }
}

class MTurkController extends TuttiController {
    constructor( duct ){
        super(duct);

        this.getCredentials =
            (  ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_GET_CREDENTIALS );
            };
        this.setCredentials =
            ( AccessKeyId, SecretAccessKey ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_SET_CREDENTIALS, this._data({ AccessKeyId, SecretAccessKey }) );
            };
        this.setSandbox =
            ( Enabled ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_SET_SANDBOX, this._data({ Enabled }) );
            };
        this.clearCredentials =
            (  ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_CLEAR_CREDENTIALS );
            };

        this.deleteQualifications =
            ( QualificationTypeIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_DELETE_QUALIFICATIONS, this._data({ QualificationTypeIds }) );
            };
        this.listQualifications =
            ( TuttiQuals ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_QUALIFICATIONS, this._data({ TuttiQuals }) );
            };
        this.listWorkersWithQualificationType =
            ( QualificationTypeId ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE, this._data({ QualificationTypeId }) );
            };
        this.createQualification =
            ( QualificationTypeParams ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_CREATE_QUALIFICATION, QualificationTypeParams );
            };
        this.associateQualificationsWithWorkers =
            ( AssociateQualificationParams ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS, AssociateQualificationParams );
            };
        this.listWorkers =
            (  ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.LIST_WORKERS, { Platform: "MTurk" } );
            };
        this.notifyWorkers =
            ( Subject, MessageText, SendEmailWorkerIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_NOTIFY_WORKERS, this._data({ Subject, MessageText, SendEmailWorkerIds }) );
            };
        this.createHITType =
            ( CreateHITTypeParams, HITTypeQualificationTypeId ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_CREATE_HIT_TYPE, this._data({ CreateHITTypeParams, HITTypeQualificationTypeId }) );
            };
        this.createHITsWithHITType =
            ( ProjectName, NumHITs, CreateHITsWithHITTypeParams ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE, this._data({ ProjectName, NumHITs, CreateHITsWithHITTypeParams }) );
            };
        this.createTuttiHITBatch =
            ( ProjectName, NumHITs, HITTypeParams, HITParams ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH, this._data({ ProjectName, NumHITs, HITTypeParams, HITParams }) );
            };
        this.getHITTypes =
            ( HITTypeIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_GET_HIT_TYPES, this._data({ HITTypeIds }) );
            };
        this.expireHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_EXPIRE_HITS, this._data({ HITIds }) );
            };
        this.deleteHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_DELETE_HITS, this._data({ HITIds }) );
            };
        this.listHITs =
            ( Cached ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_HITS, this._data({ Cached }) );
            };
        this.listHITsForHITType =
            ( HITTypeId, Cached ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE, this._data({ HITTypeId, Cached }) );
            };
        this.listAssignments =
            ( Cached ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS, this._data({ Cached }) );
            };
        this.listAssignmentsForHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS, this._data({ HITIds }) );
            };
        this.approveAssignments =
            ( AssignmentIds, RequesterFeedback ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_APPROVE_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
            };
        this.rejectAssignments =
            ( AssignmentIds, RequesterFeedback ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_REJECT_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
            };
        this.getAssignments =
            ( AssignmentIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.MTURK_GET_ASSIGNMENTS, this._data({ AssignmentIds }) );
            };
    }
}

class ResourceController extends TuttiController {
    constructor(duct){
        super(duct);

        this.getEventHistory =
            () => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.EVENT_HISTORY, null );
            };
        this.setEventHistory =
            ( eid, query ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.EVENT_HISTORY, [eid, query] );
            };

        this.listProjects =
            () => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.LIST_PROJECTS );
            };
        this.createProject =
            ( ProjectName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.CREATE_PROJECT, this._data({ ProjectName }) );
            };
        this.listTemplates =
            ( ProjectName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.LIST_TEMPLATES, this._data({ ProjectName }) );
            };
        this.getResponsesForTemplate =
            ( ProjectName, TemplateName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.GET_RESPONSES_FOR_TEMPLATE, this._data({ ProjectName, TemplateName }) );
            };
        this.getResponsesForNanotask =
            ( NanotaskId ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.GET_RESPONSES_FOR_NANOTASK, this._data({ NanotaskId }) );
            };
        this.createTemplates =
            ( ProjectName, TemplateNames, PresetEnvName, PresetTemplateName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.CREATE_TEMPLATES, this._data({ ProjectName, TemplateNames, PresetEnvName, PresetTemplateName }) );
            };
        this.listTemplatePresets =
            () => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.LIST_TEMPLATE_PRESETS );
            };
        this.getProjectScheme =
            ( ProjectName, Cached ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.GET_PROJECT_SCHEME, this._data({ ProjectName, Cached }) );
            };
        this.getNanotasks =
            ( ProjectName, TemplateName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.GET_NANOTASKS, this._data({ ProjectName, TemplateName }) );
            };
        this.deleteNanotasks =
            ( ProjectName, TemplateName, NanotaskIds ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.DELETE_NANOTASKS, this._data({ ProjectName, TemplateName, NanotaskIds }) );
            };
        this.updateNanotaskNumAssignable =
            ( ProjectName, TemplateName, NanotaskId, NumAssignable ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.UPDATE_NANOTASK_NUM_ASSIGNABLE, this._data({ ProjectName, TemplateName, NanotaskId, NumAssignable }) );
            };
        this.uploadNanotasks =
            ( ProjectName, TemplateName, Nanotasks, NumAssignable, Priority, TagName ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.UPLOAD_NANOTASKS, this._data({ ProjectName, TemplateName, Nanotasks, NumAssignable, Priority, TagName }) );
            };
        this.getTemplateNode =
            ( Target, WorkSessionId, NodeSessionId ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.SESSION, this._data({ Command: "Get", Target, WorkSessionId, NodeSessionId }) );
            };
        this.createSession =
            ( ProjectName, PlatformWorkerId, ClientToken, Platform ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.SESSION, this._data({ Command: "Create", ProjectName, PlatformWorkerId, ClientToken, Platform }) );
            };
        this.setResponse =
            ( WorkSessionId, NodeSessionId, Answers ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.SESSION, this._data({ Command: "SetResponse", WorkSessionId, NodeSessionId, Answers }) );
            };
        this.checkPlatformWorkerIdExistenceForProject =
            ( ProjectName, Platform, PlatformWorkerId ) => {
                return this._duct.send( this._duct.next_rid(), this._duct.EVENT.CHECK_PLATFORM_WORKER_ID_EXISTENCE_FOR_PROJECT, this._data({ ProjectName, Platform, PlatformWorkerId }) );
            };
                
    }
    
}

module.exports = {
    Duct,
    DuctEventLogger,
    DuctEventListener,
    ResourceEventListener, 
    MTurkEventListener,
    MTurkController,
    ResourceController,
}
