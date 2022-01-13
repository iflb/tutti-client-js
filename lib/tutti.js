const MessagePack = require("what-the-pack");
const ducts = require("@iflb/ducts-client");
const { ThisBound } = require("@iflb/lib");
const { ResourceEventListener, MTurkEventListener } = require('./listener.js')
const { ResourceController, MTurkController } = require('./controller.js')

class TuttiClient extends ThisBound {
    constructor(setLogger = false) {
        super();

        this._duct = new ducts.Duct();
        this._duct.logger = setLogger ? new DuctEventLogger() : null;
        this._opened = false;
        this._invokeOnOpenHandlers = [];

        this.accountInfo = {
            userName: null,
            userId: null,
            accessToken: null,
        };
        this.logger = this._duct.logger;

        this._duct.invokeOnOpen(async () => {
            this.resource = new ResourceController(this._duct);
            this.resource.on = (new ResourceEventListener(this._duct)).on;
            this.resource._accessToken = this.accountInfo.accessToken;

            this.mturk = new MTurkController(this._duct);
            this.mturk.on = (new MTurkEventListener(this._duct)).on;
            this.mturk._accessToken = this.accountInfo.accessToken;

            this.connection = this._duct._connectionListener;

            const wsd = await this.resource.getWebServiceDescriptor();
            this.ENUM = wsd.enums;
            this.ERROR = wsd.enums.errors;

            this.resource.on('signIn', {
                success: (data) => { this._setAccountInfo(data); }
            });
            this.resource.on('signOut', {
                success: (data) => { this._deleteAccountInfo(); }
            });

            this._opened = true;
            this._invokeOnOpenHandlers.forEach((f) => { f(); });
        });
    }

    async open(self, wsdPath) {
        self._duct = self._duct || new ducts.Duct();
        await self._duct.open(wsdPath);
    }

    reconnect(self) { self._duct.reconnect(); }

    close(self) { self._duct.close(); }

    invokeOnOpen(self, f) {
        if(self._opened) f();
        else self._invokeOnOpenHandlers.push(f);
    }

    _setAccountInfo(self, data) {
        self.accountInfo.userName = data.user_name;
        self.accountInfo.userId = data.user_id;
        self.accountInfo.accessToken = data.access_token;
    }

    _deleteAccountInfo(self) {
        self.accountInfo.userName = null;
        self.accountInfo.userId = null;
        self.accountInfo.accessToken = null;
    }

    get state() {
        return this._duct ? this._duct.state : ducts.State.CLOSE;
    }
}

class DuctEventLogger extends ThisBound {
    constructor(duct, dataSizeLimit) {
        super();
        this._duct = duct;
        this._log = {};
        this._orderedLog = [];
        this.dataSizeLimit = dataSizeLimit || 3000;
    }

    addSent(self, id, label, data) {
        self._log[id] = {
            id,
            label,
            sent: {
                content: self._skipLargeData(data),
                timestamp: new Date()
            },
            received: []
        };
        self._orderedLog.push(self._log[id]);
    }

    addReceived(self, id, label, data) {
        if(!(id in self._log))
            return;

        if(self._log[id].label != label)
            console.error(`event name ${label} does not correspond to the log`);

        const _data = JSON.parse(JSON.stringify(data));
        _data.content = self._skipLargeData(_data.content);
        _data.timestamp = new Date();

        self._log[id].received.push(_data);
    }

    _skipLargeData(self, data) {
        if(data) {
            let newData = JSON.stringify(data);
            if(newData.length>self.dataSizeLimit) return '[log skipped]';
            else return JSON.parse(newData);
        } else {
            return data;
        }
    }

    get log() {
        return this._orderedLog;
    }
}

module.exports = {
    TuttiClient
}
