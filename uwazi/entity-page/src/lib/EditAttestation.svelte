<script>
  import { onMount } from "svelte";
  import Button from "./Button.svelte";
  import DownloadDialog from "./DownloadDialog.svelte";

  export let data;
  export let fileCid;

  let textarea;
  let downloadDialog;

  let disabled;
  let disabledReason;

  $: if (data) {
    if (data.attestation.encrypted) {
      disabled = true;
      data.attestation.value = "encrypted data";
    } else if (data.attestation.value.toString() === "[object Object]") {
      disabled = true;
      data.attestation.value = "object data";
    }
  }

  /**
   * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
   *
   * @param {String} text The text to be rendered.
   * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
   *
   * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  function getTextWidth(text, font) {
    // re-use canvas object for better performance
    const canvas =
      getTextWidth.canvas ||
      (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }

  function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
  }

  function getCanvasFont(el = document.body) {
    const fontWeight = getCssStyle(el, "font-weight") || "normal";
    const fontSize = getCssStyle(el, "font-size") || "16px";
    const fontFamily = getCssStyle(el, "font-family") || "Times New Roman";
    return `${fontWeight} ${fontSize} ${fontFamily}`;
  }

  function setTextareaSize(elem) {
    const lineHeight = 20; // in px, from CSS

    const newlines = (elem.value.match(/\n/g) || []).length;
    elem.style.height = `${(newlines + 1) * lineHeight}px`;

    if (newlines != 0) {
      return;
    }
    // Only one line of text, but it might be wrapped

    const textWidth = getTextWidth(elem.value, getCanvasFont(elem));
    const styles = getComputedStyle(elem);
    const elemContentWidth =
      elem.clientWidth -
      parseFloat(styles.paddingLeft) -
      parseFloat(styles.paddingRight);

    if (textWidth > elemContentWidth) {
      // Wrapping happens. For now just show two lines instead of calculating full size
      elem.style.height = `${2 * lineHeight}px`;
    }
  }

  onMount(() => {
    setTextareaSize(textarea);
  });
</script>

<div id="container">
  <h2>{data.attestation.attribute}</h2>
  <div id="input">
    <textarea
      bind:this={textarea}
      bind:value={data.attestation.value}
      {disabled}
      class:disabled
      on:input={(e) => {
        setTextareaSize(e.target);
      }}
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
    />
  </div>
  <div id="button">
    <Button
      {disabled}
      on:click={() => {
        if (!disabled) {
          downloadDialog.showModal();
        }
      }}>Save</Button
    >
  </div>
</div>

<DownloadDialog bind:this={downloadDialog} {data} {fileCid} />

<style>
  #container {
    margin: 1em 0;
    padding: 1em;
    border: 2px solid var(--theme-border);
  }
  h2 {
    margin-top: 0;
  }
  #input {
    display: flex;
    padding: 0.5em 1em;
    background-color: #ededed;
    border-bottom: 1px solid black;
  }
  textarea {
    background-color: transparent;
    border: 0;
    width: 100%;
    height: 1em;
    display: block;
    overflow: hidden;
    line-height: 20px;
    resize: vertical;
  }
  textarea.disabled {
    font-style: italic;
    resize: none;
  }
  #button {
    margin-top: 1em;
    text-align: right;
  }
</style>
