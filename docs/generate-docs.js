const fs = require('fs');
const esprima = require('esprima');
const ctrl = require('../lib/controller.js');
const { defaultArgs } = require('./profiles.js')

const methods = {
    resource: Object.getOwnPropertyNames(new ctrl.ResourceController()).filter(m => !m.startsWith('_')),
    mturk: Object.getOwnPropertyNames(new ctrl.MTurkController()).filter(m => !m.startsWith('_')),
};

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

function parseMethodsAndArgsInController(tokens) {
    let i=0;
    let methodArgs = {};
    while(tokens[i].value!=='_setMethods') i++;
    const setMethodsParen = getParen(tokens, i);
    for(let i=1; i<setMethodsParen.length; i++) {
        let methodName = setMethodsParen[i].value;
        if(methodName!=='}') {
            const argsParen = getParen(setMethodsParen, i+1, '(', ')');
            const argsBrace = getParen(argsParen);
            let args = argsBrace.length>0 ? argsBrace.splice(1, argsBrace.length-2).filter(a => a.value!==',').map(a => a.value) : [];
            let _args = [];
            for(let i=0; i<args.length; i++) {
                let _arg = {};
                if(args[i]==='...') {
                    _arg.name = args[i]+args[i+1];
                    i++;
                } else {
                    _arg.name = args[i];
                    if(args[i+1]==='=') {
                        _arg.default = args[i+2];
                        i += 2;
                    }
                }
                _args.push(_arg);
            }
            methodArgs[methodName] = _args;
            const procParen = getParen(setMethodsParen, i+argsParen.length+1);
            i += argsParen.length + procParen.length + 1;
        } else {
            break;
        }
    }
    return methodArgs;
}

let methodArgs = {
    'Resource':
        parseMethodsAndArgsInController(
            getClassCodeInModule('../lib/controller.js', 'ResourceController')
        ),
    'MTurk':
        parseMethodsAndArgsInController(
            getClassCodeInModule('../lib/controller.js', 'MTurkController')
        ),
};

let markDownText = '';

for(let type of Object.keys(methodArgs)) {
    let _methodArgs = methodArgs[type];
    for(let methodName of Object.keys(_methodArgs)){
        _methodArgs[methodName] = _methodArgs[methodName].map(a => ({ ...a, ...defaultArgs.mturk[a.name] }));
    }
    _methodArgs = Object.fromEntries(Object.entries(_methodArgs).sort(([a,],[b,]) => a > b ? 1 : -1));

    markDownText += `### ${type}\n`;
    
    Object.entries(_methodArgs).forEach(([methodName,args]) => {
        markDownText +=
`
---

#### ${methodName}

Hogehoge description.

##### Argument Keys\n\n
`;
        if(args.length === 0) {
            markDownText += '- [None]\n';
        } else {
            args.forEach(a => {
                markDownText += `- \`${a.name}\``;
                if(a.type) markDownText += ` (_${a.type}_)`;
                if(a.default) markDownText += `default: ${a.default}`;
                markDownText += '\n';
                if(a.description) markDownText += `  - ${a.description}\n`;
            });
        }
    });
    markDownText += '\n';
}

fs.writeFileSync('hoge.md', markDownText);
