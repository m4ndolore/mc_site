import type { Resource } from '../types/curriculum'

interface Props {
  resource: Resource
  onEngage: (resource: Resource) => void
}

export default function ResourceCard({ resource, onEngage }: Props) {
  const handleClick = () => {
    onEngage(resource)
  }

  const categoryColor: Record<string, string> = {
    'systems': '#3b82f6',
    'compliance': '#f59e0b',
    'market': '#10b981',
    'execution': '#8b5cf6',
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-card"
      onClick={handleClick}
    >
      <div className="resource-header">
        <span
          className="resource-category"
          style={{ backgroundColor: categoryColor[resource.category] || '#6b7280' }}
        >
          {resource.category}
        </span>
      </div>
      <h3 className="resource-title">{resource.title}</h3>
      <p className="resource-description">{resource.description}</p>
      <div className="resource-meta">
        <span className="resource-type">{resource.type}</span>
        {resource.duration && <span className="resource-duration">{resource.duration}</span>}
      </div>
    </a>
  )
}
