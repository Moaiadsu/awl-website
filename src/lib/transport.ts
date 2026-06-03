// ConnectRPC transport for the AWL admin dashboard.
// Uses gRPC-Web so the browser can call the Go backend directly —
// no Envoy proxy needed (ConnectRPC handles gRPC-Web natively).
//
// Run `make generate` from awl-mobile/ once to produce src/gen/*.

import { createConnectTransport } from "@connectrpc/connect-web";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const transport = createConnectTransport({
  baseUrl,
  // Uses the Connect binary protocol over HTTP/1.1 for browser compat.
  // Switch to "grpc-web" if you need raw gRPC-Web framing.
  useBinaryFormat: true,
});
