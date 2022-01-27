const defaultParamProfiles = {
    common: {
        project_name: {
            type: String,
            description: "Tutti project name."
        },
        cached: {
            type: Boolean,
            description: "Whether to return cached value in the response. Note that setting this value to false may result in slower responses."
        },
    },
    resource: {
        template_name: {
            type: String,
            description: "Tutti template name of a project."
        },
        user_name: {
            type: String,
            description: "User name of Tutti account.",
        },
        password_hash: {
            type: String,
            description: "MD5-hashed password (hex-digested) of Tutti account.",
        },
        privilege_ids: {
            type: Array,
            description: "Priviledge IDs to associate with account. **Currently not in use.**",
        },
        "...args": {
            description: "Accepts only `password` key (non-hashed password of Tutti account). This is **not recommended**; use `password_hash` or `access_token` instead.",
        },
        user_id: {
            type: String,
            description: "User ID of Tutti account.",
        },
        preset_group_name: {
            type: String,
            description: "",
        },
        preset_name: {
            type: String,
            description: "",
        },
        nanotask_id: {
            type: String,
            description: "",
        },
        worker_id: {
            type: String,
            description: "Tutti's internal hash ID for worker."
        },
        work_session_id: {
            type: String,
            description: "",
        },
        nanotasks: {
            type: Array,
            description: "",
        },
        tag: {
            type: String,
            description: "An arbitrary data field to tag nanotask for identifying purposes.",
        },
        priority: {
            type: Number,
            description: "An integer value to represent nanotask importance. The smaller the value is, more prioritized the nanotask is among others. To learn more about nanotask priority, see Tutti's [Programming Reference > Project Scheme](https://iflb.github.io/tutti/#/guide/ref_scheme).",
        },
        num_assignable: {
            type: Number,
            description: "Maximum number of workers that can be assigned to nanotask.",
        },
        nanotask_ids: {
            type: Array,
            description: "",
        },
        nanotask_group_id: {
            type: String,
            description: "",
        },
    },
    mturk: {
        credentials_id: {
            type: String,
            description: "Tutti's internal hash ID for registered MTurk credentials."
        },
        access_key_id: {
            type: String,
            description: "Access Key ID of MTurk credentials."
        },
        secret_access_key: {
            type: String,
            description: "Secret Access Key of MTurk credentials."
        },
        is_sandbox: {
            type: Boolean,
            description: "Activation of Sandbox mode for MTurk credentials."
        },
        request_id: {
            type: String,
            description: "Arbitrary string value to identify response for this request."
        },
        hit_ids: {
            type: Array,
            description: "List of MTurk HIT Ids."
        },
        batch_id: {
            type: String,
            description: "Tutti's internal hash ID for Tutti HIT Batch."
        },
        hit_type_params: {
            type: Object,
            description: "Parameters for CreateHITType operation of MTurk."
        },
        hit_params: {
            type: Object,
            description: "Parameters for CreateHIT operation of MTurk."
        },
        num_hits: {
            type: Number,
            description: "Number of HITs to create for Tutti HIT Batch."
        },
        only_user_defined: {
            type: Boolean,
            description: "Whether to filter out Qualification types of other requesters in the results. This is directly passed to MustBeOwnedByCaller parameter for MTurk's ListQualificationTypes operation."
        },
        qualification_type_ids: {
            type: Array,
            description: "List of MTurk Qualification type IDs."
        },
        worker_ids: {
            type: Array,
            description: "List of MTurk Worker IDs."
        },
        assignment_ids: {
            type: Array,
            description: "List of MTurk Assignment IDs."
        }
    }
};

const defaultParamProfileToReturnData = function(namespace, paramName) {
    return {
        name: paramName,
        ...defaultParamProfiles[namespace][paramName]
    }
}

const methodProfiles = {
    resource: {
        checkProjectDiff: {
            description: "Checks whether the project is already rebuilt for the newest version.",
            parameters: {},
            returns: { 
                data: {
                    type: Boolean,
                    description: "True if the project is in the newest version, thus no rebuild is needed.",
                }
             },
        },
        createNanotaskGroup: {
            description: "",
            parameters: { 
                name: {
                    type: String,
                    description: "Name for the nanotask group. Must be unique."
                },
             },
            returns: { 
                data: {
                    type: String,
                    description: "Created nanotask group ID."
                },
                description: "",
             },
        },
        createNanotasks: {
            description: "",
            parameters: {},
            returns: { 
                data: [
                    defaultParamProfileToReturnData('common', 'project_name'),
                    defaultParamProfileToReturnData('resource', 'template_name'),
                    defaultParamProfileToReturnData('resource', 'nanotask_ids'),
                ],
                description: "",
             },
        },
        createProject: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        createTemplate: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteAccount: {
            description: "",
            parameters: { },
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteNanotaskGroup: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteNanotasks: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteProject: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteTemplate: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getNanotaskGroup: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getProjectScheme: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getUserIds: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getWebServiceDescriptor: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listNanotaskGroups: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listNanotasks: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listNanotasksWithResponses: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listNodeSessionsForWorkSession: {
            description: "",
            parameters: {
                only_template: {
                    type: Boolean,
                    description: "If True, returns only node sessions for template nodes.",
                }
            },
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listProjects: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listProjectsWithResponses: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listResponsesForNanotask: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listResponsesForProject: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listResponsesForTemplate: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listResponsesForWorkSession: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listResponsesForWorker: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listTemplatePresets: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listTemplates: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listTemplatesWithResponses: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listWorkSessionsWithResponses: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listWorkersForProject: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listWorkersWithResponses: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        rebuildProject: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        signIn: {
            description: "",
            parameters: {
                access_token: {
                        type: String,
                        description: "Valid access token obtained in previous logins."
                    },
            },
            //returns: { 
            //    data: {
            //        type: String,
            //        description: "",
            //    }
            // },
        },
        signOut: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        signUp: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        }
    },
    mturk: {
        addCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        addHITsToTuttiHITBatch: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        approveAssignments: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        associateQualificationsWithWorkers: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        createQualificationType: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        createTuttiHITBatch: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteHITs: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteQualificationTypes: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        deleteTuttiHITBatch: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        execBoto3: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        expireHITs: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getActiveCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        getCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listAssignmentsForTuttiHITBatch: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listHITTypes: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listHITsForTuttiHITBatch: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listQualificationTypes: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listTuttiHITBatches: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listTuttiHITBatchesWithHITs: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        listWorkers: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        notifyWorkers: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        rejectAssignments: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        renameCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        sendBonus: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        setActiveCredentials: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        },
        setActiveSandboxMode: {
            description: "",
            parameters: {},
            //returns: { 
            //    data: {
            //        type: String,
            //        description: ""
            //    },
            //    description: "",
            // },
        }
    }
};

module.exports = {
    defaultParamProfiles,
    methodProfiles,
};
