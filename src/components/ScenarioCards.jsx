import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { getScenarioById } from '../data/scenarios';
import { clsx } from 'clsx';

function SortablePriorityRow({ id, rank }) {
  const s = getScenarioById(id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!s) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex touch-none items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5 shadow-sm transition-shadow',
        isDragging && 'z-10 scale-[1.02] shadow-lg ring-2 ring-[#007AFF]/30'
      )}
    >
      <button
        type="button"
        className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F2F7] text-[#8E8E93] active:bg-[#E5E5EA]"
        aria-label={`Move ${s.label} up or down`}
        {...attributes}
        {...listeners}
      >
        <span className="select-none text-lg leading-none tracking-tighter" aria-hidden>
          ⋮⋮
        </span>
      </button>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/12 font-mono text-sm font-semibold text-[#007AFF]">
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold leading-snug tracking-tight text-[#1C1C1E]">
          {s.label}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#8E8E93]">{s.explanation}</p>
      </div>
      <span className="hidden shrink-0 text-2xl text-[#C7C7CC] sm:block" aria-hidden>
        {s.symbol}
      </span>
    </div>
  );
}

const ScenarioCards = ({ onFindMyCar, onBackToBudget }) => {
  const { scenarioPriorityOrder, setScenarioPriorityOrder } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenarioPriorityOrder.indexOf(active.id);
    const newIndex = scenarioPriorityOrder.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setScenarioPriorityOrder(arrayMove(scenarioPriorityOrder, oldIndex, newIndex));
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-2 sm:max-w-xl sm:px-6 md:max-w-2xl md:pb-36 md:pt-6">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10">
        {onBackToBudget && (
          <button
            type="button"
            onClick={onBackToBudget}
            className="inline-flex min-h-[44px] w-fit items-center text-[17px] font-normal text-[#007AFF] active:opacity-60"
          >
            ‹ Budget
          </button>
        )}
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#8E8E93]">
          Step 2 of 3
        </p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#1C1C1E] sm:text-[34px]">
          What matters most?
        </h1>
        <p className="text-[17px] leading-relaxed text-[#8E8E93]">
          Drag the list. <strong className="font-semibold text-[#636366]">Top</strong> = most important to you.{' '}
          <strong className="font-semibold text-[#636366]">Bottom</strong> = less important. You can change the order anytime.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={scenarioPriorityOrder} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2.5" role="list">
            {scenarioPriorityOrder.map((id, index) => (
              <li key={id}>
                <SortablePriorityRow id={id} rank={index + 1} />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="mt-10">
        <button
          type="button"
          onClick={onFindMyCar}
          className="apple-primary-btn min-h-[50px] w-full rounded-[14px] text-[17px] font-semibold text-white active:scale-[0.99] active:opacity-90"
        >
          Show my matches
        </button>
      </div>
    </div>
  );
};

export default ScenarioCards;
