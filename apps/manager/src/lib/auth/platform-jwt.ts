import { SignJWT, jwtVerify } from "jose";
import { SESSION_TIMEOUTS } from "../constants";

export type PlatformJwtPayload = {
  userId: string;
  role: "super_admin" | "support_staff";
  type: "access" | "refresh";
};

function getSecretKey() {
  const secret = process.env.PLATFORM_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("PLATFORM_JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function signToken(payload: PlatformJwtPayload, ttlSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getSecretKey());
}

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });

  const userId = payload.userId;
  const role = payload.role;
  const type = payload.type;

  if (typeof userId !== "string") {
    throw new Error("Invalid token");
  }
  if (role !== "super_admin" && role !== "support_staff") {
    throw new Error("Invalid token role");
  }
  if (type !== "access" && type !== "refresh") {
    throw new Error("Invalid token type");
  }

  return { userId, role, type } as PlatformJwtPayload;
}

export async function signPlatformAccessToken(
  payload: Omit<PlatformJwtPayload, "type">,
) {
  return signToken({ ...payload, type: "access" }, SESSION_TIMEOUTS.accessToken);
}

export async function verifyPlatformAccessToken(token: string) {
  const payload = await verifyToken(token);
  if (payload.type !== "access") {
    throw new Error("Expected access token");
  }
  return payload;
}
