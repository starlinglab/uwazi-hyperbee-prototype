<!-- Download attestation to personal hyperbee modal -->

<script>
  import Button from "./Button.svelte";
  import { hyperbeeJWT, hyperbeeSources } from "./store.js";

  export let data;
  export let fileCid;

  let downloadDialog; // Element

  export function showModal() {
    downloadDialog.showModal();
    // Reset view
    downloadDialog.querySelector("#dl-server-form").style.display = "block";
    downloadDialog.querySelector("#dl-server-info").style.display = "none";
    // Disable default input focus which looks bad
    downloadDialog.querySelector("#dl-server-0").blur();
  }

  async function downloadFormSubmit(e) {
    const formData = new FormData(e.target);

    // Show info text in dialog now
    downloadDialog.querySelector("#dl-server-form").style.display = "none";
    downloadDialog.querySelector("#dl-server-info").style.display = "block";
    const text = downloadDialog.querySelector("#dl-server-info-text");
    text.innerText = "Loading...";

    const body = IpldDagCbor.encode({
      value: data.attestation.value,
      encKey: false,
    });
    try {
      if (!formData.get("dl-servers")) {
        throw new Error("somehow no server was chosen");
      }

      const res = await fetch(
        new URL(
          fileCid + "/" + data.attestation.attribute,
          formData.get("dl-servers")
        ),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/cbor",
            Authorization: "Bearer " + $hyperbeeJWT,
          },
          body: body,
        }
      );
      if (!res.ok) {
        throw new Error("Network response was not ok: " + res.status);
      }
    } catch (error) {
      console.error(error);
      text.innerText = error;
      return;
    }
    // Success
    text.innerText =
      "Successfully sent attestation to chosen hyperbee. Reload to see updated attestation.";
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog bind:this={downloadDialog} on:click|self={() => downloadDialog.close()}>
  <div id="dl-server-form" on:click|stopPropagation>
    <div id="dl-server-title">Send data to</div>
    <form on:submit|preventDefault={downloadFormSubmit}>
      <div id="dl-server-sources">
        {#each $hyperbeeSources as { name, server }, i}
          <div style:width="max-content">
            <input
              type="radio"
              id={`dl-server-${i}`}
              name="dl-servers"
              value={server}
              checked={i === 0 || null}
            />
            <label for={`dl-server-${i}`}>{name} (<code>{server}</code>)</label>
          </div>
        {/each}
      </div>
      <div id="dl-server-button">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  </div>
  <div id="dl-server-info" style="display: none">
    <div id="dl-server-info-text" />
  </div>
</dialog>

<style>
  @import "./modal.css" scoped;

  #dl-server-title {
    margin: 0.5em;
    font-weight: bold;
    text-align: center;
    font-size: 1.2em;
  }
  #dl-server-sources {
    margin: 1em 0.5em;
  }
  #dl-server-button {
    text-align: center;
  }
  #dl-server-info-text {
    margin: 0.5em;
    text-align: center;
  }
  code {
    /* For Uwazi */
    font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console,
      monospace;
    margin: unset;
    padding: unset;
    position: unset;
  }
</style>
