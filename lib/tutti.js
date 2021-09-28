const MessagePack = require("what-the-pack");
const { decode } = MessagePack.initialize(2**22);
const ducts = require("@iflb/ducts-client");
const { ThisBound } = require("@iflb/lib");
const Buffer = require('buffer').Buffer;

class TuttiClient extends ThisBound {
    constructor(setLogger = false) {
        super();

        this._duct = new Duct();
        if(setLogger) {
            this._duct.logger = new DuctEventLogger();
            this.logger = this._duct.logger;
        }

        this.resource = this._duct.controllers.resource;
        this.resource.on = this._duct.eventListeners.resource.on;

        this.mturk = this._duct.controllers.mturk;
        this.mturk.on = this._duct.eventListeners.mturk.on;

        this.connection = this._duct._connectionListener;

        this.open = this._duct.open;
        this.reconnect = this._duct.reconnect;
        this.close = this._duct.close;
        this.invokeOnOpen = this._duct.invokeOnOpen;
        this.setEventHandler = this._duct.setEventHandler;

        this.invokeOnOpen(async () => {
            this.APP_WSD = await this._duct.call(this._duct.EVENT.APP_WSD, null);
            const ret = await this._duct.call(this._duct.EVENT.SYSTEM_GET);
            if(ret.success) this.ERROR = ret.content;
            else console.error(ret.details, ret.stacktrace);
        });
    }
}

class TuttiEventError extends Error {
    constructor(content){
        super(content.details);
        this.code = content.error_code;
        this.details = content;
    }
}

class Duct extends ducts.Duct {

    constructor() {
        super();

        this.controllers = {
            resource: new ResourceController(this),
            mturk: new MTurkController(this),
        };
        this.eventListeners = {
            resource: new ResourceEventListener(),
            mturk: new MTurkEventListener()
        };

        this.send = 
            (rid, eid, data) => {
                if(this.logger) this.logger.addSent(rid, eid, data);
                return super.send(this, rid, eid, data);
            }

    }

    _onopen(self, event) {
        super._onopen( self, event );
        //self.setEventHandler( self.EVENT.APP_WSD, (rid, eid, data) => { self.APP_WSD = data } );
        //self.send( self.nextRid(), self.EVENT.APP_WSD, null );

        self.setupHandlers();
    }

    _onmessage(self, event) {
        const [rid, eid, data] = decode(Buffer.from(event.source.data));
        if(self.logger) self.logger.addReceived(rid, eid, data);
        super._onmessage( self, event );
    }

    _handleOld(self, source, name, data) {
        try {
            const handlers = self.eventListeners[source][name];
            if(data["Status"]=="Success") {
                handlers.success.forEach(func => func(data["Contents"]));
            } else {
                handlers.error.forEach(func => func(data));
            }
            handlers.complete.forEach(func => func());
        } catch(e) {
            console.error(e);
        }
    }

    _handle(self, source, name, data) {
        try {
            const handlers = self.eventListeners[source][name];
            if(data.success) {
                if(handlers.success) handlers.success.forEach(func => func(data.content));
            } else {
                if(handlers.error) handlers.error.forEach(func => func(data.content));
            }
            if(handlers.complete) handlers.complete.forEach(func => func());
        } catch(e) {
            console.error(e);
        }
    }

