<!-- Shared styling for buttons -->

<script>
  export let border = false;
  export let type = "button";
  export let disabled = false;
</script>

<button
  autocomplete="off"
  on:click
  {type}
  class:border
  class:disabled
  disabled={disabled || null}><slot /></button
>

{#if import.meta.env.PROD}
  <style>
    button {
      font-size: 0.85em !important;
    }
  </style>
{/if}

<style>
  button {
    text-transform: uppercase;
    color: var(--theme1);
    font-weight: bold;
    display: inline-block;
    border: none;
    background-color: transparent;
    border-radius: 0.3em;
    padding: 0.5em;
    cursor: pointer;
  }
  button:hover:not(.disabled) {
    background-color: var(--theme1-hover);
  }
  button:active:not(.disabled) {
    background-color: var(--theme1-active);
    color: white;
  }
  button.border {
    border: 2px solid var(--theme-border);
  }
  button.disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
