import Button from "@thorium/ui/Button";
import {useNavigate, useParams, Outlet, Link} from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {q} from "@client/context/AppContext";

export function SortableItem({
  id,
  name,
  deckName,
}: {
  id: string;
  name: string;
  deckName: string;
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`list-group-item !p-0 transition-[border-radius] ${
        deckName === id ? "selected" : ""
      } touch-none ${isDragging ? "!border !rounded" : ""}`}
    >
      <Link
        to={id}
        // Pointer-events-none is necessary to avoid navigating when the sorting is done
        className={`block px-4 py-2 ${isDragging ? "pointer-events-none" : ""}`}
      >
        {name}
      </Link>
    </li>
  );
}

export function ShipMap() {
  const {pluginId, shipId, deckName} = useParams() as {
    pluginId: string;
    shipId: string;
    deckName: string;
  };
  const navigate = useNavigate();
  const [data] = q.plugin.ship.get.useNetRequest({pluginId, shipId});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 5},
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    const activeIndex = active.data.current?.sortable.index;
    const overIndex = over?.data.current?.sortable.index;

    if (typeof overIndex !== "number") return;
    if (activeIndex !== overIndex) {
      const result = await q.plugin.ship.deck.update.netSend({
        pluginId,
        shipId,
        deckId: active.id as string,
        newIndex: Number(overIndex),
      });
      if (result) {
        navigate(result.name);
      }
    }
  }

  return (
    <>
      <div className="w-72 flex flex-col">
        <ul className="mb-2 relative overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.decks.map((deck, index) => ({
                ...deck,
                id: deck.name,
                index,
              }))}
              strategy={verticalListSortingStrategy}
            >
              {data.decks.map(deck => (
                <SortableItem
                  key={deck.name}
                  name={deck.name}
                  id={deck.name}
                  deckName={deckName}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
        <Button
          className="btn-success w-full"
          onClick={async () => {
            const deck = await q.plugin.ship.deck.create.netSend({
              pluginId,
              shipId,
            });
            if (deck === null) return;
            navigate(deck.name.toString());
          }}
        >
          Add Deck
        </Button>
      </div>
      <Outlet />
    </>
  );
}
