import { GanacheServer } from "./GanacheServer.js";

//
// Server
//

var ganacheServer;

export function startBlockchain(port, options) {
  ganacheServer = new GanacheServer(port, options);
  return ganacheServer.start();
}

export function stopBlockchain() {
  return new Promise(resolve => ganacheServer.close(resolve));
}
