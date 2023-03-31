import { LegacyRef } from "react";
import { schedulerConfig } from "@/schedulerConfig";
import { BryntumScheduler } from "@bryntum/scheduler-react";
import { useQueryAndMutations } from "@/hooks/useQueryAndMutations";
import { debounce } from "@/utils/debounce";
import { Events, Resources } from "@prisma/client";
import { ResourceModel } from "@bryntum/scheduler";

type SyncData = {
  action: "dataset" | "add" | "remove" | "update";
  records: {
    data: Resources | Events;
    meta: {
      modified: Partial<Resources> | Partial<Events>;
    };
  }[];
  store: {
    id: "resources" | "events";
  };
};

type SchedulerProps = {
  schedulerRef: LegacyRef<BryntumScheduler> | undefined;
};

export default function Scheduler({ schedulerRef }: SchedulerProps) {
  const {
    data,
    createResource,
    deleteResource,
    updateResource,
    createEvent,
    deleteEvent,
    updateEvent,
  } = useQueryAndMutations();
  let disableCreate = false;

  function onBeforeDragCreate() {
    disableCreate = true;
  }

  function onAfterDragCreate() {
    disableCreate = false;
  }

  const createEventDebounced = debounce((variables: Events) => {
    createEvent({ variables });
  }, 200);

  const syncData = ({ store, action, records }: SyncData) => {
    const storeId = store.id;
    if (storeId === "resources") {
      if (action === "add") {
        const { resources } = data;
        const resourcesIds = resources.map((obj: ResourceModel) => obj.id);
        for (let i = 0; i < records.length; i++) {
          const resourceExists = resourcesIds.includes(records[i].data.id);
          if (resourceExists) return;
          const uuid = crypto.randomUUID();
          createResource({
            variables: {
              id: uuid,
              name: records[i].data.name,
              parentIndex: records[i].data.parentIndex,
            },
          });
        }
      }
      if (action === "remove") {
        if (records[0].data.id.startsWith("_generatedClassDefEx_")) return;
        records.forEach((record) => {
          deleteResource({
            variables: {
              id: record.data.id,
            },
          });
        });
      }
      if (action === "update") {
        for (let i = 0; i < records.length; i++) {
          if (records[i].data.id.startsWith("_generatedClassDefEx_")) return;
          const modifiedVariables = records[i].meta
            .modified as Partial<Resources>;
          (Object.keys(modifiedVariables) as Array<keyof Resources>).forEach(
            (key) => {
              modifiedVariables[key] = (records[i].data as Resources)[
                key
              ] as any;
            }
          );
          updateResource({
            variables: { ...modifiedVariables, id: records[i].data.id },
          });
        }
      }
    }

    if (storeId === "events") {
      if (action === "remove") {
        records.forEach((record) => {
          if (record.data.id.startsWith("_generatedClassDefEx_")) return;
          deleteEvent({
            variables: {
              id: record.data.id,
            },
          });
        });
      }
      if (action === "update") {
        for (let i = 0; i < records.length; i++) {
          // update event occuring for newly created event
          if (records[i].data.id.startsWith("_generatedClassDefEx_")) {
            if (disableCreate) return;
            const { exceptionDates, ...newEventData } = records[i].data;
            createEventDebounced({
              ...newEventData,
              exceptionDates: JSON.stringify(exceptionDates),
            });
          } else {
            const modifiedVariables = records[i].meta
              .modified as Partial<Events>;
            (Object.keys(modifiedVariables) as Array<keyof Events>).forEach(
              (key) => {
                modifiedVariables[key] = (records[i].data as Events)[
                  key
                ] as any;
              }
            );
            const { id, exceptionDates, ...eventUpdateData } =
              modifiedVariables;
            updateEvent({
              variables: {
                ...eventUpdateData,
                exceptionDates: JSON.stringify(exceptionDates),
                id: records[i].data.id,
              },
            });
          }
        }
      }
    }
  };

  return data ? (
    <BryntumScheduler
      ref={schedulerRef}
      resources={data?.resources}
      events={data?.events}
      onDataChange={syncData}
      onBeforeDragCreate={onBeforeDragCreate}
      onAfterDragCreate={onAfterDragCreate}
      {...schedulerConfig}
    />
  ) : null;
}