    setupHandlers(self) {
        const set = self.setEventHandler;
        const _hro = (name, data) => { self._handleOld('resource', name, data); }
        const _hmo = (name, data) => { self._handleOld('mturk', name, data); }
        const _hr = (name, data) => { self._handle('resource', name, data); }
        const _hm = (name, data) => { self._handle('mturk', name, data); }

        set(self.EVENT.EVENT_HISTORY,
                (rid, eid, data) => {
                    // FIXME
                    if("AllHistory" in data["Contents"])  _hro("getEventHistory", data);
                    else if("History" in data["Contents"])  _hro("setEventHistory", data);
                });
        set(self.EVENT.CHECK_PROJECT_DIFF,
                (rid, eid, data) => { _hr("checkIfProjectNeedsRebuild", data); } );
        set(self.EVENT.REBUILD_PRODUCTION_ENVIRONMENT,
                (rid, eid, data) => { _hr("rebuildProject", data); } );
        set(self.EVENT.PROJECT_LIST,
                (rid, eid, data) => { _hr("listProjects", data); } );
        set(self.EVENT.PROJECT_ADD,
                (rid, eid, data) => { _hr("addProject", data); } );
        set(self.EVENT.PROJECT_GET_SCHEME,
                (rid, eid, data) => { _hr("getProjectScheme", data); } );
        set(self.EVENT.PROJECT_ADD_TEMPLATE,
                (rid, eid, data) => { _hr("addTemplate", data); } );
        set(self.EVENT.PROJECT_DELETE_TEMPLATE,
                (rid, eid, data) => { _hr("deleteTemplate", data); } );
        set(self.EVENT.PROJECT_LIST_TEMPLATE_PRESETS,
                (rid, eid, data) => { _hr("listTemplatePresets", data); } );
        set(self.EVENT.PROJECT_LIST_TEMPLATES,
                (rid, eid, data) => { _hr("listTemplates", data); } );
        set(self.EVENT.RESPONSE_GET_FOR_TEMPLATE,
                (rid, eid, data) => { _hr("getResponsesForTemplate", data); } );
        set(self.EVENT.RESPONSE_GET_FOR_NANOTASK,
                (rid, eid, data) => { _hr("getResponsesForNanotask", data); } );
        set(self.EVENT.NANOTASK_GET,
                (rid, eid, data) => { _hr("getNanotasks", data); } );
        set(self.EVENT.NANOTASK_UPLOAD,
                (rid, eid, data) => { _hr("uploadNanotasks", data); } );
        set(self.EVENT.NANOTASK_DELETE,
                (rid, eid, data) => { _hr("deleteNanotasks", data); } );
        set(self.EVENT.NANOTASK_GROUP_ADD,
                (rid, eid, data) => { _hr("addNanotaskGroup", data); } );
        set(self.EVENT.NANOTASK_GROUP_LIST,
                (rid, eid, data) => { _hr("listNanotaskGroup", data); } );
        set(self.EVENT.NANOTASK_GROUP_GET,
                (rid, eid, data) => { _hr("getNanotaskGroup", data); } );
        set(self.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE,
                (rid, eid, data) => { _hr("updateNanotaskNumAssignable", data); } );
        set(self.EVENT.SESSION,
                (rid, eid, data) => {
                    if(data.content.command=="create") _hr("createSession", data);
                    else if(data.content.command=="get") _hr("getTemplateNode", data);
                    else if(data.content.command=="setResponse") _hr("setResponse", data);
                } );
        set(self.EVENT.WORKER_GET_IDS_FOR_PROJECT,
                (rid, eid, data) => { _hr("getWorkerIdsForProject", data); } );
        set(self.EVENT.WORKER_GET_ID_FOR_PLATFORM,
                (rid, eid, data) => { _hr("getWorkerIdForPlatform", data); } );


        set(self.EVENT.MTURK_GET_CREDENTIALS,
                (rid, eid, data) => { _hmo("getCredentials", data); } );

        set(self.EVENT.MTURK_SET_CREDENTIALS,
                (rid, eid, data) => { _hmo("setCredentials", data); } );

        set(self.EVENT.MTURK_CLEAR_CREDENTIALS,
                (rid, eid, data) => { _hmo("clearCredentials", data); } );

        set(self.EVENT.MTURK_SET_SANDBOX,
                (rid, eid, data) => { _hmo("setSandbox", data); } );

        set(self.EVENT.MTURK_GET_HIT_TYPES,
                (rid, eid, data) => { _hmo("getHITTypes", data); } );

        set(self.EVENT.MTURK_CREATE_HIT_TYPE,
                (rid, eid, data) => { _hmo("createHITType", data); } );

        set(self.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE,
                (rid, eid, data) => { _hmo("createHITsWithHITType", data); } );

        set(self.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH,
                (rid, eid, data) => { _hmo("createTuttiHITBatch", data); } );

        set(self.EVENT.MTURK_LIST_QUALIFICATIONS,
                (rid, eid, data) => { _hmo("listQualifications", data); } );

        set(self.EVENT.MTURK_LIST_HITS,
                (rid, eid, data) => { _hmo("listHITs", data); } );

        set(self.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE,
                (rid, eid, data) => { _hmo("listHITsForHITType", data); } );

        set(self.EVENT.MTURK_EXPIRE_HITS,
                (rid, eid, data) => { _hmo("expireHITs", data); } );

        set(self.EVENT.MTURK_DELETE_HITS,
                (rid, eid, data) => { _hmo("deleteHITs", data); } );

        set(self.EVENT.MTURK_CREATE_QUALIFICATION,
                (rid, eid, data) => { _hmo("createQualification", data); } );

        set(self.EVENT.LIST_WORKERS,
                (rid, eid, data) => {
                    // FIXME
                    if(data["Contents"]["Platform"]=="MTurk") _hmo("listWorkers", data);
                    else _hro("listWorkers", data);
                });

        set(self.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE,
                (rid, eid, data) => { _hmo("listWorkersWithQualificationType", data); } );

        set(self.EVENT.MTURK_DELETE_QUALIFICATIONS,
                (rid, eid, data) => { _hmo("deleteQualifications", data); } );

        set(self.EVENT.MTURK_NOTIFY_WORKERS,
                (rid, eid, data) => { _hmo("notifyWorkers", data); } );
        set(self.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS,
                (rid, eid, data) => { _hmo("associateQualificationsWithWorkers", data); } );

        set(self.EVENT.MTURK_LIST_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("listAssignments", data); } );
        set(self.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS,
                (rid, eid, data) => { _hmo("listAssignmentsForHITs", data); } );
        set(self.EVENT.MTURK_APPROVE_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("approveAssignments", data); } );
        set(self.EVENT.MTURK_REJECT_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("rejectAssignments", data); } );
        set(self.EVENT.MTURK_GET_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("getAssignments", data); } );
    }
}

