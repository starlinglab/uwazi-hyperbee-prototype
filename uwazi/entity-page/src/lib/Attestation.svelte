<script>
  import { createEventDispatcher } from "svelte";

  import Button from "./Button.svelte";
  import Modal from "./Modal.svelte";
  import DownloadDialog from "./DownloadDialog.svelte";

  export let data;
  export let customTitle = "";
  export let signer = "";
  export let alts; // [{source, data}, ...]
  export let fileCid;

  const dispatch = createEventDispatcher();

  let showAttrModal = false;
  let attrModalPos = { x: 0, y: 0 };
  let attrIcon; // Element

  let showAltModal = false;
  let altModalPos = { x: 0, y: 0 };
  let attrTitle; // Element

  let downloadDialog; // Element

  function uint8ArrayToBase64(uint8Array) {
    let binaryString = "";
    uint8Array.forEach((byte) => {
      binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
  }

  function saveFile(filename, type, data) {
    const blob = new Blob([data], { type: type });
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    elem.style.display = "none";
    document.body.appendChild(elem);
    elem.click();
    setTimeout(function () {
      window.URL.revokeObjectURL(elem.href);
      document.body.removeChild(elem);
    }, 0);
  }

  function iconClick() {
    let rect = attrIcon.getBoundingClientRect();
    attrModalPos.x = rect.left + 10;
    attrModalPos.y = rect.top + 10;
    showAttrModal = true;
  }
  function attrTitleClick() {
    let rect = attrTitle.getBoundingClientRect();
    altModalPos.x = rect.left + 10;
    altModalPos.y = rect.top + 10;
    showAltModal = true;
  }

  function downloadClick() {
    if (data.attestation.encrypted) {
      return;
    }
    downloadDialog.showModal();
  }

  function isLargeData(value) {
    return value.toString() === "[object Object]";
  }

  function trimLarge(value) {
    let max = 100; // Long enough to be too wide and trigger CSS ellipsis
    let string = JSON.stringify(value);
    return string.length > max ? string.substring(0, max - 3) + "..." : string;
  }

  $: largeData = isLargeData(data.attestation.value);
</script>

<div id="container">
  <div id="text">
    <h2
      class="attr"
      bind:this={attrTitle}
      on:click={attrTitleClick}
      on:keydown={attrTitleClick}
    >
      {customTitle || data.attestation.attribute}
    </h2>
    <slot name="value">
      {#if data.attestation.encrypted}
        <span class="value encrypted">encrypted</span>
      {:else if largeData}
        <span class="value large">{trimLarge(data.attestation.value)}</span>
      {:else}
        <span class="value">{data.attestation.value}</span>
      {/if}
    </slot>
  </div>
  <div id="icons">
    <svg
      class="icon"
      bind:this={attrIcon}
      on:click={iconClick}
      on:keydown={iconClick}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
        d="M314.9 194.4v101.4h-28.3v120.5h-77.1V295.9h-28.3V194.4c0-4.4 1.6-8.2 4.6-11.3 3.1-3.1 6.9-4.7 11.3-4.7H299c4.1 0 7.8 1.6 11.1 4.7 3.1 3.2 4.8 6.9 4.8 11.3zm-101.5-63.7c0-23.3 11.5-35 34.5-35s34.5 11.7 34.5 35c0 23-11.5 34.5-34.5 34.5s-34.5-11.5-34.5-34.5zM247.6 8C389.4 8 496 118.1 496 256c0 147.1-118.5 248-248.4 248C113.6 504 0 394.5 0 256 0 123.1 104.7 8 247.6 8zm.8 44.7C130.2 52.7 44.7 150.6 44.7 256c0 109.8 91.2 202.8 203.7 202.8 103.2 0 202.8-81.1 202.8-202.8.1-113.8-90.2-203.3-202.8-203.3z"
      />
      <title>{signer}</title>
    </svg>
    <svg
      class:disabled={data.attestation.encrypted}
      on:click={downloadClick}
      on:keydown={downloadClick}
      class="icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      ><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
        d="M448 384H256c-35.3 0-64-28.7-64-64V64c0-35.3 28.7-64 64-64H396.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V320c0 35.3-28.7 64-64 64zM64 128h96v48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H256c8.8 0 16-7.2 16-16V416h48v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V192c0-35.3 28.7-64 64-64z"
      /></svg
    >
  </div>
</div>

<!-- Attribute modal from clicking on attribution icon -->
<Modal bind:showModal={showAttrModal} bind:pos={attrModalPos}>
  <span slot="title">
    <strong>{data.attestation.attribute}</strong>:
    {#if data.attestation.encrypted}
      <span class="encrypted">encrypted</span>
    {:else if largeData}
      <span class="large">{trimLarge(data.attestation.value)}</span>
    {:else}
      {data.attestation.value}
    {/if}
  </span>
  <div slot="content">
    <!-- Center align *block*, text is actually left aligned in child -->
    <div style="text-align: center;">
      <div id="attr-modal-content">
        <p>
          <strong>Source:</strong>
          {signer}
        </p>
        <p>
          <strong>Timestamp:</strong>
          {data.timestamp.submitted}
        </p>
        <p>
          <strong>Public Key:</strong>
          <code> {uint8ArrayToBase64(data.signature.pubKey)}</code>
        </p>
        <p><strong>Signature:</strong> ...</p>
        <p>
          <strong>Attestation CID:</strong>
          <code>{data.signature.signedMsg}</code>
        </p>
        <p><strong>Timestamping Proof:</strong> ...</p>
      </div>
    </div>
  </div>
  <span slot="buttons">
    <!-- svelte-ignore missing-declaration -->
    <Button
      on:click={() => {
        saveFile(
          data.attestation.attribute + ".cbor",
          "application/cbor",
          IpldDagCbor.encode(data)
        );
      }}>Export Attestation</Button
    >
    <Button>View Timestamp</Button>
  </span>
</Modal>

<!-- Alternative attribute values modal, from clicking on attribute title -->
<Modal bind:showModal={showAltModal} bind:pos={altModalPos}>
  <span slot="title"
    ><strong>Alternatives: {data.attestation.attribute}</strong></span
  >
  <div slot="content">
    <!-- First the current top priority signer -->
    <p class="alt-signer-name">{signer}</p>
    <p class="alt-value">
      {#if data.attestation.encrypted}
        <span class="encrypted">encrypted</span>
      {:else if largeData}
        <span class="large">{trimLarge(data.attestation.value)}</span>
      {:else}
        {data.attestation.value}
      {/if}
    </p>
    {#each alts as alt}
      <p class="alt-signer-name">{alt.source}</p>
      <p class="alt-value">
        {#if alt.data.attestation.encrypted}
          <span class="encrypted">encrypted</span>
        {:else if isLargeData(alt.data.attestation.value)}
          <span class="large">{trimLarge(alt.data.attestation.value)}</span>
        {:else}
          {alt.data.attestation.value}
        {/if}
      </p>
    {/each}
  </div>
  <span slot="buttons">
    <Button on:click={() => dispatch("changePage", { page: "sources" })}
      >Reprioritize Sources</Button
    >
  </span>
</Modal>

<!-- Download attestation to personal hyperbee modal -->
<DownloadDialog bind:this={downloadDialog} {data} {fileCid} />

{#if import.meta.env.PROD}
  <style>
    .attr {
      font-size: 1.4em !important;
    }
  </style>
{/if}

<style>
  #container {
    display: flex;
    margin: 1em 0;
  }
  #text {
    padding-right: 1em;
    word-break: break-word;
    min-width: 0; /* https://stackoverflow.com/a/12131365 */
  }
  #icons {
    margin: auto 0;
    margin-left: auto;
    min-width: max-content;
  }
  .attr {
    color: var(--theme1);
    margin: 0;
    text-decoration: underline;
    cursor: pointer;
    width: fit-content;
  }
  #icons > svg {
    cursor: pointer;
  }
  .value {
    color: var(--theme2);
  }
  .icon {
    color: var(--theme1);
  }
  .encrypted,
  .large {
    font-style: italic;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
    width: 100%;
  }
  .disabled {
    opacity: 0.3;
  }

  #attr-modal-content {
    word-break: break-all;
    /* Undo parent center-align */
    display: inline-block;
    text-align: left;
  }
  #attr-modal-content > p {
    margin: 0.2em 0;
  }

  .alt-signer-name {
    text-transform: uppercase;
    font-size: 0.8em;
    margin: 0.2em 0 0.4em 1ch;
  }
  .alt-value {
    margin-top: 0;
    margin-bottom: 2em;
    border-bottom: 2px solid var(--theme-border);
    padding-bottom: 0.5em;
    word-break: break-all;
  }
</style>
