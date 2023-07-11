<!--
SPV5: Authenticated data graph of verification records

Displays a directed graph of relations for the current asset.

Vis docs:
- https://visjs.github.io/vis-network/docs/network/
- https://visjs.github.io/vis-network/examples/
- https://visjs.github.io/vis-data/data/dataset.html
-->

<script>
  import { hyperbeeSources } from "./store.js";

  // See graphData variable in App.svelte for schema
  export let data;

  // CID string of current asset
  export let mainCid;

  // Color edges according to the source that defined them
  const sourceColors = {
    // Monokai, re-ordered
    0: "#ff6188",
    1: "#ab9df2",
    2: "#fc9867",
    3: "#ffd866",
    4: "#a9dc76",
    5: "#78dce8",
  };

  // Process data

  let nodes = new vis.DataSet();
  let edges = new vis.DataSet();

  for (const [cid, relations] of Object.entries(data)) {
    // cid variable is a string, but all others are CID objects.

    nodes.update({ id: cid, label: cid });

    if (relations.children) {
      for (const [source, sourceData] of Object.entries(relations.children)) {
        for (const [childType, children] of Object.entries(sourceData)) {
          for (const child of children) {
            nodes.update({
              id: child.toString(),
              label: child.toString(),
            });
            if (!edges.get(`children-${childType}-${cid}-${child}`)) {
              // Only add edge if it doesn't already exist
              edges.update({
                id: `children-${childType}-${cid}-${child}`,
                from: cid,
                to: child.toString(),
                label: `<b>${childType}</b>`,
                color: source < 6 ? sourceColors[source] : "grey",
              });
            }
          }
        }
      }
    }
    if (relations.parents) {
      for (const [source, sourceData] of Object.entries(relations.parents)) {
        for (const [parentType, parents] of Object.entries(sourceData)) {
          for (const parent of parents) {
            nodes.update({
              id: parent.toString(),
              label: parent.toString(),
            });
            if (!edges.get(`parents-${parentType}-${parent}-${cid}`)) {
              // Only add edge if it doesn't already exist
              edges.update({
                id: `parents-${parentType}-${parent}-${cid}`,
                from: parent.toString(),
                to: cid,
                label: `\n\n<b>${parentType}</b>`,
                color: source < 6 ? sourceColors[source] : "grey",
              });
            }
          }
        }
      }
    }
  }

  // Add color to main CID to highlight it
  nodes.update({
    id: mainCid,
    label: mainCid,
    color: "black",
    font: { color: "white" },
  });

  // Create a network
  let container; // div Element
  $: if (container) {
    let network = new vis.Network(
      container,
      { nodes, edges },
      {
        layout: {
          hierarchical: {
            enabled: true,
            direction: "UD",
            sortMethod: "directed",
            nodeSpacing: 450, // Right size for CID text width
          },
        },
        physics: {
          enabled: false,
        },
        edges: {
          smooth: {
            enabled: true,
            type: "dynamic",
          },
          arrows: {
            to: {
              enabled: true,
            },
          },
          color: "grey",
          font: { color: "black", align: "horizontal", multi: "html" },
          labelHighlightBold: false,
          width: 4,
        },
        nodes: {
          shape: "box",
          color: "grey",
          font: { color: "white" },
        },
      }
    );
  }
</script>

<div id="container">
  <p>
    Source colors:
    {#each $hyperbeeSources as { name, server }, i}
      <span
        class="legend"
        style:background-color={sourceColors[i]}
        style:border-color={sourceColors[i]}>{name}</span
      >&nbsp;
    {/each}
  </p>
  <div bind:this={container} id="vis-container" />
</div>

<style>
  #container {
    display: flex;
    height: 100%;
    width: 100%;
    flex-direction: column;
  }
  #vis-container {
    flex-grow: 1;
    display: block;
    width: 100%;
    height: calc(100% - 2em);
  }
  .legend {
    border-radius: 0.3em;
    padding: 0.1em;
    border: 2px solid var(--theme-border);
    display: inline-block;
  }
  p {
    height: 2em;
    margin-left: 1em;
  }
</style>
