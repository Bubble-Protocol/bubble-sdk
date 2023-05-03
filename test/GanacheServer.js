import ganache from 'ganache-cli';


export class GanacheServer {

  constructor(port, options = {}) {
    this.port = port;
    this.server = ganache.server(options);
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  close(callback) {
    this.server.close(callback);
}

}
