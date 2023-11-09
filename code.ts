// Example HTML content for UI as a string
const uiHtml = `
  <div id="app">
    <h2>Select a Data Set</h2>
    <div id="layersList"></div>
  </div>
  <script>
    window.onmessage = (event) => {
      const { type, textLayers } = event.data.pluginMessage;
      if (type === 'updateLayersList') {
        const listContainer = document.getElementById('layersList');
        listContainer.innerHTML = '';
        textLayers.forEach(layerName => {
          const button = document.createElement('button');
          button.innerText = layerName;
          button.onclick = () => parent.postMessage({ pluginMessage: { type: 'populateText', layerName } }, '*');
          listContainer.appendChild(button);
        });
      }
    };
  </script>
`;

figma.showUI(uiHtml, { width: 240, height: 300 });
// ... rest of your plugin code

// Function to find text layers
function findTextLayersWithNamePattern() {
  const textLayers: string[] = []; // Explicitly define as array of strings

  const nodes = figma.root.findAll(node => node.type === 'TEXT' && node.name.startsWith('%') && node.name.endsWith('%'));

  nodes.forEach((node) => {
    if (node.type === 'TEXT') { // Type guard to ensure node is a TextNode
      textLayers.push(node.name);
    }
  });

  figma.ui.postMessage({ type: 'updateLayersList', textLayers });
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

findTextLayersWithNamePattern();
