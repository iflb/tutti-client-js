# JavaScript client SDK for Tutti.ai

## Dependency

- [DUCTS (@iflb/ducts)](https://www.npmjs.com/package/@iflb/ducts)

## Installation

```
npm install @iflb/tutti
```

## Importing Module

For web (browser, using CDN):

```html
<script src="https://unpkg.com/@iflb/tutti/dist/tutti.min.js" />
<script>
  var duct = new tutti.TuttiDuct();
</script>
```

For Node.js (server):

```javascript
const tutti = require("@iflb/tutti");
var duct = new tutti.TuttiDuct();
```

## Usage

For example, to obtain a list of your Tutti projects:

```javascript
var duct = new tutti.TuttiDuct();

duct.open("https://{your tutti domain}/ducts/wsd").then( (duct) => {   // Open a connection to Tutti server
  duct.eventListeners.resource.on("listProject", {
    success: (data) => {
      // do anything here
      
      // data = {
      //   Contents: {
      //     ...
      //   },
      //   Timestamp: {
      //     "Requested": int,
      //     "Responded": int
      //   }
      // }
    },
    error: (data) => {
      // handle error here
      
      // data = {
      //   Status: "Error",
      //   Reason: str,
      //   Timestamp: {
      //     "Requested": int,
      //     "Responded": int
      //   }
      // }
    }
  };
  
  duct.controllers.resource.listProject();
});
```

## Handling Events with Event Listeners

`duct.eventListeners.{source}.on("{method}", handlers)`

## Executing Methods with Controllers

`duct.controllers.{source}.{method}([ ... args])`

## Sources

- `resource` ... Tutti-relevant resources (projects, templates, nanotasks, answers, ...)
- `mturk` ... Amazon Mechanical Turk-relevant operations (wrapper methods for [Python Boto3 MTurk API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/mturk.html))

## Methods

### Resource

- **getEventHistory**
  - Parameters: None
- **setEventHistory**
  - Parameters: `eid`, `query` 
- **listProjects**
  - Parameters:  
- **createProject**
  - Parameters: `ProjectName` 
- **listTemplates**
  - Parameters: `ProjectName` 
- **getResponsesForTemplate**
  - Parameters: `ProjectName`, `TemplateName` 
- **getResponsesForNanotask**
  - Parameters: `NanotaskId` 
- **createTemplates**
  - Parameters: `ProjectName`, `TemplateNames`, `PresetEnvName`, `PresetTemplateName` 
- **listTemplatePresets**
  - Parameters: None
- **getProjectScheme**
  - Parameters: `ProjectName`, `Cached`
- **getNanotasks**
  - Parameters: `ProjectName`, `TemplateName`
- **deleteNanotasks**
  - Parameters: `ProjectName`, `TemplateName`, `NanotaskIds`
- **updateNanotaskNumAssignable**
  - Parameters: `ProjectName`, `TemplateName`, `NanotaskId`, `NumAssignable`
- **uploadNanotasks**
  - Parameters: `ProjectName`, `TemplateName`, `Nanotasks`, `NumAssignable`, `Priority`, `TagName`
- **getTemplateNode**
  - Parameters: `Target`, `WorkSessionId`, `NodeSessionId`
- **createSession**
  - Parameters: `ProjectName`, `PlatformWorkerId`, `ClientToken`, `Platform`
- **setResponse**
  - Parameters: `WorkSessionId`, `NodeSessionId`, `Answers`
- **checkPlatformWorkerIdExistenceForProject**
  - Parameters: `ProjectName`, `Platform`, `PlatformWorkerId`
  
### MTurk

- **getCredentials**
  - Parameters: 
- **setCredentials**
  - Parameters: `AccessKeyId`, `SecretAccessKey`
- **setSandbox**
  - Parameters: Enabled
- **clearCredentials**
  - Parameters: 
- **deleteQualifications**
  - Parameters: `QualificationTypeIds`
- **listQualifications**
  - Parameters:
- **listWorkersWithQualificationType**
  - Parameters: `QualificationTypeId`
- **createQualification**
  - Parameters: `QualificationTypeParams`
- **associateQualificationsWithWorkers**
  - Parameters: `AssociateQualificationParams`
- **listWorkers**
  - Parameters: 
- **notifyWorkers**
  - Parameters: `Subject`, `MessageText`, `SendEmailWorkerIds`
- **createHITType**
  - Parameters: `CreateHITTypeParams`, `HITTypeQualificationTypeId`
- **createHITsWithHITType**
  - Parameters: `ProjectName`, `NumHITs`, `CreateHITsWithHITTypeParams`
- **getHITTypes**
  - Parameters: `HITTypeIds`
- **expireHITs**
  - Parameters: `HITIds`
- **deleteHITs**
  - Parameters: `HITIds`
- **listHITs**
  - Parameters: `Cached`
- **listHITsForHITType**
  - Parameters: `HITTypeId=null`, `Cached=true`
- **listAssignments**
  - Parameters: `Cached`
- **listAssignmentsForHITs**
  - Parameters: `HITIds`
- **approveAssignments**
  - Parameters: `AssignmentIds`, `RequesterFeedback`
- **rejectAssignments**
  - Parameters: `AssignmentIds`, `RequesterFeedback`
- **getAssignments**
  - Parameters: `AssignmentIds`
