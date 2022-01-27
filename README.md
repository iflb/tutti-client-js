# Tutti JavaScript Client API

## Installation

Node.js:
```
npm install @iflb/tutti-client
```

## Usage

There are two ways to communicate with Tutti server: **Call** mode and **Send** mode.

### Call mode

Calling commands with `await` prefix, the process waits there until the response is sent back, and receives it as a return value.

#### Directions
```
const data = await client.<namespace>.<command>({ <args object> }, awaited = true);
```
OR equivalently,
```
const data = await client.<namespace>.<command>.call(<args object>);
```

### Send mode

Calling commands *without* `await` prefix, the process completes as soon as request is sent, and receives it in its listener.

#### Directions
Having defined a listener like below,
```
client.<namespace>.on('<command>', {
    success: (data) => {
        // do something for successful response...
    },
    error: (err) => {
        // do something for errors...
    },
    complete: () => {
        // do another thing to finalize request...
    }
});
```
Run:
```
client.<namespace>.<command>({ <args object> }, awaited = false);
```
OR equivalently,
```
client.<namespace>.<command>.send(<args object>);
```

## Code Examples

Node.js:
```javascript
const { TuttiClient } = require('@iflb/tutti-client');

async function main() {
    let client = new TuttiClient(true);
    await client.open('http://localhost:8080/ducts/wsd');

    // Sign in with an account first
    await client.resource.signIn({ user_name: 'admin', password: 'admin' })
    // Get a list of created projects
    const projects = await client.resource.listProjects();
    // List templates for the first project
    const templates = await client.resource.listTemplates({ project_name: projects[0].name });
}

main();
```

Browser:
```html
<script src="https://unpkg.com/@iflb/tutti-client/dist/tutti.js"></script>
<script>
async function main() {
    const client = new tutti.TuttiClient(true);
    await client.open('http://localhost:8080/ducts/wsd');

    // Sign in with an account first
    await client.resource.signIn({ user_name: 'admin', password: 'admin' })
    // Get a list of created projects
    const projects = await client.resource.listProjects();
    // List templates for the first project
    const templates = await client.resource.listTemplates({ project_name: projects[0].name });
}
main();
</script>
```

## Commands

Current options for namespaces are: **resource**, **mturk**.

### TuttiClient.resource

---

#### checkProjectDiff

<p style="padding-left:20px;">Checks whether the project is already rebuilt for the newest version.</p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

<h5 style="color:#666;">Returns</h5>

- <span style="color:#999;">_Boolean_</span> -- True if the project is in the newest version, thus no rebuild is needed.
---

#### createNanotaskGroup

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `name`: <span style="color:#999;">_String_</span>
  - Name for the nanotask group. Must be unique.
- `nanotask_ids`: <span style="color:#999;">_Array_</span>
- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

<h5 style="color:#666;">Returns</h5>

- <span style="color:#999;">_String_</span> -- Created nanotask group ID.
---

#### createNanotasks

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.
- `nanotasks`: <span style="color:#999;">_Array_</span>
- `tag`: <span style="color:#999;">_String_</span>
  - An arbitrary data field to tag nanotask for identifying purposes.
- `priority`: <span style="color:#999;">_Number_</span>
  - An integer value to represent nanotask importance. The smaller the value is, more prioritized the nanotask is among others. To learn more about nanotask priority, see Tutti's [Programming Reference > Project Scheme](https://iflb.github.io/tutti/#/guide/ref_scheme).
- `num_assignable`: <span style="color:#999;">_Number_</span>
  - Maximum number of workers that can be assigned to nanotask.

<h5 style="color:#666;">Returns</h5>

- <span style="color:#999;">_Object_</span>
  - `project_name`: <span style="color:#999;">_String_</span>
    - Tutti project name.
  - `template_name`: <span style="color:#999;">_String_</span>
    - Tutti template name of a project.
  - `nanotask_ids`: <span style="color:#999;">_Array_</span>

---

#### createProject

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### createTemplate

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.
- `preset_group_name`: <span style="color:#999;">_String_</span>
- `preset_name`: <span style="color:#999;">_String_</span>

---

#### deleteAccount

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `user_id`: <span style="color:#999;">_String_</span>
  - User ID of Tutti account.

---

#### deleteNanotaskGroup

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `nanotask_group_id`: <span style="color:#999;">_String_</span>

---

#### deleteNanotasks

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `nanotask_ids`: <span style="color:#999;">_Array_</span>

---

#### deleteProject

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### deleteTemplate

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

---

#### getNanotaskGroup

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `nanotask_group_id`: <span style="color:#999;">_String_</span>

---

#### getProjectScheme

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `cached`: <span style="color:#999;">_Boolean_</span>
  - Whether to return cached value in the response. Note that setting this value to false may result in slower responses.

---

#### getUserIds

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### getWebServiceDescriptor

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listNanotaskGroups

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

---

#### listNanotasks

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

---

#### listNanotasksWithResponses

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

---

#### listNodeSessionsForWorkSession

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `work_session_id`: <span style="color:#999;">_String_</span>
- `only_template`: <span style="color:#999;">_Boolean_</span>
  - If True, returns only node sessions for template nodes.

---

#### listProjects

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listProjectsWithResponses

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listResponsesForNanotask

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `nanotask_id`: <span style="color:#999;">_String_</span>

---

#### listResponsesForProject

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listResponsesForTemplate

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `template_name`: <span style="color:#999;">_String_</span>
  - Tutti template name of a project.

---

