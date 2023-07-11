import "./app.css";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("hyperbee-entity-page-app"),
  props: {
    // Replace with Uwazi file upload name for the file "sw.js" provided in the repo
    REPLAYWEB_SW_FILENAME: "1686854119383k87q2hyjd7a.js",
  },
});

export default app;
