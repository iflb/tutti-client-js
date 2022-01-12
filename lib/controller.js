const { ThisBound } = require("@iflb/lib");
const { TuttiServerEventError } = require('./error.js');

class TuttiController extends ThisBound {
    constructor( duct ){
        super();
        this._duct = duct;
        this._accessToken = null;
        this._callIds = {};
    }

    setMethods(self, methods) {
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

        if(typeof(args)!=='object') 
            throw 'Tutti args must be passed as object';

        const paramsPossiblyUndefined =
            Object.entries(rawArgs)
                .filter(([key,]) => Object.keys(args).indexOf(key)===-1)
                .map(([key,]) => key);

        if(paramsPossiblyUndefined.length>0)
            console.warn(`Possibly undefined parameter(s): ${paramsPossiblyUndefined}`);

        if(accessToken)
            args.access_token = accessToken;

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

        let self = this;

        this.setMethods({
            getActiveCredentials() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_GET_ACTIVE_CREDENTIALS,
                            {}, arguments
                        );
                },
            setActiveCredentials({ credentials_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_CREDENTIALS,
                            { credentials_id }, arguments
                        );
                }, 
            listCredentials() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_LIST_CREDENTIALS,
                            {}, arguments
                        );
                }, 
            getCredentials({ credentials_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_GET_CREDENTIALS,
                            { credentials_id }, arguments
                        );
                }, 
            deleteCredentials({ credentials_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_DELETE_CREDENTIALS,
                            { credentials_id }, arguments
                        );
                }, 
            renameCredentials({ credentials_id, label }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_RENAME_CREDENTIALS,
                            { credentials_id, label }, arguments
                        );
                }, 
            addCredentials({ access_key_id, secret_access_key, label }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_ADD_CREDENTIALS,
                            { access_key_id, secret_access_key, label }, arguments
                        );
                }, 
            setActiveSandboxMode({ is_sandbox }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_SET_ACTIVE_SANDBOX_MODE,
                            { is_sandbox }, arguments
                        );
                },
            execBoto3({ method, parameters }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_EXEC_BOTO3,
                            { method, parameters }, arguments
                        );
                },
            expireHITs({ request_id, hit_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_HIT_EXPIRE,
                            { request_id, hit_ids }, arguments
                        );
                },
            deleteHITs({ request_id, hit_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_HIT_DELETE,
                            { request_id, hit_ids }, arguments
                        );
                },
            listHITsForTuttiHITBatch({ batch_id, cached }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_HIT_LIST_FOR_TUTTI_HIT_BATCH,
                            { batch_id, cached }, arguments
                        );
                },
            listTuttiHITBatches() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST,
                            {}, arguments
                        );
                },
            listTuttiHITBatchesWithHITs() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_LIST_WITH_HITS,
                            {}, arguments
                        );
                },
            createTuttiHITBatch({ name, project_name, hit_type_params, hit_params, num_hits }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_CREATE,
                            { name, project_name, hit_type_params, hit_params, num_hits }, arguments
                        );
                },
            addHITsToTuttiHITBatch({ batch_id, hit_params, num_hits }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_ADD_HITS,
                            { batch_id, hit_params, num_hits }, arguments
                        );
                },
            deleteTuttiHITBatch({ request_id, batch_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_TUTTI_HIT_BATCH_DELETE,
                            { request_id, batch_id }, arguments
                        );
                },
            listHITTypes() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_HIT_TYPE_LIST,
                            {}, arguments
                        );
                },
            listQualificationTypes({ query, only_user_defined, cached }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_LIST,
                            { query, only_user_defined, cached }, arguments
                        );
                },
            createQualificationType({ name, description, auto_granted, qualification_type_status }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_CREATE,
                            { name, description, auto_granted, qualification_type_status }, arguments
                        );
                },
            deleteQualificationTypes({ qualification_type_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_QUALIFICATION_TYPE_DELETE,
                            { qualification_type_ids }, arguments
                        );
                },
            listWorkers() {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_WORKER_LIST,
                            {}, arguments
                        );
                },
            notifyWorkers({ subject, message_text, worker_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_WORKER_NOTIFY,
                            { subject, message_text, worker_ids }, arguments
                        );
                },
            associateQualificationsWithWorkers({ qualification_type_id, worker_ids, integer_value, send_notification }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_WORKER_ASSOCIATE_QUALIFICATIONS,
                            { qualification_type_id, worker_ids, integer_value, send_notification }, arguments
                        );
                },
            listAssignmentsForTuttiHITBatch({ batch_id, cached }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_LIST_FOR_TUTTI_HIT_BATCH,
                            { batch_id, cached }, arguments
                        );
                },
            approveAssignments({ assignment_ids, requester_feedback, override_rejection }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_APPROVE,
                            { assignment_ids, requester_feedback, override_rejection }, arguments
                        );
                },
            rejectAssignments({ assignment_ids, requester_feedback }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_REJECT,
                            { assignment_ids, requester_feedback }, arguments
                        );
                },
            sendBonus({ worker_ids, bonus_amount, assignment_ids, reason }) {
                    return self._callOrSend(
                            self._duct.EVENT.MARKETPLACE_MTURK_ASSIGNMENT_SEND_BONUS,
                            { worker_ids, bonus_amount, assignment_ids, reason }, arguments
                        );
                },
        });
    }
}

