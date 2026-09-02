import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AnnotationZone } from '../types';

interface DocumentVisualizerProps {
  imageUrl: string;
  fileName: string;
  documentTypeLabel: string;
  annotationZones?: AnnotationZone[];
}

export const DocumentVisualizer: React.FC<DocumentVisualizerProps> = ({
  imageUrl,
  fileName,
  documentTypeLabel,
  annotationZones = [],
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setActiveZoneId(null);
  };

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || imageUrl.includes('application/pdf');

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="font-semibold text-slate-200 truncate">{fileName}</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">{documentTypeLabel}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {annotationZones.length > 0 && (
            <button
              id="toggle-annotations-btn"
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                showAnnotations
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Forensic Inspection Annotations"
            >
              {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">
                {showAnnotations ? 'Hide Markers' : 'Show Markers'} ({annotationZones.length})
              </span>
            </button>
          )}

          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
            <button
              id="doc-zoom-out-btn"
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-400 px-1.5 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              id="doc-zoom-in-btn"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="doc-reset-zoom-btn"
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-slate-200 ml-0.5"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="relative min-h-[300px] max-h-[480px] p-4 flex items-center justify-center overflow-auto bg-slate-950/60 select-none">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="relative transition-transform duration-150 max-w-full max-h-full rounded-xl shadow-2xl overflow-hidden border border-slate-700/50"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={fileName}
              className="max-h-[380px] w-auto object-contain block mx-auto pointer-events-none"
            />
          ) : (
            <div className="w-[420px] h-[260px] bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Layers className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No direct image stream rendered</p>
            </div>
          )}

          {/* Forensic Bounding Box Overlays */}
          {showAnnotations &&
            annotationZones.map((zone) => {
              const isActive = activeZoneId === zone.id;
              const borderColor =
                zone.severity === 'critical' || zone.severity === 'high'
                  ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : zone.severity === 'medium'
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-emerald-500 bg-emerald-500/20 text-emerald-300';

              return (
                <div
                  key={zone.id}
                  id={`annotation-${zone.id}`}
                  onClick={() => setActiveZoneId(isActive ? null : zone.id)}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`,
                  }}
                  className={`absolute rounded cursor-pointer border-2 transition-all group ${borderColor} ${
                    isActive ? 'ring-2 ring-white z-20' : 'hover:scale-[1.02]'
                  }`}
                >
                  <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 border border-slate-700 shadow-md whitespace-nowrap">
                    {zone.label}
                  </div>

                  {/* Popover Card */}
                  {isActive && (
                    <div className="absolute top-full mt-1 left-0 z-30 w-52 p-2.5 rounded-lg bg-slate-950/95 border border-slate-700 text-xs shadow-2xl text-slate-200">
                      <div className="flex items-center gap-1 font-bold text-[11px] mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{zone.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">{zone.comment}</p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer Info / Active Finding Callout */}
      {annotationZones.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-sky-400 font-semibold">
              FORENSIC OVERLAY:
            </span>
            <span>
              {annotationZones.length} inspection zone{annotationZones.length > 1 ? 's' : ''} detected. Click any zone to inspect details.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {isPdf ? 'Native Vector Render' : 'High Resolution Scan'}
          </span>
        </div>
      )}
    </div>
  );
};
