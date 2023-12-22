class CamsCache {
    constructor(ttl) {
        this.cams = {};
        this.ttl = ttl;
    }

    isInCache(channel) {
        return channel in this.cams;
    }

    add(channel) {
        this.cams[channel] = true;
        setTimeout(() => {
            this.remove(channel);
        }, this.ttl)
    }

    remove(channel) {
        delete this.cams[channel];
    }
}
// 5 minutes ttl
const camsCache = new CamsCache(300000);
module.exports = camsCache;
