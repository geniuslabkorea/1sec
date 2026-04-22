import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";

export function signToken(payload: { userId: string; phone: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: string; phone: string };
}
