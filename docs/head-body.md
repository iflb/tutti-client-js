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
