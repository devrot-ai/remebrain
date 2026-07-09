/**
 * Premium drag-and-drop image uploader with Vision API integration.
 *
 * Shows the uploaded image with bounding-box overlays from Vision results.
 * Styled with the Soft UI / neumorphism design system.
 */

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { useVisionDetectionsContext } from "@/hooks/VisionDetectionsContext";
import { isVisionDetection } from "@/lib/vision/parser";

export function ImageUploader() {
  const { uploadAndAnalyze, isAnalyzing, error, lastAnnotation, visionDetections, isConfigured } =
    useVisionDetectionsContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      uploadAndAnalyze(file);
    },
    [uploadAndAnalyze],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so same file can be re-uploaded
      e.target.value = "";
    },
    [handleFile],
  );


  return (
    <SoftCard className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            AI Vision Analysis
          </div>
          <h2 className="text-lg font-bold">Upload image for detection</h2>
        </div>
        {isConfigured ? (
          <SoftBadge tone="green">Vision API Connected</SoftBadge>
        ) : (
          <SoftBadge tone="gold">No API Key — Mock Only</SoftBadge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Drop zone */}
        <motion.div
          className={`soft-pressed rounded-[24px] aspect-video relative overflow-hidden cursor-pointer transition-all ${
            isDragOver ? "ring-2 ring-brand-blue/50" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="h-10 w-10 text-brand-blue" />
                  </motion.div>
                  <span className="text-sm font-bold text-brand-blue">
                    Analyzing with Google Vision…
                  </span>
                  <motion.div
                    className="h-1 bg-brand-blue/30 rounded-full overflow-hidden w-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-brand-blue rounded-full"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "60%" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ) : lastAnnotation ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {/* Uploaded image with bounding boxes */}
                <img
                  src={lastAnnotation.imageDataUri}
                  alt="Analyzed"
                  className="h-full w-full object-cover"
                />
                {/* Bounding box overlays */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none">
                  {lastAnnotation.objects.map((obj) => (
                    <g key={obj.id}>
                      <rect
                        x={`${obj.box.x}%`}
                        y={`${obj.box.y}%`}
                        width={`${obj.box.w}%`}
                        height={`${obj.box.h}%`}
                        fill="none"
                        stroke={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                        strokeWidth={obj.isLitter ? 3 : 1.5}
                        rx={4}
                        style={
                          obj.isLitter
                            ? { filter: "drop-shadow(0 0 8px #e15a5a)" }
                            : undefined
                        }
                      />
                      <rect
                        x={`${obj.box.x}%`}
                        y={`${Math.max(0, obj.box.y - 4)}%`}
                        width={`${Math.max(obj.label.length * 1.4 + 6, 12)}%`}
                        height="4%"
                        fill={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                        rx={2}
                        opacity={0.9}
                      />
                      <text
                        x={`${obj.box.x + 0.8}%`}
                        y={`${Math.max(0, obj.box.y - 1)}%`}
                        fontSize="10"
                        fill="white"
                        fontWeight="700"
                      >
                        {obj.label} {(obj.confidence * 100).toFixed(0)}%
                      </text>
                    </g>
                  ))}
                </svg>
                {/* Re-upload overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <SoftBadge tone="green">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {lastAnnotation.objects.length} objects detected
                  </SoftBadge>
                  <span className="soft-raised-sm rounded-lg px-2 py-1 text-[10px] font-bold text-brand-blue bg-white/90">
                    Click to re-analyze
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
              >
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <motion.div
                    animate={
                      isDragOver
                        ? { scale: 1.15, y: -4 }
                        : { scale: 1, y: 0 }
                    }
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {isDragOver ? (
                      <ImagePlus className="h-12 w-12 text-brand-blue" />
                    ) : (
                      <Upload className="h-10 w-10" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {isDragOver
                        ? "Drop image here"
                        : "Drag & drop an image"}
                    </div>
                    <div className="text-xs mt-1">or click to browse</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results panel */}
        <div className="flex flex-col gap-3">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="soft-pressed rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-brand-red shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-brand-red">
                  Analysis failed
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {error}
                </div>
              </div>
            </motion.div>
          )}

          {lastAnnotation && (
            <>
              <div className="soft-pressed-sm rounded-2xl p-4">
                <div className="text-[10px] uppercase text-muted-foreground mb-2">
                  Detected Labels
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lastAnnotation.labels.slice(0, 10).map((l) => (
                    <SoftBadge key={l.label} tone="blue">
                      {l.label}{" "}
                      <span className="opacity-60">
                        {(l.confidence * 100).toFixed(0)}%
                      </span>
                    </SoftBadge>
                  ))}
                </div>
              </div>

              <div className="soft-pressed-sm rounded-2xl p-4">
                <div className="text-[10px] uppercase text-muted-foreground mb-2">
                  Localized Objects ({lastAnnotation.objects.length})
                </div>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {lastAnnotation.objects.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: obj.isLitter ? "#e15a5a" : "#4a86ff",
                          }}
                        />
                        <span className="font-bold">{obj.label}</span>
                        {obj.isLitter && (
                          <SoftBadge tone="red">Litter</SoftBadge>
                        )}
                      </span>
                      <span className="font-bold text-brand-green">
                        {(obj.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {lastAnnotation.objects.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      No objects localized (labels detected above)
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {!lastAnnotation && !isAnalyzing && (
            <div className="soft-pressed-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1">
              <ImagePlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <div className="text-sm text-muted-foreground">
                Upload an image to see Google Vision AI results
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                Objects, labels, and litter classification
              </div>
            </div>
          )}

          {!isConfigured && (
            <div className="soft-pressed-sm rounded-2xl p-3 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-brand-gold shrink-0" />
              Add <code className="font-mono text-brand-blue">VITE_GOOGLE_VISION_API_KEY</code> to{" "}
              <code className="font-mono">.env</code> to enable real inference
            </div>
          )}
        </div>
      </div>
    </SoftCard>
  );
}