class ResourceController extends TuttiController {
    constructor(duct){
        super(duct);
        let self = this;

        this.setMethods({
            getWebServiceDescriptor() {
                    return self._callOrSend(
                            self._duct.EVENT.SYSTEM_GET_WSD,
                            {}, arguments
                        );
                },
            signUp({ user_name, password_hash, privilege_ids, ...args }) {
                    if('password' in args) {
                        password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                        delete arguments[0].password;
                    }
                    return self._callOrSend(
                            self._duct.EVENT.AUTHENTICATION_SIGN_UP,
                            { user_name, password_hash, privilege_ids }, arguments
                        );
                },
            signIn({ user_name = null, password_hash = null, access_token = null, ...args }) {
                    if('password' in args) {
                        password_hash = crypto.createHash('md5').update(args.password, 'binary').digest('hex');
                        delete arguments[0].password;
                    }
                    return self._callOrSend(
                            self._duct.EVENT.AUTHENTICATION_SIGN_IN,
                            { user_name, password_hash, access_token }, arguments
                        );
                },
            signOut() {
                    return self._callOrSend(
                            self._duct.EVENT.AUTHENTICATION_SIGN_OUT,
                            {}, arguments
                        );
                },
            getUserIds() {
                    return self._callOrSend(
                            self._duct.EVENT.ACCOUNT_LIST_IDS,
                            {}, arguments
                        );
                },
            deleteAccount({ user_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.ACCOUNT_DELETE,
                            { user_id }, arguments
                        );
                },
            associateUserPrivilege({ user_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.ACCOUNT_ASSOCIATE_USER_PRIVILEGE,
                            { user_name }, arguments
                        );
                },
            unassociateUserPrivilege({ user_name, privilege_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.ACCOUNT_UNASSOCIATE_USER_PRIVILEGE,
                            { user_name, privilege_id }, arguments
                        );
                },
            checkProjectDiff ({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.SYSTEM_BUILD_CHECK_PROJECT_DIFF,
                            { project_name }, arguments
                        );
                },
            rebuildProject({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.SYSTEM_BUILD_REBUILD_PROJECT,
                            { project_name }, arguments
                        );
                },
            getEventHistory() {
                    return self._callOrSend(
                            self._duct.EVENT.EVENT_HISTORY,
                            {}, arguments
                        );
                },
            setEventHistory({ eid, query }) {
                    return self._callOrSend(
                            self._duct.EVENT.EVENT_HISTORY,
                            { eid, query }, arguments
                        );
                },
            listProjects() {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_LIST,
                            {}, arguments
                        );
                },
            createProject({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_ADD,
                            { project_name }, arguments
                        );
                },
            deleteProject({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_DELETE,
                            { project_name }, arguments
                        );
                },
            listTemplates({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_LIST_TEMPLATES,
                            { project_name }, arguments
                        );
                },
            createTemplate({ project_name, template_name, preset_group_name, preset_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_ADD_TEMPLATE,
                            { project_name, template_name, preset_group_name, preset_name }, arguments
                        );
                },
            deleteTemplate({ project_name, template_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_DELETE_TEMPLATE,
                            { project_name, template_name }, arguments
                        );
                },
            listTemplatePresets({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_LIST_TEMPLATE_PRESETS,
                            { project_name }, arguments
                        );
                },
            getProjectScheme({ project_name, cached }) {
                    return self._callOrSend(
                            self._duct.EVENT.PROJECT_GET_SCHEME,
                            { project_name, cached }, arguments
                        );
                },
            getResponsesForTemplate({ project_name, template_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.RESPONSE_GET_FOR_TEMPLATE,
                            { project_name, template_name }, arguments
                        );
                },
            getResponsesForNanotask({ nanotask_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.RESPONSE_GET_FOR_NANOTASK,
                            { nanotask_id }, arguments
                        );
                },
            getWorkerForPlatformWorkerId({ platform, platform_worker_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKER_GET_FOR_PLATFORM_WORKER_ID,
                            { platform, platform_worker_id }, arguments
                        );
                },
            checkIfWorkerExistsForProject({ project_name, worker_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKER_EXISTS_FOR_PROJECT,
                            { project_name, worker_id }, arguments
                        );
                },
            listWorkersForProject({ project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKER_LIST_FOR_PROJECT,
                            { project_name }, arguments
                        );
                },
            listNanotasks({ project_name, template_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_LIST,
                            { project_name, template_name }, arguments
                        );
                },
            createNanotasks({ id, project_name, template_name, nanotasks, tag, priority, num_assignable }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_ADD_MULTI_FOR_TEMPLATE,
                            { id, project_name, template_name, nanotasks, tag, priority, num_assignable }, arguments
                        );
                },
            deleteNanotasks({ nanotask_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_DELETE,
                            { nanotask_ids }, arguments
                        );
                },
            createSession({ project_name, platform_worker_id, client_token, platform, nanotask_group_ids }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKPLACE_START,
                            { project_name, platform_worker_id, client_token, platform, nanotask_group_ids }, arguments
                        );
                },
            getTemplateNode({ target, work_session_id, node_session_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKPLACE_GET_NEXT_TEMPLATE,
                            { target, work_session_id, node_session_id }, arguments
                        );
                },
            setResponse({ work_session_id, node_session_id, answers }) {
                    return self._callOrSend(
                            self._duct.EVENT.WORKPLACE_SET_RESPONSE,
                            { work_session_id, node_session_id, answers }, arguments
                        );
                },
            getNanotaskGroup({ nanotask_group_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_GROUP_GET,
                            { nanotask_group_id }, arguments
                        );
                },
            listNanotaskGroups({ project_name, template_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_GROUP_LIST,
                            { project_name, template_name }, arguments
                        );
                },
            createNanotaskGroup({ name, nanotask_ids, project_name, template_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_GROUP_ADD,
                            { name, nanotask_ids, project_name, template_name }, arguments
                        );
                },
            deleteNanotaskGroup({ nanotask_group_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_GROUP_DELETE,
                            { nanotask_group_id }, arguments
                        );
                },
            uploadNanotasks({ project_name, template_name, nanotasks, num_assignable, priority, tag_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_UPLOAD,
                            { project_name, template_name, nanotasks, num_assignable, priority, tag_name }, arguments
                        );
                },
            updateNanotaskNumAssignable({ project_name, template_name, nanotask_id, num_assignable }) {
                    return self._callOrSend(
                            self._duct.EVENT.NANOTASK_UPDATE_NUM_ASSIGNABLE,
                            { project_name, template_name, nanotask_id, num_assignable }, arguments
                        );
                },
            getAutomationParameterSet({ automation_parameter_set_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.AUTOMATION_PARAMETER_SET_GET,
                            { automation_parameter_set_id }, arguments
                        );
                },
            listAutomationParameterSets() {
                    return self._callOrSend(
                            self._duct.EVENT.AUTOMATION_PARAMETER_SET_LIST,
                            {}, arguments
                        );
                },
            createAutomationParameterSet({ name, platform_parameter_set_id, project_name }) {
                    return self._callOrSend(
                            self._duct.EVENT.AUTOMATION_PARAMETER_SET_ADD,
                            { name, platform_parameter_set_id, project_name }, arguments
                        );
                },
            getPlatformParameterSet({ platform_parameter_set_id }) {
                    return self._callOrSend(
                            self._duct.EVENT.PLATFORM_PARAMETER_SET_GET,
                            { platform_parameter_set_id }, arguments
                        );
                },
            listPlatformParameterSets() {
                    return self._callOrSend(
                            self._duct.EVENT.PLATFORM_PARAMETER_SET_LIST,
                            {}, arguments
                        );
                },
            createPlatformParameterSet({ name, platform, parameters }) {
                    return self._callOrSend(
                            self._duct.EVENT.PLATFORM_PARAMETER_SET_ADD,
                            { name, platform, parameters }, arguments
                        );
                },
            executeAutomation({ automation_parameter_set_id, parameters }) {
                    return self._callOrSend(
                            self._duct.EVENT.EXECUTE_AUTOMATION,
                            { automation_parameter_set_id, parameters }, arguments
                        );
                },
        });
    }
}

module.exports = {
        ResourceController,
        MTurkController,
    };
