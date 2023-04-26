import ganache from 'ganache-cli';


export class GanacheServer {

  constructor(port, options = {}) {
    this.port = port;
    this.server = ganache.server(options);
  }

  start() {
    this.server.listen(this.port);
  }

  close(callback) {
    this.server.close(callback);
}

}
