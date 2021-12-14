const MessagePack = require("what-the-pack");
const ducts = require("@iflb/ducts-client");
const { ThisBound } = require("@iflb/lib");
const crypto = require('crypto');

class TuttiClient extends ThisBound {
    constructor(setLogger = false) {
        super();

        this._duct = new ducts.Duct();
        this._duct.logger = setLogger ? new DuctEventLogger() : null;
        this._opened = false;
        this._invokeOnOpenHandlers = [];

        this.accountInfo = {
            userName: null,
            userId: null,
            accessToken: null,
        };
        this.logger = this._duct.logger;

        this._duct.invokeOnOpen(async () => {
            this.resource = new ResourceController(this._duct);
            this.resource.on = (new ResourceEventListener(this._duct)).on;
            this.resource._accessToken = this.accountInfo.accessToken;

            this.mturk = new MTurkController(this._duct);
            this.mturk.on = (new MTurkEventListener(this._duct)).on;
            this.mturk._accessToken = this.accountInfo.accessToken;

            this.connection = this._duct._connectionListener;

            const wsd = await this.resource.getWebServiceDescriptor();
            this.ENUM = wsd.enums;
            this.ERROR = wsd.enums.errors;

            this.resource.on('signIn', {
                success: (data) => { this._setAccountInfo(data); }
            });
            this.resource.on('signOut', {
                success: (data) => { this._deleteAccountInfo(); }
            });

            this._opened = true;
            this._invokeOnOpenHandlers.forEach((f) => { f(); });
        });
    }

    async open(self, wsdPath) {
        self._duct = self._duct || new ducts.Duct();
        await self._duct.open(wsdPath);
    }

    reconnect(self) { self._duct.reconnect(); }

    close(self) { self._duct.close(); }

    invokeOnOpen(self, f) {
        if(self._opened) f();
        else self._invokeOnOpenHandlers.push(f);
    }

    _setAccountInfo(self, data) {
        self.accountInfo.userName = data.user_name;
        self.accountInfo.userId = data.user_id;
        self.accountInfo.accessToken = data.access_token;
    }

    _deleteAccountInfo(self) {
        self.accountInfo.userName = null;
        self.accountInfo.userId = null;
        self.accountInfo.accessToken = null;
    }