class DuctEventLogger extends ThisBound {
    constructor(duct, dataSizeLimit) {
        super();
        this._duct = duct;
        this.log = [];
        this.dataSizeLimit = dataSizeLimit || 3000;
    }

    addSent(self, rid, eid, data) {
        self.log[rid] = { eid, sent: self._skipLargeData(data), received: [] };
    }

    addReceived(self, rid, eid, data) {
        if(!(rid in self.log))  throw new ReferenceError(`request id ${rid} (eid: ${eid}) is not found in the log`);
        if(self.log[rid].eid != eid)  throw new ReferenceError(`event id ${eid} does not correspond to the log`);

        data["Contents"] = self._skipLargeData(data["Contents"]);
        data.content = self._skipLargeData(data.content);
        self.log[rid].received.push(data);
    }

    _skipLargeData(self, data) {
        if(data) {
            let newData = JSON.stringify(data);
            if(newData.length>self.dataSizeLimit) return '[log skipped]';
            else return JSON.parse(newData);
        } else {
            return data;
        }
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
        this.checkIfProjectNeedsRebuild = {};
        this.rebuildProject = {};
        this.listProjects = {};
        this.addProject = {};
        this.getProjectScheme = {};
        this.addTemplate = {};
        this.deleteTemplate = {};
        this.listTemplates = {};
        this.listTemplatePresets = {};
        this.getResponsesForTemplate = {};
        this.getResponsesForNanotask = {};
        this.getNanotasks = {};
        this.uploadNanotasks = {};
        this.deleteNanotasks = {};
        this.addNanotaskGroup = {};
        this.listNanotaskGroup = {};
        this.getNanotaskGroup = {};
        this.updateNanotaskNumAssignable = {};

        this.getTemplateNode = {};
        this.setResponse = {};
        this.createSession = {};
        this.getWorkerIdForPlatform = {};
        this.getWorkerIdsForProject = {};
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
        const camelToSnake = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        for(const d of Object.entries(data)) {
            delete data[d[0]];
            if(d[1]!==undefined) data[camelToSnake(d[0])] = d[1];
        }
        return data;
    }
}

