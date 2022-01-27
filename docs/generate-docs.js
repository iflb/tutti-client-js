const fs = require('fs');
const esprima = require('esprima');
const ctrl = require('../lib/controller.js');
const { defaultParamProfiles, methodProfiles } = require('./profiles.js')

function getParen(tokens, startIdx=0, start='{', end='}') {
    while(startIdx<tokens.length && tokens[startIdx].value!==start) startIdx++;
    let endIdx = 0;
    for(let i=startIdx; i<tokens.length; i++){
        i++;
        let parenCnt = 1;
        while(parenCnt > 0){
            if(tokens[i].value===start) parenCnt++;
            else if(tokens[i].value===end) parenCnt--;
            i++;
        }
        endIdx = i;
        break;
    }
    return tokens.slice(startIdx, endIdx);
}

function getClassCodeInModule(modulePath, className) {
    const tokens = esprima.tokenize(fs.readFileSync(modulePath).toString());
    let i=1;
    while(!(tokens[i-1].value==='class' && tokens[i].value===className)) i++;
    return getParen(tokens, i);
}

function parseMethodsAndParamsInController(tokens) {
    let i=0;
    let methodParams = {};
    while(tokens[i].value!=='_setMethods') i++;
    const setMethodsParen = getParen(tokens, i);
    for(let i=1; i<setMethodsParen.length; i++) {
        let methodName = setMethodsParen[i].value;
        if(methodName!=='}') {
            const paramsParen = getParen(setMethodsParen, i+1, '(', ')');
            const paramsBrace = getParen(paramsParen);
            let params = paramsBrace.length>0 ? paramsBrace.splice(1, paramsBrace.length-2).filter(a => a.value!==',').map(a => a.value) : [];
            let _params = [];
            for(let i=0; i<params.length; i++) {
                let _arg = {};
                if(params[i]==='...') {
                    _arg.name = params[i]+params[i+1];
                    i++;
                } else {
                    _arg.name = params[i];
                    if(params[i+1]==='=') {
                        _arg.default = params[i+2];
                        i += 2;
                    }
                }
                _params.push(_arg);
            }
            methodParams[methodName] = _params;
            const procParen = getParen(setMethodsParen, i+paramsParen.length+1);
            i += paramsParen.length + procParen.length + 1;
        } else {
            break;
        }
    }
    return methodParams;
}

let methodParams = {
    resource:
        parseMethodsAndParamsInController(
            getClassCodeInModule('../lib/controller.js', 'ResourceController')
        ),
    mturk:
        parseMethodsAndParamsInController(
            getClassCodeInModule('../lib/controller.js', 'MTurkController')
        ),
};





const headBody = fs.readFileSync('head-body.md');

let markDownText = headBody + '\n## Commands\n\n';

markDownText += `Current options for namespaces are: ${Object.keys(methodParams).map(ns => '**'+ns+'**').join(', ')}.\n\n`;

console.log('=== INSUFFICIENT INFORMATION ===');
for(let namespace of Object.keys(methodParams)) {
    console.log(`[${namespace}]`);
    let _methodParams = methodParams[namespace];
    for(let methodName of Object.keys(_methodParams)){
        _methodParams[methodName] = _methodParams[methodName].map(a => ({
            ...a,
            ...defaultParamProfiles.common[a.name],
            ...defaultParamProfiles[namespace][a.name],
            ...methodProfiles[namespace][methodName].parameters[a.name]
        }));
    }
    _methodParams = Object.fromEntries(Object.entries(_methodParams).sort(([a,],[b,]) => a > b ? 1 : -1));

    markDownText += `### TuttiClient.${namespace}\n`;
    
    Object.entries(_methodParams).forEach(([methodName,params]) => {
        const profile = methodProfiles[namespace][methodName];
        markDownText +=
`
---

#### ${methodName}

<p style="padding-left:20px;">${profile.description}</p>

<h5 style="color:#666;">Parameters</h5>\n
`;
        if(params.length === 0) {
            markDownText += '- [None]\n';
        } else {
            let insufficients = {};
            params.forEach(a => {
                insufficients[a.name] = [];
                let ins = insufficients[a.name];
                markDownText += `- \`${a.name}\`: `;
                if(a.type) markDownText += `<span style="color:#999;">_${a.type.name}_</span>`; else ins.push('type');
                if(a.default) markDownText += `, default ${a.default}`;
                markDownText += '\n';
                if(a.description) markDownText += `  - ${a.description}\n`; else ins.push('description');
            });
            if(Object.values(insufficients).flat().length > 0) {
                console.log(`+ ${methodName}:`);
                Object.entries(insufficients).forEach(([argName, ins]) => {
                    if(ins.length > 0) console.log(` - ${argName}\t(${ins})`);
                });
                console.log('');
            }
        }
        if(profile.returns) {
            markDownText += `\n<h5 style="color:#666;">Returns</h5>\n\n`;
            if(Array.isArray(profile.returns.data)) {
                markDownText += `- <span style="color:#999;">_Object_</span>`;
                if(profile.returns.data.description) markDownText += ` -- ${profile.returns.data.description}`;
                markDownText += `\n`;
                profile.returns.data.forEach(d => {
                    markDownText += `  - \`${d.name}\`: <span style="color:#999;">_${d.type.name}_</span>\n`;
                    if(d.description) markDownText += `    - ${d.description}\n`;
                });
            } else {
                markDownText += `- <span style="color:#999;">_${profile.returns.data.type.name}_</span>`;
                if(profile.returns.data.description) markDownText += ` -- ${profile.returns.data.description}`;
            }
        //} else {
        //    markDownText += '- [Nothing returned]';
        }
    });
    markDownText += '\n';
}

fs.writeFileSync('../README.md', markDownText);
