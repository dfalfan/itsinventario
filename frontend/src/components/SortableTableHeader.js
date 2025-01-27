import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender } from '@tanstack/react-table';

export function SortableTableHeader({ header }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: header.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    width: header.getSize(), // Mantener el ancho original
    ...header.column.columnDef.style, // Preservar estilos específicos de la columna
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
    backgroundColor: isDragging ? '#f0f0f0' : undefined,
    zIndex: isDragging ? 1 : 0
  };

  return (
    <th 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Evitar sorting mientras se arrastra
        if (!isDragging && header.column.getCanSort()) {
          header.column.toggleSorting();
        }
      }}
      className={`sortable ${isDragging ? 'dragging' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
        {header.column.getIsSorted() && (
          <span style={{ marginLeft: '4px' }}>
            {header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔽'}
          </span>
        )}
      </div>
    </th>
  );
}