class MTurkController extends TuttiController {
    constructor(duct){
        super(duct);

        this.getCredentials =
            (  ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_GET_CREDENTIALS );
            };
        this.setCredentials =
            ( AccessKeyId, SecretAccessKey ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_SET_CREDENTIALS, this._data({ AccessKeyId, SecretAccessKey }) );
            };
        this.setSandbox =
            ( Enabled ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_SET_SANDBOX, this._data({ Enabled }) );
            };
        this.clearCredentials =
            (  ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CLEAR_CREDENTIALS );
            };

        this.deleteQualifications =
            ( QualificationTypeIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_DELETE_QUALIFICATIONS, this._data({ QualificationTypeIds }) );
            };
        this.listQualifications =
            ( TuttiQuals ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_QUALIFICATIONS, this._data({ TuttiQuals }) );
            };
        this.listWorkersWithQualificationType =
            ( QualificationTypeId ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE, this._data({ QualificationTypeId }) );
            };
        this.createQualification =
            ( QualificationTypeParams ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_QUALIFICATION, QualificationTypeParams );
            };
        this.associateQualificationsWithWorkers =
            ( AssociateQualificationParams ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS, AssociateQualificationParams );
            };
        this.listWorkers =
            (  ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.LIST_WORKERS, { Platform: "MTurk" } );
            };
        this.notifyWorkers =
            ( Subject, MessageText, SendEmailWorkerIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_NOTIFY_WORKERS, this._data({ Subject, MessageText, SendEmailWorkerIds }) );
            };
        this.createHITType =
            ( CreateHITTypeParams, HITTypeQualificationTypeId ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_HIT_TYPE, this._data({ CreateHITTypeParams, HITTypeQualificationTypeId }) );
            };
        this.createHITsWithHITType =
            ( ProjectName, NumHITs, CreateHITsWithHITTypeParams ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE, this._data({ ProjectName, NumHITs, CreateHITsWithHITTypeParams }) );
            };
        this.createTuttiHITBatch =
            ( ProjectName, NumHITs, HITTypeParams, HITParams ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH, this._data({ ProjectName, NumHITs, HITTypeParams, HITParams }) );
            };
        this.getHITTypes =
            ( HITTypeIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_GET_HIT_TYPES, this._data({ HITTypeIds }) );
            };
        this.expireHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_EXPIRE_HITS, this._data({ HITIds }) );
            };
        this.deleteHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_DELETE_HITS, this._data({ HITIds }) );
            };
        this.listHITs =
            ( Cached ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_HITS, this._data({ Cached }) );
            };
        this.listHITsForHITType =
            ( HITTypeId, Cached ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE, this._data({ HITTypeId, Cached }) );
            };
        this.listAssignments =
            ( Cached ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS, this._data({ Cached }) );
            };
        this.listAssignmentsForHITs =
            ( HITIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS, this._data({ HITIds }) );
            };
        this.approveAssignments =
            ( AssignmentIds, RequesterFeedback ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_APPROVE_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
            };
        this.rejectAssignments =
            ( AssignmentIds, RequesterFeedback ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_REJECT_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
            };
        this.getAssignments =
            ( AssignmentIds ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_GET_ASSIGNMENTS, this._data({ AssignmentIds }) );
            };
    }
}

