import { useState } from "react";

function App() {
  const [tabs, setTabs] = useState([{ id: 1, url: "https://google.com" }]);
  const [activeTab, setActiveTab] = useState(1);

  const addTab = () => {
    const newTab = { id: tabs.length + 1, url: "https://google.com" };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const updateURL = (id, url) => {
    setTabs(
      tabs.map((tab) => (tab.id === id ? { ...tab, url } : tab))
    );
  };

  return (
    <div>
      <div>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
            Tab {tab.id} ✖
          </button>
        ))}
        <button onClick={addTab}>➕ New Tab</button>
      </div>

      {tabs.map((tab) =>
        tab.id === activeTab ? (
          <div key={tab.id}>
            <input
              type="text"
              value={tab.url}
              onChange={(e) => updateURL(tab.id, e.target.value)}
            />
            <button onClick={() => window.electronAPI.openNewTab(tab.url)}>Go</button>
            <webview
              src={tab.url}
              style={{ width: "100%", height: "600px", border: "1px solid black" }}
            ></webview>
          </div>
        ) : null
      )}
    </div>
  );
}

export default App;
