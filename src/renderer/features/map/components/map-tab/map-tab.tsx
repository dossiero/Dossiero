import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  PanelRightOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-tab.css";
import type {
  GeoJsonPosition,
  MapDocument,
  MapFeature,
  MapLayerFolder,
  PersonTab,
} from "@shared/types";
import { importMapFile } from "@/features/map/logic/import";
import { ContentFullscreenButton } from "@/components/content-fullscreen-button/content-fullscreen-button";
import { useContentFullscreen } from "@/components/content-fullscreen/use-content-fullscreen";
import { ProfileContent } from "@/components/profile-content/profile-content";
import { ProfileContentBody } from "@/components/profile-content-body/profile-content-body";
import { FeatureDetails } from "@/features/map/components/feature-details/feature-details";
import { FeatureShape } from "@/features/map/components/feature-shape/feature-shape";
import { DraftShape } from "@/features/map/components/draft-shape/draft-shape";
import { MapLayersPanel } from "@/features/map/components/layers-panel/layers-panel";
import { MapAttribution } from "@/features/map/components/map-attribution/map-attribution";
import { MapStyleSwitcher } from "@/features/map/components/map-style-switcher/map-style-switcher";
import { RasterTileLayer } from "@/features/map/components/raster-tile-layer/raster-tile-layer";
import { readMapTileStyle } from "@/features/map/logic/map-tile-styles";
import { DrawingToolbar } from "@/features/map/components/drawing-toolbar/drawing-toolbar";
import { MapSearch } from "@/features/map/components/map-search/map-search";
import { SearchTarget } from "@/features/map/components/search-target/search-target";
import { MapHeader } from "@/features/map/components/map-header/map-header";
import { PinDropdown } from "@/features/map/components/pin-dropdown/pin-dropdown";
import { useMapDocument } from "@/features/map/hooks/use-map-document";
import { useMapViewport } from "@/features/map/hooks/use-map-viewport";
import {
  featureAnchor,
  makeFeature,
  readCamera,
  readCameraViewport,
  relativePoint,
  resizeCameraFromTopLeft,
} from "@/features/map/logic/geometry";
import {
  getMapStackFeatures,
  isFeatureVisible,
  isFolderDescendant,
} from "@/features/map/logic/layer-order";
import {
  defaultCamera,
  type Camera,
  type MapSearchResult,
  type MapTileStyle,
} from "@/features/map/map.types";
import { useMapInteractions } from "@/features/map/hooks/use-map-interactions";
import { Button } from "@/components/button/button";
import { Tooltip } from "@/components/tooltip/tooltip";

interface MapTabProps {
  tab: PersonTab;
  document?: MapDocument;
  themeKey: string;
  onSave: (features: MapFeature[], folders: MapLayerFolder[]) => Promise<MapDocument>;
}

