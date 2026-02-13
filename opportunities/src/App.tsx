import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

function HomePage(): React.JSX.Element {
  return (
    <div>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem",
        }}
      >
        Opportunities
      </h1>
      <p style={{ color: "var(--mc-text-muted)", maxWidth: "36rem" }}>
        Discover and pursue high-impact opportunities curated by the Merge
        Combinator network.
      </p>
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;
