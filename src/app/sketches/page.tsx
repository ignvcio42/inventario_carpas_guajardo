"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Container,
  Title,
  Button,
  Group,
  TextInput,
  Stack,
  ActionIcon,
  Select,
  Modal,
  Textarea,
  Card,
  Text as MantineText,
  Badge,
  Loader,
  Center,
  Paper,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconPlus,
  IconEdit,
  IconArrowLeft,
  IconTrash,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";

// Importación dinámica del editor para evitar problemas con SSR
const SketchEditor = dynamic(
  () => import("./_components/sketch-editor"),
  { 
    ssr: false,
    loading: () => (
      <Center p="xl">
        <Loader size="xl" />
      </Center>
    ),
  }
);

interface ShapeElement {
  id: string;
  type: "rectangle" | "text" | "measurement";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const AUTOSAVE_KEY = "sketch_autosave_draft";

function SketchesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");
  const sketchIdFromUrl = searchParams.get("sketchId");
  
  const [elements, setElements] = useState<ShapeElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sketchName, setSketchName] = useState("");
  const [sketchDescription, setSketchDescription] = useState("");
  const [currentSketchId, setCurrentSketchId] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdFromUrl);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);

  const utils = api.useUtils();
  const { data: sketches, isLoading: loadingSketches } = api.sketch.getAll.useQuery();
  const { data: events } = api.event.getAll.useQuery();
  
  const createSketch = api.sketch.create.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Boceto guardado correctamente",
        color: "green",
      });
      setSaveModalOpen(false);
      void utils.sketch.getAll.invalidate();
      // Limpiar el autoguardado
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasDraft(false);
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });

  const updateSketch = api.sketch.update.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Boceto actualizado correctamente",
        color: "green",
      });
      void utils.sketch.getAll.invalidate();
      // Limpiar el autoguardado
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasDraft(false);
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });

  const deleteSketch = api.sketch.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Boceto eliminado correctamente",
        color: "green",
      });
      void utils.sketch.getAll.invalidate();
    },
  });

  const handleLoad = (sketch: any) => {
    try {
      const loadedElements = JSON.parse(sketch.data) as ShapeElement[];
      setElements(loadedElements);
      setSketchName(sketch.name);
      setSketchDescription(sketch.description || "");
      setCurrentSketchId(sketch.id);
      setSelectedEventId(sketch.eventId?.toString() || null);
      setLoadModalOpen(false);
      // Limpiar el draft al cargar un boceto guardado
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasDraft(false);
      setShowDraftNotification(false);
      notifications.show({
        title: "Éxito",
        message: "Boceto cargado correctamente",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Error al cargar el boceto",
        color: "red",
      });
    }
  };

  // Cargar boceto si hay sketchId en URL
  useEffect(() => {
    if (sketchIdFromUrl && sketches && !loadingSketches) {
      const sketch = sketches.find((s: any) => s.id === parseInt(sketchIdFromUrl));
      if (sketch && currentSketchId !== sketch.id) {
        handleLoad(sketch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketchIdFromUrl, sketches, loadingSketches]);

  // Verificar si hay un draft guardado al cargar
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft && !sketchIdFromUrl) {
      try {
        const draft = JSON.parse(savedDraft);
        // Solo mostrar banner si hay elementos guardados
        if (draft.elements && draft.elements.length > 0) {
          setHasDraft(true);
          setShowDraftNotification(true);
        }
      } catch (error) {
        console.error("Error al cargar el borrador:", error);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, [sketchIdFromUrl]);

  // Autoguardar cada vez que cambien los elementos (con debounce)
  useEffect(() => {
    if (elements.length > 0) {
      const timer = setTimeout(() => {
        const draft = {
          elements,
          sketchName,
          sketchDescription,
          currentSketchId,
          selectedEventId,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
        setHasDraft(true);
      }, 2000); // Guardar 2 segundos después del último cambio

      return () => clearTimeout(timer);
    }
  }, [elements, sketchName, sketchDescription, currentSketchId, selectedEventId]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setElements(draft.elements || []);
        setSketchName(draft.sketchName || "");
        setSketchDescription(draft.sketchDescription || "");
        setCurrentSketchId(draft.currentSketchId || null);
        setSelectedEventId(draft.selectedEventId || null);
        setShowDraftNotification(false);
        notifications.show({
          title: "Borrador restaurado",
          message: "Se ha recuperado tu trabajo anterior",
          color: "green",
        });
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "No se pudo restaurar el borrador",
          color: "red",
        });
      }
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setHasDraft(false);
    setShowDraftNotification(false);
    notifications.show({
      title: "Borrador descartado",
      message: "El borrador ha sido eliminado",
      color: "gray",
    });
  };

  const handleSave = () => {
    if (!sketchName.trim()) {
      notifications.show({
        title: "Error",
        message: "Por favor ingrese un nombre para el boceto",
        color: "red",
      });
      return;
    }

    const data = JSON.stringify(elements);

    if (currentSketchId) {
      updateSketch.mutate({
        id: currentSketchId,
        name: sketchName,
        description: sketchDescription,
        data,
        eventId: selectedEventId ? parseInt(selectedEventId) : null,
      });
    } else {
      createSketch.mutate({
        name: sketchName,
        description: sketchDescription,
        data,
        eventId: selectedEventId ? parseInt(selectedEventId) : undefined,
      });
    }
  };

  const handleNew = () => {
    if (elements.length > 0 && !window.confirm("¿Estás seguro de crear un nuevo boceto? Los cambios no guardados se perderán.")) {
      return;
    }
    setElements([]);
    setSketchName("");
    setSketchDescription("");
    setCurrentSketchId(null);
    setSelectedEventId(null);
    setSelectedId(null);
    localStorage.removeItem(AUTOSAVE_KEY);
    setHasDraft(false);
  };

  return (
    <Container fluid px="md" py="md" style={{ maxWidth: '100%', height: '100vh', overflow: 'hidden' }}>
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => router.push("/dashboard")}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Group gap="sm" align="center">
              <Title order={2}>Cuaderno Digital de Carpas Guajardo</Title>
              {currentSketchId && sketchName && (
                  <MantineText size="sm" fw={500} c="blue.7">
                    Editando: {sketchName}
                  </MantineText>
              )}
            </Group>
            <MantineText size="sm" c="dimmed">
              {currentSketchId 
                ? "Realiza cambios y guarda para actualizar el boceto" 
                : "Crea bocetos digitales de las carpas con medidas"}
            </MantineText>
          </div>
        </Group>
        <Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNew}
            variant="light"
          >
            Nuevo
          </Button>
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => setLoadModalOpen(true)}
            variant="light"
          >
            Cargar
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={() => setSaveModalOpen(true)}
            disabled={elements.length === 0}
          >
            {currentSketchId ? "Actualizar" : "Guardar"}
          </Button>
        </Group>
      </Group>

      {/* Alerta de borrador guardado */}
      {showDraftNotification && (
        <Paper p="md" mb="md" withBorder bg="blue.0" style={{ borderColor: "#228be6" }}>
          <Group justify="space-between" align="center">
            <div>
              <MantineText fw={600} size="sm" c="blue.9">
                🔄 Borrador encontrado
              </MantineText>
              <MantineText size="xs" c="dimmed">
                Hay cambios sin guardar del {hasDraft && localStorage.getItem(AUTOSAVE_KEY) 
                  ? new Date(JSON.parse(localStorage.getItem(AUTOSAVE_KEY)!).timestamp).toLocaleString("es-CL")
                  : "último trabajo"}
              </MantineText>
            </div>
            <Group gap="xs">
              <Button size="xs" onClick={restoreDraft} color="blue">
                Restaurar Borrador
              </Button>
              <Button size="xs" onClick={discardDraft} variant="subtle" color="gray">
                Descartar
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Indicador de autoguardado */}
      {hasDraft && elements.length > 0 && (
        <MantineText size="xs" c="dimmed" mb="xs" ta="right">
          💾 Autoguardado localmente
        </MantineText>
      )}

      <SketchEditor
        elements={elements}
        setElements={setElements}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />

      {/* Modal de guardar */}
      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={currentSketchId ? "Actualizar Boceto" : "Guardar Boceto"}
      >
        <Stack>
          <TextInput
            label="Nombre del boceto"
            placeholder="Ej: Carpa evento cumpleaños"
            value={sketchName}
            onChange={(e) => setSketchName(e.currentTarget.value)}
            required
          />
          <Textarea
            label="Descripción"
            placeholder="Descripción opcional del boceto"
            value={sketchDescription}
            onChange={(e) => setSketchDescription(e.currentTarget.value)}
            rows={3}
          />
          <Select
            label="Asignar a evento (opcional)"
            placeholder="Seleccione un evento"
            data={
              events?.map((event) => ({
                value: event.id.toString(),
                label: `${event.nombreCliente} - ${new Date(event.startDate).toLocaleDateString("es-CL")}`,
              })) || []
            }
            value={selectedEventId}
            onChange={setSelectedEventId}
            searchable
            clearable
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setSaveModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={createSketch.isPending || updateSketch.isPending}
            >
              {currentSketchId ? "Actualizar" : "Guardar"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de cargar */}
      <Modal
        opened={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        title="Cargar Boceto"
        size="lg"
      >
        {loadingSketches ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : sketches && sketches.length > 0 ? (
          <Stack>
            {sketches.map((sketch) => (
              <Card key={sketch.id} shadow="sm" padding="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <div>
                    <MantineText fw={500}>{sketch.name}</MantineText>
                    {sketch.description && (
                      <MantineText size="sm" c="dimmed">
                        {sketch.description}
                      </MantineText>
                    )}
                  </div>
                  <Group>
                    <Button size="xs" onClick={() => handleLoad(sketch)}>
                      Cargar
                    </Button>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => {
                        if (confirm("¿Está seguro de eliminar este boceto?")) {
                          deleteSketch.mutate({ id: sketch.id });
                        }
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Group gap="xs">
                  {sketch.event && (
                    <Badge size="sm" variant="light">
                      {sketch.event.nombreCliente}
                    </Badge>
                  )}
                  <Badge size="sm" variant="light" color="gray">
                    {new Date(sketch.createdAt).toLocaleDateString("es-CL")}
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Center p="xl">
            <MantineText c="dimmed">No hay bocetos guardados</MantineText>
          </Center>
        )}
      </Modal>
    </Container>
  );
}

export default function SketchesPage() {
  return (
    <Suspense fallback={
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    }>
      <SketchesPageContent />
    </Suspense>
  );
}
