import { framer, CanvasNode } from "framer-plugin"
import { useState, useEffect } from "react"
import "./App.css"

framer.showUI({
    position: "top right",
    width: 340,
    height: 500,
})

function useSelection() {
    const [selection, setSelection] = useState<CanvasNode[]>([])

    useEffect(() => {
        return framer.subscribeToSelection(setSelection)
    }, [])

    return selection
}

interface NodeInfo {
    id: string
    type: string
    name: string
    x?: number
    y?: number
    width?: number
    height?: number
    backgroundColor?: string
    opacity?: number
    rotation?: number
    visible?: boolean
}

function extractNodeInfo(node: CanvasNode): NodeInfo {
    const info: NodeInfo = {
        id: node.id,
        type: node.type,
        name: node.name,
    }

    // Extract position and size if available
    if ('x' in node) info.x = node.x
    if ('y' in node) info.y = node.y
    if ('width' in node) info.width = node.width
    if ('height' in node) info.height = node.height
    if ('backgroundColor' in node) info.backgroundColor = node.backgroundColor as string
    if ('opacity' in node) info.opacity = node.opacity as number
    if ('rotation' in node) info.rotation = node.rotation as number
    if ('visible' in node) info.visible = node.visible as boolean

    return info
}

async function generateHTML(node: CanvasNode): Promise<string> {
    const info = extractNodeInfo(node)

    // Try to get HTML using internal API
    try {
        // @ts-ignore - Using internal API
        const html = await framer.$framerInternal.getHTMLForNode(node.id)
        if (html) return html
    } catch (e) {
        console.log("Internal API not available, generating custom HTML")
    }

    // Fallback: Generate HTML based on node type
    let html = `<!-- ${info.name} (${info.type}) -->\n`

    if (node.type === "Frame") {
        html += `<div class="frame-${info.name.toLowerCase().replace(/\s+/g, '-')}">\n`
        html += `  <!-- Width: ${info.width}px, Height: ${info.height}px -->\n`
        html += `</div>`
    } else if (node.type === "Text") {
        // @ts-ignore
        const text = node.text || "Text content"
        html += `<p>${text}</p>`
    } else {
        html += `<div class="${info.type.toLowerCase()}">\n`
        html += `  <!-- ${info.name} -->\n`
        html += `</div>`
    }

    return html
}

function generateCSS(node: CanvasNode): string {
    const info = extractNodeInfo(node)
    const className = info.name.toLowerCase().replace(/\s+/g, '-')

    let css = `.${node.type.toLowerCase()}-${className} {\n`

    if (info.width) css += `  width: ${info.width}px;\n`
    if (info.height) css += `  height: ${info.height}px;\n`
    if (info.backgroundColor) css += `  background-color: ${info.backgroundColor};\n`
    if (info.opacity !== undefined && info.opacity !== 1) css += `  opacity: ${info.opacity};\n`
    if (info.rotation) css += `  transform: rotate(${info.rotation}deg);\n`

    css += `}`

    return css
}

export function App() {
    const selection = useSelection()
    const [extractedHTML, setExtractedHTML] = useState("")
    const [extractedCSS, setExtractedCSS] = useState("")
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState<"html" | "css" | "info">("html")

    const selectedNode = selection.length === 1 ? selection[0] : null

    const handleExtract = async () => {
        if (!selectedNode) return

        const html = await generateHTML(selectedNode)
        const css = generateCSS(selectedNode)

        setExtractedHTML(html)
        setExtractedCSS(css)
    }

    const handleCopy = async () => {
        const content = activeTab === "html" ? extractedHTML : extractedCSS
        await navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopyBoth = async () => {
        const combined = `<!-- HTML -->\n${extractedHTML}\n\n/* CSS */\n${extractedCSS}`
        await navigator.clipboard.writeText(combined)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <main className="inspector">
            <div className="inspector-header">
                <h2>Component Inspector</h2>
                {selectedNode && (
                    <span className="selection-badge">{selectedNode.name}</span>
                )}
            </div>

            {!selectedNode ? (
                <div className="empty-state">
                    <p>Select a layer to extract its HTML & CSS</p>
                </div>
            ) : (
                <>
                    <button
                        className="framer-button-primary extract-btn"
                        onClick={handleExtract}
                    >
                        Extract Component
                    </button>

                    {extractedHTML && (
                        <div className="results">
                            <div className="tabs">
                                <button
                                    className={activeTab === "html" ? "active" : ""}
                                    onClick={() => setActiveTab("html")}
                                >
                                    HTML
                                </button>
                                <button
                                    className={activeTab === "css" ? "active" : ""}
                                    onClick={() => setActiveTab("css")}
                                >
                                    CSS
                                </button>
                                <button
                                    className={activeTab === "info" ? "active" : ""}
                                    onClick={() => setActiveTab("info")}
                                >
                                    Info
                                </button>
                            </div>

                            <div className="code-output">
                                {activeTab === "html" && (
                                    <pre>{extractedHTML}</pre>
                                )}
                                {activeTab === "css" && (
                                    <pre>{extractedCSS}</pre>
                                )}
                                {activeTab === "info" && (
                                    <pre>{JSON.stringify(extractNodeInfo(selectedNode), null, 2)}</pre>
                                )}
                            </div>

                            <div className="actions">
                                <button
                                    className="framer-button-secondary"
                                    onClick={handleCopy}
                                >
                                    {copied ? "Copied!" : `Copy ${activeTab.toUpperCase()}`}
                                </button>
                                <button
                                    className="framer-button-secondary"
                                    onClick={handleCopyBoth}
                                >
                                    Copy Both
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    )
}
