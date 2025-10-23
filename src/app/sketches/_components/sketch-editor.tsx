"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import {
  Button,
  Group,
  Paper,
  Stack,
  ActionIcon,
  Text as MantineText,
  ColorInput,
  Modal,
  TextInput,
} from "@mantine/core";
import {
  IconSquarePlus,
  IconTextPlus,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCheck,
} from "@tabler/icons-react";

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

interface SketchEditorProps {
  elements: ShapeElement[];
  setElements: (elements: ShapeElement[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export default function SketchEditor({
  elements,
  setElements,
  selectedId,
  setSelectedId,
}: SketchEditorProps) {
  const [tool, setTool] = useState<"select" | "rectangle" | "text">("select");
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  // Canvas fijo de 2000x1500 para tener mucho espacio
  const canvasWidth = 2000;
  const canvasHeight = 1500;
  
  // Estado para controlar el modo de arrastre
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  // Historial para Undo/Redo
  const [history, setHistory] = useState<ShapeElement[][]>([elements]);
  const [historyStep, setHistoryStep] = useState(0);
  
  // Estado para edición de texto
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [editingTextPosition, setEditingTextPosition] = useState({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Estado para modal de medida
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementData, setMeasurementData] = useState<{
    element: ShapeElement;
    side: "top" | "right" | "bottom" | "left";
  } | null>(null);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Limitar el zoom entre 0.1x y 5x
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setScale(clampedScale);
    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    stage.position(newPos);
  };

  // Zoom con gestos táctiles (pellizcar)
  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    const stage = e.target.getStage();
    if (!stage || !touch1 || !touch2) return;

    // Si hay dos dedos, hacer zoom
    if (touch1 && touch2) {
      setIsDraggingCanvas(false);
      
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (!stage.lastDist) {
        stage.lastDist = dist;
      }

      const scale = (stage.scaleX() * dist) / stage.lastDist;
      const clampedScale = Math.max(0.1, Math.min(5, scale));

      setScale(clampedScale);
      stage.scale({ x: clampedScale, y: clampedScale });
      stage.lastDist = dist;
    }
  };

  const handleTouchEnd = (e: any) => {
    const stage = e.target.getStage();
    if (stage) {
      stage.lastDist = undefined;
    }
  };

  const handleZoomIn = () => {
    const newScale = Math.min(5, scale * 1.2);
    setScale(newScale);
    if (stageRef.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, scale / 1.2);
    setScale(newScale);
    if (stageRef.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
    }
  };

  const handleZoomReset = () => {
    if (!stageRef.current) return;
    
    // Restablecer zoom a 100%
    setScale(1);
    stageRef.current.scale({ x: 1, y: 1 });
    
    // Obtener dimensiones del contenedor
    const stageContainer = stageRef.current.container().parentElement;
    if (!stageContainer) return;
    
    const containerWidth = stageContainer.clientWidth;
    const containerHeight = stageContainer.clientHeight;
    
    // Si no hay elementos, centrar en una posición inicial cómoda
    if (elements.length === 0) {
      // Posicionar para que el inicio del canvas esté visible pero no pegado al borde
      stageRef.current.position({ 
        x: containerWidth / 4, 
        y: containerHeight / 4 
      });
      stageRef.current.batchDraw();
      return;
    }
    
    // Buscar el primer rectángulo (es lo principal)
    const firstRectangle = elements.find(el => el.type === "rectangle");
    
    if (firstRectangle) {
      // Centrar en el primer rectángulo
      const rectCenterX = firstRectangle.x + (firstRectangle.width || 100) / 2;
      const rectCenterY = firstRectangle.y + (firstRectangle.height || 80) / 2;
      
      const newX = containerWidth / 2 - rectCenterX;
      const newY = containerHeight / 2 - rectCenterY;
      
      stageRef.current.position({ x: newX, y: newY });
    } else {
      // Si solo hay textos, centrar en el primer elemento
      const firstElement = elements[0];
      if (firstElement) {
        const newX = containerWidth / 2 - firstElement.x;
        const newY = containerHeight / 2 - firstElement.y;
        stageRef.current.position({ x: newX, y: newY });
      }
    }
    
    stageRef.current.batchDraw();
  };

  // Guardar en historial cuando cambian los elementos
  const saveToHistory = (newElements: ShapeElement[]) => {
    // Eliminar todo el historial después del paso actual
    const newHistory = history.slice(0, historyStep + 1);
    // Agregar el nuevo estado
    newHistory.push(newElements);
    // Limitar el historial a 50 pasos
    const limitedHistory = newHistory.slice(-50);
    setHistory(limitedHistory);
    setHistoryStep(limitedHistory.length - 1);
    setElements(newElements);
  };

  // Deshacer (Undo)
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setElements(history[newStep]!);
    }
  };

