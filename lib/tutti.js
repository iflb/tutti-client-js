const MessagePack = require("what-the-pack");
const { decode } = MessagePack.initialize(2**22);
const ducts = require("@iflb/ducts-client");
const { ThisBound } = require("@iflb/lib");
const Buffer = require('buffer').Buffer;
const crypto = require('crypto');

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

        this.open = (wsdPath) => {
            this._duct = this._duct || new Duct();
            this._duct.open(wsdPath);
        }
        this.opened = false;
        this.reconnect = this._duct.reconnect;
        this.close = this._duct.close;
        this._invokeOnOpenHandlers = [];
        this.invokeOnOpen = (f) => {
                if(this.opened) f();
                else this._invokeOnOpenHandlers.push(f);
            };
        this.setEventHandler = this._duct.setEventHandler;

        this.accountInfo = {
            userName: null,
            userId: null,
            accessToken: null,
        };

        this._duct.invokeOnOpen(async () => {
            const wsd = await this.resource.getWebServiceDescriptor();
            this.ERROR = wsd.enums.errors;

            this.resource.on('signIn', {
                success: (data) => {
                    this.accountInfo.userName = data.user_name;
                    this.accountInfo.userId = data.user_id;
                    this.accountInfo.accessToken = data.access_token;
                }
            });
            this.resource.on('signOut', {
                success: (data) => {
                    this.accountInfo.accessToken = null;
                }
            });

            this.opened = true;
            this._invokeOnOpenHandlers.forEach((f) => { f(); });
        });
    }
}

