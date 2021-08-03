const tutti = require('../lib/tutti.js');

let duct = new tutti.Duct()
duct.open('http://localhost:8888/ducts/wsd').then( (duct) => {
    duct.setEventHandler(duct.EVENT.JOB_GROUP, (rid,eid,data) => {
        console.log(data);
    });
    duct.eventListeners.resource.on('listProjects', {
        success: (data) => {
            console.log(data);
        },
        error: () => {}
    });
    duct.controllers.resource.listProjects();
    duct.send(duct.nextRid(), duct.EVENT.JOB_GROUP, null);
});
