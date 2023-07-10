import { logError } from "../../services/error";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

export async function updatePassword_controller(request, response) {
  try {
    // const result = await getPassportDetailsThroughScan();
    // response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function signIn_controller(request, response) {
  try {
    const { email, password } = request.body;
    const encryptedPassword = await hash(password, 10);
    const token = sign({ email: email }, "flyers@123", {
      expiresIn: "2h",
    });
    response.json({ token: token });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
