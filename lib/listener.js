const ducts = require("@iflb/ducts-client");

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

    registerHandlers(self, source, listenerEventRelayMap) {
        Object.entries(listenerEventRelayMap).forEach(([listenerName, eid]) => {
            self._duct.setEventHandler(
                eid,
                (rid, eid, data) => { self._handle(source, listenerName, rid, data); }
            )
        });
        self.setDefaultTuttiHandlers(Object.keys(listenerEventRelayMap));
    }
}

class ResourceEventListener extends DuctEventListener {
    constructor(duct) {
        super(duct);

        const listenerEventRelayMap = {
                'checkIfProjectNeedsRebuild':
                    duct.EVENT.CHECK_PROJECT_DIFF,
                'rebuildProject':
                    duct.EVENT.REBUILD_PRODUCTION_ENVIRONMENT,
                'signIn':
                    duct.EVENT.AUTHENTICATION_SIGN_IN,
                'signOut':
                    duct.EVENT.AUTHENTICATION_SIGN_OUT,
                'listProjects':
                    duct.EVENT.PROJECT_LIST,
                'createProject':
                    duct.EVENT.PROJECT_ADD,
                'getProjectScheme':
                    duct.EVENT.PROJECT_GET_SCHEME,
                'addTemplate':
                    duct.EVENT.PROJECT_ADD_TEMPLATE,
                'deleteTemplate':
                    duct.EVENT.PROJECT_DELETE_TEMPLATE,
                'listTemplates':
                    duct.EVENT.PROJECT_LIST_TEMPLATES,
                'listTemplatePresets':
                    duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS,
                'getResponsesForTemplate':
                    duct.EVENT.RESPONSE_GET_FOR_TEMPLATE,
                'getResponsesForNanotask':
                    duct.EVENT.RESPONSE_GET_FOR_NANOTASK,
                'getNanotasks':
                    duct.EVENT.NANOTASK_GET,
                'createNanotasks':
                    duct.EVENT.NANOTASK_ADD_MULTI_FOR_TEMPLATE,
                'deleteNanotasks':
                    duct.EVENT.NANOTASK_DELETE,
                'createNanotaskGroup':
                    duct.EVENT.NANOTASK_GROUP_ADD,
                'listNanotaskGroups':
                    duct.EVENT.NANOTASK_GROUP_LIST,
                'getNanotaskGroup':
                    duct.EVENT.NANOTASK_GROUP_GET,
                'updateNanotaskNumAssignable':
                    duct.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE,
                'createSession':
                    duct.EVENT.WORKPLACE_START,
                'getTemplateNode':
                    duct.EVENT.WORKPLACE_GET_NEXT_TEMPLATE,
                'setResponse':
                    duct.EVENT.WORKPLACE_SET_RESPONSE,
                'getWorkerForPlatformWorkerId':
                    duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID,
                'listWorkersForProject':
                    duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID,
            };

        this.registerHandlers('resource', listenerEventRelayMap);
    }
}

class MTurkEventListener extends DuctEventListener {
    constructor(duct) {
        super(duct);

        const listenerEventRelayMap = {
                'getActiveCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_GET_ACTIVE_CREDENTIALS,
                'setActiveCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_CREDENTIALS,
                'listCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_LIST_CREDENTIALS,
                'getCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_GET_CREDENTIALS,
                'deleteCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_DELETE_CREDENTIALS,
                'renameCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_RENAME_CREDENTIALS,
                'addCredentials':
                    duct.EVENT.MARKETPLACE_MTURK_ADD_CREDENTIALS,
                'setActiveSandboxMode':
                    duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_SANDBOX_MODE,
                'execBoto3':
                    duct.EVENT.MARKETPLACE_MTURK_EXEC_BOTO3,
                'listHITTypes':
                    duct.EVENT.MARKETPLACE_MTURK_HIT_TYPE_LIST,
                'listTuttiHITBatches':
                    duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST,
                'listTuttiHITBatchesWithHITs':
                    duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST_WITH_HITS,
                'createTuttiHITBatch':
                    duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_CREATE,
                'addHITsToTuttiHITBatch':
                    duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_ADD_HITS,
                'deleteTuttiHITBatch':
                    duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_DELETE,
                'listQualificationTypes':
                    duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_LIST,
                'createQualificationType':
                    duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_CREATE,
                'deleteQualificationTypes':
                    duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_DELETE,
                'associateQualificationsWithWorkers':
                    duct.EVENT.MARKETPLACE_MTURK_WORKER_ASSOCIATE_QUALIFICATIONS,
                'listHITsForTuttiHITBatch':
                    duct.EVENT.MARKETPLACE_MTURK_HIT_LIST_FOR_TUTTI_HIT_BATCH,
                'expireHITs':
                    duct.EVENT.MARKETPLACE_MTURK_HIT_EXPIRE,
                'deleteHITs':
                    duct.EVENT.MARKETPLACE_MTURK_HIT_DELETE,
                'listWorkers':
                    duct.EVENT.MARKETPLACE_MTURK_WORKER_LIST,
                'notifyWorkers':
                    duct.EVENT.MARKETPLACE_MTURK_WORKER_NOTIFY,
                'listAssignmentsForTuttiHITBatch':
                    duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_LIST_FOR_TUTTI_HIT_BATCH,
                'approveAssignments':
                    duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_APPROVE,
                'rejectAssignments':
                    duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_REJECT,
                'sendBonus':
                    duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_SEND_BONUS,
            };

        this.registerHandlers('mturk', listenerEventRelayMap);
    }
}

module.exports = {
        ResourceEventListener,
        MTurkEventListener,
    };
