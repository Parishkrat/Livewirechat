import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // get token from cookies
  const token = req.cookies.token;
  //if no token user is not logged in
  if (!token) {
    return res.status(401).json({ message: "NOt Authorized" });
  }
  try {
    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //save user ID for later use
    req.userID = decoded.id;
    //Allow request to continue
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};
