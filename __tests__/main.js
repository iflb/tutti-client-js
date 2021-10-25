const { TuttiClient } = require('../lib/tutti');
let client = new TuttiClient(false);
const wsdPath = 'http://localhost:8080/ducts/wsd';

const ACCOUNT = {
    userName: 'jest',
    password: 'jestpass'
};

const PROJECT = {
    name: 'JestProject',
    templateNamePrefix: 'JestProjectTemplate'
};

async function resetAll() {
    await openClient();
    try { await deleteTestProject(); } catch {}
    await deleteAccount();
    await closeClient();
}

async function openClient() { return await client.open(wsdPath); }
async function closeClient() { return await client.close(); }
async function createTestProject() { 
    return await client.resource.createProject({
            project_name: PROJECT.name
        });
}
async function deleteTestProject() { 
    return await client.resource.deleteProject({
            project_name: PROJECT.name
        });
}
async function signIn() {
    return await client.resource.signIn({
            user_name: ACCOUNT.userName,
            password: ACCOUNT.password
        });
}
async function signOut() {
    return await client.resource.signOut()
}
async function deleteAccount() { 
    try {
        const res = await client.resource.signIn({ user_name: ACCOUNT.userName, password: ACCOUNT.password });
        await client.resource.deleteAccount({
            user_id: res.user_id
        });
    } catch {}
}


beforeAll(resetAll);
afterAll(resetAll);

beforeEach(async () => { await openClient(); });
afterEach(async () => { await closeClient(); });

test('Authentication: sign up, sign in, get user IDs, sign out, delete account',
    async() => {
        const res = await client.resource.signUp({
            user_name: ACCOUNT.userName,
            password: ACCOUNT.password
        });
        await client.resource.signIn({
            user_name: ACCOUNT.userName,
            password: ACCOUNT.password
        });
        const userIds = await client.resource.getUserIds();
        expect(userIds.includes(res.user_id)).toBe(true);
    }
);
    

test('Connection: open, close', async () => {});

test(
    'Project: create, list, delete',
    async () => {
        const projectName = await createTestProject();
        expect(projectName).toBe(PROJECT.name);

        const projects = await client.resource.listProjects();
        expect(projects.some((prj) => (prj.name===PROJECT.name))).toBe(true)

        await deleteTestProject();
    }
);

test(
    'Template: list presets, create, list, delete',
    async () => {
        await createTestProject();

        const presets = await client.resource.listTemplatePresets({
            project_name: PROJECT.name
        });
        expect(Array.isArray(presets)).toBe(true);
        expect(
            presets.every((preset) => (Array.isArray(preset) && preset.length===2))
        ).toBe(true);

        presets.forEach(async (preset,i) => {
            await client.resource.createTemplate({
                project_name: PROJECT.name,
                template_name: `${PROJECT.templateNamePrefix}${i}`,
                preset_group_name: preset[0],
                preset_name: preset[1]
            });
        });

        const templateNames = await client.resource.listTemplates({
                project_name: PROJECT.name
            });
        expect(
            presets.every((preset,i) => (templateNames.includes(`${PROJECT.templateNamePrefix}${i}`)))
        ).toBe(true);

        templateNames.forEach(async (name,i) => {
            await client.resource.deleteTemplate({
                project_name: PROJECT.name,
                template_name: name,
            });
        });

        await deleteTestProject();
    }
)
