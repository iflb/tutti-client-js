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

    _setDefaultTuttiHandlers(self, methods) {
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
        self._setDefaultTuttiHandlers(Object.keys(listenerEventRelayMap));
    }
}

class ResourceEventListener extends DuctEventListener {
    constructor(duct) {
        super(duct);

        const listenerEventRelayMap = {
                'getWebServiceDescriptor':
                    duct.EVENT.SYSTEM_GET_WSD,
                'signUp':
                    duct.EVENT.AUTHENTICATION_SIGN_UP,
                'signIn':
                    duct.EVENT.AUTHENTICATION_SIGN_IN,
                'signOut':
                    duct.EVENT.AUTHENTICATION_SIGN_OUT,
                'getUserIds':
                    duct.EVENT.ACCOUNT_LIST_IDS,
                'changeAccountPassword':
                    duct.EVENT.ACCOUNT_CHANGE_PASSWORD,
                'deleteAccount':
                    duct.EVENT.ACCOUNT_DELETE,
                'checkProjectDiff':
                    duct.EVENT.SYSTEM_BUILD_CHECK_PROJECT_DIFF,
                'rebuildProject':
                    duct.EVENT.SYSTEM_BUILD_REBUILD_PROJECT,
                'listProjects':
                    duct.EVENT.PROJECT_LIST,
                'createProject':
                    duct.EVENT.PROJECT_ADD,
                //'renameProject':
                //    duct.EVENT.PROJECT_RENAME,
                'copyProject':
                    duct.EVENT.PROJECT_COPY,
                'deleteProject':
                    duct.EVENT.PROJECT_DELETE,
                'getProjectScheme':
                    duct.EVENT.PROJECT_GET_SCHEME,
                'loadProjectSchemeCode':
                    duct.EVENT.PROJECT_LOAD_SCHEME_CODE,
                'saveProjectSchemeCode':
                    duct.EVENT.PROJECT_SAVE_SCHEME_CODE,
                'createTemplate':
                    duct.EVENT.PROJECT_ADD_TEMPLATE,
                'deleteTemplate':
                    duct.EVENT.PROJECT_DELETE_TEMPLATE,
                'listTemplates':
                    duct.EVENT.PROJECT_LIST_TEMPLATES,
                'loadTemplateCode':
                    duct.EVENT.PROJECT_LOAD_TEMPLATE_CODE,
                'saveTemplateCode':
                    duct.EVENT.PROJECT_SAVE_TEMPLATE_CODE,
                'listTemplatePresets':
                    duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS,
                'listResponsesForProject':
                    duct.EVENT.RESPONSE_LIST_FOR_PROJECT,
                'listResponsesForTemplate':
                    duct.EVENT.RESPONSE_LIST_FOR_TEMPLATE,
                'listResponsesForNanotask':
                    duct.EVENT.RESPONSE_LIST_FOR_NANOTASK,
                'listResponsesForWorker':
                    duct.EVENT.RESPONSE_LIST_FOR_WORKER,
                'listResponsesForWorkSession':
                    duct.EVENT.RESPONSE_LIST_FOR_WORK_SESSION,
                'listProjectsWithResponses':
                    duct.EVENT.RESPONSE_LIST_PROJECTS,
                'listTemplatesWithResponses':
                    duct.EVENT.RESPONSE_LIST_TEMPLATES,
                'listNanotasksWithResponses':
                    duct.EVENT.RESPONSE_LIST_NANOTASKS,
                'listWorkersWithResponses':
                    duct.EVENT.RESPONSE_LIST_WORKERS,
                'listWorkSessionsWithResponses':
                    duct.EVENT.RESPONSE_LIST_WORK_SESSIONS,
                'watchResponsesForProject':
                    duct.EVENT.RESPONSE_WATCH_FOR_PROJECT,
                'watchResponsesForTemplate':
                    duct.EVENT.RESPONSE_WATCH_FOR_TEMPLATE,
                'watchResponsesForNanotask':
                    duct.EVENT.RESPONSE_WATCH_FOR_NANOTASK,
                'watchResponsesForWorker':
                    duct.EVENT.RESPONSE_WATCH_FOR_WORKER,
                'watchResponsesForAutomationParameterSet':
                    duct.EVENT.RESPONSE_WATCH_FOR_AUTOMATION_PARAMETER_SET,
                'watchResponsesForPlatformParameterSet':
                    duct.EVENT.WORKER_LIST_FOR_PLATFORM_PARAMETER_SET,
                'listWorkersForProject':
                    duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID,
                'listNanotasks':
                    duct.EVENT.NANOTASK_LIST,
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
                'deleteNanotaskGroup':
                    duct.EVENT.NANOTASK_GROUP_DELETE,
                'listNodeSessionsForWorkSession':
                    duct.EVENT.NODE_SESSION_LIST_FOR_WORK_SESSION,
                'getAutomationParameterSet':
                    duct.EVENT.AUTOMATION_PARAMETER_SET_GET,
                'listAutomationParameterSets':
                    duct.EVENT.AUTOMATION_PARAMETER_SET_LIST,
                'createAutomationParameterSet':
                    duct.EVENT.AUTOMATION_PARAMETER_SET_ADD,
                'getPlatformParameterSet':
                    duct.EVENT.PLATFORM_PARAMETER_SET_GET,
                'listPlatformParameterSets':
                    duct.EVENT.PLATFORM_PARAMETER_SET_LIST,
                'createPlatformParameterSet':
                    duct.EVENT.PLATFORM_PARAMETER_SET_ADD,
                'saveFilesInWorkSession':
                    duct.EVENT.SYSTEM_FS_SAVE_FILES_IN_WORK_SESSION,
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
                    duct.EVENT.MARKETPLACE_MTURK_HIT_ADD_FOR_TUTTI_HIT_BATCH,
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
