<script>
  import EditAttestation from "./lib/EditAttestation.svelte";
  import Attestation from "./lib/Attestation.svelte";
  import Button from "./lib/Button.svelte";
  import Graph from "./lib/Graph.svelte";
  import Settings from "./lib/Settings.svelte";
  import { hyperbeeJWT, hyperbeeSources } from "./lib/store.js";
  import NewAttestation from "./lib/NewAttestation.svelte";

  /// Props ///

  export let REPLAYWEB_SW_FILENAME = "sw.js";

  /// Consts ///

  const dagCborURL =
    "https://cdn.jsdelivr.net/npm/@ipld/dag-cbor@9.0.3/dist/index.min.js";
  const replayWebURL = "https://cdn.jsdelivr.net/npm/replaywebpage@1.8.4/ui.js";
  const visURL =
    "https://cdn.jsdelivr.net/npm/vis-network@9.1.6/standalone/umd/vis-network.min.js";

  const DEBUG = import.meta.env.DEV;
  console.log("Debug status:", DEBUG);

  /// Setup funcs ///

  const isScriptAlreadyIncluded = (src) => {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++)
      if (scripts[i].getAttribute("src") === src) return true;
    return false;
  };

  const loadScript = async (url) => {
    return new Promise(function (resolve, reject) {
      if (!isScriptAlreadyIncluded(url)) {
        const script = document.createElement("script");
        script.onload = function () {
          console.log("script loaded");
          resolve();
        };
        script.src = url;
        document.head.appendChild(script);
      } else {
        console.log("script was already loaded.");
        resolve();
      }
    });
  };

  const loadData = async (sources, cid) => {
    let datas = [];
    for (var i = 0; i < sources.length; i++) {
      const resp = await fetch(`${sources[i].server}/${cid}`);
      if (!resp.ok) {
        errMsg = `failed to load data: ${resp.statusText}`;
        throw new Error("failed to load data");
      }
      datas.push(IpldDagCbor.decode(new Uint8Array(await resp.arrayBuffer())));
    }
    return datas;
  };

  /**
   * Walks through output of loadData, amalgamating entries from all sources.
   *
   * Returns an Array of the following:
   *
   *     {
   *       source: <hyperbee name>,
   *       attr: <attribute name>,
   *       data: <attestation data>,
   *       alts: [ // What other hyperbees have to say about this attr
   *         {source, data}
   *       ]
   *     }
   */
  const getDbEntries = (sources, datas) => {
    // Store already seen attribute names in a hashmap for O(1) checking
    const usedAttrs = {};
    const ret = [];
    for (var i = 0; i < sources.length; i++) {
      const hb = sources[i];
      if (Object.keys(datas[i]).length === 0) {
        continue;
      }
      for (const [attr, data] of Object.entries(datas[i])) {
        if (attr in usedAttrs) {
          // Add as alternate data
          ret[usedAttrs[attr]].alts.push({ source: hb.name, data });
        } else {
          // Store the index of the attribute in usedAttrs
          usedAttrs[attr] =
            ret.push({ source: hb.name, attr, data, alts: [] }) - 1;
        }
      }
    }
    return ret;
  };

  const reloadData = async (sources, cid) => {
    loading = true;
    errMsg = "";
    try {
      const datas = await loadData(sources, cid);
      dbEntries = getDbEntries(sources, datas);
      entityInfo = getEntityInfo(cid);
    } catch (e) {
      errMsg = e.toString();
      console.error(e);
      loading = false;
      return false;
    }
    loading = false;
    return true;
  };

  const getEntityInfo = (cid) => {
    if (cid === false || cid === ogEntityCid) {
      // Original page
      let entityHasAttachment = entity.attachments.length == 1;
      let isWacz =
        !entityHasAttachment ||
        entity.attachments[0].originalname.endsWith(".wacz");
      return {
        title: entity.title,
        hasAttachment: entityHasAttachment,
        cid:
          !entityHasAttachment ||
          (entity.metadata.sha256cid && entity.metadata.sha256cid.value) ||
          null,
        fileType:
          !entityHasAttachment ||
          (isWacz ? "application/wacz" : entity.attachments[0].mimetype),
        fileName: !entityHasAttachment || entity.attachments[0].originalname,
        fileSize: !entityHasAttachment || entity.attachments[0].size,
        fileUrl:
          !entityHasAttachment ||
          "/api/files/" + entity.attachments[0].filename,
        isWacz: isWacz,
      };
    }
    for (const ent of entities) {
      if (
        !("sha256cid" in ent.metadata) ||
        ent.metadata.sha256cid.length === 0
      ) {
        continue;
      }
      if (ent.metadata.sha256cid[0].value === cid) {
        let entityHasAttachment = ent.attachments.length == 1;
        let isWacz =
          !entityHasAttachment ||
          ent.attachments[0].originalname.endsWith(".wacz");
        return {
          title: ent.title,
          hasAttachment: entityHasAttachment,
          cid: cid,
          fileType:
            !entityHasAttachment ||
            (isWacz ? "application/wacz" : ent.attachments[0].mimetype),
          fileName: !entityHasAttachment || ent.attachments[0].originalname,
          fileSize: !entityHasAttachment || ent.attachments[0].size,
          fileUrl:
            !entityHasAttachment || "/api/files/" + ent.attachments[0].filename,
          isWacz: isWacz,
        };
      }
    }
    // No match found, return basic info
    return {
      title: "Unknown",
      hasAttachment: false,
      cid: cid,
    };
  };

  /// Variables ///

  let entity;
  if (import.meta.env.DEV) {
    // Example dataset
    entity = {
      sharedId: "wow65tfsa2",
      permissions: [
        {
          refId: "58ad7d240d44252fee4e6212",
          type: "user",
          level: "write",
        },
      ],
      obsoleteMetadata: [],
      user: "58ad7d240d44252fee4e6212",
      creationDate: 1683726145837,
      published: false,
      metadata: {
        sha256cid: {
          translateContext: "5bfbb1a0471dd0fc16ada146",
          _id: "645bda1524ec7d80e74731ea",
          label: "SHA256CID",
          type: "text",
          name: "sha256cid",
          indexInTemplate: 0,
          value: "bafybeifgkpgb7yqgjnovszaio7tzetmdfmigylr24hg6a76wnjxcnhkx54",
        },
      },
      attachments: [
        {
          _id: "645b9f413f4de0737494fa38",
          entity: "wow65tfsa2",
          type: "attachment",
          filename: "16837261456656tmwy4delgj.pdf",
          originalname: "Table Top Manual 4th Edition.pdf",
          mimetype: "application/pdf",
          size: 2652159,
          creationDate: 1683726145926,
        },
      ],
      documentType: "Document",
      __v: 0,
      relations: [],
      editDate: 1683741267794,
      title: "Test supporting PDF",
      documents: [],
      language: "en",
      template: "5bfbb1a0471dd0fc16ada146",
      _id: "645b9f413f4de0737494fa2c",
    };
  } else {
    // In prod Uwazi will set this variable
    // https://uwazi.readthedocs.io/en/latest/admin-docs/designing-your-website.html#exploring-your-datasets
    entity = datasets.entity;
  }

  let ogEntityCid;
  let entityInfo = getEntityInfo(false);
  ogEntityCid = structuredClone(entityInfo).cid;
  let fileCid = ogEntityCid;

  let entities = [];
  if (import.meta.env.PROD) {
    // Stores the result of an API search made using the <Query> component, see index.html
    // https://uwazi.readthedocs.io/en/latest/admin-docs/analysing-and-visualising-your-collection.html#query-component
    //
    // An array of objects in a SIMILAR format as the entity variable. "metadata" is different.
    entities = datasets.entities.rows;
  }

  // Names for different "pages" that can be viewed
  // Current avail. pages: entity, sources, cid, graph, edit
  let curPage = "entity";
  let prevPage = null;

  let loading = true;
  let errMsg = "";
  let fileObject; // <object> element

  let dbEntries;

  let sourcesListSuccess = null; // null means sources haven't been tested yet

  let newAttestation; // <NewAttestation> svelte component

  /// Main function ///

  (async () => {
    if (!entityInfo.hasAttachment) {
      errMsg = "No attachment for this entity";
      return;
    }
    if (!fileCid) {
      errMsg = "No CID set for this file";
      return;
    }

    // if ($hyperbeeSources.length === 0) {
    //   hyperbeeSources.set([
    //     {
    //       name: "Local Dev",
    //       server: "http://localhost:3001",
    //     },
    //     {
    //       name: "Local Dev 2",
    //       server: "http://localhost:3001",
    //     },
    //   ]);
    // }

    try {
      await loadScript(dagCborURL);
      await loadScript(visURL);
      if (entityInfo.isWacz) {
        await loadScript(replayWebURL);
      }
      await reloadData($hyperbeeSources, fileCid);
    } catch (e) {
      errMsg = e.toString();
      console.error(e);
    }
  })();

  /// Reactivity ///

  $: if (!loading && !errMsg && !entityInfo.isWacz && fileObject) {
    // Set the embedded file CSS based on the filetype
    // Images need max-width/height set so they scale to fit the container
    // PDFs, videos need explicit width and height
    // Everything else is given explicit width and height since that's probably
    // the option that will work best for most files overall.
    if (entityInfo.fileType.startsWith("image/")) {
      fileObject.style.maxWidth = "100%";
      fileObject.style.maxHeight = "100%";
    } else {
      fileObject.style.width = "100%";
      fileObject.style.height = "100%";
    }
  }

  /// Functions ///

  /*
  {
    "<cid>": {
      children: {
        <source num>: {
          "derived": [ CID(...), CID(...), ... ],
          "transcoded": [ CID(...), CID(...), ... ],
          "redacted": [ CID(...), CID(...), ... ],
          "verified": [ CID(...), CID(...), ... ],
          "related": [ CID(...), CID(...), ... ]
        },
        <source 2 num>: {
          "derived": [ CID(...), CID(...), ... ],
          "transcoded": [ CID(...), CID(...), ... ],
          "redacted": [ CID(...), CID(...), ... ],
          "verified": [ CID(...), CID(...), ... ],
          "related": [ CID(...), CID(...), ... ]
        }
      },
      parents: {
        // Same as children
      }
    },
    "<cid>": {
      // etc
    }
  }
  */
  let graphData;

  /**
   * Sets global graphData variable instead of returning anything.
   */
  const loadGraphData = async (sources, cid) => {
    errMsg = "";
    loading = true;
    graphData = {};

    const updateData = async (fcid) => {
      if (!(fcid in graphData)) {
        graphData[fcid] = { parents: {}, children: {} };
      }

      for (var i = 0; i < $hyperbeeSources.length; i++) {
        const hb = $hyperbeeSources[i];
        const resp = await fetch(`${hb.server}/${fcid}`);
        if (!resp.ok) {
          errMsg = `failed to load data: ${resp.statusText}`;
          loading = false;
          throw new Error("failed to load data");
        }
        const attests = IpldDagCbor.decode(
          new Uint8Array(await resp.arrayBuffer())
        );

        graphData[fcid].parents[i] =
          (attests.parents && attests.parents.attestation.value) || [];
        graphData[fcid].children[i] =
          (attests.children && attests.children.attestation.value) || [];
      }
    };

    // Walk the tree of CIDs
    // Start with the provided one
    await updateData(cid);

    // Limit to depth of 3 (2 + 1 level already done)
    for (let i = 0; i < 2; i++) {
      for (const [cid, relations] of Object.entries(graphData)) {
        // Parents
        for (const [source, sourceData] of Object.entries(relations.parents)) {
          for (const [parentType, parents] of Object.entries(sourceData)) {
            for (let parent of parents) {
              parent = parent.toString();
              if (!graphData[parent]) {
                // Not processed yet
                await updateData(parent);
              }
            }
          }
        }
        // Children
        for (const [source, sourceData] of Object.entries(relations.children)) {
          for (const [childType, children] of Object.entries(sourceData)) {
            for (let child of children) {
              child = child.toString();
              if (!graphData[child]) {
                // Not processed yet
                await updateData(child);
              }
            }
          }
        }
      }
    }

    loading = false;
  };

  function humanFileSize(size) {
    // https://stackoverflow.com/a/20732091
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "KiB", "MiB", "GiB", "TiB"][i]
    );
  }

  /// Event handlers ///

  function handleChangePageMsg(event) {
    if (event.detail.page === "sources") {
      // Reset back to unknown state
      sourcesListSuccess = null;
    } else if (event.detail.page === "cid") {
      // Load data for cid
      fileCid = event.detail.cid;
      // Async function, but running it in the background is fine since it
      // properly sets the loading variable and everything
      reloadData($hyperbeeSources, fileCid);

      if (fileCid === ogEntityCid) {
        // User has clicked back into the entity, so display the entity page instead
        prevPage = curPage;
        curPage = "entity";
        return;
      }
    } else if (event.detail.page === "graph") {
      // Async function, but running it in the background is fine since it
      // properly sets the loading variable and everything
      loadGraphData($hyperbeeSources, fileCid);
    }

    prevPage = curPage;
    curPage = event.detail.page;
  }

  function handlePrevPageMsg(event) {
    errMsg = "";
    if (prevPage) {
      curPage = prevPage;
    } else {
      curPage = "entity";
    }
    prevPage = null;
  }
