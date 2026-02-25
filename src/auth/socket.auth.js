import jwt from "jsonwebtoken";

export const socketAuth = (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRETE);
      socket.user = decoded;
      // console.log(socket.user);
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
};