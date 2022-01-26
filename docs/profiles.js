const defaultArgs = {
    mturk: {
        credentials_id: {
            "type": "String",
            "description": "Tutti's internal hash ID for registered MTurk credentials."
        },
        access_key_id: {
            "type": "String",
            "description": "Access Key ID of MTurk credentials."
        },
        secret_access_key: {
            "type": "String",
            "description": "Secret Access Key of MTurk credentials."
        },
        is_sandbox: {
            "type": "Boolean",
            "description": "Activation of Sandbox mode for MTurk credentials."
        },
        request_id: {
            "type": "String",
            "description": "Arbitrary string value to identify response for this request."
        },
        hit_ids: {
            "type": "Array",
            "description": "List of MTurk HIT Ids."
        },
        batch_id: {
            "type": "String",
            "description": "Tutti's internal hash ID for Tutti HIT Batch."
        },
        cached: {
            "type": "Boolean",
            "description": "Whether to return cached value in the response. Note that setting this value to false may result in slower responses."
        },
        project_name: {
            "type": "String",
            "description": "Project name"
        },
        hit_type_params: {
            "type": "Object",
            "description": "Parameters for CreateHITType operation of MTurk."
        },
        hit_params: {
            "type": "Object",
            "description": "Parameters for CreateHIT operation of MTurk."
        },
        num_hits: {
            "type": "Number",
            "description": "Number of HITs to create for Tutti HIT Batch."
        },
        only_user_defined: {
            "type": "Boolean",
            "description": "Whether to filter out Qualification types of other requesters in the results. This is directly passed to MustBeOwnedByCaller parameter for MTurk's ListQualificationTypes operation."
        },
        qualification_type_ids: {
            "type": "Array",
            "description": "List of MTurk Qualification type IDs."
        },
        worker_ids: {
            "type": "Array",
            "description": "List of MTurk Worker IDs."
        },
        assignment_ids: {
            "type": "Array",
            "description": "List of MTurk Assignment IDs."
        }
    },
    resource: {

    }
};

module.exports = {
    defaultArgs,

};