    get state() {
        return this._duct ? this._duct.state : ducts.State.CLOSE;
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

class DuctEventLogger extends ThisBound {
    constructor(duct, dataSizeLimit) {
        super();
        this._duct = duct;
        this._log = {};
        this._orderedLog = [];
        this.dataSizeLimit = dataSizeLimit || 3000;
    }

    addSent(self, id, label, data) {
        self._log[id] = {
            id,
            label,
            sent: {
                content: self._skipLargeData(data),
                timestamp: new Date()
            },
            received: []
        };
        self._orderedLog.push(self._log[id]);
    }

    addReceived(self, id, label, data) {
        if(!(id in self._log))
            return;

        if(self._log[id].label != label)
            console.error(`event name ${label} does not correspond to the log`);

        const _data = JSON.parse(JSON.stringify(data));
        _data.content = self._skipLargeData(_data.content);
        _data.timestamp = new Date();

        self._log[id].received.push(_data);
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

    get log() {
        return this._orderedLog;
    }
}

class DuctEventListener extends ducts.DuctEventListener {
    constructor(duct) {
        super();
        this._duct = duct;
        this._handlers = {};

        this.on =
            (names, { success, error, complete }) => {
                for(let name of (names instanceof Array) ? names : [names]) {
                    if (!(name in this._handlers)) {
                        throw new ReferenceError('['+name+'] is not defined');
                    } 

                    if(success)  this._handlers[name].success.push(success);
                    if(error)    this._handlers[name].error.push(error);
                    if(complete) this._handlers[name].complete.push(complete);
                }
            }
    }

    _handleOld(self, source, name, rid, data) {
        if(data===null) return;
        try {
            const handlers = self._handlers[name];

            self._duct.logger.addReceived(rid, name, data);

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

    _handle(self, source, name, rid, data) {
        if(data===null) return;
        try {
            const handlers = self._handlers[name];

            self._duct.logger.addReceived(rid, name, data);

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

    setDefaultTuttiHandlers(self, methods) {
        for(const method of methods) {
            self._handlers[method] = { success: [], error: [], complete: [] };
        }
    }
}

class ResourceEventListener extends DuctEventListener {
    constructor(duct) {
        super(duct);

        this.bindTuttiHandlersToDuct();

        this.setDefaultTuttiHandlers([
            'signIn',
            'signOut',
            'getEventHistory',
            'setEventHistory',
            'checkIfProjectNeedsRebuild',
            'rebuildProject',
            'listProjects',
            'addProject',
            'getProjectScheme',
            'addTemplate',
            'deleteTemplate',
            'listTemplates',
            'listTemplatePresets',
            'getResponsesForTemplate',
            'getResponsesForNanotask',
            'getNanotasks',
            'createNanotasks',
            'deleteNanotasks',
            'createNanotaskGroup',
            'listNanotaskGroups',
            'getNanotaskGroup',
            'updateNanotaskNumAssignable',
            'getTemplateNode',
            'setResponse',
            'createSession',
            'getWorkerForPlatformWorkerId',
            'listWorkersForProject',
        ]);
    }

    bindTuttiHandlersToDuct(self) {
        const set = self._duct.setEventHandler;
        const _hro = (name, rid, data) => { self._handleOld('resource', name, rid, data); }
        const _hr = (name, rid, data) => { self._handle('resource', name, rid, data); }

        set(self._duct.EVENT.AUTHENTICATION_SIGN_IN,
                (rid, eid, data) => { _hr("signIn", rid, data); } );

        set(self._duct.EVENT.EVENT_HISTORY,
                (rid, eid, data) => {
                    // FIXME
                    if("AllHistory" in data["Contents"])  _hro("getEventHistory", rid, data);
                    else if("History" in data["Contents"])  _hro("setEventHistory", rid, data);
                });
        set(self._duct.EVENT.CHECK_PROJECT_DIFF,
                (rid, eid, data) => { _hr("checkIfProjectNeedsRebuild", rid, data); } );
        set(self._duct.EVENT.REBUILD_PRODUCTION_ENVIRONMENT,
                (rid, eid, data) => { _hr("rebuildProject", rid, data); } );
        set(self._duct.EVENT.PROJECT_LIST,
                (rid, eid, data) => { _hr("listProjects", rid, data); } );
        set(self._duct.EVENT.PROJECT_ADD,
                (rid, eid, data) => { _hr("addProject", rid, data); } );
        set(self._duct.EVENT.PROJECT_GET_SCHEME,
                (rid, eid, data) => { _hr("getProjectScheme", rid, data); } );
        set(self._duct.EVENT.PROJECT_ADD_TEMPLATE,
                (rid, eid, data) => { _hr("addTemplate", rid, data); } );
        set(self._duct.EVENT.PROJECT_DELETE_TEMPLATE,
                (rid, eid, data) => { _hr("deleteTemplate", rid, data); } );
        set(self._duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS,
                (rid, eid, data) => { _hr("listTemplatePresets", rid, data); } );
        set(self._duct.EVENT.PROJECT_LIST_TEMPLATES,
                (rid, eid, data) => { _hr("listTemplates", rid, data); } );
        set(self._duct.EVENT.RESPONSE_GET_FOR_TEMPLATE,
                (rid, eid, data) => { _hr("getResponsesForTemplate", rid, data); } );
        set(self._duct.EVENT.RESPONSE_GET_FOR_NANOTASK,
                (rid, eid, data) => { _hr("getResponsesForNanotask", rid, data); } );
        set(self._duct.EVENT.NANOTASK_GET,
                (rid, eid, data) => { _hr("getNanotasks", rid, data); } );
        set(self._duct.EVENT.NANOTASK_UPLOAD,
                (rid, eid, data) => { _hr("addNanotasks", rid, data); } );
        set(self._duct.EVENT.NANOTASK_DELETE,
                (rid, eid, data) => { _hr("deleteNanotasks", rid, data); } );
        set(self._duct.EVENT.NANOTASK_GROUP_ADD,
                (rid, eid, data) => { _hr("createNanotaskGroup", rid, data); } );
        set(self._duct.EVENT.NANOTASK_GROUP_LIST,
                (rid, eid, data) => { _hr("listNanotaskGroups", rid, data); } );
        set(self._duct.EVENT.NANOTASK_GROUP_GET,
                (rid, eid, data) => { _hr("getNanotaskGroup", rid, data); } );
        set(self._duct.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE,
                (rid, eid, data) => { _hr("updateNanotaskNumAssignable", rid, data); } );
        set(self._duct.EVENT.WORKPLACE_START,
                (rid, eid, data) => { _hr("createSession", rid, data); } );
        set(self._duct.EVENT.WORKPLACE_GET_NEXT_TEMPLATE,
                (rid, eid, data) => { _hr("getTemplateNode", rid, data); } );
        set(self._duct.EVENT.WORKPLACE_SET_RESPONSE,
                (rid, eid, data) => { _hr("setResponse", rid, data); } );
        set(self._duct.EVENT.WORKER_LIST_FOR_PROJECT,
                (rid, eid, data) => { _hr("listWorkersForProject", rid, data); } );
        set(self._duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID,
                (rid, eid, data) => { _hr("getWorkerForPlatformWorkerId", rid, data); } );
    }
}

class MTurkEventListener extends DuctEventListener {
    constructor(duct) {
        super(duct);

        this.bindTuttiHandlersToDuct();

        this.setDefaultTuttiHandlers([
            'getActiveCredentials',
            'setActiveCredentials',
            'listCredentials',
            'getCredentials',
            'deleteCredentials',
            'renameCredentials',
            'addCredentials',
            'setActiveSandboxMode',
            'execBoto3',
            'listTuttiHITBatches',
            'createTuttiHITBatch',
            'addHITsToTuttiHITBatch',
            'getHITTypes',
            'createHITType',
            'createHITsWithHITType',
            'createTuttiHITBatch',
            'listQualifications',
            'listHITs',
            'listHITsForHITType',
            'expireHITs',
            'deleteHITs',
            'createQualification',
            'listWorkers',
            'listWorkersWithQualificationType',
            'notifyWorkers',
            'associateQualificationsWithWorkers',
            'deleteQualifications',
            'listAssignments',
            'listAssignmentsForHITs',
            'approveAssignments',
            'rejectAssignments',
            'getAssignments',
        ]);
    }

    bindTuttiHandlersToDuct(self) {
        const set = self._duct.setEventHandler;
        const _hmo = (name, rid, data) => { self._handleOld('mturk', name, rid, data); }
        const _hm = (name, rid, data) => { self._handle('mturk', name, rid, data); }

        set(self._duct.EVENT.MARKETPLACE_MTURK_GET_ACTIVE_CREDENTIALS,
                (rid, eid, data) => { _hm("getActiveCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_CREDENTIALS,
                (rid, eid, data) => { _hm("setActiveCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_LISTCREDENTIALS,
                (rid, eid, data) => { _hm("listCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_GET_CREDENTIALS,
                (rid, eid, data) => { _hm("getCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_DELETE_CREDENTIALS,
                (rid, eid, data) => { _hm("deleteCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_RENAME_CREDENTIALS,
                (rid, eid, data) => { _hm("renameCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_ADD_CREDENTIALS,
                (rid, eid, data) => { _hm("addCredentials", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_SANDBOX_MODE,
                (rid, eid, data) => { _hm("setActiveSandboxMode", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_EXEC_BOTO3,
                (rid, eid, data) => { _hm("execBoto3", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST,
                (rid, eid, data) => { _hm("listTuttiHITBatches", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_CREATE,
                (rid, eid, data) => { _hm("createTuttiHITBatch", rid, data); } );
        set(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_ADD_HITS,
                (rid, eid, data) => { _hm("addHITsToTuttiHITBatch", rid, data); } );
        set(self._duct.EVENT.MTURK_GET_HIT_TYPES,
                (rid, eid, data) => { _hmo("getHITTypes", rid, data); } );
        set(self._duct.EVENT.MTURK_CREATE_HIT_TYPE,
                (rid, eid, data) => { _hmo("createHITType", rid, data); } );
        set(self._duct.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE,
                (rid, eid, data) => { _hmo("createHITsWithHITType", rid, data); } );
        set(self._duct.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH,
                (rid, eid, data) => { _hmo("createTuttiHITBatch", rid, data); } );
        set(self._duct.EVENT.MTURK_LIST_QUALIFICATIONS,
                (rid, eid, data) => { _hmo("listQualifications", rid, data); } );
        set(self._duct.EVENT.MTURK_LIST_HITS,
                (rid, eid, data) => { _hmo("listHITs", rid, data); } );
        set(self._duct.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE,
                (rid, eid, data) => { _hmo("listHITsForHITType", rid, data); } );
        set(self._duct.EVENT.MTURK_EXPIRE_HITS,
                (rid, eid, data) => { _hmo("expireHITs", rid, data); } );
        set(self._duct.EVENT.MTURK_DELETE_HITS,
                (rid, eid, data) => { _hmo("deleteHITs", rid, data); } );
        set(self._duct.EVENT.MTURK_CREATE_QUALIFICATION,
                (rid, eid, data) => { _hmo("createQualification", rid, data); } );
        set(self._duct.EVENT.LIST_WORKERS,
                (rid, eid, data) => {
                    // FIXME
                    if(data["Contents"]["Platform"]=="MTurk") _hmo("listWorkers", rid, data);
                    else _hro("listWorkers", rid, data);
                });
        set(self._duct.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE,
                (rid, eid, data) => { _hmo("listWorkersWithQualificationType", rid, data); } );
        set(self._duct.EVENT.MTURK_DELETE_QUALIFICATIONS,
                (rid, eid, data) => { _hmo("deleteQualifications", rid, data); } );
        set(self._duct.EVENT.MTURK_NOTIFY_WORKERS,
                (rid, eid, data) => { _hmo("notifyWorkers", rid, data); } );
        set(self._duct.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS,
                (rid, eid, data) => { _hmo("associateQualificationsWithWorkers", rid, data); } );
        set(self._duct.EVENT.MTURK_LIST_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("listAssignments", rid, data); } );
        set(self._duct.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS,
                (rid, eid, data) => { _hmo("listAssignmentsForHITs", rid, data); } );
        set(self._duct.EVENT.MTURK_APPROVE_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("approveAssignments", rid, data); } );
        set(self._duct.EVENT.MTURK_REJECT_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("rejectAssignments", rid, data); } );
        set(self._duct.EVENT.MTURK_GET_ASSIGNMENTS,
                (rid, eid, data) => { _hmo("getAssignments", rid, data); } );
    }
}

class TuttiController extends ThisBound {
    constructor( duct ){
        super();
        this._duct = duct;
        this._accessToken = null;
        this._callIds = {};
    }

    _setMethods(self, methods) {
        Object.entries(methods).forEach(([name, f]) => {
            self[name] =
                (args = {}, { awaited = true } = {}) => {
                    return f(args, self._accessToken, awaited, name)
                };
            self[name].call =
                (args = {}) => {
                    return f(args, self._accessToken, true, name);
                };
            self[name].send =
                (args = {}) => {
                    return f(args, self._accessToken, false, name);
                };
        });
        self._callIds = Object.fromEntries(Object.keys(methods).map((name) => [name, 0]));
    }

    _callOrSend(self, eid, args, [rawArgs, accessToken, awaited, methodName]) {
        const send = (eid, args) => {
            const rid = self._duct.nextRid();
            const data = self._data(args);

            self._duct.logger.addSent(rid, methodName, data);

            return self._duct.send( rid, eid, data );
        };
        const called = async (eid, args) => {
            const data = self._data(args);
            let { success, content } = await self._duct.call( eid, data );

            self._duct.logger.addSent(`${methodName}${self._callIds[methodName]}`, methodName, data);
            self._duct.logger.addReceived(`${methodName}${self._callIds[methodName]}`, methodName, { success, content });

            if(success) return content; else throw new TuttiServerEventError(content);
        };

        if(typeof(args)!=='object') throw 'Tutti args must be passed as object';
        const paramsPossiblyUndefined = Object.entries(rawArgs).filter(([key,]) => (Object.keys(args).indexOf(key)===-1)).map(([key,]) => (key));
        if(paramsPossiblyUndefined.length>0) console.warn(`Possibly undefined parameter(s): ${paramsPossiblyUndefined}`);

        if(accessToken) args.access_token = accessToken;

        const f = awaited ? called : send;
        return f(eid, args)
    }

    _data(self, data) {
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

        //this.deleteQualifications =
        //    ( QualificationTypeIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_DELETE_QUALIFICATIONS, this._data({ QualificationTypeIds }) );
        //    };
        //this.listQualifications =
        //    ( TuttiQuals ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_QUALIFICATIONS, this._data({ TuttiQuals }) );
        //    };
        //this.listWorkersWithQualificationType =
        //    ( QualificationTypeId ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_WORKERS_WITH_QUALIFICATION_TYPE, this._data({ QualificationTypeId }) );
        //    };
        //this.createQualification =
        //    ( QualificationTypeParams ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_QUALIFICATION, QualificationTypeParams );
        //    };
        //this.associateQualificationsWithWorkers =
        //    ( AssociateQualificationParams ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_ASSOCIATE_QUALIFICATIONS_WITH_WORKERS, AssociateQualificationParams );
        //    };
        //this.listWorkers =
        //    (  ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.LIST_WORKERS, { Platform: "MTurk" } );
        //    };
        //this.notifyWorkers =
        //    ( Subject, MessageText, SendEmailWorkerIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_NOTIFY_WORKERS, this._data({ Subject, MessageText, SendEmailWorkerIds }) );
        //    };
        //this.createHITType =
        //    ( CreateHITTypeParams, HITTypeQualificationTypeId ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_HIT_TYPE, this._data({ CreateHITTypeParams, HITTypeQualificationTypeId }) );
        //    };
        //this.createHITsWithHITType =
        //    ( ProjectName, NumHITs, CreateHITsWithHITTypeParams ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_HITS_WITH_HIT_TYPE, this._data({ ProjectName, NumHITs, CreateHITsWithHITTypeParams }) );
        //    };
        //this.createTuttiHITBatch =
        //    ( ProjectName, NumHITs, HITTypeParams, HITParams ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_CREATE_TUTTI_HIT_BATCH, this._data({ ProjectName, NumHITs, HITTypeParams, HITParams }) );
        //    };
        //this.getHITTypes =
        //    ( HITTypeIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_GET_HIT_TYPES, this._data({ HITTypeIds }) );
        //    };
        //this.expireHITs =
        //    ( HITIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_EXPIRE_HITS, this._data({ HITIds }) );
        //    };
        //this.deleteHITs =
        //    ( HITIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_DELETE_HITS, this._data({ HITIds }) );
        //    };
        //this.listHITs =
        //    ( Cached ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_HITS, this._data({ Cached }) );
        //    };
        //this.listHITsForHITType =
        //    ( HITTypeId, Cached ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_HITS_FOR_HIT_TYPE, this._data({ HITTypeId, Cached }) );
        //    };
        //this.listAssignments =
        //    ( Cached ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS, this._data({ Cached }) );
        //    };
        //this.listAssignmentsForHITs =
        //    ( HITIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_LIST_ASSIGNMENTS_FOR_HITS, this._data({ HITIds }) );
        //    };
        //this.approveAssignments =
        //    ( AssignmentIds, RequesterFeedback ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_APPROVE_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
        //    };
        //this.rejectAssignments =
        //    ( AssignmentIds, RequesterFeedback ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_REJECT_ASSIGNMENTS, this._data({ AssignmentIds, RequesterFeedback }) );
        //    };
        //this.getAssignments =
        //    ( AssignmentIds ) => {
        //        return this._duct.send( this._duct.nextRid(), this._duct.EVENT.MTURK_GET_ASSIGNMENTS, this._data({ AssignmentIds }) );
        //    };

        let self = this;

        this._setMethods({
            getActiveCredentials() {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_GET_ACTIVE_CREDENTIALS, {}, arguments);
                },
            setActiveCredentials({ credentials_id }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_CREDENTIALS, { credentials_id }, arguments);
                }, 
            listCredentials() {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_LIST_CREDENTIALS, {}, arguments);
                }, 
            getCredentials({ credentials_id }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_GET_CREDENTIALS, { credentials_id }, arguments);
                }, 
            deleteCredentials({ credentials_id }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_DELETE_CREDENTIALS, { credentials_id }, arguments);
                }, 
            renameCredentials({ credentials_id, label }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_RENAME_CREDENTIALS, { credentials_id, label }, arguments);
                }, 
            addCredentials({ access_key_id, secret_access_key, label }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_ADD_CREDENTIALS, { access_key_id, secret_access_key, label }, arguments);
                }, 
            setActiveSandboxMode({ is_sandbox }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_SANDBOX_MODE, { is_sandbox }, arguments);
                },
            execBoto3({ method, parameters }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_EXEC_BOTO3, { method, parameters }, arguments);
                },
            listTuttiHITBatches() {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST, {}, arguments);
                },
            createTuttiHITBatch({ name, project_name, hit_type_params, hit_params, num_hits }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_CREATE, { name, project_name, hit_type_params, hit_params, num_hits }, arguments);
                },
            addHITsToTuttiHITBatch({ batch_id, hit_params, num_hits }) {
                    return self._callOrSend(self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_ADD_HITS, { batch_id, hit_params, num_hits }, arguments);
                },
        });
    }
}

class ResourceController extends TuttiController {
    constructor(duct){
        super(duct);
        let self = this;

        this._setMethods({
            getWebServiceDescriptor() {
                    return self._callOrSend(self._duct.EVENT.SYSTEM_GET_WSD, {}, arguments);
                },
            signUp({ user_name, password_hash, privilege_ids, ...args }) {
                    if('password' in args) {
                        password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                        delete arguments[0].password;
                    }
                    return self._callOrSend(self._duct.EVENT.AUTHENTICATION_SIGN_UP, { user_name, password_hash, privilege_ids }, arguments);
                },
            signIn({ user_name = null, password_hash = null, access_token = null, ...args }) {
                    if('password' in args) {
                        password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                        delete arguments[0].password;
                    }
                    return self._callOrSend(self._duct.EVENT.AUTHENTICATION_SIGN_IN, { user_name, password_hash, access_token }, arguments);
                },
            signOut() {
                    return self._callOrSend(self._duct.EVENT.AUTHENTICATION_SIGN_OUT, {}, arguments);
                },
            getUserIds() {
                    return self._callOrSend(self._duct.EVENT.ACCOUNT_LIST_IDS, {}, arguments);
                },
            deleteAccount({ user_id }) {
                    return self._callOrSend(self._duct.EVENT.ACCOUNT_DELETE, { user_id }, arguments);
                },
            associateUserPrivilege({ user_name }) {
                    return self._callOrSend(self._duct.EVENT.ACCOUNT_ASSOCIATE_USER_PRIVILEGE, { user_name }, arguments);
                },
            unassociateUserPrivilege({ user_name, privilege_id }) {
                    return self._callOrSend(self._duct.EVENT.ACCOUNT_UNASSOCIATE_USER_PRIVILEGE, { user_name, privilege_id }, arguments);
                },
            checkProjectDiff ({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.SYSTEM_BUILD_CHECK_PROJECT_DIFF, { project_name }, arguments);
                },
            rebuildProject({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.SYSTEM_BUILD_REBUILD_PROJECT, { project_name }, arguments);
                },
            getEventHistory() {
                    return self._callOrSend(self._duct.EVENT.EVENT_HISTORY, {}, arguments);
                },
            setEventHistory({ eid, query }) {
                    return self._callOrSend(self._duct.EVENT.EVENT_HISTORY, { eid, query }, arguments);
                },
            listProjects() {
                    return self._callOrSend(self._duct.EVENT.PROJECT_LIST, {}, arguments);
                },
            createProject({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_ADD, { project_name }, arguments);
                },
            deleteProject({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_DELETE, { project_name }, arguments);
                },
            listTemplates({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_LIST_TEMPLATES, { project_name }, arguments);
                },
            createTemplate({ project_name, template_name, preset_group_name, preset_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_ADD_TEMPLATE, { project_name, template_name, preset_group_name, preset_name }, arguments);
                },
            deleteTemplate({ project_name, template_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_DELETE_TEMPLATE, { project_name, template_name }, arguments);
                },
            listTemplatePresets({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS, { project_name }, arguments);
                },
            getProjectScheme({ project_name, cached }) {
                    return self._callOrSend(self._duct.EVENT.PROJECT_GET_SCHEME, { project_name, cached }, arguments);
                },
            getResponsesForTemplate({ project_name, template_name }) {
                    return self._callOrSend(self._duct.EVENT.RESPONSE_GET_FOR_TEMPLATE, { project_name, template_name }, arguments);
                },
            getResponsesForNanotask({ nanotask_id }) {
                    return self._callOrSend(self._duct.EVENT.RESPONSE_GET_FOR_NANOTASK, { nanotask_id }, arguments);
                },
            getWorkerForPlatformWorkerId({ platform, platform_worker_id }) {
                    return self._callOrSend(self._duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID, { platform, platform_worker_id }, arguments);
                },
            checkIfWorkerExistsForProject({ project_name, worker_id }) {
                    return self._callOrSend(self._duct.EVENT.WORKER_EXISTS_FOR_PROJECT, { project_name, worker_id }, arguments);
                },
            listWorkersForProject({ project_name }) {
                    return self._callOrSend(self._duct.EVENT.WORKER_LIST_FOR_PROJECT, { project_name }, arguments);
                },
            listNanotasks({ project_name, template_name }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_LIST, { project_name, template_name }, arguments);
                },
            createNanotasks({ project_name, template_name, nanotasks, tag, priority, num_assignable }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_ADD_MULTI_FOR_TEMPLATE, { project_name, template_name, nanotasks, tag, priority, num_assignable }, arguments);
                },
            deleteNanotasks({ nanotask_ids }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_DELETE, { nanotask_ids }, arguments);
                },
            createSession({ project_name, platform_worker_id, client_token, platform, nanotask_group_ids }) {
                    return self._callOrSend(self._duct.EVENT.WORKPLACE_START, { project_name, platform_worker_id, client_token, platform, nanotask_group_ids }, arguments);
                },
            getTemplateNode({ target, work_session_id, node_session_id }) {
                    return self._callOrSend(self._duct.EVENT.WORKPLACE_GET_NEXT_TEMPLATE, { target, work_session_id, node_session_id }, arguments);
                },
            setResponse({ work_session_id, node_session_id, answers }) {
                    return self._callOrSend(self._duct.EVENT.WORKPLACE_SET_RESPONSE, { work_session_id, node_session_id, answers }, arguments);
                },
            getNanotaskGroup({ nanotask_group_id }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_GROUP_GET, { nanotask_group_id }, arguments);
                },
            listNanotaskGroups({ project_name, template_name }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_GROUP_LIST, { project_name, template_name }, arguments);
                },
            createNanotaskGroup({ name, nanotask_ids, project_name, template_name }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_GROUP_ADD, { name, nanotask_ids, project_name, template_name }, arguments);
                },
            deleteNanotaskGroup({ nanotask_group_id }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_GROUP_DELETE, { nanotask_group_id }, arguments);
                },
            uploadNanotasks({ project_name, template_name, nanotasks, num_assignable, priority, tag_name }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_UPLOAD, { project_name, template_name, nanotasks, num_assignable, priority, tag_name }, arguments);
                },
            updateNanotaskNumAssignable({ project_name, template_name, nanotask_id, num_assignable }) {
                    return self._callOrSend(self._duct.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE, { project_name, template_name, nanotask_id, num_assignable }, arguments);
                },
            getAutomationParameterSet({ automation_parameter_set_id }) {
                    return self._callOrSend(self._duct.EVENT.AUTOMATION_PARAMETER_SET_GET, { automation_parameter_set_id }, arguments);
                },
            listAutomationParameterSets() {
                    return self._callOrSend(self._duct.EVENT.AUTOMATION_PARAMETER_SET_LIST, {}, arguments);
                },
            createAutomationParameterSet({ name, platform_parameter_set_id, project_name }) {
                    return self._callOrSend(self._duct.EVENT.AUTOMATION_PARAMETER_SET_ADD, { name, platform_parameter_set_id, project_name }, arguments);
                },
            getPlatformParameterSet({ platform_parameter_set_id }) {
                    return self._callOrSend(self._duct.EVENT.PLATFORM_PARAMETER_SET_GET, { platform_parameter_set_id }, arguments);
                },
            listPlatformParameterSets() {
                    return self._callOrSend(self._duct.EVENT.PLATFORM_PARAMETER_SET_LIST, {}, arguments);
                },
            createPlatformParameterSet({ name, platform, parameters }) {
                    return self._callOrSend(self._duct.EVENT.PLATFORM_PARAMETER_SET_ADD, { name, platform, parameters }, arguments);
                },
            executeAutomation({ automation_parameter_set_id, parameters }) {
                    return self._callOrSend(self._duct.EVENT.EXECUTE_AUTOMATION, { automation_parameter_set_id, parameters }, arguments);
                },
        });
    }
}

module.exports = {
    TuttiClient
}
