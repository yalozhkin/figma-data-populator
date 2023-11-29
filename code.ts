
// Function to format layer names: remove '%' and convert to Sentence Case
function formatLayerName(layerName: string): string {
  // Remove '%' symbols
  let formattedName = layerName.replace(/%/g, '');

  // Convert to Sentence Case
  formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();

  return formattedName;
}

/// Function to find text layers and handle no layers found
function findTextLayersWithNamePattern() {
  const textLayers: string[] = []; // Explicitly define as array of strings
  const nodes = figma.root.findAll(node => node.type === 'TEXT' && node.name.startsWith('%') && node.name.endsWith('%'));

  nodes.forEach((node) => {
    if (node.type === 'TEXT') {
      textLayers.push(node.name);
    }
  });

  if (textLayers.length === 0) {
    // Send message to UI to display a hint
    figma.ui.postMessage({ type: 'noLayersFound' });
  } else {
    figma.ui.postMessage({ type: 'updateLayersList', textLayers });
  }
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'populateText') {
    const targetLayerName = msg.layerName;
    const targetLayer = figma.root.findOne(node => node.type === 'TEXT' && node.name === targetLayerName);

    if (targetLayer && targetLayer.type === 'TEXT') { // Type guard to ensure node is a TextNode
      const paragraphs = targetLayer.characters.split('\n');

      const selectedTextNodes = figma.currentPage.selection.filter(node => node.type === 'TEXT') as TextNode[];
      for (let i = 0; i < selectedTextNodes.length; i++) {
        await figma.loadFontAsync(selectedTextNodes[i].fontName as FontName);
        selectedTextNodes[i].characters = paragraphs[i % paragraphs.length];
      }
    }

    // figma.closePlugin();
  }
};


// UI script to handle messages and create buttons
const uiHtml = `
  <div id="app">
    <h2>Select a Data Set</h2>
    <div id="layersList">Loading layers...</div>
  </div>
  <script>
    window.onmessage = (event) => {
      const { type, textLayers } = event.data.pluginMessage;
      const listContainer = document.getElementById('layersList');

      if (type === 'updateLayersList') {
        listContainer.innerHTML = '';
        textLayers.forEach(layerName => {
          const button = document.createElement('button');
          // Use formatted name for button text
          button.innerText = formatLayerName(layerName);
          button.onclick = () => parent.postMessage({ pluginMessage: { type: 'populateText', layerName } }, '*');
          listContainer.appendChild(button);
        });
      } else if (type === 'noLayersFound') {
        listContainer.innerHTML = '<p>No text layers found. Please create a layer named "%custom-name%" to store paragraph data.</p>';
      }
    };

    // Function to format layer names inside the UI script
    function formatLayerName(layerName) {
      let formattedName = layerName.replace(/%/g, '');
      formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();
      return formattedName;
    }
  </script>
`;

figma.showUI(uiHtml, { width: 240, height: 300 });

findTextLayersWithNamePattern();