class TuttiServerEventError extends Error {
    constructor(content){
        super(content.stacktrace[content.stacktrace.length-1]);
        this.name = 'TuttiServerEventError'
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

        set(self.EVENT.AUTHENTICATION_SIGN_IN,
                (rid, eid, data) => { _hr("signIn", data); } );

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
        //if(!(rid in self.log))  throw new ReferenceError(`request id ${rid} (eid: ${eid}) is not found in the log`);
        if(!(rid in self.log))  console.error(`request id ${rid} (eid: ${eid}) is not found in the log`);
        //if(self.log[rid].eid != eid)  throw new ReferenceError(`event id ${eid} does not correspond to the log`);
        if(self.log[rid].eid != eid)  console.error(`event id ${eid} does not correspond to the log`);

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

        this.signIn = {};
        this.signOut = {};

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
        let _self = this;

        //this._accessToken = duct.accountInfo.accessToken;

        this.getEventHistory =
            () => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.EVENT_HISTORY, null );
            };
        this.setEventHistory =
            ( eid, query ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.EVENT_HISTORY, [eid, query] );
            };

        this.rebuildProject = 
            ( project_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.REBUILD_PRODUCTION_ENVIRONMENT, this._data({ project_name }) );
            };
        //this.listProjects = {
        //    send: ( project_name ) => { return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_LIST); },
        //    call: async ( project_name ) => { return await this._duct.call( this._duct.EVENT.PROJECT_LIST ); }
        //};
        this.getResponsesForNanotask =
            ( nanotask_id ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.RESPONSE_GET_FOR_NANOTASK, this._data({ nanotask_id }) );
            };
        this.deleteTemplate =
            ( project_name, template_name ) => {
                return this._duct.send( this._duct.nextRid(), this._duct.EVENT.PROJECT_DELETE_TEMPLATE, this._data({ project_name, template_name }) );
            };
        this._callOrSend = (eid, args, [, accessToken, awaited ]) => {
                const send = (eid, args) => {
                    return this._duct.send( this._duct.nextRid(), eid, this._data(args) );
                };
                const called = async (eid, args) => {
                    let { success, content } = await this._duct.call( eid, this._data(args) );
                    if(success) return content; else throw new TuttiServerEventError(content);
                };

                if(typeof(args)!=='object') throw 'Tutti args must be passed as object';
                const paramsPossiblyUndefined = Object.entries(args).filter(([key, val]) => (typeof(val)==='undefined')).map(([, val]) => (key));
                if(paramsPossiblyUndefined.length>0) console.warn(`Possibly undefined parameter(s): ${paramsPossiblyUndefined}`);

                if(accessToken) args.access_token = accessToken;

                const f = awaited ? called : send;
                return f(eid, args)
            };

        this._methods = {
            getWebServiceDescriptor() {
                    return _self._callOrSend(_self._duct.EVENT.SYSTEM_GET_WSD, {}, arguments);
                },

            signUp({ user_name, password_hash, privilege_ids, ...args }) {
                    if('password' in args) password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                    return _self._callOrSend(_self._duct.EVENT.AUTHENTICATION_SIGN_UP, { user_name, password_hash, privilege_ids }, arguments);
                },

            signIn({ user_name = null, password_hash = null, access_token = null, ...args }) {
                    if('password' in args) password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                    return _self._callOrSend(_self._duct.EVENT.AUTHENTICATION_SIGN_IN, { user_name, password_hash, access_token }, arguments);
                },

            signOut() {
                    return _self._callOrSend(_self._duct.EVENT.AUTHENTICATION_SIGN_OUT, {}, arguments);
                },

            getUserIds() {
                    return _self._callOrSend(_self._duct.EVENT.ACCOUNT_LIST_IDS, {}, arguments);
                },

            associateUserPrivilege({ user_name }) {
                    return _self._callOrSend(_self._duct.EVENT.ACCOUNT_ASSOCIATE_USER_PRIVILEGE, { user_name }, arguments);
                },

            unassociateUserPrivilege({ user_name, privilege_id }) {
                    return _self._callOrSend(_self._duct.EVENT.ACCOUNT_UNASSOCIATE_USER_PRIVILEGE, { user_name, privilege_id }, arguments);
                },


            checkProjectDiff ({ project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.SYSTEM_BUILD_CHECK_PROJECT_DIFF, { project_name }, arguments);
                },

            getEventHistory() {
                    return _self._callOrSend(_self._duct.EVENT.EVENT_HISTORY, {}, arguments);
                },

            setEventHistory({ eid, query }) {
                    return _self._callOrSend(_self._duct.EVENT.EVENT_HISTORY, { eid, query }, arguments);
                },


            listProjects() {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_LIST, {}, arguments);
                },

            createProject({ project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_ADD, { project_name }, arguments);
                },

            listTemplates({ project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_LIST_TEMPLATES, { project_name }, arguments);
                },

            createTemplate({ project_name, template_name, preset_group_name, preset_name }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_ADD_TEMPLATE, { project_name, template_name, preset_group_name, preset_name }, arguments);
                },

            deleteTemplate({ project_name, template_name }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_DELETE_TEMPLATE, { project_name, template_name }, arguments);
                },

            listTemplatePresets({ project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS, { project_name }, arguments);
                },

            getProjectScheme({ project_name, cached }) {
                    return _self._callOrSend(_self._duct.EVENT.PROJECT_GET_SCHEME, { project_name, cached }, arguments);
                },

            getResponsesForTemplate({ project_name, template_name }) {
                    return _self._callOrSend(_self._duct.EVENT.RESPONSE_GET_FOR_TEMPLATE, { project_name, template_name }, arguments);
                },


            getWorkerIdForPlatform({ platform, platform_worker_id }) {
                    return _self._callOrSend(_self._duct.EVENT.WORKER_GET_ID_FOR_PLATFORM, { platform, platform_worker_id }, arguments);
                },

            getWorkerIdsForProject({ project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.WORKER_GET_IDS_FOR_PROJECT, { project_name }, arguments);
                },


            createSession({ project_name, platform_worker_id, client_token, platform, nanotask_group_ids }) {
                    return _self._callOrSend(_self._duct.EVENT.SESSION, { command: 'create', project_name, platform_worker_id, client_token, platform, nanotask_group_id }, args);
                },


            getNanotaskGroup({ nanotask_group_id }) {
                    return _self._callOrSend(_self._duct.EVENT.NANOTASK_GROUP_GET, { nanotask_group_id }, arguments);
                },

            listNanotaskGroups({ project_name, template_name }) {
                    return _self._callOrSend(_self._duct.EVENT.NANOTASK_GROUP_LIST, { project_name, template_name }, arguments);
                },

            addNanotaskGroup({ name, nanotask_ids, project_name, template_name }) {
                    return _self._callOrSend(_self._duct.EVENT.NANOTASK_GROUP_ADD, { name, nanotask_ids, project_name, template_name }, arguments);
                },

            deleteNanotaskGroup({ nanotask_group_id }) {
                    return _self._callOrSend(_self._duct.EVENT.NANOTASK_GROUP_DELETE, { nanotask_group_id }, arguments);
                },


            uploadNanotasks({ projectName, templateName, nanotasks, numAssignable, priority, tagName }) {
                    return _self._callOrSend(_self._duct.EVENT.NANOTASK_UPLOAD, { projectName, templateName, nanotasks, numAssignable, priority, tagName }, arguments);
                },


            getAutomationParameterSet({ automation_parameter_set_id }) {
                    return _self._callOrSend(_self._duct.EVENT.AUTOMATION_PARAMETER_SET_GET, { automation_parameter_set_id }, arguments);
                },

            listAutomationParameterSets() {
                    return _self._callOrSend(_self._duct.EVENT.AUTOMATION_PARAMETER_SET_LIST, {}, arguments);
                },

            createAutomationParameterSet({ name, platform_parameter_set_id, project_name }) {
                    return _self._callOrSend(_self._duct.EVENT.AUTOMATION_PARAMETER_SET_ADD, { name, platform_parameter_set_id, project_name }, arguments);
                },


            getPlatformParameterSet({ platform_parameter_set_id }) {
                    return _self._callOrSend(_self._duct.EVENT.PLATFORM_PARAMETER_SET_GET, { platform_parameter_set_id }, arguments);
                },

            listPlatformParameterSets() {
                    return _self._callOrSend(_self._duct.EVENT.PLATFORM_PARAMETER_SET_LIST, {}, arguments);
                },

            createPlatformParameterSet({ name, platform, parameters }) {
                    return _self._callOrSend(_self._duct.EVENT.PLATFORM_PARAMETER_SET_ADD, { name, platform, parameters }, arguments);
                },


            executeAutomation({ automation_parameter_set_id, parameters }) {
                    return _self._callOrSend(_self._duct.EVENT.EXECUTE_AUTOMATION, { automation_parameter_set_id, parameters }, arguments);
                },
        };
        this.loadMethods();

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
    }
    loadMethods() {
        Object.entries(this._methods).forEach(([name, f]) => {
            const accessToken = this._accessToken;
            this[name] = (args = {}, { awaited = true } = {}) => f(args, accessToken, awaited);
            this[name].call = (args = {}) => f(args, accessToken, true);
            this[name].send = (args = {}) => f(args, accessToken, false);
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
