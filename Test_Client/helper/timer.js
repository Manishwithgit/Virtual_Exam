function extendTimeout(req, res, next) {
    res.setTimeout(480000, function () {
        console.log("Time out occured");
    });
    next();
}

module.exports = extendTimeout;