<script>
  import Button from "./Button.svelte";
  import DownloadDialog from "./DownloadDialog.svelte";

  export let fileCid;

  // Elements
  let dialog;
  let downloadDialog;
  // Bind values
  let aattr;
  let avalue;

  export function showModal() {
    dialog.showModal();
    // Reset view
    dialog.querySelectorAll("input").forEach((elem) => {
      elem.value = "";
    });
    dialog.querySelectorAll("textarea").forEach((elem) => {
      elem.value = "";
      elem.setAttribute("style", ""); // Reset height
    });
    // Disable default input focus
    // dialog.querySelector("input").blur();
  }

  function formSubmit(e) {
    dialog.close();
    downloadDialog.showModal();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog bind:this={dialog} on:click|self={() => dialog.close()}>
  <div on:click|stopPropagation>
    <div id="title">New Attestation</div>
    <form on:submit|preventDefault={formSubmit}>
      <label for="new-attest-attr">Attribute:</label>
      <div class="input">
        <input
          id="new-attest-attr"
          type="text"
          name="attribute"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          bind:value={aattr}
        />
      </div>
      <label for="new-attest-val">Value:</label>
      <div class="input">
        <textarea
          id="new-attest-val"
          name="value"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          rows="2"
          bind:value={avalue}
        />
      </div>
      <div id="button">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  </div>
</dialog>

<DownloadDialog
  bind:this={downloadDialog}
  data={{ attestation: { attribute: aattr, value: avalue } }}
  {fileCid}
/>

<style>
  @import "./modal.css" scoped;

  #title {
    margin: 0.5em;
    font-weight: bold;
    text-align: center;
    font-size: 1.2em;
  }
  .input {
    padding: 0.5em 1em;
    background-color: #ededed;
    border-bottom: 1px solid black;
  }
  #button {
    text-align: right;
    margin-top: 1em;
  }
  input,
  textarea {
    background-color: transparent;
    border: 0;
    width: 100%;
  }
  textarea {
    resize: vertical;
    overflow: hidden;
  }
  dialog > div > form {
    margin: 0.5em;
  }
  label {
    margin: 0.5em 0;
    display: block;
    margin-top: 1.5em;
  }
  dialog {
    width: 30em;
    max-width: none;
  }
</style>
