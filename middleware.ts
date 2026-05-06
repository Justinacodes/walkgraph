export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/organizations/:path*",
    "/api/floors/:path*",
    "/api/nodes/:path*",
    "/api/edges/:path*",
    "/api/qr/:path*",
  ],
};