</script>

<div id="top-container-6facc2a3">
  {#if loading && !errMsg}
    <p>Loading...</p>
  {/if}
  {#if errMsg}
    <p class="error">{errMsg}</p>
    {#if curPage === "entity" && entityInfo.hasAttachment && fileCid}
      <div id="error-button">
        <Button
          border={true}
          on:click={() => {
            errMsg = "";
            handleChangePageMsg({ detail: { page: "sources" } });
          }}>Edit Sources</Button
        >
      </div>
    {/if}
  {/if}

  {#if !loading}
    {#if (curPage === "entity" || curPage === "cid") && !errMsg}
      <div id="title-bar">
        <h1>{entityInfo.title}</h1>
      </div>
      <div id="container-6facc2a3">
        <div id="non-sidebar">
          <div id="file-info">
            {#if entityInfo.hasAttachment}
              <p id="top-file-text">
                {entityInfo.fileType.split("/")[1].toUpperCase()}
                <a href={entityInfo.fileUrl} target="_blank">
                  <svg
                    style="color: var(--theme1);"
                    class="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                      d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"
                    /></svg
                  >
                </a>
              </p>
              <p id="file-size">{humanFileSize(entityInfo.fileSize)}</p>
              <div id="embed-container">
                {#if entityInfo.isWacz}
                  <replay-web-page
                    source={`https://wacz.hyperbee.dev.starlinglab.org/${entityInfo.cid}`}
                    replayBase="/api/files/"
                    swName={REPLAYWEB_SW_FILENAME}
                  />
                {:else}
                  <object
                    bind:this={fileObject}
                    id="file-object"
                    title={entityInfo.fileName}
                    data={entityInfo.fileUrl}
                    type={entityInfo.fileType}
                  >
                    <span class="error">Failed to display file</span>
                    <style>
                      #embed-container {
                        background-color: var(--theme-border);
                      }
                    </style>
                  </object>
                {/if}
              </div>
            {:else}
              <p>No file information is available for this CID.</p>
            {/if}
            <p><strong>CID</strong> <code>{fileCid}</code></p>
          </div>
          <div id="bottom-buttons">
            <Button
              border={true}
              on:click={() => {
                handleChangePageMsg({ detail: { page: "edit" } });
              }}
            >
              <svg
                class="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                  d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"
                /></svg
              >
              Edit</Button
            >
            <Button border={true}>
              <svg
                class="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                  d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"
                /></svg
              >
              View Additional Metadata</Button
            >
            <Button
              border={true}
              on:click={() => {
                handleChangePageMsg({ detail: { page: "graph" } });
              }}
            >
              <svg
                class="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                  d="M0 80C0 53.5 21.5 32 48 32h96c26.5 0 48 21.5 48 48V96H384V80c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H432c-26.5 0-48-21.5-48-48V160H192v16c0 1.7-.1 3.4-.3 5L272 288h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H272c-26.5 0-48-21.5-48-48V336c0-1.7 .1-3.4 .3-5L144 224H48c-26.5 0-48-21.5-48-48V80z"
                /></svg
              >
              Graph</Button
            >
            <Button border={true}>
              <svg
                class="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                  d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
                /></svg
              >
              Delete</Button
            >
            <div id="right-button">
              <Button
                border={true}
                on:click={() => {
                  handleChangePageMsg({ detail: { page: "sources" } });
                }}
              >
                <svg
                  class="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  ><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
                    d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
                  />
                </svg>
                Settings</Button
              >
            </div>
          </div>
        </div>
        <div id="attestation-sidebar">
          {#if dbEntries.length > 0}
            {#each dbEntries as { source, attr, data, alts }}
              {#if attr === "parents" && !data.attestation.encrypted}
                <Attestation
                  {data}
                  {alts}
                  {fileCid}
                  signer={source}
                  customTitle="Parents"
                  on:changePage={handleChangePageMsg}
                >
                  <div slot="value">
                    {#each Object.entries(data.attestation.value) as [parentType, cids]}
                      <span class="cid-type">{parentType}</span>
                      {#each cids as cid}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span
                          class="cid"
                          on:click={() => {
                            handleChangePageMsg({
                              detail: { page: "cid", cid: cid.toString() },
                            });
                          }}>{cid}</span
                        ><br />
                      {/each}
                    {/each}
                  </div>
                </Attestation>
              {:else if attr === "children" && !data.attestation.encrypted}
                <Attestation
                  {data}
                  {alts}
                  {fileCid}
                  signer={source}
                  customTitle="Children"
                  on:changePage={handleChangePageMsg}
                >
                  <div slot="value">
                    {#each Object.entries(data.attestation.value) as [childType, cids]}
                      <span class="cid-type">{childType}</span>
                      {#each cids as cid}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span
                          class="cid"
                          on:click={() => {
                            handleChangePageMsg({
                              detail: { page: "cid", cid: cid.toString() },
                            });
                          }}>{cid}</span
                        ><br />
                      {/each}
                    {/each}
                  </div>
                </Attestation>
              {:else}
                <Attestation
                  {data}
                  {alts}
                  {fileCid}
                  signer={source}
                  on:changePage={handleChangePageMsg}
                />
              {/if}
            {/each}
          {:else}
            <p class="error">No attestations found</p>
          {/if}
        </div>
      </div>
    {:else if curPage === "sources"}
      <div id="title-bar">
        <h1>Settings</h1>
      </div>
      <div id="sources-list-container">
        <Settings
          success={sourcesListSuccess}
          on:prevPage={handlePrevPageMsg}
          on:settingsChange={(evt) => {
            (async () => {
              // JWT
              if (evt.detail.jwt) {
                hyperbeeJWT.set(evt.detail.jwt);
              }
              // Sources
              sourcesListSuccess = await reloadData(
                evt.detail.sources,
                fileCid
              );
              if (sourcesListSuccess) {
                // Actually call .set so that subscribers get the update and
                // it's stored in localStorage
                hyperbeeSources.set(evt.detail.sources);
              } else {
                await reloadData($hyperbeeSources, fileCid);
              }
            })();
          }}
        />
      </div>
    {:else if curPage === "graph"}
      <div id="title-bar">
        <h1>Graph</h1>
        <p>Only three hops are calculated.</p>
      </div>
      <div id="graph-container">
        <Graph data={graphData} mainCid={fileCid} />
      </div>
      <div id="graph-button-container">
        <Button border={true} on:click={handlePrevPageMsg}>Back</Button>
      </div>
    {:else if curPage === "edit"}
      <div id="title-bar">
        <h1>Edit Attestations</h1>
        <p>
          You can resize each textarea to make sure you are viewing the full
          value.
        </p>
      </div>
      <div id="attestations-edit-box">
        {#if dbEntries.length > 0}
          {#each dbEntries as { source, attr, data, alts }}
            <EditAttestation data={structuredClone(data)} {fileCid} />
          {/each}
        {:else}
          <p class="error">No attestations found</p>
        {/if}
      </div>
      <div id="edit-buttons">
        <Button border={true} on:click={handlePrevPageMsg}>Back</Button>
        <Button
          border={true}
          on:click={() => {
            newAttestation.showModal();
          }}
          ><svg
            class="icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            ><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
              d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
            /></svg
          > New</Button
        >
      </div>
      <NewAttestation bind:this={newAttestation} {fileCid} />
    {/if}
  {/if}
</div>

{#if import.meta.env.DEV}
  <style>
    /* Basic styling for running directly in the browser when dev testing. */

    /* Taken from https://systemfontstack.com/ */
    :root {
      font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir,
        segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto,
        arial, sans-serif;
    }
    code,
    pre {
      font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console,
        monospace;
    }

    /* Use whole viewport when not running in Uwazi */
    #top-container-6facc2a3 {
      height: 100vh !important;
    }
    body {
      margin: 0;
    }
  </style>
{/if}
{#if import.meta.env.PROD}
  <style>
    #hyperbee-entity-page-app {
      max-width: 95vw !important;
    }
  </style>
{/if}

<style>
  .error {
    color: red;
    font-size: 2em !important;
  }
  #top-container-6facc2a3 {
    height: 80vh; /* Leaves space for Uwazi top nav */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--theme2);
  }

  #error-button {
    width: max-content;
    margin-left: 2em;
  }

  #title-bar {
    flex-grow: 0;
    padding-left: 1em;
    border-bottom: 2px solid var(--theme-border);
  }
  #container-6facc2a3 {
    display: flex;
    flex: auto;
    overflow: hidden;
  }
  #attestation-sidebar {
    width: 30%;
    padding-left: 1em;
    padding-right: 2em; /* no scrollbar overlap */
    overflow-y: auto;
    border-left: 2px solid var(--theme-border);
  }
  #non-sidebar {
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  #file-info {
    margin-left: 4em;
    padding-right: 3em;
    flex-grow: 1;
    overflow-y: auto;
  }
  #top-file-text {
    margin-top: 2em !important;
    margin-bottom: 0 !important;
  }
  #file-size {
    font-size: 0.85em;
    margin-top: 0.5em !important;
  }
  #embed-container {
    height: 65%;
    width: 100%;
  }
  #embed-container .error {
    position: relative;
    top: 1em;
    left: 1em;
  }
  #bottom-buttons {
    margin-bottom: 1em;
    padding-left: 1em;
    border-top: 2px solid var(--theme-border);
    padding-top: 1em;
    display: flex;
    gap: 1em;
  }
  #right-button {
    margin-left: auto;
    margin-right: 1em;
  }

  #sources-list-container {
    margin-left: 2em;
    width: max(40%, 40ch);
  }

  #graph-container {
    flex-grow: 1;
    min-height: 50%;
  }
  #graph-button-container {
    margin: 1em;
    height: 10%;
  }

  .cid-type {
    display: inline-block;
    width: max-content;
    white-space: nowrap;
  }
  .cid-type::first-letter {
    text-transform: capitalize;
  }
  .cid {
    cursor: pointer;
    text-decoration: underline;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
    width: 100%;
    color: var(--theme2);
    padding-left: 2ch;
    /*
    No matter the padding values, the CID needs to not go outside its flex element box
    Setting this fixes that. Otherwise padding pushes it outside the box.

    https://stackoverflow.com/a/8075903 
    */
    box-sizing: border-box;
  }

  #attestations-edit-box {
    overflow: auto;
    margin-left: 2em;
    padding-right: 2em;
    display: flex;
    flex-wrap: wrap;
    gap: 0em 1.5em;
  }
  #attestations-edit-box > :global(div) {
    flex-grow: 1;
    min-width: 30em;
  }
  #edit-buttons {
    margin-bottom: 1em;
    padding-left: 1em;
    border-top: 2px solid var(--theme-border);
    padding-top: 1em;
    display: flex;
    gap: 1em;
  }

  /* Undo Uwazi styling */
  a {
    border-bottom: 0 !important;
  }
  p {
    margin: revert !important;
  }
</style>
