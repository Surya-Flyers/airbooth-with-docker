import { throwError } from "../../../services/error.js";
import jwt from "jsonwebtoken";

export async function iamAuthMiddleware(request, response, next) {
  console.log("Header : ", request.headers);
  let authorization = request.headers.authorization;
  if (
    typeof authorization !== "string" ||
    (typeof authorization === "string" && !authorization.includes("Bearer"))
  ) {
    throwError("Authentication Failed");
  }

  authorization = authorization.replace("Bearer ", "");

  console.log("authorization : ", authorization);
  const decodedToken = jwt.verify(authorization, "123456");

  request.headers.auth = {
    ...decodedToken,
  };

  console.log("decodedToken : ", decodedToken);

  next();
}
