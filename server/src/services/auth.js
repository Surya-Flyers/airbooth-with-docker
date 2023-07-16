import jwt from "jsonwebtoken";

export async function createJwtToken({
  userId,
  email,
  claims = {},
  profileStatus = "",
}) {
  const token = jwt.sign(
    {
      user_id: userId,
      email: email,
      claims: claims,
      profileStatus: profileStatus,
    },
    "123456789",
    {
      expiresIn: "2h",
    }
  );
  return token;
}

export async function verifyToken({ token }) {
  const result = jwt.verify(token, "123456789");
  return result;
}