export function MapTab({ tab, document, themeKey, onSave }: MapTabProps) {
  const { isFullscreen } = useContentFullscreen();
  const storageKey = `dossier-map-camera:${tab.personId}:${tab.id}`;
  const tileStyleStorageKey = `dossier-map-style:${tab.personId}:${tab.id}`;
  const layersOpenStorageKey = `dossier-map-layers-open:${tab.personId}:${tab.id}`;
  const previousViewportRef = useRef({
    storageKey,
    size: readCameraViewport(storageKey),
  });
  const {
    addFeature,
    commit,
    createFolder,
    deleteFeatures: removeFeatures,
    features,
    folders,
    moveFeatures,
    moveFolder,
    removeFolder,
    saveState,
    setSaveState,
    setFeatures,
    toggleFeature,
    updateFeature,
    updateFolder,
  } = useMapDocument({ document, onSave });
  const [camera, setCamera] = useState<Camera>(() => readCamera(storageKey, defaultCamera));
  const [tileStyle, setTileStyle] = useState<MapTileStyle>(() =>
    readMapTileStyle(tileStyleStorageKey)
  );
  const [layersOpen, setLayersOpen] = useState(() =>
    localStorage.getItem(layersOpenStorageKey) !== "closed"
  );
  const [layersWidth, setLayersWidth] = useState(250);
  const [searchTarget, setSearchTarget] = useState<MapSearchResult | null>(null);
  const {
    boardRef: board,
    size,
    vectorContainerRef: vectorContainer,
  } = useMapViewport({
    camera,
    themeKey,
    tileStyle,
    tabId: tab.id,
  });
  const {
    suppressFeatureClickRef,
    tool,
    setTool,
    draft,
    setDraft,
    draftCursor,
    setDraftCursor,
    pinDraft,
    setPinDraft,
    selectedId,
    setSelectedId,
    detailsId,
    setDetailsId,
    detailsAnchor,
    setDetailsAnchor,
    project,
    resetInteraction,
    deleteFeature,
    deleteFeatures,
    moveCameraTo,
    finishPath,
    pointerDown,
    wheel,
    dragFeature,
    dragFeaturePoint,
  } = useMapInteractions({
    board,
    camera,
    setCamera,
    size,
    features,
    setFeatures,
    addFeature,
    removeFeatures,
    commit,
  });

  if (previousViewportRef.current.storageKey !== storageKey) {
    previousViewportRef.current = {
      storageKey,
      size: readCameraViewport(storageKey),
    };
  }

  useLayoutEffect(() => {
    if (!size.width || !size.height) return;

    const previousSize = previousViewportRef.current.size;
    previousViewportRef.current.size = size;
    if (!previousSize) return;
    if (previousSize.width === size.width && previousSize.height === size.height) return;

    setCamera((current) => resizeCameraFromTopLeft(current, previousSize, size));
  }, [size.height, size.width]);

  useEffect(() => {
    resetInteraction();
    setTileStyle(readMapTileStyle(tileStyleStorageKey));
  }, [tab.id, document?.updatedAt, tileStyleStorageKey]);
  useEffect(() => {
    if (!size.width || !size.height) return;
    localStorage.setItem(storageKey, JSON.stringify({ ...camera, viewport: size }));
  }, [camera, size, storageKey]);
  useEffect(() => {
    setLayersOpen(localStorage.getItem(layersOpenStorageKey) !== "closed");
  }, [layersOpenStorageKey]);
  const detailsFeature = features.find((feature) => feature.id === detailsId) ?? null;
  const importFile = async (file: File) => {
    const imported = await importMapFile(file);
    commit([...features, ...imported]);
  };
  const changeTileStyle = (next: MapTileStyle) => {
    setTileStyle(next);
    localStorage.setItem(tileStyleStorageKey, next);
  };
  const changeLayersOpen = (open: boolean) => {
    setLayersOpen(open);
    localStorage.setItem(layersOpenStorageKey, open ? "open" : "closed");
  };
  const mapFeatures = getMapStackFeatures(features, folders)
    .filter((feature) => isFeatureVisible(feature, folders));
  const boardStyle = {
    "--map-layers-width": layersOpen ? `${layersWidth}px` : "0px",
  } as CSSProperties;
  return (
    <ProfileContent className="map-tab" fill>
      {!isFullscreen && (
        <MapHeader
          features={features}
          saveState={saveState}
          title={tab.name}
          onImport={(file) => {
            void importFile(file).catch((error) => {
              setSaveState("error");
              const message = error instanceof Error ? error.message : "Map import failed";
              toast.error(`! ${message}`);
            });
          }}
        />
      )}
      <ProfileContentBody className="map-content" padding="flush">
        <div className="map-board" style={boardStyle}>
          <div
            ref={board}
            className={`map-canvas tool-${tool}`}
            onPointerDown={pointerDown}
            onPointerMove={(event) => {
              if (tool === "line" && draft.length) {
                setDraftCursor(relativePoint(event, board.current));
              }
            }}
            onDoubleClick={(event) => {
              if (tool !== "line") return;
              event.preventDefault();
              finishPath();
            }}
            onWheel={wheel}
          >
          <RasterTileLayer tileStyle={tileStyle} camera={camera} size={size} />
          <div
            ref={vectorContainer}
            className={`map-vector-map ${tileStyle === "styled" ? "" : "is-hidden"}`}
            aria-hidden="true"
          />
          <svg
            className="map-overlay"
            width={size.width}
            height={size.height}
            role="img"
            aria-label={`${tab.name} annotations`}
          >
            {mapFeatures.map((feature) => (
              <FeatureShape
                key={feature.id}
                feature={feature}
                project={project}
                selected={feature.id === selectedId}
                onSelect={(point) => {
                  if (suppressFeatureClickRef.current) return;
                  setSelectedId(feature.id);
                  setDetailsId(feature.id);
                  setDetailsAnchor(point);
                  setDraft([]);
                  setDraftCursor(null);
                  setTool("pan");
                }}
                onDelete={() => deleteFeature(feature.id)}
                onPointerDown={(event) => dragFeature(event, feature)}
                onPolygonPointDown={(event, vertexIndex, insert) =>
                  dragFeaturePoint(event, feature, vertexIndex, insert)}
              />
            ))}
            {draft.length > 0 && (tool === "line" || tool === "pen") && (
              <DraftShape
                points={draft.map(project)}
                cursor={tool === "line" ? draftCursor : null}
                showVertices={tool === "line"}
              />
            )}
            {searchTarget && (
              <SearchTarget result={searchTarget} point={project(searchTarget.coordinate)} />
            )}
          </svg>
          <MapSearch
            onSelect={(result) => {
              setSearchTarget(result);
              setSelectedId(null);
              setDetailsId(null);
              setPinDraft(null);
              setDraft([]);
              setTool("pan");
              setCamera({ center: result.coordinate, zoom: result.zoom });
            }}
          />
          <DrawingToolbar
            tool={tool}
            onChange={(next) => {
              setDraft([]);
              setDraftCursor(null);
              setTool(next);
            }}
          />
          {pinDraft && (
            <PinDropdown
              draft={pinDraft}
              onCancel={() => setPinDraft(null)}
              onAdd={(properties) => {
                addFeature(
                  makeFeature({ type: "Point", coordinates: pinDraft.coordinate }, {
                    ...properties,
                    shape: "pin",
                  }),
                );
                setPinDraft(null);
                setTool("pan");
              }}
            />
          )}
          {draft.length > 0 && tool === "line" && (
            <div
              className="map-draw-actions"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span>{draft.length} point{draft.length === 1 ? "" : "s"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDraft([]);
                  setTool("pan");
                }}
                aria-label="Cancel drawing"
              >
                <X size={14} />
              </Button>
              <Button
                variant="signal"
                size="sm"
                disabled={draft.length < 2}
                onClick={() => finishPath()}
              >
                <Check size={13} /> Finish
              </Button>
            </div>
          )}
          {detailsFeature && (
            <FeatureDetails
              key={detailsFeature.id}
              feature={detailsFeature}
              anchor={detailsAnchor ?? project(featureAnchor(detailsFeature))}
              collisionBoundary={board.current}
              onPreview={(feature) => {
                setFeatures((current) => current.map((item) =>
                  item.id === feature.id ? feature : item
                ));
              }}
              onSave={updateFeature}
              onClose={() => {
                setDetailsId(null);
                setDetailsAnchor(null);
              }}
            />
          )}
          <MapStyleSwitcher tileStyle={tileStyle} onChange={changeTileStyle} />
          <div className={`map-corner-actions ${layersOpen ? "with-layers" : ""}`}>
            <ContentFullscreenButton iconOnly />
            {!layersOpen && (
              <Tooltip label="Show layers">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeLayersOpen(true)}
                  aria-label="Show layers"
                >
                  <PanelRightOpen size={15} />
                </Button>
              </Tooltip>
            )}
          </div>
          <MapAttribution tileStyle={tileStyle} />
        </div>
        {layersOpen && <MapLayersPanel
          features={features}
          folders={folders}
          selectedId={selectedId}
          onSelect={(feature) => {
            if (!isFeatureVisible(feature, folders)) return;
            setSelectedId(feature.id);
            setDetailsId(null);
            setDetailsAnchor(null);
            moveCameraTo(featureAnchor(feature));
            setDraft([]);
            setTool("pan");
          }}
          onCreateFolder={createFolder}
          onUpdateFolder={(folder) => {
            updateFolder(folder);
            if (
              folder.hidden &&
              isFolderDescendant(
                folders,
                features.find((feature) => feature.id === selectedId)?.properties.folderId,
                folder.id,
                true,
              )
            ) {
              setSelectedId(null);
              setDetailsId(null);
            }
          }}
          onRemoveFolder={removeFolder}
          onMoveFeatures={moveFeatures}
          onMoveFolder={moveFolder}
          onToggleFeature={(feature) => {
            toggleFeature(feature);
            if (!feature.properties.hidden && selectedId === feature.id) {
              setSelectedId(null);
              setDetailsId(null);
            }
          }}
          onSetAllHidden={(hidden) => {
            commit(
              features.map((feature) => ({
                ...feature,
                properties: { ...feature.properties, hidden },
              })),
              folders.map((folder) => ({ ...folder, hidden })),
            );
            if (hidden) {
              setSelectedId(null);
              setDetailsId(null);
            }
          }}
          onEditFeature={(feature) => {
            if (!isFeatureVisible(feature, folders)) return;
            setSelectedId(feature.id);
            setDetailsId(feature.id);
            setDetailsAnchor(project(featureAnchor(feature)));
            setTool("pan");
          }}
          onRenameFeature={(feature, label) => updateFeature({
            ...feature,
            properties: { ...feature.properties, label },
          })}
          onDeleteFeatures={deleteFeatures}
          onClearSelection={() => {
            setSelectedId(null);
            setDetailsId(null);
          }}
          onClose={() => changeLayersOpen(false)}
          width={layersWidth}
          onResize={setLayersWidth}
        />}
        </div>
      </ProfileContentBody>
    </ProfileContent>
  );
}
