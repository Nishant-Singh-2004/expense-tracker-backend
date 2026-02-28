const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    //   console.log("HEADERS RECEIVED:", req.headers);

    const header = req.headers.authorization;
    // checking if header exists
    if (!header) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = auth;
