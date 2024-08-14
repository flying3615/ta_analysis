export default class {
  constructor() {
    this.onmessage = null;
  }

  postMessage(msg) {
    if (this.onmessage) {
      this.onmessage({ type: "ECHO", payload: msg });
    }
  }

  terminate() {
    // noop
  }
}