#### listResponsesForWorkSession

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `work_session_id`: <span style="color:#999;">_String_</span>

---

#### listResponsesForWorker

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `worker_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for worker.

---

#### listTemplatePresets

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listTemplates

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listTemplatesWithResponses

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listWorkSessionsWithResponses

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listWorkersForProject

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### listWorkersWithResponses

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### rebuildProject

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.

---

#### signIn

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `user_name`: <span style="color:#999;">_String_</span>, default null
  - User name of Tutti account.
- `password_hash`: <span style="color:#999;">_String_</span>, default null
  - MD5-hashed password (hex-digested) of Tutti account.
- `access_token`: <span style="color:#999;">_String_</span>, default null
  - Valid access token obtained in previous logins.
- `...args`: 
  - Accepts only `password` key (non-hashed password of Tutti account). This is **not recommended**; use `password_hash` or `access_token` instead.

---

#### signOut

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### signUp

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `user_name`: <span style="color:#999;">_String_</span>
  - User name of Tutti account.
- `password`: 
- `privilege_ids`: <span style="color:#999;">_Array_</span>
  - Priviledge IDs to associate with account. **Currently not in use.**

### TuttiClient.mturk

---

#### addCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `access_key_id`: <span style="color:#999;">_String_</span>
  - Access Key ID of MTurk credentials.
- `secret_access_key`: <span style="color:#999;">_String_</span>
  - Secret Access Key of MTurk credentials.
- `label`: 

---

#### addHITsToTuttiHITBatch

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `batch_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for Tutti HIT Batch.
- `hit_params`: <span style="color:#999;">_Object_</span>
  - Parameters for CreateHIT operation of MTurk.
- `num_hits`: <span style="color:#999;">_Number_</span>
  - Number of HITs to create for Tutti HIT Batch.

---

#### approveAssignments

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `assignment_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Assignment IDs.
- `requester_feedback`: 
- `override_rejection`: 

---

#### associateQualificationsWithWorkers

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `qualification_type_id`: 
- `worker_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Worker IDs.
- `integer_value`: 
- `send_notification`: 

---

#### createQualificationType

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `name`: 
- `description`: 
- `auto_granted`: 
- `qualification_type_status`: 

---

#### createTuttiHITBatch

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `name`: 
- `project_name`: <span style="color:#999;">_String_</span>
  - Tutti project name.
- `hit_type_params`: <span style="color:#999;">_Object_</span>
  - Parameters for CreateHITType operation of MTurk.
- `hit_params`: <span style="color:#999;">_Object_</span>
  - Parameters for CreateHIT operation of MTurk.
- `num_hits`: <span style="color:#999;">_Number_</span>
  - Number of HITs to create for Tutti HIT Batch.

---

#### deleteCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `credentials_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for registered MTurk credentials.

---

#### deleteHITs

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `request_id`: <span style="color:#999;">_String_</span>
  - Arbitrary string value to identify response for this request.
- `hit_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk HIT Ids.

---

#### deleteQualificationTypes

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `qualification_type_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Qualification type IDs.

---

#### deleteTuttiHITBatch

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `request_id`: <span style="color:#999;">_String_</span>
  - Arbitrary string value to identify response for this request.
- `batch_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for Tutti HIT Batch.

---

#### execBoto3

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `method`: 
- `parameters`: 

---

#### expireHITs

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `request_id`: <span style="color:#999;">_String_</span>
  - Arbitrary string value to identify response for this request.
- `hit_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk HIT Ids.

---

#### getActiveCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### getCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `credentials_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for registered MTurk credentials.

---

#### listAssignmentsForTuttiHITBatch

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `batch_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for Tutti HIT Batch.
- `cached`: <span style="color:#999;">_Boolean_</span>
  - Whether to return cached value in the response. Note that setting this value to false may result in slower responses.

---

#### listCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listHITTypes

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listHITsForTuttiHITBatch

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `batch_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for Tutti HIT Batch.
- `cached`: <span style="color:#999;">_Boolean_</span>
  - Whether to return cached value in the response. Note that setting this value to false may result in slower responses.

---

#### listQualificationTypes

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `query`: 
- `only_user_defined`: <span style="color:#999;">_Boolean_</span>
  - Whether to filter out Qualification types of other requesters in the results. This is directly passed to MustBeOwnedByCaller parameter for MTurk's ListQualificationTypes operation.
- `cached`: <span style="color:#999;">_Boolean_</span>
  - Whether to return cached value in the response. Note that setting this value to false may result in slower responses.

---

#### listTuttiHITBatches

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listTuttiHITBatchesWithHITs

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### listWorkers

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- [None]

---

#### notifyWorkers

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `subject`: 
- `message_text`: 
- `worker_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Worker IDs.

---

#### rejectAssignments

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `assignment_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Assignment IDs.
- `requester_feedback`: 

---

#### renameCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `credentials_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for registered MTurk credentials.
- `label`: 

---

#### sendBonus

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `worker_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Worker IDs.
- `bonus_amount`: 
- `assignment_ids`: <span style="color:#999;">_Array_</span>
  - List of MTurk Assignment IDs.
- `reason`: 

---

#### setActiveCredentials

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `credentials_id`: <span style="color:#999;">_String_</span>
  - Tutti's internal hash ID for registered MTurk credentials.

---

#### setActiveSandboxMode

<p style="padding-left:20px;"></p>

<h5 style="color:#666;">Parameters</h5>

- `is_sandbox`: <span style="color:#999;">_Boolean_</span>
  - Activation of Sandbox mode for MTurk credentials.

