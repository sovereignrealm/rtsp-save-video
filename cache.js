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

const { CACHING_TIME } = process.env;
// ttl in miliseconds
const camsCache = new CamsCache(+CACHING_TIME);
module.exports = camsCache;