class ResourceController extends TuttiController {
    constructor(duct){
        super(duct);

        this.getEventHistory =
            () => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.EVENT_HISTORY, null );
            };
        this.setEventHistory =
            ( eid, query ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.EVENT_HISTORY, [eid, query] );
            };

        this.checkIfProjectNeedsRebuild = 
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.CHECK_PROJECT_DIFF, this._data({ project_name }) );
            };
        this.rebuildProject = 
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.REBUILD_PRODUCTION_ENVIRONMENT, this._data({ project_name }) );
            };
        this.listProjects =
            () => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_LIST);
            };
        //this.listProjects = {
        //    send: ( project_name ) => { return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_LIST); },
        //    call: async ( project_name ) => { return await this._duct.call( this._duct.EVENT.PROJECT_LIST ); }
        //};
        this.addProject =
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_ADD, this._data({ project_name }) );
            };
        this.getResponsesForTemplate =
            ( project_name, template_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.RESPONSE_GET_FOR_TEMPLATE, this._data({ project_name, template_name }) );
            };
        this.getResponsesForNanotask =
            ( nanotask_id ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.RESPONSE_GET_FOR_NANOTASK, this._data({ nanotask_id }) );
            };
        this.addTemplate =
            ( project_name, template_name, preset_group_name, preset_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_ADD_TEMPLATE, this._data({ project_name, template_name, preset_group_name, preset_name }) );
            };
        this.deleteTemplate =
            ( project_name, template_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_DELETE_TEMPLATE, this._data({ project_name, template_name }) );
            };
        this.listTemplates =
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_LIST_TEMPLATES, this._data({ project_name }) );
            };
        this.listTemplatePresets =
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS, this._data({ project_name }) );
            };

        this._callOrSend = (eid, args, awaited=true) => {
                const send = (eid, args) => {
                    return this._duct.send( this._duct.nextRid(), eid, this._data(args) );
                };
                const called = async (eid, args) => {
                    let { success, content } = await this._duct.call( eid, this._data(args) );
                    if(success) return content; else throw new TuttiEventError(content);
                };

                const f = awaited ? called : send;
                return f(eid, args)
            };

        this._methods = {
            'getProjectScheme':
                ({ project_name, cached }, awaited) =>
                    this._callOrSend(this._duct.EVENT.PROJECT_GET_SCHEME, { project_name, cached }, awaited),

            'getWorkerIdForPlatform':
                ({ platform, platform_worker_id }, awaited) =>
                    this._callOrSend(this._duct.EVENT.WORKER_GET_ID_FOR_PLATFORM, { platform, platform_worker_id }, awaited),

            'getWorkerIdsForProject':
                ({ project_name }, awaited) =>
                    this._callOrSend(this._duct.EVENT.WORKER_GET_IDS_FOR_PROJECT, { project_name }, awaited),

            'createSession':
                ({ project_name, platform_worker_id, client_token, platform, nanotask_group_ids }, awaited) =>
                    this._callOrSend(this._duct.EVENT.SESSION, { command: "create", project_name, platform_worker_id, client_token, platform, nanotask_group_ids }, awaited),

            'getNanotaskGroup':
                ({ nanotask_group_id }, awaited) =>
                    this._callOrSend(this._duct.EVENT.NANOTASK_GROUP_GET, { nanotask_group_id }, awaited),

            'listNanotaskGroups':
                ({ project_name, template_name }, awaited) =>
                    this._callOrSend(this._duct.EVENT.NANOTASK_GROUP_LIST, { project_name, template_name }, awaited),

            'addNanotaskGroup':
                ({ name, nanotask_ids, project_name, template_name }, awaited) =>
                    this._callOrSend(this._duct.EVENT.NANOTASK_GROUP_ADD, { name, nanotask_ids, project_name, template_name }, awaited),

            'deleteNanotaskGroup':
                ({ nanotask_group_id }, awaited) =>
                    this._callOrSend(this._duct.EVENT.NANOTASK_GROUP_DELETE, { nanotask_group_id }, awaited),

            'uploadNanotasks':
                ({ projectName, templateName, nanotasks, numAssignable, priority, tagName }, awaited) =>
                    this._callOrSend(this._duct.EVENT.NANOTASK_UPLOAD, { projectName, templateName, nanotasks, numAssignable, priority, tagName }, awaited),

            'getRequestParameterSet':
                ({ request_parameter_set_id }, awaited) =>
                    this._callOrSend(this._duct.EVENT.REQUEST_PARAMETER_SET_GET, { request_parameter_set_id }, awaited),

            'request':
                ({ request_parameter_set_id, nanotasks, nanotask_group_name, job_description }, awaited) =>
                    this._callOrSend(this._duct.EVENT.REQUEST, { request_parameter_set_id, nanotasks, nanotask_group_name, job_description }, awaited),
        };

        this.getNanotasks =
            ( project_name, template_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.NANOTASK_GET, this._data({ project_name, template_name }) );
            };
        this.deleteNanotasks =
            ( project_name, template_name, nanotask_ids ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.NANOTASK_DELETE, this._data({ project_name, template_name, nanotask_ids }) );
            };

        this.updateNanotaskNumAssignable =
            ( project_name, template_name, nanotask_id, num_assignable ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE, this._data({ project_name, template_name, nanotask_id, num_assignable }) );
            };
        this.getTemplateNode =
            ( target, work_session_id, node_session_id ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.SESSION, this._data({ command: "get", target, work_session_id, node_session_id }) );
            };

        this.setResponse =
            ( work_session_id, node_session_id, answers ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.SESSION, this._data({ command: "setResponse", work_session_id, node_session_id, answers }) );
            };

        this.loadMethods();
    }
    loadMethods() {
        Object.entries(this._methods).forEach(([name, f]) => {
            this[name] = (args) => f(args, true);
            this[name].call = (args) => f(args, true);
            this[name].send = (args) => f(args, false);
        });
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
    TuttiClient
}