  // Rehacer (Redo)
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setElements(history[newStep]!);
    }
  };

  // Listener de teclado para Ctrl+Z y Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z o Cmd+Z (Mac) para deshacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y o Cmd+Shift+Z para rehacer
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history]);

  useEffect(() => {
    if (selectedIds.length > 0 && transformerRef.current) {
      const stage = stageRef.current;
      if (stage) {
        const selectedNodes = selectedIds
          .map(id => stage.findOne(`#${id}`))
          .filter((node): node is Konva.Node => node !== null && node !== undefined);
        
        if (selectedNodes.length > 0) {
          transformerRef.current.nodes(selectedNodes);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds]);

  const handleStageClick = (e: any) => {
    // Si estaba arrastrando el canvas, no hacer nada
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      return;
    }
    
    const clickedOnEmpty = e.target === e.target.getStage();
    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (!pointerPosition) return;

    // Si clickeó en el stage vacío y el tool es rectangle o text, crear elemento
    if (clickedOnEmpty && tool === "rectangle") {
      const newRect: ShapeElement = {
        id: `rect-${Date.now()}`,
        type: "rectangle",
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: 100,
        height: 80,
        fill: "rgba(66, 135, 245, 0.1)",
        stroke: "#4287f5",
        strokeWidth: 2,
      };
      const newElements = [...elements, newRect];
      saveToHistory(newElements);
      setTool("select");
      return;
    }

    if (clickedOnEmpty && tool === "text") {
      // Crear texto vacío y activar edición inmediatamente
      const newTextId = `text-${Date.now()}`;
      const newText: ShapeElement = {
        id: newTextId,
        type: "text",
        x: pointerPosition.x,
        y: pointerPosition.y,
        text: "Escribe aquí...",
        fontSize: 16,
        fill: "#000",
      };
      const newElements = [...elements, newText];
      saveToHistory(newElements);
      
      // Activar edición del texto recién creado
      setTimeout(() => {
        startEditingText(newTextId, pointerPosition.x, pointerPosition.y, "Escribe aquí...");
      }, 50);
      
      setTool("select");
      return;
    }

    // Si clickeó en el stage vacío con el tool "select", deseleccionar
    if (clickedOnEmpty && tool === "select") {
      setSelectedId(null);
      setSelectedIds([]);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
    }
  };

  const handleShapeClick = (id: string, e: any) => {
    // Prevenir propagación para evitar conflictos
    e.cancelBubble = true;
    
    const isMultiSelect = e.evt?.ctrlKey || e.evt?.metaKey || e.evt?.shiftKey;
    
    if (isMultiSelect) {
      // Selección múltiple
      if (selectedIds.includes(id)) {
        // Deseleccionar si ya está seleccionado
        const newSelectedIds = selectedIds.filter(selectedId => selectedId !== id);
        setSelectedIds(newSelectedIds);
        setSelectedId(newSelectedIds[0] || null);
      } else {
        // Agregar a la selección
        const newSelectedIds = [...selectedIds, id];
        setSelectedIds(newSelectedIds);
        setSelectedId(id);
      }
    } else {
      // Selección simple
      setSelectedId(id);
      setSelectedIds([id]);
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const id = node.id();

    const newElements = elements.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
        };
      }
      return el;
    });
    
    saveToHistory(newElements);

    node.scaleX(1);
    node.scaleY(1);
  };

  const addMeasurement = (element: ShapeElement, side: "top" | "right" | "bottom" | "left") => {
    if (!element.width || !element.height) return;

    // Abrir el modal en lugar de usar prompt
    setMeasurementData({ element, side });
    setMeasurementValue("");
    setMeasurementModalOpen(true);
  };

  const confirmMeasurement = () => {
    if (!measurementValue.trim() || !measurementData) return;

    const { element, side } = measurementData;
    if (!element.width || !element.height) return;

    let x = element.x;
    let y = element.y;

    switch (side) {
      case "top":
        x = element.x + element.width / 2;
        y = element.y - 20;
        break;
      case "right":
        x = element.x + element.width + 20;
        y = element.y + element.height / 2;
        break;
      case "bottom":
        x = element.x + element.width / 2;
        y = element.y + element.height + 20;
        break;
      case "left":
        x = element.x - 40;
        y = element.y + element.height / 2;
        break;
    }

    const newMeasurement: ShapeElement = {
      id: `measurement-${Date.now()}`,
      type: "measurement",
      x,
      y,
      text: measurementValue,
      fontSize: 14,
      fill: "#e03131",
    };

    const newElements = [...elements, newMeasurement];
    saveToHistory(newElements);
    
    // Cerrar el modal
    setMeasurementModalOpen(false);
    setMeasurementValue("");
    setMeasurementData(null);
  };

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      const newElements = elements.filter((el) => !selectedIds.includes(el.id));
      saveToHistory(newElements);
      setSelectedId(null);
      setSelectedIds([]);
    }
  };

  const handleColorChange = (elementId: string, newColor: string) => {
    const newElements = elements.map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          fill: newColor.includes('rgba') ? newColor : `${newColor}33`, // Agregar transparencia si no la tiene
          stroke: newColor.includes('rgba') ? newColor.replace('33', '') : newColor,
        };
      }
      return el;
    });
    saveToHistory(newElements);
  };

  const startEditingText = (id: string, x: number, y: number, currentText: string) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    // Calcular posición real considerando el zoom y posición del stage
    const transform = stage.getAbsoluteTransform().copy();
    const pos = transform.point({ x, y });
    
    setEditingTextId(id);
    setEditingTextValue(currentText === "Escribe aquí..." ? "" : currentText);
    setEditingTextPosition({ x: pos.x, y: pos.y });
    
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 50);
  };

  const finishEditingText = () => {
    if (!editingTextId) return;
    
    const finalText = editingTextValue.trim() || "Texto";
    const newElements = elements.map((el) =>
      el.id === editingTextId ? { ...el, text: finalText } : el
    );
    saveToHistory(newElements);
    
    setEditingTextId(null);
    setEditingTextValue("");
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Cancelar edición con Escape
      setEditingTextId(null);
      setEditingTextValue("");
    }
    // Enter ahora agrega una nueva línea en el textarea (comportamiento por defecto)
  };

  const selectedElement = elements.find((el) => el.id === selectedId);
  const hasMultipleSelection = selectedIds.length > 1;

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" withBorder>
        <Group mb="md" justify="space-between">
          <Group>
            <Button
              variant={tool === "select" ? "filled" : "light"}
              onClick={() => setTool("select")}
            >
              Seleccionar
            </Button>
            <Button
              variant={tool === "rectangle" ? "filled" : "light"}
              leftSection={<IconSquarePlus size={16} />}
              onClick={() => setTool("rectangle")}
            >
              Rectángulo
            </Button>
            <Button
              variant={tool === "text" ? "filled" : "light"}
              leftSection={<IconTextPlus size={16} />}
              onClick={() => setTool("text")}
            >
              Texto
            </Button>
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="light"
              onClick={handleUndo}
              disabled={historyStep <= 0}
              title="Deshacer (Ctrl+Z)"
            >
              <IconArrowBackUp size={18} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              title="Rehacer (Ctrl+Y)"
            >
              <IconArrowForwardUp size={18} />
            </ActionIcon>
            
            <div style={{ width: 1, height: 24, background: '#e0e0e0', margin: '0 8px' }} />
            
            <ActionIcon
              variant="light"
              onClick={handleZoomOut}
              title="Alejar (Zoom Out)"
            >
              <IconZoomOut size={18} />
            </ActionIcon>
            <MantineText size="sm" fw={500} style={{ minWidth: 50, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </MantineText>
            <ActionIcon
              variant="light"
              onClick={handleZoomIn}
              title="Acercar (Zoom In)"
            >
              <IconZoomIn size={18} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              onClick={handleZoomReset}
              title="Restablecer y Centrar Vista"
            >
              <IconZoomReset size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {selectedIds.length > 0 && (
          <Paper p="xs" withBorder bg="blue.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <MantineText size="sm" fw={500}>
                  {hasMultipleSelection 
                    ? `${selectedIds.length} elementos seleccionados`
                    : selectedElement?.type === "rectangle" && "Rectángulo seleccionado"
                    || selectedElement?.type === "text" && "Texto seleccionado"
                    || selectedElement?.type === "measurement" && "Medida seleccionada"}
                </MantineText>
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={handleDelete}
                  size="lg"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
              
              {!hasMultipleSelection && selectedElement?.type === "rectangle" && (
                <>
                  <Group gap="xs" wrap="wrap">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => addMeasurement(selectedElement, "top")}
                    >
                      Medida Arriba
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => addMeasurement(selectedElement, "right")}
                    >
                      Medida Derecha
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => addMeasurement(selectedElement, "bottom")}
                    >
                      Medida Abajo
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => addMeasurement(selectedElement, "left")}
                    >
                      Medida Izquierda
                    </Button>
                  </Group>
                  
                  <Group gap="xs" align="center">
                    <MantineText size="xs" fw={500}>
                      Color:
                    </MantineText>
                    <ColorInput
                      size="xs"
                      value={selectedElement.stroke || "#4287f5"}
                      onChange={(color) => handleColorChange(selectedElement.id, color)}
                      swatches={[
                        '#4287f5', '#f03e3e', '#12b886', '#fab005', 
                        '#7950f2', '#ff6b6b', '#339af0', '#51cf66',
                        '#ff8787', '#4dabf7', '#69db7c', '#ffd43b'
                      ]}
                      style={{ width: 200 }}
                    />
                  </Group>
                </>
              )}
            </Stack>
          </Paper>
        )}
        
        <MantineText size="xs" c="dimmed" ta="center">
          💡 Tips: Selecciona un rectángulo para cambiar su color | Doble click en texto para editar | Arrastra para mover | Ctrl+Z = deshacer
        </MantineText>
      </Paper>

      <Paper 
        shadow="sm" 
        p={0}
        withBorder 
        style={{ 
          overflow: "hidden",
          height: "calc(100vh - 350px)",
          minHeight: "500px",
          position: "relative",
          background: "#f8f9fa",
        }}
      >
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          ref={stageRef}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={selectedIds.length === 0}
          onDragStart={() => setIsDraggingCanvas(true)}
          onDragEnd={() => setIsDraggingCanvas(false)}
          style={{
            background: "white",
            cursor: selectedIds.length === 0 && tool === "select" ? "grab" : tool === "select" ? "move" : "crosshair",
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          <Layer>
            {elements.map((element) => {
              if (element.type === "rectangle") {
                return (
                  <Rect
                    key={element.id}
                    id={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fill}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    draggable={tool === "select"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (!isDraggingCanvas) handleShapeClick(element.id, e);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      if (!isDraggingCanvas) handleShapeClick(element.id, e);
                    }}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                      handleShapeClick(element.id, e);
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      handleTransformEnd(e);
                    }}
                    onTransformEnd={handleTransformEnd}
                  />
                );
              } else if (element.type === "text" || element.type === "measurement") {
                return (
                  <Text
                    key={element.id}
                    id={element.id}
                    x={element.x}
                    y={element.y}
                    text={element.text}
                    fontSize={element.fontSize}
                    fill={element.fill}
                    draggable={tool === "select"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (!isDraggingCanvas) handleShapeClick(element.id, e);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      if (!isDraggingCanvas) handleShapeClick(element.id, e);
                    }}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                      handleShapeClick(element.id, e);
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      const node = e.target;
                      const newElements = elements.map((el) =>
                        el.id === element.id ? { ...el, x: node.x(), y: node.y() } : el
                      );
                      saveToHistory(newElements);
                    }}
                    onDblClick={() => {
                      startEditingText(element.id, element.x, element.y, element.text || "");
                    }}
                    onDblTap={() => {
                      startEditingText(element.id, element.x, element.y, element.text || "");
                    }}
                    visible={editingTextId !== element.id}
                  />
                );
              }
              return null;
            })}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
        
        {/* Textarea para editar texto directamente en el canvas */}
        {editingTextId && (
          <div
            style={{
              position: "absolute",
              top: editingTextPosition.y,
              left: editingTextPosition.x,
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <textarea
              ref={textInputRef}
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onKeyDown={handleTextKeyDown}
              style={{
                fontSize: "16px",
                padding: "8px",
                border: "2px solid #4287f5",
                borderRadius: "4px",
                outline: "none",
                background: "white",
                minWidth: "200px",
                minHeight: "60px",
                maxWidth: "400px",
                resize: "both",
                fontFamily: "inherit",
              }}
            />
            <Button
              size="xs"
              onClick={finishEditingText}
              leftSection={<IconCheck size={14} />}
              fullWidth
            >
              Aceptar (Esc para cancelar)
            </Button>
          </div>
        )}
      </Paper>

      {/* Modal para agregar medida */}
      <Modal
        opened={measurementModalOpen}
        onClose={() => {
          setMeasurementModalOpen(false);
          setMeasurementValue("");
          setMeasurementData(null);
        }}
        title={`Medida para el lado ${measurementData?.side === 'top' ? 'superior' : measurementData?.side === 'bottom' ? 'inferior' : measurementData?.side === 'left' ? 'izquierdo' : 'derecho'}`}
        size="sm"
      >
        <Stack>
          <TextInput
            label="Medida"
            placeholder="Ej: 10m, 5.5m, 15 metros"
            value={measurementValue}
            onChange={(e) => setMeasurementValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                confirmMeasurement();
              }
            }}
            autoFocus
            data-autofocus
          />
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setMeasurementModalOpen(false);
                setMeasurementValue("");
                setMeasurementData(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmMeasurement} disabled={!measurementValue.trim()}>
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

